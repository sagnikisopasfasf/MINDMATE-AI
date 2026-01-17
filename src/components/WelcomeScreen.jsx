import React, { useEffect, useState } from "react";
import "../styles/App.css";

export const therapyMessages = [
  "Take a deep breath. I’m here for you",
  "Let’s talk about your day or dreams!",
  "Relax, share anything with me",
  "Good vibes incoming! How are you feeling today?",
  "A fresh thought, a fresh start! Let’s dive in.",
  "Hey! Let’s set some goals and crush them.",
  "Welcome {name}! Let’s make your mind a happier place today",
  "Every thought matters. Let’s talk!",
  "Hello, {name}! Ready to explore your thoughts today?",
  "Welcome back, {name}! Let’s make today amazing."
];

export const doctorMessages = [
  "Hi {name}, how can I help you today? Describe your symptoms clearly.",
  "Tell me what you're experiencing — I will assist step by step.",
  "I'm here to help medically. What symptoms are troubling you?",
  "Your health matters. Share what's bothering you.",
  "Let's begin — describe any discomfort or symptoms you're having.",
  "I'm listening. Tell me about your symptoms in detail."
];

const WelcomeScreen = ({ user, mode }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const firstName = user?.displayName?.split(" ")[0] || "there";

    // Select messages based on mode
    const list = mode === "doctor" ? doctorMessages : therapyMessages;

    const randomMessage = list[Math.floor(Math.random() * list.length)];

    const personalized = randomMessage.includes("{name}")
      ? randomMessage.replace("{name}", firstName)
      : randomMessage;

    setMessage(personalized);
  }, [user, mode]);

  return (
    <div className="welcome-container">
      <h1 className="welcome-text">{message}</h1>
    </div>
  );
};

export default WelcomeScreen;
