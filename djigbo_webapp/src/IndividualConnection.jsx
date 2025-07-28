import { useRef, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

// const API_URL = "http://localhost:4000/api/chat";
const API_URL = "http://localhost:8000/api/ollama-chat";

const MODEL_OPTIONS = [
  { label: 'Llama 3 8B', value: 'meta.llama3-8b-instruct' },
  { label: 'Llama 3 70B', value: 'meta.llama3-70b-instruct' },
  { label: 'Claude 3 Sonnet', value: 'anthropic.claude-3-sonnet-20240229-v1:0' },
  { label: 'Claude 3 Haiku', value: 'anthropic.claude-3-haiku-20240307-v1:0' },
];

export default function IndividualConnection() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [messages, setMessages] = useState([
    {
      role: 'system', content:
        //   `
        //   You are a Lithuanian-language chatbot that helps young users (e.g., students) reflect on difficult social or emotional situations using the principles of Nonviolent Communication (NVC) and the Džigbo style of gentle empowerment.

        //   Your role is to guide the user through:

        //   Emotional reflection: Acknowledge their feelings and help them identify unmet needs.
        //   Empowerment: Ask if they would like to talk to the other person about it.
        //   Practical support: If they want to talk but are unsure how, offer a possible phrasing that is kind, clear, and respectful.
        //   Structure of conversation:
        //   Always respond in natural spoken Lithuanian and follow this progression:

        //   Step 1: Reflect the user's experience.

        //   Acknowledge what the user is feeling or needing.
        //   Do not judge or analyze.
        //   Focus on core needs (e.g., respect, fairness, recognition, connection).
        //   Example phrasing (in Lithuanian):

        //   "Atrodo, kad tau svarbu ___.
        //   "Girdžiu, kad tai gali kelti ___.
        //   Step 2: Ask if they'd like to express it to the other person.
        //   Example:

        //   "Ar norėtum pasakyti tai žmogui, kuris tau tai padarė?"
        //   Step 3: If they want to talk but are unsure how, offer a possible phrasing.
        //   Example:

        //   "Jei norėtum, galėtum pasakyti: 'Kai tu ___, aš jaučiu ___, nes man reikia ___. Ar galėtum ___.'"
        //   Remember:
        //   - Always respond in natural spoken Lithuanian
        //   - Be gentle and empathetic
        //   - Focus on feelings and needs, not blame
        //   - Offer practical help when appropriate
        //   - Keep responses concise but meaningful
        //   `
        `You are a helpful assistant.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const chatEndRef = useRef(null);

  // Add conversation ID state management
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState('');

  // Function to determine if this is a new conversation
  const isNewConversation = (newMessage) => {
    // If no conversation ID exists, it's a new conversation
    if (!currentConversationId) return true;

    // If the last user message is empty, it's a new conversation
    if (!lastUserMessage) return true;

    // Check if the new message is significantly different from the last user message
    // This is a simple heuristic - you might want to make this more sophisticated
    const similarityThreshold = 0.3; // 30% similarity threshold
    const similarity = calculateSimilarity(newMessage, lastUserMessage);

    return similarity < similarityThreshold;
  };

  // Simple similarity calculation using word overlap
  const calculateSimilarity = (message1, message2) => {
    const words1 = message1.toLowerCase().split(/\s+/);
    const words2 = message2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return totalWords > 0 ? commonWords.length / totalWords : 0;
  };

  // Function to start a new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setLastUserMessage('');
  };

  // Add a button to manually start a new conversation
  const handleNewConversation = () => {
    startNewConversation();
    setMessages([messages[0]]); // Keep only the system message
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isAuthenticated) {
      setMessages([...messages, { role: 'assistant', content: 'Please log in to use the chat.' }]);
      return;
    }

    // Check if this is a new conversation
    const shouldStartNewConversation = isNewConversation(input);

    // If it's a new conversation, clear the conversation ID
    if (shouldStartNewConversation) {
      setCurrentConversationId(null);
    }

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Update the last user message for similarity comparison
    setLastUserMessage(input);

    try {
      const token = await getAccessTokenSilently();
      const requestBody = {
        messages: newMessages,
        conversation_id: currentConversationId // Send current conversation ID if it exists
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        setMessages([...newMessages, { role: 'assistant', content: 'Authentication failed. Please log in again.' }]);
        return;
      }

      const data = await response.json();

      // Store the conversation ID from the response
      if (data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
      }

      // Assume the model's reply is in data.content or similar
      // Adjust this if your backend returns a different structure
      const assistantReply = data.content || data.completion || data.message || JSON.stringify(data);

      setMessages([...newMessages, { role: 'assistant', content: assistantReply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="journal-container">
      {/* Journal Header */}
      <div className="journal-header">
        <div className="journal-title">
          <h1>Mano Dienoraštis</h1>
          <div className="journal-subtitle">Džigbo Empatijos Užrašai</div>
        </div>
        <div className="journal-date">
          {new Date().toLocaleDateString('lt-LT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Model Selector and New Conversation Button */}
      <div className="model-selector">
        <label htmlFor="model-select">Modelis:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
        >
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={handleNewConversation}
          className="new-conversation-btn"
          title="Start a new conversation"
        >
          New Conversation
        </button>
        {currentConversationId && (
          <div className="conversation-status">
            <span className="conversation-label">Conversation ID:</span>
            <span className="conversation-id">{currentConversationId.substring(0, 20)}...</span>
          </div>
        )}
      </div>

      {/* Journal Content */}
      <div className="journal-content">
        <div className="journal-pages">
          {messages.filter(m => m.role !== 'system').length === 0 ? (
            <div className="journal-entry assistant">
              <div className="entry-content">
                <p>Labs! Kaip tu šiandien? Pasidalink savo mintimis...</p>
              </div>
            </div>
          ) : (
            messages
              .filter(msg => msg.role !== 'system')
              .map((msg, i) => (
                <div key={i} className={`journal-entry ${msg.role}`}>
                  <div className="entry-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Journal Input */}
      <div className="journal-input-section">
        <form className="journal-input-form" onSubmit={sendMessage}>
          <div className="input-wrapper">
            <textarea
              className="journal-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Parašyk savo mintis čia..."
              disabled={loading}
              rows={3}
            />
            <button
              className="journal-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
            >
              {loading ? 'Rašo...' : 'Įrašyti'}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="journal-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Džigbo galvoja...</p>
        </div>
      )}
    </div>
  );
} 