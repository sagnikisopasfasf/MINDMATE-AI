import { X } from "lucide-react";
import "../styles/Settings.css";
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  getDoc,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from "firebase/auth";

const sections = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "personalization", label: "Personalization" },
  { id: "connected", label: "Connected apps" },
  { id: "data", label: "Data controls" },
  { id: "security", label: "Security" },
  { id: "account", label: "Account" },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [active, setActive] = useState("general");
  const [closing, setClosing] = useState(false);
  const [theme, setTheme] = useState("dark");

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load theme from Firestore or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().theme) setTheme(snap.data().theme);
      } else {
        const saved = localStorage.getItem("theme");
        if (saved) setTheme(saved);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saveTheme = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { theme });
      } else {
        localStorage.setItem("theme", theme);
      }
    };
    saveTheme();
  }, [theme]);

  if (!isOpen && !closing) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const providerId = user.providerData[0]?.providerId;

    // If email/password, show password modal
    if (providerId === "password") {
      setShowPasswordModal(true);
    } else {
      // Otherwise confirm modal for OAuth providers
      setShowConfirmModal(true);
    }
  };

  const confirmDeleteOAuth = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const providerId = user.providerData[0]?.providerId;
    try {
      if (providerId === "google.com") {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else if (providerId === "facebook.com") {
        await reauthenticateWithPopup(user, new FacebookAuthProvider());
      } else {
        setErrorMessage("Unsupported provider");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      await deleteUser(user);

      setShowSuccessModal(true);
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete account. Try again.");
    }
  };

  const confirmDeletePassword = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      await deleteUser(user);

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete account. Make sure your password is correct.");
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <button className="close-btn" onClick={handleClose}><X size={20} /></button>

        <div className="settings-content">
          <aside className="settings-sidebar">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`sidebar-item ${active === s.id ? "active" : ""}`}
                onClick={() => setActive(s.id)}
              >
                {s.label}
              </button>
            ))}
          </aside>

          <main className="settings-panel">
            {active === "general" && (
              <>
                <h2>General</h2>
                <div className="setting-row">
                  <span>Theme</span>
                  <div className="theme-toggle">
                    {[
                      { id: "dark", gradient: "linear-gradient(180deg, #0f0f0f, #1a1a1a)" },
                      { id: "premium", gradient: "linear-gradient(180deg, #1a0f2e, #2e1746, #0f0f0f)" },
                      { id: "blue", gradient: "linear-gradient(180deg, #2c3e50, #4ca1af)" },
                      { id: "sunset", gradient: "linear-gradient(135deg, #1e1e2f, #3a1c71, #d76d77, #ffaf7b)" },
                      { id: "aurora", gradient: "linear-gradient(180deg, #0f2027, #203a43, #2c5364)" },
                    ].map((t) => (
                      <div
                        key={t.id}
                        className={`theme-circle ${theme === t.id ? "active" : ""}`}
                        style={{ background: t.gradient }}
                        onClick={() => setTheme(t.id)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {active === "account" && (
              <>
                <h2>Account</h2>
                <button className="logout-btn" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </>
            )}

            {active !== "general" && active !== "account" && <h2>{sections.find(s => s.id === active)?.label}</h2>}
          </main>
        </div>

        {/* Confirm OAuth Delete Modal */}
        {showConfirmModal && (
          <div className="custom-modal">
            <p>Are you sure you want to delete your account? This cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={confirmDeleteOAuth}>Yes, delete</button>
              <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Password Modal for email/password */}
        {showPasswordModal && (
          <div className="custom-modal">
            <p>Enter your password to confirm account deletion:</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <div className="modal-actions">
              <button onClick={confirmDeletePassword}>Delete Account</button>
              <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="custom-modal">
            <p>Your account has been deleted.</p>
            <button onClick={() => setShowSuccessModal(false)}>OK</button>
          </div>
        )}

        {/* Error Modal */}
        {errorMessage && (
          <div className="custom-modal">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage("")}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}
