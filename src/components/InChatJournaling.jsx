// src/components/InChatJournaling.jsx
import React, { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { FaEdit, FaMagic, FaTrash } from "react-icons/fa";
import "../styles/App.css";

const InChatJournaling = ({ initialEntry, onSave, onAISuggest, onExpandChange, onDelete }) => {
  const [entry, setEntry] = useState(initialEntry?.text || "");
  const [savedEntry, setSavedEntry] = useState(initialEntry || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialEntry); // new ones auto-open
  const [aiSuggestion, setAiSuggestion] = useState("");

  const handleSave = async () => {
    if (!entry.trim()) return;

    const createdAt = new Date();
    const formattedDate = createdAt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in!");

      const docRef = await addDoc(collection(db, "users", user.uid, "journals"), {
        text: entry.trim(),
        mood: "neutral",
        createdAt: serverTimestamp(),
      });

      const newEntry = {
        id: docRef.id,
        text: entry.trim(),
        date: formattedDate,
        type: "journal",
      };

      setSavedEntry(newEntry);
      setEntry("");
      setIsExpanded(false);
      setIsEditing(false);
      onSave?.(newEntry);
      onExpandChange?.(false);
    } catch (err) {
      console.error("❌ Firestore save failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!savedEntry) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in!");

      await deleteDoc(doc(db, "users", user.uid, "journals", savedEntry.id));
      setSavedEntry(null);
      setEntry("");
      setIsExpanded(false);
      setIsEditing(false);
      setAiSuggestion("");
      onExpandChange?.(false);
      onDelete?.();
    } catch (err) {
      console.error("❌ Failed to delete journal:", err);
    }
  };

  const handleAISuggest = async () => {
    if (!savedEntry) return;
    setAiSuggestion("⏳ Thinking...");
    try {
      const suggestion = await onAISuggest?.(savedEntry.text);
      setAiSuggestion(suggestion || "No suggestions available.");
    } catch (err) {
      console.error("AI Suggestion failed:", err);
      setAiSuggestion("❌ Failed to get suggestion.");
    }
  };

  return (
    <div className="journaling-new-chat">
      {!savedEntry || isEditing ? (
        <div className="journal-box expanded">
          <textarea
            placeholder="Write your thoughts..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      ) : (
        <div
          className={`journal-box ${isExpanded ? "expanded" : "collapsed"}`}
          onClick={() => {
            if (!isExpanded) {
              setIsExpanded(true);
              onExpandChange?.(true);
            }
          }}
        >
          <div className="flex justify-between items-center">
            <span className="brick-date">{savedEntry.date}</span>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <FaTrash />
            </button>
          </div>

          {isExpanded && (
            <>
              <div className="journal-text mt-2">{savedEntry.text}</div>
              <div className="flex gap-2 mt-3">
                <button className="save-btn" onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                  onExpandChange?.(false);
                }}>Minimise</button>

                <button className="save-btn" onClick={(e) => {
                  e.stopPropagation();
                  setEntry(savedEntry.text);
                  setIsEditing(true);
                  setIsExpanded(true);
                  onExpandChange?.(true);
                }}>
                  <FaEdit /> Edit
                </button>

                <button className="save-btn" onClick={(e) => {
                  e.stopPropagation();
                  handleAISuggest();
                }}>
                  <FaMagic /> Suggest
                </button>
              </div>

              {aiSuggestion && (
                <div className="mt-3 p-2 rounded-md bg-gray-800 text-gray-200 text-sm">
                  <strong>AI Suggestion:</strong> {aiSuggestion}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InChatJournaling;
