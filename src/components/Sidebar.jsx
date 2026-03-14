import React, { useState, useRef } from "react";
import {
  SmilePlus,
  NotebookPen,
  Activity,
  Target,
  UserRoundSearch,
  NotepadText,
  Stethoscope,
  SquarePen,
  ClockFading
} from "lucide-react";
import LOGO2 from "../assets/LOGO2.svg";
import "../styles/App.css";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  chatTitles = [],
  onNewChat,
  onSelectChat,
  activeChatId,
  onDeleteChat,
  searchTerm,
  setSearchTerm,
  onToggleSidebar,
  collapsed,
  onToggleCollapse,
  sidebarOpen,
  onOpenMoodTracker,
  goToPremium,
  mode,
  setMode,
  onOpenSearch
}) {
  const [deleteVisibleForId, setDeleteVisibleForId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [anim, setAnim] = useState("fade-in");
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("sidebar-overlay")) {
      onToggleSidebar();
    }
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setAnim("fade-out");
    setTimeout(() => {
      setMode(m);
      setAnim("fade-in");
    }, 160);
  };

  const handleTouchStart = (chatId) => {
    timerRef.current = setTimeout(() => {
      setDeleteVisibleForId(chatId);
    }, 700);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleChatClick = (chatId) => {
    if (deleteVisibleForId && deleteVisibleForId !== chatId) {
      setDeleteVisibleForId(null);
    }
    onSelectChat(chatId);
  };

  const filteredChats = chatTitles.filter((chat) =>
    (chat.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );



  return (
    <>
      {sidebarOpen && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : "collapsed"}`}
          onClick={handleOverlayClick}
        />
      )}

      <div
        className={`sidebar ${collapsed ? "collapsed" : "expanded"} ${sidebarOpen ? "visible" : ""
          }`}
      >
        {/* Logo */}
        <div className="logo-wrapper">

  <img
    src={LOGO2}
    alt="MindMate Logo"
    className="logo-i"
  />

  <button
    className="collapse-btn"
    onClick={onToggleCollapse}
  >
    <svg width="18" height="18" viewBox="0 0 24 24">
      {collapsed ? (
        <path
          d="M9 18l6-6-6-6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M15 18l-6-6 6-6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  </button>

</div>

        {/* ---------- MIDDLE SECTION ---------- */}
        <div className={`sidebar-middle ${anim}`}>

          {/* Slide Toggle - hidden if collapsed */}
          {/* {!collapsed && (
            <div className="slide-toggle">
              <div className={`slider ${mode}`}></div>

              <div
                className="toggle-option"
                onClick={() => switchMode("therapy")}
              >
                <Activity size={18} />
                <span>Therapy</span>
              </div>

              <div
                className="toggle-option"
                onClick={() => switchMode("doctor")}
              >
                {/* Medical Cross *
                <Stethoscope size={18}/>
                <span>Doctor</span>
              </div>
            </div>
          )} */}

          <button
            onClick={onNewChat}
            className="new-chat-btn"

            style={{

              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "bold",
              marginTop: "5px",
              padding: "1px 16px",
              backgroundColor: "transparent",
              color: "white",
              border: "none",

              cursor: "pointer",
              transition: "all 0.2s ease-in-out", // smooth effect
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Chat Plus Icon */}
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

            {!collapsed && <span>New Chat</span>}
          </button>

          {/* ---------- MODE BASED FEATURES ---------- */}
          {mode === "therapy" ? (
            <>
              <div className="feature-btn" onClick={onOpenMoodTracker}>
                <SmilePlus size={18} />
                {!collapsed && <span>Mood</span>}
              </div>

              <div
                className="feature-btn"
                onClick={() => navigate("/journals")}
              >
                <NotebookPen size={18} />
                {!collapsed && <span>Journaling</span>}
              </div>

              <div className="feature-btn" onClick={() => navigate("/goals")}>
                <Target size={18} />
                {!collapsed && <span>Goals</span>}
              </div>


            </>
          ) : (
            <>
              <div
                className="feature-btn"
                onClick={() => navigate("/medical-summary")}
              >
                <NotepadText size={18} />
                {!collapsed && <span>Dashboard</span>}
              </div>

              <div
                className="feature-btn"
                onClick={() => navigate("/nearby-doctors")}
              >
                <UserRoundSearch size={18} />
                {!collapsed && <span>Nearby Doctors</span>}
              </div>

              <div
                className="feature-btn"
                onClick={() => navigate("/appointments")}
              >
                <ClockFading size={18} />
                {!collapsed && <span>Appointments</span>}
              </div>

              <div
                className="feature-btn"
                onClick={() => navigate("/health-reports")}
              >
                <SquarePen size={18} />
                {!collapsed && <span>Health Reports</span>}
              </div>
            </>
          )}

          <div
            className={`search-container ${collapsed ? "collapsed" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
          >

            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            {!collapsed && (
              <span className="search-placeholder">
                Search chats...

              </span>
            )}

          </div>
        </div>

        {/* ---------- BOTTOM SECTION ---------- */}
        {collapsed && (
          <div className="sidebar-bottom">
            <div className="upgrade-section" onClick={goToPremium}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="upgrade-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l2.09 6.26L21 9.27l-5 3.64L17.18 21 12 17.27 6.82 21 8 12.91l-5-3.64 6.91-1.01L12 3z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ---------- CHATS ---------- */}
        <div className="chat-header">Chats</div>

        <ul
          className="chat-list"
          style={{
            pointerEvents: collapsed ? "none" : "auto",
            opacity: collapsed ? 0 : 1
          }}
        >
          {filteredChats.length === 0 ? (
            <li className="no-chats-message">No chats found</li>
          ) : (
            filteredChats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={
                  chat.id === activeChatId ? "active clickable" : "clickable"
                }
                title={chat.title}
                onTouchStart={() => handleTouchStart(chat.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              >
                <span className="chat-title">
                  {chat.title || "Untitled Chat"}
                  <span className="dot-after-title">.</span>
                </span>

                <button
                  className={`delete-btn ${deleteVisibleForId === chat.id ? "visible-mobile" : ""
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(chat.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="18"
                    height="18"
                    className="trash-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {showDeleteModal && (
        <div className="modal-over" onClick={() => setShowDeleteModal(false)}>
          <div
            className="modal-cont"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setShowDeleteModal(false)}
            >
              &times;
            </button>

            <h2>Confirm Delete</h2>
            <p>
              Are you sure you want to delete{" "}
              {chatTitles.find((c) => c.id === chatToDelete)?.title ||
                "this chat"}
              ?
            </p>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="delete-b"
                onClick={() => {
                  if (chatToDelete) onDeleteChat(chatToDelete);
                  setChatToDelete(null);
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
