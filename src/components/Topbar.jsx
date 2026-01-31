import { Menu, Settings, UserPen, LifeBuoy, LogOut, Star } from 'lucide-react';
import LOGO2 from "../assets/LOGO2.svg";
import "../styles/App.css";
import { useState, useRef, useEffect } from "react";

const Topbar = ({ user, onLogout, onToggleSidebar, sidebarOpen, goToPremium, onOpenSettings, onLoginClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAvatar = () => {
    if (user?.photoURL) return user.photoURL;
    if (user?.displayName) {
      const initials = user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      return `https://via.placeholder.com/40?text=${initials}`;
    }
    return "https://via.placeholder.com/40?text=U";
  };

  return (
    <div className="topbar flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 shadow-lg">

      {/* Center: Logo */}
      <div className="brand-logo flex items-center gap-2 justify-center w-full">
        {/* Logo hidden on mobile */}
        <img
          src={LOGO2}
          alt="Logo"
          className="logo-icon h-8 w-auto hidden md:block" // only visible on md and up
        />

        {/* Brand title always visible */}
        <h2 className="brand-title text-white font-bold text-lg">MindMate</h2>
      </div>




      {/* Right: User Menu or Guest Buttons */}
      {user ? (
        <div className="profile-container relative" ref={menuRef}>
          <img
            src={getAvatar()}
            alt={user.displayName || "User"}
            className="profile-avatar w-10 h-10 rounded-full cursor-pointer border-2 border-white"
            onClick={() => setMenuOpen(prev => !prev)}
          />

          {menuOpen && (
            <div className="profile-menu absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg text-white z-50">
              <button
                className="menu-header flex items-center px-4 py-2 w-full text-white hover:bg-gray-700"
                onClick={() => {
                  setMenuOpen(false);
                  goToPremium();
                }}
              >
                <Star size={18} className="mr-2 text-white" />
                MindMate Pro
              </button>

              <hr style={{ margin: "5px 0", borderColor: 'rgba(255,255,255,0.2)' }} />

              <button className="menu-item flex items-center px-4 py-2 w-full text-white hover:bg-gray-700">
                <UserPen size={18} className="mr-2 text-white" />
                Profile
              </button>

              <button
                className="menu-item flex items-center px-4 py-2 w-full text-white hover:bg-gray-700"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings size={18} className="mr-2 text-white" />
                Settings
              </button>

              <button className="menu-item flex items-center px-4 py-2 w-full text-white hover:bg-gray-700">
                <LifeBuoy size={18} className="mr-2 text-white" />
                Help
              </button>

              <hr style={{ margin: "5px 0", borderColor: 'rgba(255,255,255,0.2)' }} />

              <button
                className="menu-item flex items-center px-4 py-2 w-full text-white hover:bg-gray-700"
                onClick={onLogout}
              >
                <LogOut size={18} className="mr-2 text-white" />
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="guest-buttons flex gap-2">
          <button
            className="px-4 py-1 rounded-md bg-white text-purple-700 font-semibold hover:bg-gray-100"
            onClick={onLoginClick}
          >
            Login
          </button>
          <button
            className="px-4 py-1 rounded-md bg-white text-purple-700 font-semibold hover:bg-gray-100"
            onClick={onLoginClick}
          >
            Sign Up
          </button>
        </div>
      )}
    </div>
  );
};

export default Topbar;
