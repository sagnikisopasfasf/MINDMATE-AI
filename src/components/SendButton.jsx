// components/Sidebar.jsx
import React from "react";
import "../styles/Sidebar.css";
// import Logo from "./Logo";

const Sidebar = ({ onNewChat, visible }) => {
  return (
    <div className={`sidebar ${visible ? "visible" : "hidden"}`}>
      {/* <Logo /> */}
      {/* <div className="new-chat" onClick={onNewChat}>
        + New Chat
      </div> */}
    </div>
  );
};

export default Sidebar;
