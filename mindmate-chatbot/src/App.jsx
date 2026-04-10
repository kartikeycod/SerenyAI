import { useState, useEffect, useRef } from "react";
import Groq from "groq-sdk"; // 👈 New Import
import "./App.css";

// Initialize Groq with your new key
const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required since we are calling from the frontend
});

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: "Hi there 👋 I’m MindMate — here to listen and share calming thoughts. How are you feeling today?",
      },
    ]);
  }, []);

  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 1.2; 
    utter.pitch = 1.05;
    synth.cancel();
    synth.speak(utter);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser 😢");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 🚀 Groq Chat Completion Logic
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are MindMate, a compassionate mental-health support chatbot. Reply in an empathetic, kind tone. Never diagnose or give medical advice. If crisis is mentioned, urge seeking professional help. Keep replies very short (1-2 lines)."
          },
          {
            role: "user",
            content: input
          }
        ],
        model: "llama-3.3-70b-versatile", // Powerful and smart
        temperature: 0.7,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "";

      setMessages((prev) => [...prev, { role: "ai", text: responseText }]);
      speak(responseText);
    } catch (error) {
      console.error("Groq API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h1 className="chatbot-header">
        🧠 Sereny-AI <h5>we do care for you</h5>
      </h1>

      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className="message-wrapper">
              <div className={`message-bubble ${msg.role === "user" ? "message-user" : "message-ai"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <p className="message-loading">Thinking...</p>}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            className="input-field"
            placeholder="Type or speak..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button onClick={startListening} className={`mic-button ${listening ? "listening" : ""}`} disabled={loading}>
            🎤
          </button>
          <button onClick={sendMessage} className="send-button" disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}