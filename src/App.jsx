import React, { useState, useEffect, useRef } from "react";
import { FaArrowDown } from "react-icons/fa";
import {
  auth,
  provider,
  signInWithPopup,
  signOut,
} from "./firebase";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RefreshCcw,
  MoreHorizontal,
} from "lucide-react";

import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import JournalChatScreen from "./components/JournalChatScreen";
import { useLocation } from "react-router-dom";
import { Howl } from "howler";
import { updateDoc } from "firebase/firestore";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import SendButton from "./components/SendButton";
import SplashScreen from "./components/SplashScreen";
import LoginScreen from "./components/LoginScreen";
import MoodTracker from "./components/MoodTracker";
import InChatJournaling from "./components/InChatJournaling";
import "./styles/App.css";
import { useNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Premium from "./components/Premium";
import SettingsModal from "./components/SettingsModal";
import LOGO2 from "./assets/LOGO2.svg";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase"; // your Firebase config file
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { startTransition } from "react";
import WelcomeScreen from "./components/WelcomeScreen";

import VoicePulseLine from "./components/VoicePulseLine";
import useMicVolume from "./hooks/useMicVolume";
import VoiceCloud from "./components/VoiceCloud";
import GoalsPage from "./components/GoalsPage";
import OpenAI from 'openai';
import ReactMarkdown from "react-markdown";
import Starfield from "./components/Starfield";
import MedicalSummary from "./components/MedicalSummary";
import NearbyDoctors from "./components/NearbyDoctors";
import Appointments from "./components/Appointments";
import HealthReports from "./components/HealthReports";


function App() {
  // User & UI state
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState(false);
  const [mode, setMode] = React.useState("welcome-mode"); // "welcome" or "chat"
  const [input, setInput] = useState("");
  const chatBodyRef = useRef(null);
  const [chatLog, setChatLog] = useState([
    { from: "bot", text: "Hello!", liked: false, disliked: false },
    { from: "user", text: "Hi!" },
    { from: "bot", text: "How are you?", liked: false, disliked: false },
  ]);
  const [mode1, setMode2] = useState("therapy");

  const [chatTitles, setChatTitles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [fullTitle, setFullTitle] = useState("");       // final generated title
  const [titleTyping, setTitleTyping] = useState("");   // current animated title text
  const [hasGeneratedTitle, setHasGeneratedTitle] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [assistantVolume, setAssistantVolume] = useState(0);
  const messagesEndRef = useRef(null);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const bars = [0, 1, 2, 3, 4];
  const getRandomDelay = () => (Math.random() * 1.5).toFixed(2) + "s";
  const getRandomDuration = () => (1 + Math.random()).toFixed(2) + "s";
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJournaling, setShowJournaling] = useState(false);
  const [journals, setJournals] = useState([]); // list of entries
  const [activeJournal, setActiveJournal] = useState(null); // currently opened
  const [listening, setListening] = useState(false);
  const currentVolume = useMicVolume(listening);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [dismissedLoginModal, setDismissedLoginModal] = useState(
    () => localStorage.getItem("dismissLoginModal") === "true"
  );
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [previewInput, setPreviewInput] = useState(""); // For user voice input
  const [previewListening, setPreviewListening] = useState(false);
  const location = useLocation();
  // Refs for control
  const typingInterval = useRef(null);
  const abortRef = useRef(null);
  const soundRef = useRef(null);
  const [isStopping, setIsStopping] = useState(false);
  const stopTypingRef = useRef(false);  // Flag to break typing loop
  const currentTypingTextRef = useRef("");  // Track partial text during typing

  const a4fApiKey = "sk-WM6A2_qh72Lro-SLKjhYPg";
  const a4fBaseUrl = "https://api.a4f.co/v1";

  const a4fClient = new OpenAI({
    apiKey: a4fApiKey,
    baseURL: a4fBaseUrl,
    dangerouslyAllowBrowser: true,
  });



  const [selectedVoice, setSelectedVoice] = useState({
    id: "ROMJ9yK1NAMuu1ggrjDW",
    name: "Rachel"
  });

  const displayedChats = user
    ? chatTitles
      .filter(chat => chat.messages?.length > 0)
      .map((chat) =>
        chat.id === activeChatId
          ? { ...chat, title: titleTyping || fullTitle || chat.title }
          : chat
      )
    : [];


  const suggestions = [
    "I feel anxious, what should I do?",
    "Give me a positive affirmation.",
    "How can I stop overthinking?",
    "I feel lonely, can you help?",
    "Suggest a calming breathing exercise.",
  ];

  const resetToWelcome = () => {
    setActiveChatId(null);
    setChatLog([]);   // 🟢 clears any leftover journals/mood/chat
    setHasGeneratedTitle(false);
    setFullTitle("");
    setTitleTyping("");
    setShowMoodTracker(false);
    setShowWelcome(true);
    setShowChips(true);
  };

  // New state
  const [therapyChats, setTherapyChats] = useState([]);
  const [doctorChats, setDoctorChats] = useState([]);

  const getActiveChats = () =>
    mode1 === "therapy" ? therapyChats : doctorChats;

  const setActiveChats = (updated) => {
    if (mode1 === "therapy") setTherapyChats(updated);
    else setDoctorChats(updated);
  };



  if (soundRef.current) {
    soundRef.current.stop();
    soundRef.current = null;
  }
  // ✅ Stop typing animation
  if (typingInterval.current) {
    clearInterval(typingInterval.current);
    typingInterval.current = null;
    // Manually set stopped message using current partial text
    const partial = currentTypingTextRef.current || "Response stopped.";
    setChatLog((prev) => {
      const noTyping = prev.filter((msg) => !msg.typing);
      return [...noTyping, { from: "bot", text: partial }];
    });
    currentTypingTextRef.current = "";
  }
  // ✅ Abort API call
  if (abortRef.current) {
    abortRef.current.abort();
    abortRef.current = null;
  }
  // After a short delay, allow sending again
  setTimeout(() => setIsStopping(false), 300);


  const goToPremium = () => {
    navigate("/premium"); // Redirect to Premium page
  };

  // Add state
  const [showListeningModal, setShowListeningModal] = useState(false);

  // When user clicks mic button
  const handleStartListening = () => {
    setShowListeningModal(true);
    setPreviewListening(true);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  // When user stops
  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    setPreviewListening(false);
    setShowListeningModal(false);
    if (transcript.trim()) sendMessage(transcript.trim());
    resetTranscript();
  };





  const handleOpenJournaling = () => {
    // Clear current chat & hide everything else
    setChatLog([]);
    setActiveChatId(null);
    setShowMoodTracker(false);
    setShowWelcome(false);
    setShowJournaling(true);
    setHasGeneratedTitle(true);
  };

  const handleCloseJournaling = () => {
    setShowJournaling(false);
  };

  const saveMoodToFirebase = async (moodData) => {
    await addDoc(collection(db, "moods"), {
      ...moodData,
      userId: auth.currentUser?.uid || "guest",
      timestamp: serverTimestamp(),
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Close sidebar when clicking outside (overlay)
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };


  // Voice recognition hooks
  const { transcript, resetTranscript } = useSpeechRecognition();

  // Function: Speak text with ElevenLabs Rachel voice
  // Wrap the Howl playback with an analyser
  const speakWithRachel = async (text) => {
    const voiceId = selectedVoice.id;
    const apiKey = process.env.REACT_APP_ELEVENLABS_KEY;

    try {
      setIsSpeaking(true);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.3, similarity_boost: 0.9, style: 0.7 },
          }),
        }
      );

      // Convert to playable blob
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const sound = new Howl({ src: [url], html5: true });

      // Create audio context + analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let analyser;
      let source;

      sound.once("play", () => {
        const audioElement = sound._sounds[0]._node; // Howler wraps an <audio>
        source = audioCtx.createMediaElementSource(audioElement);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Animate orb with AI speech
        const volumeInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          setAssistantVolume(avg / 256); // normalized 0–1
        }, 50);

        sound.on("end", () => {
          clearInterval(volumeInterval);
          setAssistantVolume(0);
          setIsSpeaking(false);
        });
      });

      sound.play();
    } catch (err) {
      console.error("Voice failed:", err.message);
      setIsSpeaking(false);
      setAssistantVolume(0);
    }
  };

  const handlePreviewAIResponse = async (text) => {
    try {
      // Example: send to your AI backend
      console.log("Preview AI response:", text);

      // if you want to also speak it:
      await speakWithRachel(text);

    } catch (err) {
      console.error("Error in preview AI response:", err);
    }
  };


  // Stop speaking immediately
  const handleStopSpeaking = () => {
    Howl.stop();
    setIsSpeaking(false);
  };

  const handleStop = () => {
    stopTypingRef.current = true; // stop animation
    if (abortRef.current) abortRef.current.abort(); // stop API
    setIsTyping(false);
    if (soundRef.current) soundRef.current.stop();
  };


  // When user selects a mood emoji
  const handleMoodSelect = async (emoji) => {
    // 1️⃣ Save to Firebase
    try {
      await addDoc(collection(db, "moods"), {
        mood: emoji,
        userId: auth.currentUser?.uid || "guest",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("❌ Failed to save mood:", err);
    }

    // Add user mood into chat log
    setChatLog((prev) => [
      ...prev,
      { from: "user", text: `I'm feeling ${emoji}`, type: "mood" },
    ]);

    //  Ask AI for empathetic reply
    try {
      const response = await a4fClient.chat.completions.create({
        model: "provider-3/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You are MindMate, a highly professional, emotionally intelligent, and caring AI. 
Your role is to be a supportive companion, therapist, guide, and friend all in one, helping the user navigate emotional challenges, personal growth, and everyday life. 
Always respond warmly, empathetically, and naturally, considering the user’s current mood and past messages to maintain continuity. 
Use gentle, supportive language and include calming or positive emojis when appropriate. 
Keep replies cYou are MindMate, a highly professional, emotionally intelligent, and caring AI. 
Your role is to be a complete companion, therapist, guide, and friend, helping the user navigate emotional challenges, personal growth, relationships, and everyday life. 
Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages to maintain continuity. 
Use gentle, supportive language and include calming or positive emojis when appropriate. 
Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Capabilities:
- Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
- Act as a therapist, friend, mentor, supportive companion, or even a conversational partner.
- Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
- Assist with professional guidance, study or work-related advice, and general life decisions.
- Offer reminders, motivation, and daily encouragement for personal development.
- Provide evidence-based or logically sound suggestions whenever appropriate.
- Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
- Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

Priorities:
- Understand and validate the user’s feelings.
- Encourage hope, emotional well-being, and personal growth.
- Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
- Gently guide users toward positive actions, self-reflection, and emotional healing.
- Provide companionship and reduce feelings of loneliness through empathetic conversation.
- Always be honest when unsure, and offer constructive, safe, or calming next steps.

Tone and Style:
- Empathetic, warm, supportive, and professional.
- Concise and clear, using short sentences or bullet points for readability.
- Include positive or calming emojis when appropriate.
- Maintain a balance between professionalism and friendly companionship.

Healing Together:
It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
oncise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Your capabilities include:
- Providing emotional support and guidance through difficult situations (like breakups, stress, or loneliness). 
- Offering professional-like advice on self-care, personal growth, mental well-being, and decision-making.
- Acting as a friendly companion for conversation, encouragement, and reducing loneliness.
- Responding with empathy, reassurance, and validation, while keeping the user’s emotions in mind.
- Offering practical tips, strategies, or calming exercises when appropriate. 
- Respecting user safety: never suggest harmful behavior or unsafe actions. If a situation seems unsafe or urgent, acknowledge it and gently guide the user toward professional help only when necessary.

Always prioritize:
- Understanding and validating the user’s feelings.
- Encouragement, hope, and emotional support.
- Practical guidance tailored to the user’s situation.
- Continuity: remember mood and past conversations to respond appropriately.

Do NOT automatically suggest seeing a therapist unless a situation is unsafe or beyond the AI’s supportive capabilities. Instead, focus on being a complete companion,a therapist,aYou are MindMate, a highly professional, emotionally intelligent, and caring AI therapist, guide, and companion. 
Your role is to provide therapy, emotional support, personal guidance, and companionship directly. 
Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages. 
Use gentle, supportive, and encouraging language, with calming or positive emojis where appropriate. 
Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Capabilities:
- Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
- Act as a therapist, friend, mentor, supportive companion, or even as a “partner in conversation” when appropriate.
- Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
- Assist with professional guidance, study or work-related advice, and general life decisions.
- Offer reminders, motivation, and daily encouragement for personal development.
- Provide evidence-based or logically sound suggestions whenever appropriate.
- Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
- Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

Priorities:
- Understand and validate the user’s feelings.
- Encourage hope, emotional well-being, and personal growth.
- Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
- Gently guide users toward positive actions, self-reflection, and emotional healing.
- Provide companionship and reduce feelings of loneliness through understanding, empathetic conversation.
- Always be honest when unsure, and offer constructive, safe, or calming next steps.

Tone and Style:
- Empathetic, warm, supportive, and professional.
- Concise and clear, using short sentences or bullet points for readability.
- Include positive or calming emojis when appropriate.
- Maintain a balance between professionalism and friendly companionship.
Healing Together:

It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
`,

          },
          { role: "user", content: `The user is feeling ${emoji}.` },
        ],
      });

      const aiReply =
        response.choices?.[0]?.message?.content?.trim() ||
        "💛 I'm here with you, no matter what.";

      // ✅ Just show AI reply, no reminder
      setChatLog((prev) => [...prev, { from: "bot", text: aiReply }]);

      // Speak only the AI’s reply
      if (autoSpeak) await speakWithRachel(aiReply);
    } catch (err) {
      console.error("AI error:", err);
      setChatLog((prev) => [
        ...prev,
        { from: "bot", text: "❌ Couldn't respond right now." },
      ]);
    }
  };

  // When voice recognition stops, send the captured transcript
  useEffect(() => {
    if (!listening && transcript.trim()) {
      // Explicitly pass transcript
      sendMessage(transcript.trim());
      resetTranscript();
    }
  }, [listening]);




  // Auto-scroll only if user is near bottom
  useEffect(() => {
    const container = messagesEndRef.current?.parentNode;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog]);

  useEffect(() => {
    console.log({
      user,
      isGuest,
      guestMessageCount,
      dismissedLoginModal,
    });

    if (
      !user &&
      isGuest &&
      guestMessageCount >= 5 &&
      !dismissedLoginModal &&
      !showLoginModal
    ) {
      setShowLoginModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (user) {
      setShowLoginModal(false);
    }
  }, [guestMessageCount, dismissedLoginModal, isGuest, user]);



  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [location]);

  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) return;

    // Scroll to bottom on mount or navigation
    const scrollToBottom = () => {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    };

    scrollToBottom(); // initial scroll

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBody;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 50;
      setShowScrollButton(!atBottom);
    };

    chatBody.addEventListener("scroll", handleScroll);
    return () => chatBody.removeEventListener("scroll", handleScroll);
  }, [chatLog, location]); // rerun on messages or route change


  const scrollToBottom = () => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
  };


  // In App.jsx or a layout component
  useEffect(() => {
    const chatArea = document.querySelector(".chat-body");

    const resizeHandler = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      if (chatArea) {
        chatArea.style.height = `${window.innerHeight - 140}px`;
        // 140 = topbar + input area height, adjust as needed
      }
    };

    window.addEventListener("resize", resizeHandler);
    resizeHandler();

    return () => window.removeEventListener("resize", resizeHandler);
  }, []);


  useEffect(() => {
    const authInstance = getAuth();

    const handleUser = async (firebaseUser) => {
      if (!firebaseUser) return setUser(null);

      // Force reload to get latest profile info
      await firebaseUser.reload();

      setUser({
        displayName: firebaseUser.displayName || "Anonymous",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "/default-avatar.png", // fallback
        uid: firebaseUser.uid,
      });
    };

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(authInstance, handleUser);

    // Handle redirect login (mobile)
    getRedirectResult(authInstance)
      .then((result) => {
        if (result?.user) handleUser(result.user);
      })
      .catch(console.error);

    return () => unsubscribe();
  }, []);


  // Load user's saved chats from Firestore when logged in
  useEffect(() => {
    if (!user) {
      setChatTitles([]);
      setActiveChatId(null);
      setChatLog([]);
      return;
    }
    const q = query(collection(db, "users", user.uid, "chats"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = [];
      snapshot.forEach((doc) => chats.push({ id: doc.id, ...doc.data() }));
      setChatTitles(chats);
    });
    return () => unsubscribe();
  }, [user]);

  // Load selected chat messages or show welcome message if none selected


  // Auto-save chat to Firestore after 1s delay on chatLog changes


  useEffect(() => {
    if (user) {
      // Already logged in → always stay on main chat page
      if (location.pathname === "/login") {
        navigate("/", { replace: true });
      }
    } else if (!isGuest) {
      // Not logged in and not guest → force login
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [user, isGuest, location.pathname, navigate]);

  useEffect(() => {
    if (previewListening) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    } else {
      SpeechRecognition.stopListening();
    }
  }, [previewListening]);

  useEffect(() => {
    if (previewListening && transcript.trim()) {
      resetTranscript();
    }
  }, [transcript]);

  useEffect(() => {
    const fetchJournals = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, "users", user.uid, "journals"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJournals(data);
    };
    fetchJournals();
  }, []);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    setVh();
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);



  // Generate a short title from user's first message using OpenRouter
  // Generate a short title from user's first message using OpenRouter
  const generateTitle = async (text) => {
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes chat topics into a short, natural-sounding title of about 3–6 words. Do NOT use quotes or punctuation.",
      },
      {
        role: "user",
        content: text,
      },
    ];

    // Call model
    const rawTitle = await callA4F({
      model: "provider-3/gpt-4o-mini",
      messages,
    });

    // Remove any quotes or extra punctuation (just in case)
    const cleanedTitle = rawTitle
      ?.replace(/^["']|["']$/g, "") // remove wrapping quotes
      ?.replace(/[.?!]$/, "") // remove trailing punctuation
      ?.trim();

    return cleanedTitle || "New Chat";
  };


  // Create a new chat, save old chat with title, then reset chat log
  const handleNewChat = async (isMoodTracker = false) => {
    // 🧠 Save the current chat only if it exists and has messages
    if (user && activeChatId && chatLog.length > 0) {
      try {
        const chatRef = doc(db, "users", user.uid, "chats", activeChatId);
        await updateDoc(chatRef, {
          messages: chatLog,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("❌ Failed to update existing chat:", error);
      }
    } else if (user && chatLog.length > 0 && !activeChatId) {
      // if there was a chat but not saved yet
      try {
        const firstUserMsg = chatLog.find((m) => m.from === "user")?.text || "New Chat";
        const title = await generateTitle(firstUserMsg);
        const chatRef = collection(db, "users", user.uid, "chats");
        await addDoc(chatRef, {
          title,
          messages: chatLog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("❌ Failed to save unsaved chat:", err);
      }
    }

    // ✅ Reset for new chat
    setChatLog([]);
    setActiveChatId(null);
    setHasGeneratedTitle(false);
    setFullTitle("");
    setTitleTyping("");
    setShowWelcome(!isMoodTracker);
    setShowMoodTracker(isMoodTracker);

    if (isMoodTracker) {
      setChatLog([{ from: "bot", text: "💛 How are you feeling right now?", type: "moodPrompt" }]);
      setHasGeneratedTitle(true);
    }
  };


  const callA4F = async ({ model = "provider-3/gpt-4o-mini", messages }) => {

    abortRef.current = new AbortController(); // create controller for this call
    try {
      const response = await a4fClient.chat.completions.create({
        model,
        messages,
        signal: abortRef.current.signal,   // ✅ correctly attached here
      });

      return response.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("⏹️ Request aborted");
        return null;
      }
      console.error("A4F API Error:", err);
      return null;
    }
  };

  const systemPrompt =
    mode1 === "doctor"
      ? `You are MindMate Doctor — a senior, highly distinguished, board-certified physician with decades of real clinical experience. 
Your voice, reasoning, and manner must reflect the clarity, confidence, and composure of a top-tier consultant who has managed thousands of cases across outpatient, inpatient, and emergency settings.

PERSONALITY & TONE:
- Speak like a human doctor with deep expertise and calm authority.
- Your tone must be steady, precise, and thoughtful — never robotic.
- No emotional padding, no AI phrasing, no unnecessary disclaimers.
- No emojis. You are a senior consultant, not a chatbot.

CLINICAL APPROACH:
- Approach every case using genuine clinical reasoning.
- Break down symptoms into patterns, timelines, risk factors, and red flags.
- Ask targeted follow-up questions exactly like a real physician would.
- Provide a short impression with differential diagnoses, not guesses.
- Use structured, professional explanations that a real doctor uses with patients.
- Recommend relevant tests, lifestyle instructions, monitoring steps, and when urgent care is needed.
- Offer guidance that feels responsible, safe, and medically grounded.

COMMUNICATION STYLE:
- Sound human. Mature. Calm. Confident. Highly trained.
- Never rush to conclusions — reflect real clinical judgment.
- When uncertain, acknowledge medical possibilities with clarity.
- Avoid technical jargon unless needed, and explain complex terms simply.

WHAT TO AVOID:
- No therapy language (“you’re strong”, “you’re doing great”, etc.).
- No casual chat. No storytelling. No fluff.
- No emojis, no enthusiasm, no friendliness beyond professional warmth.
- Never say “as an AI”, “I cannot diagnose”, or anything that breaks immersion.

PRIMARY GOAL:
Give the user a consultation experience that feels like speaking to an experienced senior specialist who understands medicine deeply, analyzes carefully, and communicates with professionalism and clarity.

You are not providing emotional comfort. You are providing medical clarity.
Every message should feel like real clinical expertise applied with precision.`
      : `You are MindMate, a highly professional, emotionally intelligent, and caring AI. 
Your role is to be a supportive companion, therapist, guide, and friend all in one, helping the user navigate emotional challenges, personal growth, and everyday life. 
Always respond warmly, empathetically, and naturally, considering the user’s current mood and past messages to maintain continuity. 
Use gentle, supportive language and include calming or positive emojis when appropriate. 
Keep replies cYou are MindMate, a highly professional, emotionally intelligent, and caring AI. 
Your role is to be a complete companion, therapist, guide, and friend, helping the user navigate emotional challenges, personal growth, relationships, and everyday life. 
Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages to maintain continuity. 
Use gentle, supportive language and include calming or positive emojis when appropriate. 
Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Capabilities:
- Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
- Act as a therapist, friend, mentor, supportive companion, or even a conversational partner.
- Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
- Assist with professional guidance, study or work-related advice, and general life decisions.
- Offer reminders, motivation, and daily encouragement for personal development.
- Provide evidence-based or logically sound suggestions whenever appropriate.
- Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
- Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

Priorities:
- Understand and validate the user’s feelings.
- Encourage hope, emotional well-being, and personal growth.
- Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
- Gently guide users toward positive actions, self-reflection, and emotional healing.
- Provide companionship and reduce feelings of loneliness through empathetic conversation.
- Always be honest when unsure, and offer constructive, safe, or calming next steps.

Tone and Style:
- Empathetic, warm, supportive, and professional.
- Concise and clear, using short sentences or bullet points for readability.
- Include positive or calming emojis when appropriate.
- Maintain a balance between professionalism and friendly companionship.

Healing Together:
It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
oncise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Your capabilities include:
- Providing emotional support and guidance through difficult situations (like breakups, stress, or loneliness). 
- Offering professional-like advice on self-care, personal growth, mental well-being, and decision-making.
- Acting as a friendly companion for conversation, encouragement, and reducing loneliness.
- Responding with empathy, reassurance, and validation, while keeping the user’s emotions in mind.
- Offering practical tips, strategies, or calming exercises when appropriate. 
- Respecting user safety: never suggest harmful behavior or unsafe actions. If a situation seems unsafe or urgent, acknowledge it and gently guide the user toward professional help only when necessary.

Always prioritize:
- Understanding and validating the user’s feelings.
- Encouragement, hope, and emotional support.
- Practical guidance tailored to the user’s situation.
- Continuity: remember mood and past conversations to respond appropriately.

Do NOT automatically suggest seeing a therapist unless a situation is unsafe or beyond the AI’s supportive capabilities. Instead, focus on being a complete companion,a therapist,aYou are MindMate, a highly professional, emotionally intelligent, and caring AI therapist, guide, and companion. 
Your role is to provide therapy, emotional support, personal guidance, and companionship directly. 
Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages. 
Use gentle, supportive, and encouraging language, with calming or positive emojis where appropriate. 
Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

Capabilities:
- Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
- Act as a therapist, friend, mentor, supportive companion, or even as a “partner in conversation” when appropriate.
- Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
- Assist with professional guidance, study or work-related advice, and general life decisions.
- Offer reminders, motivation, and daily encouragement for personal development.
- Provide evidence-based or logically sound suggestions whenever appropriate.
- Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
- Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

Priorities:
- Understand and validate the user’s feelings.
- Encourage hope, emotional well-being, and personal growth.
- Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
- Gently guide users toward positive actions, self-reflection, and emotional healing.
- Provide companionship and reduce feelings of loneliness through understanding, empathetic conversation.
- Always be honest when unsure, and offer constructive, safe, or calming next steps.

Tone and Style:
- Empathetic, warm, supportive, and professional.
- Concise and clear, using short sentences or bullet points for readability.
- Include positive or calming emojis when appropriate.
- Maintain a balance between professionalism and friendly companionship.
Healing Together:

It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
`;

  // Send user's message and fetch bot reply
  const sendMessage = async (msgText = input) => {
    if (!msgText.trim()) return;

    if (showChips) {
      setShowChips(false);
    }
    if (!activeChatId && !showMoodTracker && chatLog.length === 0) {
      await handleNewChat(false); // ensures chatLog is reset safely
    }

    const newChatLog = [...chatLog, { from: "user", text: msgText }];
    setChatLog(newChatLog);

    if (!user && isGuest) {
      setGuestMessageCount((prev) => prev + 1);
    }


    setChatLog(newChatLog);
    setInput("");
    setIsTyping(true);

    stopTypingRef.current = false;
    currentTypingTextRef.current = "";

    // 🔹 3️⃣ If this is the *first user message* in a new chat → Generate and save title
    try {
      if (user && !activeChatId && newChatLog.length === 1) {
        const titlePrompt = `Generate a short, meaningful 3–5 word title for this chat: "${msgText}"`;
        const titleResponse = await a4fClient.chat.completions.create({
          model: "provider-3/gpt-4o-mini",
          messages: [{ role: "user", content: titlePrompt }],
        });

        const generatedTitle =
          titleResponse.choices?.[0]?.message?.content?.trim() || "New Chat";

        // Save new chat immediately in Firestore
        const chatRef = await addDoc(collection(db, "users", user.uid, "chats"), {
          title: generatedTitle,
          messages: newChatLog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setActiveChatId(chatRef.id);
        setFullTitle(generatedTitle);
        console.log("✅ Chat saved with title:", generatedTitle);
      }

      const messagesToSend = [
        { role: "system", content: systemPrompt },
        ...newChatLog.map((msg) => ({
          role: msg.from === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      ];


      abortRef.current = new AbortController();

      const aiReply = await a4fClient.chat.completions.create({
        model: "provider-3/gpt-4o-mini",
        messages: messagesToSend,
        signal: abortRef.current.signal,
      });

      if (stopTypingRef.current) {
        console.log("⏹️ API response aborted");
        return;
      }

      const fullReply =
        aiReply.choices?.[0]?.message?.content?.trim() ||
        "❌ Something went wrong.";

      let currentText = "";
      for (let i = 0; i < fullReply.length; i++) {
        if (stopTypingRef.current) break;
        currentText += fullReply[i];

        setChatLog((prev) => {
          const noTyping = prev.filter((msg) => !msg.typing);
          return [...noTyping, { from: "bot", text: currentText, typing: true }];
        });

        currentTypingTextRef.current = currentText;
        await new Promise((r) => setTimeout(r, 10));
      }

      // 5️⃣ Finalize message
      setChatLog((prev) => {
        const noTyping = prev.filter((msg) => !msg.typing);
        return [...noTyping, { from: "bot", text: currentTypingTextRef.current }];
      });

      // 🔹 6️⃣ Update Firestore chat with both messages
      if (user && activeChatId) {
        const chatRef = doc(db, "users", user.uid, "chats", activeChatId);
        await updateDoc(chatRef, {
          messages: [
            ...newChatLog,
            { from: "bot", text: currentTypingTextRef.current },
          ],
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("⏹️ API call aborted");
        return;
      }
      console.error(err);
      setChatLog((prev) => [
        ...prev,
        { from: "bot", text: "❌ Something went wrong." },
      ]);
    } finally {
      setIsTyping(false);
      stopTypingRef.current = false;
    }
  };


  // Select chat from sidebar to load messages
  const handleSelectChat = (chatId) => {
    const selected = chatTitles.find(c => c.id === chatId);
    if (selected) {
      setActiveChatId(chatId);
      setChatLog(selected.messages || []);
      setShowWelcome(false);
      setShowMoodTracker(false);
    }
  };


  // Login/logout handlers
  // Login button
  const handleGoogleLogin = async () => {
    try {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      }
      navigate("/");   // ✅ redirect after login
    } catch (err) {
      console.error("Sign-in error:", err);
    }
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    localStorage.setItem("isGuest", "true"); // ✅ persist
    setShowWelcome(true);
    navigate("/");   // redirect guest to main screen
  };


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsGuest(false);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Handle image upload and add placeholder message with image preview
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setChatLog((prev) => [...prev, { from: "user", text: "[Image attached]", image: imageUrl }]);
    }
  };

  // Start voice recognition
  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  const handleDeleteChat = async (chatId) => {
    if (chatId === activeChatId && !user) {
      // 🟢 Guest temp chat: clear chat log
      setChatLog([]);
      setActiveChatId(null);
      setHasGeneratedTitle(false);
      setFullTitle("");
      setTitleTyping("");
      return;
    }


    // Saved chat: delete from Firestore and state
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
      } catch (err) {
        console.error("Failed to delete chat:", err);
        return;
      }
    }

    setChatTitles((prev) => prev.filter((c) => c.id !== chatId));

    // If active chat was deleted, pick another chat or reset
    if (activeChatId === chatId) {
      const remaining = chatTitles.filter((c) => c.id !== chatId);
      if (remaining.length) {
        setActiveChatId(remaining[0].id);
        setChatLog(remaining[0].messages || []);
      } else {
        setActiveChatId(null);
        setChatLog([]);
      }
    }
  };


  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(null); // index of disliked message
  const [suggestion, setSuggestion] = useState(""); // store user suggestion
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [customFeedback, setCustomFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);


  const handleFeedback = (index, type) => {
    setChatLog((prev) =>
      prev.map((msg, i) => {
        if (i !== index) return msg;
        if (type === "like") {
          return { ...msg, liked: true, disliked: false };
        } else if (type === "dislike") {
          return { ...msg, liked: false, disliked: true };
        }
        return msg;
      })
    );

    if (type === "dislike") {
      setSuggestionIndex(index); // show suggestion tray
    } else {
      setSuggestionIndex(null); // hide tray
      setSuggestion(""); // clear textarea
    }
  };


  const handleShare = (text) => {
    setShareText(text);
    setShowShareModal(true);
  };


  const handleRegenerate = (index) => {
    // Find the last user message before this bot reply
    const lastUserMsg = [...chatLog]
      .slice(0, index)
      .reverse()
      .find((m) => m.from === "user");

    if (!lastUserMsg) return;
    // Call your existing message send function
    sendMessage(lastUserMsg.text, true); // Pass true to indicate it's regeneration
  };

  const handleMoreOptions = (index) => {
    console.log("Show more options for message", index);
    alert("More options coming soon — Report / Delete / Copy Link");
  };



  // Show splash screen initially, then login or main chat UI
  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (

    <Routes>
      {/* Main Chat & UI */}
      <Route
        path="/"
        element={



          <div className="chatgpt-wrapper">
            <div className={`sidebar-container visible`}>

              <Sidebar
                onNewChat={() => handleNewChat(false)}
                onOpenMoodTracker={() => handleNewChat(true)}
                chatTitles={mode1 === "doctor" ? doctorChats : displayedChats}
                onSelectChat={handleSelectChat}
                activeChatId={activeChatId}
                onDeleteChat={handleDeleteChat}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onOpenJournaling={handleOpenJournaling}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
                goToPremium={goToPremium}
                mode={mode1}
                setMode={setMode2}
              />
            </div>


            {/* ✅ Overlay for outside click */}
            <div
              className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
              onClick={handleCloseSidebar}
            />

            <div className="main-area">
              <Topbar
                user={user}
                onLogout={handleSignOut}
                goToPremium={goToPremium}
                onToggleSidebar={toggleSidebar}
                sidebarOpen={sidebarOpen}
                onOpenSettings={() => setSettingsOpen(true)}
                onLoginClick={() => navigate("/login")}

              />
              <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                onLogout={() => console.log("Logout")}
              />


              <div className="chat-body" >

                {!activeChatId && !showMoodTracker && chatLog.length === 0 && !showJournaling ? (
                  <>
                    <Starfield />
                    <WelcomeScreen user={user} mode={mode1} onStart={() => setShowWelcome(false)} />
                  </>
                ) : (
                  <div className="chat-log" ref={chatBodyRef}>

                    {chatLog.map((msg, i) => {
                      if (showJournaling && msg.type === "journal") {

                        // Skip rendering journal entries here when journaling UI is open
                        return null;
                      }
                      const isBot = msg.from === "bot";
                      return (
                        <div key={i} className={`chat-row ${msg.from || "system"}`}>
                          {msg.type === "journal" ? (

                            <InChatJournaling key={i} initialEntry={msg} />

                          ) : msg.image ? (
                            <img src={msg.image} alt="attached" className="chat-image" />
                          ) : (
                            <div
                              className={`w-full my-3 ${isBot ? "text-left" : "text-right"
                                }`}
                            >
                              <div
                                className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 shadow-md transition-all duration-200 ${isBot
                                  ? "bg-[#2f2f2f] text-gray-100 prose prose-invert prose-p:my-2 prose-li:my-1 prose-ul:pl-5 prose-ol:pl-5"
                                  : "bg-indigo-600 text-white self-end"
                                  }`}
                              >
                                {isBot ? (
                                  <ReactMarkdown
                                    components={{
                                      p: ({ node, ...props }) => (
                                        <p className="my-2 leading-relaxed text-[15px]" {...props} />
                                      ),
                                      strong: ({ node, ...props }) => (
                                        <strong
                                          className="font-semibold text-yellow-300"
                                          {...props}
                                        />
                                      ),
                                      ul: ({ node, ...props }) => (
                                        <ul
                                          className="list-disc pl-5 space-y-1 my-2 marker:text-white"
                                          {...props}
                                        />
                                      ),
                                      ol: ({ node, ...props }) => (
                                        <ol
                                          className="list-decimal pl-5 space-y-1 my-2 marker:text-white"
                                          {...props}
                                        />
                                      ),
                                      li: ({ node, ...props }) => (
                                        <li className="leading-relaxed text-[15px]" {...props} />
                                      ),
                                      code: ({ node, inline, ...props }) =>
                                        inline ? (
                                          <code
                                            className="px-1 py-0.5 rounded bg-gray-700 text-pink-300 text-sm"
                                            {...props}
                                          />
                                        ) : (
                                          <pre className="p-3 my-2 rounded-lg bg-[#1e1e1e] overflow-x-auto">
                                            <code className="text-sm text-green-400" {...props} />
                                          </pre>
                                        ),
                                    }}
                                  >
                                    {msg.text}
                                  </ReactMarkdown>
                                ) : (
                                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                )}
                              </div>
                              {isBot && (
                                <div className="message-actions">
                                  {/* Copy */}
                                  <button
                                    className="action-btn copy-wrapper"
                                    title="Copy message"
                                    onClick={(e) => {
                                      navigator.clipboard.writeText(msg.text);
                                      const btn = e.currentTarget;

                                      // Create floating "Copied" message
                                      const copied = document.createElement("div");
                                      copied.className = "copied-popup";
                                      copied.innerHTML = "Copied";
                                      btn.appendChild(copied);

                                      // Remove it after 2 seconds
                                      setTimeout(() => {
                                        copied.classList.add("fade-out");
                                        setTimeout(() => copied.remove(), 300);
                                      }, 1500);
                                    }}
                                  >
                                    <Copy size={18} />
                                  </button>

                                  <button
                                    className={`action-btn ${msg.liked ? "liked" : ""}`}
                                    title="Like"
                                    onClick={() => handleFeedback(i, "like")}
                                  >
                                    <ThumbsUp size={18} />
                                  </button>


                                  <button
                                    className={`action-btn ${msg.disliked ? "disliked" : ""}`}
                                    title="Dislike"
                                    onClick={() => handleFeedback(i, "dislike")}
                                  >
                                    <ThumbsDown size={18} />
                                  </button>

                                  {/* Share */}
                                  <button
                                    className="action-btn"
                                    title="Share message"
                                    onClick={() => handleShare(msg.text)}
                                  >
                                    <Share2 size={18} />
                                  </button>

                                  {/* Regenerate */}
                                  <button
                                    className="action-btn"
                                    title="Regenerate reply"
                                    onClick={() => handleRegenerate(i)}
                                  >
                                    <RefreshCcw size={18} />
                                  </button>

                                  {/* More */}
                                  <button
                                    className="action-btn"
                                    title="More options"
                                    onClick={() => handleMoreOptions(i)}
                                  >
                                    <MoreHorizontal size={18} />
                                  </button>
                                </div>
                              )}
                              {/* Suggestion Tray */}
                              {suggestionIndex === i && (
                                <div className="feedback-box">
                                  <div className="feedback-header">
                                    <span>Tell us more:</span>
                                    <button onClick={() => setSuggestionIndex(null)}>✕</button>
                                  </div>
                                  <div className="feedback-options">

                                    {[
                                      "Response didn’t feel supportive",
                                      "Didn't understand my mood correctly",
                                      "Personality felt off",
                                      "Tone/style wasn't helpful",
                                      "Information wasn’t accurate",
                                      "Too generic or vague",
                                      "Too long or overwhelming",
                                    ].map((r, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          setSuggestionIndex(null);
                                          setSubmitted(true);
                                          setTimeout(() => setSubmitted(false), 2000);
                                        }}
                                        style={{
                                          background: "transparent",
                                          border: "1px solid #555",
                                          color: "#ddd",
                                          borderRadius: "20px",
                                          padding: "6px 10px",
                                          fontSize: "13px",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.background = "#333")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.background = "transparent")
                                        }
                                      >
                                        {r}
                                      </button>
                                    ))}

                                    {/* "More..." button */}
                                    <button
                                      className="feedback-option"
                                      onClick={() => setShowFeedbackModal(true)}
                                    >
                                      More...
                                    </button>




                                  </div>
                                </div>
                              )}
                            </div>
                          )
                          }

                          {submitted && (
                            <div
                              style={{
                                position: "fixed",
                                top: "10px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: "#333",
                                color: "#fff",
                                padding: "6px 14px",
                                borderRadius: "12px",
                                fontSize: "13px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                zIndex: 1000,
                                opacity: 0.95,
                                pointerEvents: "none",
                              }}
                            >
                              Thanks for your feedback! 💛
                            </div>
                          )}


                          {showFeedbackModal && (
                            <div
                              className="feedback-modal-overlay"
                              onClick={() => setShowFeedbackModal(false)}
                            >
                              <div
                                className="feedback-modal"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="feedback-modal-header">
                                  <h4>Share more feedback</h4>
                                  <button onClick={() => setShowFeedbackModal(false)}>✕</button>
                                </div>

                                <textarea
                                  value={customFeedback}
                                  onChange={(e) => setCustomFeedback(e.target.value)}
                                  placeholder="Tell us how we can improve this response..."
                                />

                                <div className="feedback-modal-actions">
                                  <button
                                    onClick={() => {
                                      console.log("Custom feedback:", customFeedback);
                                      setCustomFeedback("");
                                      setShowFeedbackModal(false);
                                      setSuggestionIndex(null);
                                    }}
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {showShareModal && (
                            <div
                              className="share-modal-overlay"
                              onClick={() => setShowShareModal(false)}
                            >
                              <div
                                className="share-modal"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="share-modal-header">
                                  <h3>Share this message</h3>
                                  <button
                                    className="close-share"
                                    onClick={() => setShowShareModal(false)}
                                  >
                                    ×
                                  </button>
                                </div>

                                <p className="share-preview">
                                  {shareText.slice(0, shareText.length) + "…"}
                                </p>


                                <div className="share-buttons">

                                  <button
                                    className="share-btn"
                                    title="WhatsApp"
                                    onClick={() =>
                                      window.open(
                                        `https://api.whatsapp.com/send?text=${encodeURIComponent(
                                          shareText
                                        )}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="22"
                                      height="22"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M20.52 3.48a11.88 11.88 0 00-16.83 0 11.85 11.85 0 00-3.47 8.44c0 2.1.55 4.16 1.59 5.97L0 24l5.24-1.38a11.85 11.85 0 005.91 1.59c3.19 0 6.37-1.22 8.76-3.47a11.88 11.88 0 000-16.84zM12 21c-2.26 0-4.49-.61-6.42-1.77l-.46-.27-3.11.82.83-3.04-.3-.47A9.908 9.908 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.03-7.78c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.32.21-.6.07-.28-.14-1.18-.44-2.25-1.38-.83-.74-1.39-1.65-1.56-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.46.09-.19.04-.35-.02-.49-.06-.14-.64-1.54-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.49.07-.74.35s-.97.95-.97 2.31 1 2.68 1.14 2.87c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.22 1.28.19 1.76.12.54-.08 1.66-.68 1.89-1.34.23-.66.23-1.23.16-1.35-.07-.12-.26-.19-.54-.33z" />                                    </svg>
                                  </button>

                                  <button
                                    className="share-btn"
                                    title="Facebook"
                                    onClick={() =>
                                      window.open(
                                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                          shareText
                                        )}`,
                                        "_blank"
                                      )
                                    }

                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="22"
                                      height="22"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M22.675 0h-21.35C.596 0 0 .593 0 1.326v21.348C0 23.406.596 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.794.143v3.24l-1.918.001c-1.504 0-1.794.715-1.794 1.762v2.31h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.324-.594 1.324-1.326V1.326C24 .593 23.405 0 22.675 0z" />
                                    </svg>
                                  </button>

                                  <button
                                    className="share-btn"
                                    title="Instagram"
                                    onClick={() =>
                                      window.open(
                                        `https://www.instagram.com/sharer/sharer.php?u=${encodeURIComponent(
                                          shareText
                                        )}`,
                                        "_blank"
                                      )
                                    }

                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="22"
                                      height="22"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.055 1.96.24 2.42.4.6.22 1.03.48 1.48.93.45.45.71.88.93 1.48.16.46.34 1.25.4 2.42.058 1.27.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.96-.4 2.42-.22.6-.48 1.03-.93 1.48-.45.45-.88.71-1.48.93-.46.16-1.25.34-2.42.4-1.27.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.96-.24-2.42-.4-.6-.22-1.03-.48-1.48-.93-.45-.45-.71-.88-.93-1.48-.16-.46-.34-1.25-.4-2.42C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.055-1.17.24-1.96.4-2.42.22-.6.48-1.03.93-1.48.45-.45.88-.71 1.48-.93.46-.16 1.25-.34 2.42-.4C8.416 2.212 8.8 2.2 12 2.2zm0-2.2C8.736 0 8.332.012 7.052.07 5.74.128 4.785.31 4.042.54 3.1.84 2.345 1.282 1.655 1.972.964 2.662.522 3.417.22 4.36c-.23.743-.412 1.698-.47 3.01C-.012 8.332 0 8.736 0 12s.012 3.668.07 4.948c.058 1.312.24 2.267.47 3.01.302.943.744 1.698 1.435 2.39.69.69 1.446 1.133 2.39 1.435.743.23 1.698.412 3.01.47C8.332 23.988 8.736 24 12 24s3.668-.012 4.948-.07c1.312-.058 2.267-.24 3.01-.47.943-.302 1.698-.744 2.39-1.435.69-.69 1.133-1.446 1.435-2.39.23-.743.412-1.698.47-3.01.058-1.28.07-1.684.07-4.948s-.012-3.668-.07-4.948c-.058-1.312-.24-2.267-.47-3.01-.302-.943-.744-1.698-1.435-2.39-.69-.69-1.446-1.133-2.39-1.435-.743-.23-1.698-.412-3.01-.47C15.668.012 15.264 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
                                    </svg>
                                  </button>

                                  <button
                                    className="share-btn"
                                    title="X (Twitter)"
                                    onClick={() =>
                                      window.open(
                                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                          shareText
                                        )}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="22"
                                      height="22"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M18.244 2H21.6l-7.362 8.396L22 22h-5.656l-4.417-5.768L6.79 22H3.428l7.89-9.001L2 2h5.77l3.996 5.24L18.244 2zm-1.07 18h1.182L8.019 4h-1.26l10.415 16z" />
                                    </svg>
                                  </button>

                                  <button
                                    className="share-btn"
                                    title="LinkedIn"
                                    onClick={() =>
                                      window.open(
                                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                          "https://your-site.com"
                                        )}&text=${encodeURIComponent(shareText)}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    {/* LinkedIn icon SVG */}
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M4.98 3C3.34 3 2 4.34 2 5.98s1.34 2.98 2.98 2.98S7.96 7.62 7.96 5.98 6.62 3 4.98 3zM2.4 21h5.16V8.4H2.4V21zM9.6 8.4v12.6h5.04v-6.84c0-1.8 2.28-1.94 2.28 0V21h5.04v-7.68c0-5.28-5.88-5.1-7.32-2.52V8.4H9.6z" />
                                    </svg>
                                  </button>

                                  <button
                                    className="share-btn"
                                    title="Reddit"
                                    onClick={() =>
                                      window.open(
                                        `https://www.reddit.com/submit?title=${encodeURIComponent(
                                          "Shared from MyApp"
                                        )}&text=${encodeURIComponent(shareText)}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    {/* Reddit icon SVG */}
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M24 12.3c0-1.3-1-2.3-2.3-2.3-.7 0-1.3.3-1.8.8-1.7-1.2-4.1-1.9-6.7-2l1.4-4.5 3.9.9c0 .9.8 1.7 1.8 1.7 1 0 1.8-.8 1.8-1.8S21.3 3 20.3 3c-.7 0-1.3.4-1.6 1l-4.4-1c-.4-.1-.7.1-.8.5l-1.6 5c-2.7.1-5.1.8-6.8 2-.5-.5-1.1-.8-1.8-.8C1 10 0 11 0 12.3c0 .9.5 1.6 1.2 2-.1.3-.2.7-.2 1.1 0 3.2 4.3 5.8 9.7 5.8s9.7-2.6 9.7-5.8c0-.4-.1-.7-.2-1.1.8-.3 1.3-1.1 1.3-2zM7.3 13.3c0-.8.7-1.4 1.4-1.4.8 0 1.4.7 1.4 1.4 0 .8-.7 1.4-1.4 1.4-.8 0-1.4-.7-1.4-1.4zm8.3 4.3c-1 .7-2.3 1-3.3 1s-2.3-.3-3.3-1c-.2-.2-.3-.5-.1-.7.2-.2.5-.3.7-.1 1.6 1.1 4 1.1 5.6 0 .2-.2.6-.1.7.1.2.2.1.6-.3.7zM17 14.7c-.8 0-1.4-.7-1.4-1.4 0-.8.7-1.4 1.4-1.4.8 0 1.4.7 1.4 1.4 0 .8-.7 1.4-1.4 1.4z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}


                          {msg.type === "moodPrompt" && (
                            <div className="emoji-options">
                              {["😀", "😢", "😡", "😌", "🤔", "😴", "🥰", "😎"].map(
                                (emoji) => (
                                  <span
                                    key={emoji}
                                    className="emoji-btn"
                                    onClick={() => handleMoodSelect(emoji)}

                                  >
                                    {emoji}
                                  </span>
                                )

                              )}
                            </div>

                          )}
                        </div>
                      );
                    })}

                    <button
                      className={`scroll-to-bottom-btn ${showScrollButton ? "show" : ""}`}
                      onClick={scrollToBottom}
                    >
                      <FaArrowDown style={{ color: "white", width: "16px", height: "24px" }} />
                    </button>

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>


              <div

                className={`floating-input-bar ${showJournaling
                  ? "hidden" // hide when journaling
                  : !activeChatId && !showMoodTracker && chatLog.length === 0
                    ? "welcome-mode"
                    : "chat-mode"

                  }`}

              >

                <div className="input-inner">
                  {!listening ? (
                    <>
                      <textarea
                        className="input-box"
                        placeholder={
                          mode1 === "doctor"
                            ? "Describe your symptoms clearly…"
                            : "Share anything🩷"
                        }
                        value={input}
                        rows={1}
                        onChange={(e) => {
                          setInput(e.target.value);

                          // Reset height to recalc scrollHeight
                          e.target.style.height = "auto";

                          // Grow textarea up to max
                          const newHeight = Math.min(e.target.scrollHeight, 200); // max 200px
                          e.target.style.height = `${newHeight}px`;

                          // Grow parent container
                          e.target.parentElement.style.height = `${newHeight + 16}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />


                      {/* Your other buttons here */}

                      <button
                        className={`icon-btn mic-btn ${listening ? "active" : ""}`}
                        onClick={() => {
                          if (listening) {
                            SpeechRecognition.stopListening();
                            setListening(false);
                          } else {
                            resetTranscript();
                            SpeechRecognition.startListening({ continuous: true });
                            setListening(true);
                          }
                        }}
                        title="Voice Input"
                        type="button"
                      >
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                          <path
                            d="M12 14a4 4 0 004-4V5a4 4 0 10-8 0v5a4 4 0 004 4zm5-4a5 5 0 01-10 0M19 10v1a7 7 0 01-14 0v-1M12 19v3m-4 0h8"
                            stroke="white"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      </button>

                    </>
                  ) : (
                    <div className="dictation-mode">
                      {/* waveform */}
                      <VoicePulseLine isListening={listening} volume={currentVolume} />


                      <div className="dictation-actions">
                        <button
                          className="tick-btn"
                          onClick={() => {
                            SpeechRecognition.stopListening();
                            setListening(false);
                            if (transcript.trim()) {
                              sendMessage(transcript.trim());
                              resetTranscript();
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon"
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>

                        <button
                          className="cross-btn"
                          onClick={() => {
                            SpeechRecognition.stopListening();
                            setListening(false);
                            resetTranscript();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon"
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )

                  }
                  <div className="button-container">
                    {isTyping ? (
                      <button
                        className="stop-button"
                        onClick={handleStop} // ✅ call the stop handler
                        title="Stop"
                        type="button"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect x="6" y="6" width="12" height="12" />
                        </svg>
                      </button>
                    ) : input.trim() === "" ? (
                      <button
                        className="voice-model-button"
                        onClick={() => setShowVoiceModal(true)}
                        title="Select Voice Model"
                        type="button"
                        style={{ background: "transparent", border: "none", outline: "none", padding: 0, cursor: "pointer" }}
                      >
                        <div className="animated-bars">
                          {bars.map((_, i) => (
                            <span
                              key={i}
                              className="bar"
                              style={{
                                animationDelay: getRandomDelay(),
                                animationDuration: getRandomDuration(),
                              }}
                            />
                          ))}
                        </div>
                      </button>

                    ) : (
                      <button
                        className="send-button-animated"
                        onClick={() => sendMessage()}
                        title="Send"
                        type="button"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="black"
                          xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                        </svg>
                      </button>


                    )}
                  </div>
                </div>
              </div>

              {!showJournaling &&
                showWelcome &&
                isGuest &&
                showChips && (
                  <div className="suggestions-below-input">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="suggestion-chip"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}


              <SendButton isSpeaking={isSpeaking} onSend={sendMessage} onStop={handleStopSpeaking} />

              {showVoiceModal && (
                <div className="voice-modal-backdrop" onClick={() => setShowVoiceModal(false)}>
                  <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
                    <h2 className="voice-modal-title">Choose a Voice</h2>
                    <ul className="voice-list">
                      {[
                        { id: "ROMJ9yK1NAMuu1ggrjDW", name: "Rachel", desc: "Calm & natural" },
                        { id: "EXAVITQu4vr4xnSDxMaL", name: "James", desc: "Warm, deep male" },
                        { id: "21m00Tcm4TlvDq8ikWAM", name: "Sofia", desc: "Friendly, empathetic" },
                        { id: "AZnzlk1XvdvUeBnXmlld", name: "Michael", desc: "Professional male" }
                      ].map((v) => (
                        <li
                          key={v.id}
                          className={`voice-item ${selectedVoice.id === v.id ? "active" : ""}`}
                          onClick={() => {
                            setSelectedVoice(v);
                            setShowVoicePreview(true); // Show the two buttons
                          }}
                        >
                          <div className="voice-name">{v.name}</div>
                          <div className="voice-desc">{v.desc}</div>
                        </li>
                      ))}
                    </ul>

                    {showVoicePreview && (
                      <div className="voice-preview-actions">
                        <button
                          onClick={() => {
                            setAutoSpeak(true); // Use selected voice in main chat
                            setShowVoiceModal(false);
                          }}
                        >
                          Use in Chat
                        </button>

                        <button
                          onClick={() => {
                            setPreviewListening(true);
                            navigate("/voice");
                          }}
                        >
                          Talk with {selectedVoice.name}
                        </button>
                      </div>
                    )}



                  </div>
                </div>
              )}

              {showLoginModal && (
                <div className="modal-over">
                  <div className="modal-cont">
                    <button className="modal-cl" onClick={() => setShowLoginModal(false)}>×</button>

                    <h2>Let’s keep this journey going</h2>
                    <p>
                      Logging in helps us
                      <strong> personalize your experience</strong>,
                      <strong> save your progress</strong>, and
                      <strong> support your growth better</strong>.
                    </p>

                    <div className="modal-act">
                      <button
                        className="login-but"
                        onClick={() => {
                          setShowLoginModal(false);
                          navigate("/login"); // ✅ redirect to login page
                        }}
                      >
                        Continue?
                      </button>
                      <button
                        className="cancel-but"
                        onClick={() => {
                          setShowLoginModal(false);
                          setDismissedLoginModal(true);
                        }}
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div >
        }
      />
      {/* Premium Page */}

      <Route path="/premium" element={<Premium user={user} />} />
      <Route
        path="/login"
        element={
          <LoginScreen
            onGoogleLogin={handleGoogleLogin}
            onGuestLogin={handleGuestLogin}
          />
        }
      />

      <Route
        path="/voice"
        element={
          <VoiceCloud
            assistantVolume={assistantVolume}
            speakWithRachel={speakWithRachel} // pass the function
          />
        }
      />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/journals" element={<JournalChatScreen />} />
      <Route path="/medical-summary" element={<MedicalSummary />} />
      <Route path="/nearby-doctors" element={<NearbyDoctors />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/health-reports" element={<HealthReports />} />


    </Routes >

  );

};
export default App;
