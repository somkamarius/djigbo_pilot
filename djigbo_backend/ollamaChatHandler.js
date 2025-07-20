const fetch = require('node-fetch');
const esClient = require('./esClient');

// Handler for local Ollama chat
async function ollamaChatHandler(req, res) {
  try {
    const { messages, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }
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
    // Ollama returns the generated text in 'response'
    res.json({ content: data.response });
    // Log conversation to Elasticsearch (non-blocking)
    esClient.index({
      index: 'ollama-logs',
      document: {
        timestamp: new Date(),
        prompt,
        response: data.response,
        model,
        userAgent: req.headers['user-agent'] || null
      }
    }).catch(e => console.error('Elasticsearch log error:', e.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { ollamaChatHandler }; 