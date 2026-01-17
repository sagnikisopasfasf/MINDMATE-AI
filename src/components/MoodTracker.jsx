// src/components/MoodTracker.jsx
import React, { useState } from "react";
import "../styles/App.css";

const moods = [
  { emoji: "😀", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😌", label: "Relaxed" },
  { emoji: "🤔", label: "Thoughtful" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😎", label: "Confident" },
];

export default function MoodTracker({ onSelectMood }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (mood) => {
    setLoading(true);
    await onSelectMood(mood); // parent (App.jsx) handles AI + Firebase
    setLoading(false);
  };

  return (
    <div className="mood-selector">
      <h4>How are you feeling today?</h4>

      <div className="mood-grid">
        {moods.map((m) => (
          <button
            key={m.label}
            className="mood-btn"
            onClick={() => handleClick(m.label)}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {loading && <p className="ai-thinking">🤖 Thinking...</p>}
    </div>
  );
}
