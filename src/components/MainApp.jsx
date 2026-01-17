import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatWindow from "./ChatWindow";
import "../styles/MainApp.css";

const MainApp = ({ user, isGuest, chatTitles, onNewChat }) => {
  return (
    <div className="main-app-layout">
      <Sidebar onNewChat={onNewChat} chatTitles={chatTitles} />
      <div className="main-area">
        <Topbar user={user} />
        <ChatWindow user={user} isGuest={isGuest} />
      </div>
    </div>
  );
};

export default MainApp;
