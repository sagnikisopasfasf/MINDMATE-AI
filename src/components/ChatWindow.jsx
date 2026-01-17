import React, { useState } from "react";
import SendButton from "./SendButton";
import "../styles/ChatWindow.css";

const ChatWindow = () => {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setChatLog([...chatLog, { from: "user", text: input }]);
    setInput("");
    // Add logic to handle API call and bot response
  };

  const handleStop = () => {
    // Stop voice
    setIsSpeaking(false);
  };

  return (
    <div className="chat-body">
      
      <div className="chat-log">
        {chatLog.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-container">
        <div className="input-inner">
          <input
            className="input-box"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <SendButton isSpeaking={isSpeaking} onSend={handleSend} onStop={handleStop} />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
