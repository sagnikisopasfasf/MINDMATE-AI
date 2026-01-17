import React, { useEffect } from "react";
import "../styles/SplashScreen.css";
import logo from "../assets/logo.jpg"; // Rename your uploaded file to `logo.jpg` and place in /src/assets

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4000); // Stay for 4s
    return () => clearTimeout(timer);
  }, [onFinish]);

  useEffect(() => {
    const chime = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_4f3b7fb323.mp3");
    chime.volume = 0.5;
    chime.play().catch(() => {});
  }, []);

  return (
    <div className="splash-screen">
      <img src={logo} alt="MindMate Logo" className="splash-logo" />
      <h1 className="animated-text">MindMate</h1>
      <p className="splash-tagline">Your emotionally intelligent AI companion 💛</p>
    </div>
  );
};

export default SplashScreen;
