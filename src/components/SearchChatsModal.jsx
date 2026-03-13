import React, { useState, useEffect } from "react";
import "../styles/SearchChatsModal.css";
export default function SearchChatsModal({
  isOpen,
  onClose,
  chatTitles,
  onSelectChat,
  activeChatId,
  onNewChat   // ADD THIS
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (isOpen) {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }
}, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);

    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 200); // animation duration
  };

  if (!visible) return null;

  const now = new Date();

  const isToday = (date) => {
    const d = new Date(date);
    return d.toDateString() === now.toDateString();
  };

  const isYesterday = (date) => {
    const d = new Date(date);
    const y = new Date();
    y.setDate(now.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const todayChats = [];
  const yesterdayChats = [];
  const olderChats = [];

  chatTitles.forEach((chat) => {
    if (!chat.updatedAt) {
      olderChats.push(chat);
      return;
    }

    const date = chat.updatedAt?.seconds
      ? new Date(chat.updatedAt.seconds * 1000)
      : new Date(chat.updatedAt);

    if (isToday(date)) {
      todayChats.push(chat);
    } else if (isYesterday(date)) {
      yesterdayChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  const filterChats = (list) =>
    list.filter((chat) =>
      (chat.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const renderChats = (list) =>
    filterChats(list).map((chat) => (
      <div
        key={chat.id}
        className={`search-chat-item ${chat.id === activeChatId ? "active" : ""
          }`}
        onClick={() => {
          onSelectChat(chat.id);
          handleClose();
        }}
      >
        <span className="chat-icon"><div className="chat-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 453.874 453.874" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M254.152,206.042c-20.808-24.48-59.975-28.152-89.963-29.988c-56.916-3.06-150.552,7.344-162.792,77.112 c-6.12,33.659,7.344,107.1,50.796,101.592c-1.224,14.688,0,29.376,0,44.063c0,4.284,3.672,8.568,7.956,7.956 c17.136-1.836,31.824-9.18,45.9-19.584c8.568-6.731,18.36-17.136,23.256-28.151c18.972,10.403,52.02,1.224,70.38-3.061 c30.599-6.731,56.916-28.151,67.931-57.528C279.244,266.018,276.797,232.357,254.152,206.042z"></path> <path d="M453.053,144.842c-9.18-48.348-53.244-90.576-102.204-96.696c-57.528-6.732-201.348,15.912-172.583,104.04 c0.612,1.836,1.836,3.672,3.06,4.284c1.224,1.224,2.448,2.448,4.896,2.448c45.9-3.672,102.204,15.912,117.503,61.812v0.612 c0,1.224,0,2.448,0.612,3.672c8.567,26.316,26.928,45.288,53.855,52.019c4.896,1.225,10.404-2.447,10.404-7.956 c0-13.464-0.612-26.928-1.224-41.004C409.601,237.865,461.009,188.294,453.053,144.842z"></path> </g> </g></svg>
          </svg>
        </div></span>
        {chat.title || "Untitled Chat"}
      </div>
    ));

  return (
    <div
      className={`chat-search-overlay ${closing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`chat-search-modal ${closing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="search-header">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <button className="close-search" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="search-content">
          {loading ? (
            <div className="search-skeleton">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-dot"></div>
                  <div className="skeleton-lines">
                    <div className="line short"></div>
                    <div className="line long"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>

              <div
                className="new-chat-row"
                onClick={() => {
                  onNewChat();
                  handleClose();
                }}
              >
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h7"></path>
                    <line x1="19" y1="3" x2="19" y2="9"></line>
                    <line x1="16" y1="6" x2="22" y2="6"></line>
                  </svg>
                </span>

                <span className="new-chat-text">New Chat</span>
              </div>

              {filterChats(todayChats).length > 0 && (
                <>
                  <div className="search-section">Today</div>
                  {renderChats(todayChats)}
                </>
              )}

              {filterChats(yesterdayChats).length > 0 && (
                <>
                  <div className="search-section">Yesterday</div>
                  {renderChats(yesterdayChats)}
                </>
              )}

              {filterChats(olderChats).length > 0 && (
                <>
                  <div className="search-section">Older</div>
                  {renderChats(olderChats)}
                </>
              )}
              {!loading && filterChats([...todayChats, ...yesterdayChats, ...olderChats]).length === 0 && (
                <div className="no-chats">
                  No chats found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}