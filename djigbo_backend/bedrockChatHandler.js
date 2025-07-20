require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

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
    const { messages, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }
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
    res.json({ content: responseBody.generation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { bedrockChatHandler }; 