import React from "react";
import "../styles/LoginScreen.css";
import googleLogo from "../assets/google-logo.svg"; 
import appleLogo from "../assets/apple-logo.svg";
import micro from "../assets/microsoft-icon-logo.svg"
import LOGO2 from "../assets/LOGO2.svg";

const LoginScreen = ({ onGoogleLogin, onGuestLogin }) => {
  return (
    <div className="login-screen">
      <div className="login-box">
        {/* Logo */}
        <img src={LOGO2} alt="MindMate Logo" className="logo" />

        {/* Heading */}
        <h1 className="title">
          Welcome to <span className="highlight">MindMate</span> 
        </h1>
        <p className="subtitle">Your emotional wellness & career assistant</p>

        {/* Social Logins */}
        <button className="social-btn google" onClick={onGoogleLogin}>
          <img src={googleLogo} alt="Google" className="icon" />
          Continue with Google
        </button>

        <button className="social-btn apple">
          <img src={appleLogo} alt="Google" className="icon" />
          Continue with Apple
        </button>

        <button className="social-btn github">
          <img src={micro} alt="Google" className="icon" />
          Continue with Microsoft
        </button>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Email/Password Login */}
        <div className="input-group">
          <input type="email" required />
          <label>Email</label>
        </div>

        <div className="input-group">
          <input type="password" required />
          <label>Password</label>
        </div>

        <button className="login-btn">Login with Email</button>

        <a href="#" className="forgot-link">Forgot password?</a>

        {/* Guest Login */}
        <button className="guest-btn" onClick={onGuestLogin}>
          Try it first!
        </button>

        {/* Signup */}
        <p className="signup-text">
          Don’t have an account? <a href="#">Sign up</a>
        </p>

        
      </div>
    </div>
  );
};

export default LoginScreen;
