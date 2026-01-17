// src/pages/JournalChatScreen.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    serverTimestamp,
    doc,
    query,
    orderBy,
    updateDoc,
} from "firebase/firestore";
import { FaEdit, FaMagic, FaTrash } from "react-icons/fa";
import "../styles/App.css";

const JournalChatScreen = () => {
    const [journals, setJournals] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [newEntry, setNewEntry] = useState("");

    // 🔹 Load journals on mount
    useEffect(() => {
        const fetchJournals = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const q = query(
                collection(db, "users", user.uid, "journals"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            const data = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setJournals(data);
        };
        fetchJournals();
    }, []);

    // 🔹 Save new journal
    const handleSaveNew = async () => {
        if (!newEntry.trim() && !newTitle.trim()) return;

        const createdAt = new Date();
        const formattedDate = createdAt.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",   // ✅ added year
        });

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in!");

            const docRef = await addDoc(collection(db, "users", user.uid, "journals"), {
                title: newTitle.trim() || "Untitled",
                text: newEntry.trim(),
                mood: "neutral",
                date: formattedDate,
                createdAt: serverTimestamp(),
            });

            const newDoc = {
                id: docRef.id,
                title: newTitle.trim() || "Untitled",
                text: newEntry.trim(),
                date: formattedDate,
            };

            setJournals((prev) => [newDoc, ...prev]);
            setNewTitle("");
            setNewEntry("");
        } catch (err) {
            console.error("❌ Firestore save failed:", err);
        }
    };

    // 🔹 Delete journal
    const handleDelete = async (id) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in!");
            await deleteDoc(doc(db, "users", user.uid, "journals", id));
            setJournals((prev) => prev.filter((j) => j.id !== id));
        } catch (err) {
            console.error("❌ Failed to delete journal:", err);
        }
    };

    return (
        <div className="chat-screen">
            {/* ➕ New Journal box */}
            <div className="journal-box expanded mb-4">
                <input
                    type="text"
                    placeholder="Journal Title"
                    className="w-full p-2 rounded-md mb-2 text-black"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                    placeholder="Write your thoughts..."
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                />
                <button className="save-btn" onClick={handleSaveNew}>
                    Save
                </button>
            </div>

            {/* 📝 Existing Journals */}
            {journals.map((entry) => (
                <JournalEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={() => handleDelete(entry.id)}
                />
            ))}
        </div>
    );
};

// 🔹 Subcomponent for each saved journal
const JournalEntry = ({ entry, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(entry.title || "Untitled");
    const [text, setText] = useState(entry.text);
    const [aiSuggestion, setAiSuggestion] = useState("");

    const handleAISuggest = async () => {
        setAiSuggestion("⏳ Thinking...");
        // ⚡ Hook in your AI API here
        setTimeout(() => {
            setAiSuggestion("✨ Maybe reflect more on gratitude today?");
        }, 800);
    };

    return (
        <div
            className={`journal-box ${isExpanded ? "expanded" : "collapsed"}`}
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-gray-400">{entry.date}</div>
                <button
                    className="delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <FaTrash />
                </button>
            </div>

            {isExpanded && (
                <>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={title}
                                className="w-full p-2 rounded-md mb-2 text-black"
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <button
                                className="save-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(false);
                                    // 🔹 TODO: update Firestore here
                                }}
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <div className="journal-text mt-2">{text}</div>
                    )}

                    <div className="flex gap-2 mt-3">
                        <button
                            className="save-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(false);
                            }}
                        >
                            Minimise
                        </button>
                        <button
                            className="save-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                        >
                            <FaEdit /> Edit
                        </button>
                        <button
                            className="save-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAISuggest();
                            }}
                        >
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
    );
};

export default JournalChatScreen;
