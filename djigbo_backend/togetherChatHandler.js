const fetch = require('node-fetch');
const logger = require('./logger');
const { saveConversationSummary, generateConversationId, generateConversationSummaryV2 } = require('./database');

// Handler for Together.ai chat
async function togetherChatHandler(req, res) {
    try {
        const { messages, max_tokens, conversation_id } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        // Generate conversation ID if not provided
        const convId = conversation_id || generateConversationId();

        // Format messages for Together.ai API
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const togetherBody = {
            model: 'google/gemma-3-27b-it',
            messages: formattedMessages,
            max_tokens: max_tokens || 1024,
            temperature: 0.7,
            top_p: 0.9,
            stream: false
        };

        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
            },
            body: JSON.stringify(togetherBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Together.ai API error:', errorText);
            return res.status(500).json({ error: `Together.ai API error: ${errorText}` });
        }

        const data = await response.json();
        logger.info('Together.ai response received');

        // Together.ai returns the generated text in choices[0].message.content
        const assistantResponse = data.choices[0].message.content;

        // Save conversation summary
        try {
            const userId = req.user?.sub || 'anonymous';
            const summaryProvider = process.env.SUMMARY_PROVIDER || 'together'; // 'bedrock', 'ollama', 'together', or 'simple'
            const summary = await generateConversationSummaryV2(messages, assistantResponse, summaryProvider);
            await saveConversationSummary(userId, convId, summary, messages.length);
            logger.info(`Saved conversation summary for user ${userId}, conversation ${convId} using ${summaryProvider}`);
        } catch (dbError) {
            logger.error('Error saving conversation summary:', dbError);
            // Don't fail the request if database save fails
        }

        res.json({
            content: assistantResponse,
            conversation_id: convId
        });

    } catch (err) {
        logger.error('Error in togetherChatHandler:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { togetherChatHandler }; 