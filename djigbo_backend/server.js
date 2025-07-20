require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { bedrockChatHandler } = require('./bedrockChatHandler');
const { ollamaChatHandler } = require('./ollamaChatHandler');
const esClient = require('./esClient'); // Add this line to import esClient

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Elasticsearch health check
  esClient.info()
    .then(info => {
      console.log('Elasticsearch connected:', info.version.number);
    })
    .catch(err => {
      console.error('Elasticsearch connection error:', err);
    });
});

// USAGE:
// POST /api/chat
// Body: {
//   "messages": [
//     {"role": "system", "content": "You are a helpful assistant."},
//     {"role": "user", "content": "Hello!"},
//     {"role": "assistant", "content": "Hi! How can I help you?"}
//   ],
//   "max_tokens": 1024 // optional
// }
// To set a system prompt, include a message with role "system" as the first message.
//
// The response will be the assistant's reply from the LLM.
app.post('/api/chat', bedrockChatHandler);

// Add a new endpoint for Ollama
app.post('/api/ollama-chat', ollamaChatHandler); 

