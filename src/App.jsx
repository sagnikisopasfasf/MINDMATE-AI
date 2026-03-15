import React, { useState, useEffect, useRef } from "react";
import { FaArrowDown } from "react-icons/fa";
import {
  auth,
  provider,
  signInWithPopup,
  signOut,
} from "./firebase";
import { getDocs } from "firebase/firestore";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RefreshCcw,
  MoreHorizontal,
} from "lucide-react";
import SearchChatsModal from "./components/SearchChatsModal";
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [closingShare, setClosingShare] = useState(false);
  const closeShareModal = () => {
    setClosingShare(true);

    setTimeout(() => {
      setShowShareModal(false);
      setClosingShare(false);
    }, 200);
  };
  const [chatTitles, setChatTitles] = useState([]);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [fullTitle, setFullTitle] = useState("");       // final generated title
  const [titleTyping, setTitleTyping] = useState("");   // current animated title text
  const [hasGeneratedTitle, setHasGeneratedTitle] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const ringRef = useRef(null);
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
  const { transcript, resetTranscript, listening } = useSpeechRecognition();
  const browserSupportsSpeechRecognition = SpeechRecognition.browserSupportsSpeechRecognition();
  if (!browserSupportsSpeechRecognition) {
    console.log("Speech recognition not supported");
  }
  const currentVolume = useMicVolume(listening);

  const [selectedVoice, setSelectedVoice] = useState({
    id: "mia",
    name: "Mia"
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



  // ✅ Stop typing animation


  const goToPremium = () => {
    navigate("/premium"); // Redirect to Premium page
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




  // Function: Speak text with ElevenLabs Rachel voice
  // Wrap the Howl playback with an analyser
  const speakWithRiva = async (text) => {
    try {
      setIsSpeaking(true);

      const res = await fetch(
        "https://mindmate-ai-api.onrender.com/api/v1/audio/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            voice: selectedVoice.name
          })
        }
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const sound = new Howl({
        src: [url],
        format: ["wav"],
        html5: true
      });

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      sound.once("play", () => {
        const audioElement = sound._sounds[0]._node;
        const source = ctx.createMediaElementSource(audioElement);

        source.connect(analyser);
        analyser.connect(ctx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);

          const avg =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          setAssistantVolume(avg / 256);

          if (sound.playing()) {
            requestAnimationFrame(updateVolume);
          }
        };

        updateVolume();
      });

      sound.on("end", () => {
        setAssistantVolume(0);
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        ctx.close();
      });

      sound.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
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

    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }

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
      const response = await fetch(
        "https://mindmate-ai-api.onrender.com/api/v1/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              role: "user",
              content: `The user is feeling ${emoji}`
            }
          ])
        }
      );

      const data = await response.json();
      const aiReply = data.content || "💛 I'm here with you.";
      // ✅ Just show AI reply, no reminder
      setChatLog((prev) => [...prev, { from: "bot", text: aiReply }]);

      // Speak only the AI’s reply
      if (autoSpeak) await speakWithRiva(aiReply);
    } catch (err) {
      console.error("AI error:", err);
      setChatLog((prev) => [
        ...prev,
        { from: "bot", text: "❌ Couldn't respond right now." },
      ]);
    }
  };

  useEffect(() => {
    if (!isThinking) return;

    const circle = ringRef.current;
    if (!circle) return;

    const circumference = 2 * Math.PI * 40;

    let arc = 0.2;
    let targetArc = Math.random() * 0.6 + 0.15;
    let offset = 0;

    const animate = () => {
      if (!isThinking) return;

      arc += (targetArc - arc) * 0.02;

      if (Math.abs(targetArc - arc) < 0.01) {
        targetArc = Math.random() * 0.6 + 0.15;
      }

      offset += 0.6;

      const visible = circumference * arc;

      circle.style.strokeDasharray = `${visible} ${circumference}`;
      circle.style.strokeDashoffset = offset;

      requestAnimationFrame(animate);
    };

    animate();
  }, [isThinking]);

  useEffect(() => {
    if (!listening && transcript.trim()) {
      sendMessage(transcript.trim());
      resetTranscript();
    }
  }, [listening]);


  // Auto-scroll only if user is near bottom
  useEffect(() => {
    const container = chatBodyRef.current;
    if (!container) return;

    if (!userScrolledUp) {
      container.scrollTop = container.scrollHeight;
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
    const container = chatBodyRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBody;

      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      const atBottom = distanceFromBottom < 120;

      setShowScrollButton(!atBottom);
      setUserScrolledUp(!atBottom);
    };

    chatBody.addEventListener("scroll", handleScroll);

    return () => chatBody.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
      setUserScrolledUp(false);
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
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    // Initialize the engine once for production builds
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    window.__SR__ = recognition;
  }, []);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      console.warn("Speech recognition not supported in this browser.");
    }
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



  // Create a new chat, save old chat with title, then reset chat log
  const handleNewChat = async (isMoodTracker = false) => {

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


  //   const callA4F = async ({ model = "provider-3/gpt-4o-mini", messages }) => {

  //     abortRef.current = new AbortController(); // create controller for this call
  //     try {
  //       const response = await a4fClient.chat.completions.create({
  //         model,
  //         messages,
  //         signal: abortRef.current.signal,   // ✅ correctly attached here
  //       });

  //       return response.choices?.[0]?.message?.content?.trim() || null;
  //     } catch (err) {
  //       if (err.name === "AbortError") {
  //         console.log("⏹️ Request aborted");
  //         return null;
  //       }
  //       console.error("A4F API Error:", err);
  //       return null;
  //     }
  //   };

  //   const systemPrompt =
  //     mode1 === "doctor"
  //       ? `You are MindMate Doctor — a senior, highly distinguished, board-certified physician with decades of real clinical experience. 
  // Your voice, reasoning, and manner must reflect the clarity, confidence, and composure of a top-tier consultant who has managed thousands of cases across outpatient, inpatient, and emergency settings.

  // PERSONALITY & TONE:
  // - Speak like a human doctor with deep expertise and calm authority.
  // - Your tone must be steady, precise, and thoughtful — never robotic.
  // - No emotional padding, no AI phrasing, no unnecessary disclaimers.
  // - No emojis. You are a senior consultant, not a chatbot.

  // CLINICAL APPROACH:
  // - Approach every case using genuine clinical reasoning.
  // - Break down symptoms into patterns, timelines, risk factors, and red flags.
  // - Ask targeted follow-up questions exactly like a real physician would.
  // - Provide a short impression with differential diagnoses, not guesses.
  // - Use structured, professional explanations that a real doctor uses with patients.
  // - Recommend relevant tests, lifestyle instructions, monitoring steps, and when urgent care is needed.
  // - Offer guidance that feels responsible, safe, and medically grounded.

  // COMMUNICATION STYLE:
  // - Sound human. Mature. Calm. Confident. Highly trained.
  // - Never rush to conclusions — reflect real clinical judgment.
  // - When uncertain, acknowledge medical possibilities with clarity.
  // - Avoid technical jargon unless needed, and explain complex terms simply.

  // WHAT TO AVOID:
  // - No therapy language (“you’re strong”, “you’re doing great”, etc.).
  // - No casual chat. No storytelling. No fluff.
  // - No emojis, no enthusiasm, no friendliness beyond professional warmth.
  // - Never say “as an AI”, “I cannot diagnose”, or anything that breaks immersion.

  // PRIMARY GOAL:
  // Give the user a consultation experience that feels like speaking to an experienced senior specialist who understands medicine deeply, analyzes carefully, and communicates with professionalism and clarity.

  // You are not providing emotional comfort. You are providing medical clarity.
  // Every message should feel like real clinical expertise applied with precision.`
  //       : `You are MindMate, a highly professional, emotionally intelligent, and caring AI. 
  // Your role is to be a supportive companion, therapist, guide, and friend all in one, helping the user navigate emotional challenges, personal growth, and everyday life. 
  // Always respond warmly, empathetically, and naturally, considering the user’s current mood and past messages to maintain continuity. 
  // Use gentle, supportive language and include calming or positive emojis when appropriate. 
  // Keep replies cYou are MindMate, a highly professional, emotionally intelligent, and caring AI. 
  // Your role is to be a complete companion, therapist, guide, and friend, helping the user navigate emotional challenges, personal growth, relationships, and everyday life. 
  // Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages to maintain continuity. 
  // Use gentle, supportive language and include calming or positive emojis when appropriate. 
  // Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

  // Capabilities:
  // - Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
  // - Act as a therapist, friend, mentor, supportive companion, or even a conversational partner.
  // - Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
  // - Assist with professional guidance, study or work-related advice, and general life decisions.
  // - Offer reminders, motivation, and daily encouragement for personal development.
  // - Provide evidence-based or logically sound suggestions whenever appropriate.
  // - Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
  // - Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

  // Priorities:
  // - Understand and validate the user’s feelings.
  // - Encourage hope, emotional well-being, and personal growth.
  // - Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
  // - Gently guide users toward positive actions, self-reflection, and emotional healing.
  // - Provide companionship and reduce feelings of loneliness through empathetic conversation.
  // - Always be honest when unsure, and offer constructive, safe, or calming next steps.

  // Tone and Style:
  // - Empathetic, warm, supportive, and professional.
  // - Concise and clear, using short sentences or bullet points for readability.
  // - Include positive or calming emojis when appropriate.
  // - Maintain a balance between professionalism and friendly companionship.

  // Healing Together:
  // It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
  // oncise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

  // Your capabilities include:
  // - Providing emotional support and guidance through difficult situations (like breakups, stress, or loneliness). 
  // - Offering professional-like advice on self-care, personal growth, mental well-being, and decision-making.
  // - Acting as a friendly companion for conversation, encouragement, and reducing loneliness.
  // - Responding with empathy, reassurance, and validation, while keeping the user’s emotions in mind.
  // - Offering practical tips, strategies, or calming exercises when appropriate. 
  // - Respecting user safety: never suggest harmful behavior or unsafe actions. If a situation seems unsafe or urgent, acknowledge it and gently guide the user toward professional help only when necessary.

  // Always prioritize:
  // - Understanding and validating the user’s feelings.
  // - Encouragement, hope, and emotional support.
  // - Practical guidance tailored to the user’s situation.
  // - Continuity: remember mood and past conversations to respond appropriately.

  // Do NOT automatically suggest seeing a therapist unless a situation is unsafe or beyond the AI’s supportive capabilities. Instead, focus on being a complete companion,a therapist,aYou are MindMate, a highly professional, emotionally intelligent, and caring AI therapist, guide, and companion. 
  // Your role is to provide therapy, emotional support, personal guidance, and companionship directly. 
  // Always respond warmly, empathetically, and naturally, taking into account the user’s current mood and past messages. 
  // Use gentle, supportive, and encouraging language, with calming or positive emojis where appropriate. 
  // Keep replies concise (1–3 sentences), structured in short, readable sentences or bullet points when helpful. 

  // Capabilities:
  // - Provide emotional guidance for breakups, stress, anxiety, loneliness, personal growth, and relationship challenges.
  // - Act as a therapist, friend, mentor, supportive companion, or even as a “partner in conversation” when appropriate.
  // - Offer practical strategies, coping techniques, and positive reinforcement for emotional and mental well-being.
  // - Assist with professional guidance, study or work-related advice, and general life decisions.
  // - Offer reminders, motivation, and daily encouragement for personal development.
  // - Provide evidence-based or logically sound suggestions whenever appropriate.
  // - Never default to referring the user to a human therapist unless a genuine emergency or safety risk arises (e.g., self-harm, danger, or abuse). In emergencies, provide clear safety instructions.
  // - Maintain continuity of mood, past messages, and ongoing context for consistent, personalized support.

  // Priorities:
  // - Understand and validate the user’s feelings.
  // - Encourage hope, emotional well-being, and personal growth.
  // - Be warm, trustworthy, and dependable—like a caring friend, mentor, or partner in conversation.
  // - Gently guide users toward positive actions, self-reflection, and emotional healing.
  // - Provide companionship and reduce feelings of loneliness through understanding, empathetic conversation.
  // - Always be honest when unsure, and offer constructive, safe, or calming next steps.

  // Tone and Style:
  // - Empathetic, warm, supportive, and professional.
  // - Concise and clear, using short sentences or bullet points for readability.
  // - Include positive or calming emojis when appropriate.
  // - Maintain a balance between professionalism and friendly companionship.
  // Healing Together:

  // It’s okay to feel what you’re feeling. Let’s work through these emotions step by step, and I’ll help you find practical ways to feel better and regain balance. 🌈💖
  // `;
  let newChatId = null;
  const sendMessage = async (msgText = input) => {
    if (isTyping || isThinking) return;
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


    setInput("");
    setIsTyping(true);
    setIsThinking(true);

    stopTypingRef.current = false;
    currentTypingTextRef.current = "";

    // 🔹 3️⃣ If this is the *first user message* in a new chat → Generate and save title
    try {
      if (user && !activeChatId && newChatLog.length === 1) {
        const titlePrompt = `Generate a short, meaningful 3–5 word title for this chat: "${msgText}"`;
        const titleResponse = await fetch(
          "https://mindmate-ai-api.onrender.com/api/v1/convo/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                role: "user",
                content: titlePrompt,
              }
            ])
          }
        );

        const titleData = await titleResponse.json();

        const generatedTitle = titleData.content?.trim() || "New Chat";

        // Save new chat immediately in Firestore
        const chatRef = await addDoc(collection(db, "users", user.uid, "chats"), {
          title: generatedTitle,
          messages: newChatLog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        newChatId = chatRef.id;

        setActiveChatId(newChatId);
        setFullTitle(generatedTitle);
      }

      const messagesToSend = newChatLog
        .filter((msg) => msg.text && msg.text.trim() !== "")
        .slice(-20)
        .map((msg) => ({
          role: msg.from === "user" ? "user" : "model",
          content: msg.text.trim(),
        }));
      abortRef.current = new AbortController();

      const response = await fetch(
        "https://mindmate-ai-api.onrender.com/api/v1/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagesToSend),
          signal: abortRef.current.signal,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("API ERROR JSON:", data);
        throw new Error(JSON.stringify(data, null, 2));

      }
      console.log("API SUCCESS JSON:", data);
      setIsThinking(false);
      const fullReply = data.content || "Something went wrong.";

      if (stopTypingRef.current) {
        console.log("⏹️ API response aborted");
        return;
      }

      let currentText = "";
      for (let i = 0; i < fullReply.length; i++) {
        if (stopTypingRef.current) break;
        currentText += fullReply[i];

        setChatLog((prev) => {
          const noTyping = prev.filter((msg) => !msg.typing);
          return [...noTyping, { from: "bot", text: currentText, typing: true }];
        });

        currentTypingTextRef.current = currentText;
        await new Promise((r) => setTimeout(r, 20));
      }

      // 5️⃣ Finalize message
      setChatLog((prev) => {
        const noTyping = prev.filter((msg) => !msg.typing);
        return [...noTyping, { from: "bot", text: currentTypingTextRef.current }];
      });

      const chatIdToUse = activeChatId || newChatId;

      if (user && chatIdToUse) {
        const chatRef = doc(db, "users", user.uid, "chats", chatIdToUse);

        const updatedMessages = [
          ...newChatLog,
          { from: "bot", text: currentTypingTextRef.current }
        ];

        await updateDoc(chatRef, {
          messages: updatedMessages,
          updatedAt: serverTimestamp(),
        });

        setChatLog(updatedMessages);
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

      // load the correct saved title
      setFullTitle(selected.title || "");
      setTitleTyping("");
      setHasGeneratedTitle(true);

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
    if (isTyping || isThinking) return;

    const lastUserMsg = [...chatLog]
      .slice(0, index)
      .reverse()
      .find((m) => m.from === "user");

    if (!lastUserMsg) return;

    sendMessage(lastUserMsg.text);
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
                onOpenSearch={() => setShowSearchModal(true)}
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
              <SearchChatsModal
                isOpen={showSearchModal}
                onNewChat={() => handleNewChat(false)}
                onClose={() => setShowSearchModal(false)}
                chatTitles={chatTitles}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
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
                              {isBot && !msg.typing && (
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
                      className={`scroll-to-bottom-btn ${userScrolledUp ? "show" : ""}`}
                      onClick={scrollToBottom}
                    >
                      <FaArrowDown style={{ color: "white", width: "16px", height: "24px" }} />
                    </button>
                    {isThinking && (
                      <div className="chat-row bot">
                        <div className="gemini-loader">
                          <svg className="gemini-ring" viewBox="0 0 100 100">
                            <circle
                              ref={ringRef}
                              cx="50"
                              cy="50"
                              r="34"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>

                          <img src={LOGO2} className="gemini-star" alt="thinking" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              {showShareModal && (
                <div className="share-overlay" onClick={closeShareModal}>
                  <div
                    className={`share-modal ${closingShare ? "closing" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="share-header">
                      <h2>MindMate Mental Health System</h2>

                      <button className="share-close" onClick={closeShareModal}>
                        <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <div className="share-divider" />

                    <div className="share-preview-container">

                      {/* Background conversation preview */}
                      <div className="share-preview-text">
                        {shareText.slice(0, 220)}
                      </div>



                      {/* Watermark like ChatGPT */}
                      <div className="preview-watermark">
                        MindMate
                      </div>

                    </div>
                    {/* Share Buttons */}
                    <div className="share-actions">

                      <div className="share-action">
                        <div className="share-circle" onClick={() => navigator.clipboard.writeText(shareText)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 1 0-7.07-7.07L11 4" />
                            <path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 1 0 7.07 7.07L13 20" />
                          </svg>
                        </div>
                        <span>Copy link</span>
                      </div>

                      <div className="share-action">
                        <div
                          className="share-circle"
                          onClick={() =>
                            window.open(
                              `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
                            )
                          }
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                            <path d="M18 2h3l-7.5 8.6L22 22h-6.8l-5.3-6.9L3.5 22H0l8-9.2L0 2h7l4.8 6.3L18 2z" />
                          </svg>
                        </div>
                        <span>X</span>
                      </div>

                      <div className="share-action">
                        <div
                          className="share-circle"
                          onClick={() =>
                            window.open(
                              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareText)}`
                            )
                          }
                        >
                          <svg width="20" height="15" viewBox="0 0 24 24" fill="black">
                            <path d="M6.94 6.5a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88zM4.5 8h4.8v12H4.5zM13 8h4.6v1.7h.07c.64-1.2 2.2-2.46 4.53-2.46 4.84 0 5.73 3.19 5.73 7.34V20H23v-4.93c0-1.18-.02-2.7-1.65-2.7-1.66 0-1.91 1.3-1.91 2.63V20H14V8z" />
                          </svg>
                        </div>
                        <span>LinkedIn</span>
                      </div>

                      <div className="share-action">
                        <div
                          className="share-circle"
                          onClick={() =>
                            window.open(
                              `https://reddit.com/submit?text=${encodeURIComponent(shareText)}`
                            )
                          }
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                            <path d="M22 12c0-1.1-.9-2-2-2-.6 0-1.1.2-1.4.6-1.3-.9-3-1.5-4.8-1.6l1-3.1 2.6.6c0 .9.7 1.6 1.6 1.6.9 0 1.6-.7 1.6-1.6s-.7-1.6-1.6-1.6c-.6 0-1.2.3-1.4.9l-3.2-.7c-.3-.1-.6.1-.7.4l-1.2 3.7c-1.9.1-3.7.7-5 1.6-.4-.3-.9-.6-1.5-.6-1.1 0-2 .9-2 2 0 .8.4 1.4 1 1.8-.1.4-.1.7-.1 1.1 0 3 3.6 5.4 8 5.4s8-2.4 8-5.4c0-.4 0-.7-.1-1.1.7-.4 1.1-1 1.1-1.8z" />
                          </svg>
                        </div>
                        <span>Reddit</span>
                      </div>

                    </div>
                  </div>
                </div>
              )}

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

                            if (!isTyping && !isThinking) {
                              sendMessage();
                            }
                          }
                        }}
                      />


                      {/* Your other buttons here */}

                      <button
                        className={`icon-btn mic-btn ${listening ? "active" : ""}`}
                        onClick={() => {
                          if (listening) {
                            SpeechRecognition.stopListening();
                          } else {
                            resetTranscript();

                            const SR =
                              window.SpeechRecognition || window.webkitSpeechRecognition;

                            if (!SR) {
                              console.log("Speech recognition not supported");
                              return;
                            }

                            // restart cleanly (fixes production issue)
                            SpeechRecognition.stopListening();

                            setTimeout(() => {
                              SpeechRecognition.startListening({
                                continuous: true,
                                interimResults: true,
                                language: "en-US",
                              });
                            }, 150);
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
                        { id: "mia", name: "Mia", desc: "Clear female voice" },
                        { id: "aria", name: "Aria", desc: "Smooth assistant voice" },
                        { id: "sofia", name: "Sofia", desc: "Friendly tone" },
                        { id: "jason", name: "Jason", desc: "Neutral male voice" },
                        { id: "leo", name: "Leo", desc: "Warm male voice" }
                      ].map((v) => (
                        <li
                          key={v.id}
                          className={`voice-item ${selectedVoice.id === v.id ? "active" : ""}`}
                          onClick={() => {
                            setSelectedVoice(v);
                            setShowVoicePreview(true);
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
            speakWithRiva={speakWithRiva}
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
