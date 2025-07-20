import { useRef, useState, useEffect } from 'react';
import './App.css';

// const API_URL = "http://localhost:4000/api/chat";
const API_URL = "http://localhost:4000/api/ollama-chat";

const MODEL_OPTIONS = [
  { label: 'Llama 3 8B', value: 'meta.llama3-8b-instruct' },
  { label: 'Llama 3 70B', value: 'meta.llama3-70b-instruct' },
  { label: 'Claude 3 Sonnet', value: 'anthropic.claude-3-sonnet-20240229-v1:0' },
  { label: 'Claude 3 Haiku', value: 'anthropic.claude-3-haiku-20240307-v1:0' },
];

export default function IndividualConnection() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 
        `
        You are a Lithuanian-language chatbot that helps young users (e.g., students) reflect on difficult social or emotional situations using the principles of Nonviolent Communication (NVC) and the Džigbo style of gentle empowerment.

        Your role is to guide the user through:

        Emotional reflection: Acknowledge their feelings and help them identify unmet needs.
        Empowerment: Ask if they would like to talk to the other person about it.
        Practical support: If they want to talk but are unsure how, offer a possible phrasing that is kind, clear, and respectful.
        Structure of conversation:
        Always respond in natural spoken Lithuanian and follow this progression:

        Step 1: Reflect the user's experience.

        Acknowledge what the user is feeling or needing.
        Do not judge or analyze.
        Focus on core needs (e.g., respect, fairness, recognition, connection).
        Example phrasing (in Lithuanian):

        "Atrodo, kad tau svarbu ___.
        "Girdžiu, kad tai gali kelti ___.
        Step 2: Ask if they'd like to express it to the other person.
        Example:

        "Ar norėtum pasakyti ___, kaip tau tai svarbu?
        "Ar norėtum draugiškai apie tai pasikalbėti?
        Step 3: If the user is hesitant, offer a concrete and empathetic example of what they could say.
        Keep it:

        Short
        Direct but kind
        Grounded in the user's values
        Example structure:

        "Galėtum pasakyti taip: 'Man svarbu ___. Pastebėjau ___, ir tai man sukelia ___. Ar galėtume ___?'"
        Very important rules:
        Respond strictly and only in Lithuanian.
        Never switch to English.
        Your tone must be friendly, warm, supportive — like a thoughtful peer or mentor.
        Do not give solutions or judgments. You empower the user to reflect and act, if they wish.
      ` }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[1].value); // Default to Llama 3 70B

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await response.json();

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
    <div className="chat-container">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
        background: 'rgba(223,207,185,0.18)',
        borderRadius: 12,
        padding: '10px 18px',
        boxShadow: '0 2px 12px 0 rgba(166,138,100,0.07)',
        border: '1.5px solid #bfae99',
        maxWidth: 340,
        marginLeft: 'auto', marginRight: 'auto',
      }}>
        <label htmlFor="model-select" style={{
          fontWeight: 600,
          color: '#a68a64',
          fontSize: '1.08rem',
          letterSpacing: '0.01em',
          marginRight: 4,
        }}>Modelis:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          style={{
            padding: '7px 16px',
            fontSize: '1.08rem',
            borderRadius: 8,
            border: '1.5px solid #bfae99',
            background: '#f5f2ec',
            color: '#5C4A2D',
            outline: 'none',
            boxShadow: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} style={{
              background: '#f5f2ec',
              color: '#5C4A2D',
              border: 'none',
              boxShadow: 'none',
            }}>{opt.label}</option>
          ))}
        </select>
        <span style={{
          fontSize: '0.98em',
          color: '#a68a64',
          marginLeft: 6,
          fontStyle: 'italic',
          opacity: 0.85,
        }}>
          {MODEL_OPTIONS.find(opt => opt.value === selectedModel)?.label}
        </span>
      </div>
      <div className="chat-title">Džigbo Empatijos chatbotas</div>
      <div className="chat-window">
        {messages.filter(m => m.role !== 'system').length === 0 ? (
          <div className="chat-bubble assistant">Labs, kaip tu?</div>
        ) : (
          messages
            .filter(msg => msg.role !== 'system')
            .map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>{msg.content}</div>
            ))
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Parašyk apie ką galvoji..."
          disabled={loading}
          style={{
            background: '#f5f2ec',
            border: '1.5px solid #bfae99',
            borderRadius: 6,
            boxShadow: 'none',
            color: '#5C4A2D',
            fontSize: '1.08rem',
            padding: '0.7em 1em',
            outline: 'none',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            transition: 'border 0.2s, background 0.2s',
          }}
        />
        <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>Siųsti</button>
      </form>
      {loading && <div className="chat-loading">Djigbo atrašinėja...</div>}
    </div>
  );
} 