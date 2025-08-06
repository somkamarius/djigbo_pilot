require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { saveConversationSummary, generateConversationId, generateConversationSummaryV2 } = require('./database');
const Sentry = require("@sentry/node");
const { logger } = Sentry;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // sessionToken: process.env.AWS_SESSION_TOKEN // Optional, for temporary credentials
  }
});

// Handler for AWS Bedrock chat
async function bedrockChatHandler(req, res) {
  try {
    const { messages, max_tokens, conversation_id } = req.body;
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages array is required');
    }

    // Generate conversation ID if not provided
    const convId = conversation_id || generateConversationId();

    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${msg.content}\n<|eot_id|>`;
      } else if (msg.role === 'user') {
        prompt += `<|start_header_id|>user<|end_header_id|>\n${msg.content}\n<|eot_id|>`;
      } else if (msg.role === 'assistant') {
        prompt += `<|start_header_id|>assistant<|end_header_id|>\n${msg.content}\n<|eot_id|>`;
      }
    }
    prompt += '<|start_header_id|>assistant<|end_header_id|>\n';

    const body = {
      prompt,
      max_gen_len: max_tokens || 1024,
      temperature: 0.7,
      top_p: 0.9
    };

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const assistantResponse = responseBody.generation;

    // Save conversation summary
    try {
      const userId = req.user?.sub || 'anonymous';
      const summaryProvider = process.env.SUMMARY_PROVIDER || 'bedrock'; // 'bedrock', 'ollama', or 'simple'
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
    logger.error('Error in bedrockChatHandler:', err);
    throw err; // Re-throw to be caught by global error handlers
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

module.exports = { bedrockChatHandler }; 