import React, { useState, useEffect } from "react";

export default function SearchChatsModal({ isOpen, onClose, chatTitles, onSelectChat, activeChatId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState(chatTitles);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chatTitles);
    } else {
      setFilteredChats(
        chatTitles.filter((chat) =>
          chat.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, chatTitles]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input premium"
            autoFocus
          />
          <button onClick={onClose} className="modal-close-btn" title="Close">
            ✕
          </button>
        </div>
        <div className="modal-content">
          {filteredChats.length === 0 ? (
            <div className="no-chats-msg">No chats found</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
                title={chat.title}
              >
                {chat.title || "Untitled Chat"}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
