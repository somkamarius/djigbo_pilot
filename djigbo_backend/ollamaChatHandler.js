const fetch = require('node-fetch');
const logger = require('./logger');
const { saveConversationSummary, generateConversationId, generateConversationSummaryV2 } = require('./database');

// Handler for local Ollama chat
async function ollamaChatHandler(req, res) {
  try {
    const { messages, max_tokens, conversation_id } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Generate conversation ID if not provided
    const convId = conversation_id || generateConversationId();

    // Concatenate messages into a single prompt (simple version)
    let prompt = '';
    for (const msg of messages) {
      prompt += `${msg.role}: ${msg.content}\n`;
    }
    // Remove trailing newline
    prompt = prompt.trim();

    // You can set the model name here or via env
    const model = process.env.OLLAMA_MODEL || 'llama3';
    const ollamaBody = {
      model,
      prompt,
      stream: false,
      options: {
        num_predict: max_tokens || 1024
      }
    };
    console.log(ollamaBody);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }
    const data = await response.json();

    logger.info(data);
    // Ollama returns the generated text in 'response'
    const assistantResponse = data.response;

    // Save conversation summary
    try {
      const userId = req.user?.sub || 'anonymous';
      const summaryProvider = process.env.SUMMARY_PROVIDER || 'ollama'; // 'bedrock', 'ollama', or 'simple'
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
    logger.error('Error in ollamaChatHandler:', err);
    res.status(500).json({ error: err.message });
  }
}

// Helper function to generate a simple conversation summary (keeping for backward compatibility)
function generateConversationSummary(messages, assistantResponse) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (lastUserMessage) {
    const summary = lastUserMessage.content.length > 100
      ? lastUserMessage.content.substring(0, 100) + '...'
      : lastUserMessage.content;
    return summary;
  }

  return 'Conversation started';
}

module.exports = { ollamaChatHandler }; 