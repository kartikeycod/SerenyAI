import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

  // 🌐 Text-to-speech function for AI replies
 const speak = (text) => {
  const synth = window.speechSynthesis;
  if (!synth) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-IN";

  // 🎵 Adjust tone and speed
  utter.rate = 2.0;   // ✅ Speed up slightly (1.0 = normal, 2.0 = max)
  utter.pitch = 1.05;  // Adds a gentle friendly tone

  synth.cancel(); // stop any previous speech
  synth.speak(utter);
};


  // 🎙️ Voice input setup
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser 😢");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
You are MindMate, a compassionate mental-health support chatbot.
Always reply in an empathetic, kind tone.
Never diagnose or give medical advice; instead, offer gentle reflections,
coping suggestions, or positive reinforcement.
If someone mentions crisis or self-harm, urge them to reach out to a trusted friend, family member, or local helpline immediately . Also it will be best if you confine your reply in a line or a two .

User: ${userMsg.text}
      `;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      setMessages((prev) => [...prev, { role: "ai", text }]);
      speak(text); // 👈 Speak AI response aloud
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Sorry, something went wrong. Please check your API key or try again.",
        },
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
              <div
                className={`message-bubble ${
                  msg.role === "user" ? "message-user" : "message-ai"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && <p className="message-loading">Typing...</p>}
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
          <button
            onClick={startListening}
            className={`mic-button ${listening ? "listening" : ""}`}
            disabled={loading}
          >
            🎤
          </button>
          <button
            onClick={sendMessage}
            className="send-button"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
