import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    CheckCircle,
    Flame,
    Dumbbell,
    Heart,
    BookOpen,
    DollarSign,
    PenTool,
    Brain,
    Globe,
    Clock,
    Shield,
    Star,
} from "lucide-react";
import "../styles/GoalsPage.css";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import LOGO2 from "../assets/LOGO2.svg";
import { deleteDoc } from "firebase/firestore";


const generateGoalSuggestions = async (category) => {

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
                    content: `Generate 3 small daily goals for ${category}`
                }
            ])
        }
    );

    const data = await response.json();

    return data.content;
};

const quotes = [
    "Success is built on daily discipline.",
    "Be the 1% who don’t quit.",
    "Your future is created by what you do today.",
    "Financial freedom starts with your habits.",
    "Strong mind, strong life.",
    "Small steps daily create massive results.",
];

const challenges = {
    Mindset: ["Journal 5 mins", "Do 1 uncomfortable task"],
    Finance: ["Save today", "Track expenses"],
    Fitness: ["Do 20 pushups", "Walk 5,000 steps"],
    Learning: ["Read 10 pages", "Watch 1 educational video"],
    Wellness: ["Sleep 7+ hrs", "Drink 3L water"],
    Impact: ["Help 1 person today", "Share a positive message"],
    Relationships: ["Message someone you care about", "Have a meaningful conversation"],
    Creativity: ["Sketch for 10 mins", "Write 100 words"],
    "Time Mastery": ["Plan your top 3 tasks", "Avoid social media for 1 hour"],
    Resilience: ["Reflect on a past setback", "List 3 wins today"],
    Leadership: ["Encourage someone", "Take initiative on 1 task"],
    Freedom: ["Say 'no' to something draining", "Spend 30 mins on your dream project"],
    Spirituality: ["Meditate 5 mins", "Write what you’re grateful for"],
};

const pillars = [
    { title: "Mindset", icon: <Brain size={20} />, tip: "Discipline > motivation. Build habits that stick." },
    { title: "Finance", icon: <DollarSign size={20} />, tip: "Save, invest, and scale multiple income streams." },
    { title: "Fitness", icon: <Dumbbell size={20} />, tip: "Consistency beats intensity. Move daily." },
    { title: "Learning", icon: <BookOpen size={20} />, tip: "Read 10 pages. Learn, grow, repeat." },
    { title: "Wellness", icon: <Heart size={20} />, tip: "Energy is your greatest currency." },
    { title: "Impact", icon: <Globe size={20} />, tip: "Help others rise, and you’ll rise too." },
    { title: "Relationships", icon: <Heart size={20} />, tip: "Build meaningful connections that fuel growth." },
    { title: "Creativity", icon: <PenTool size={20} />, tip: "Create more than you consume. Express yourself." },
    { title: "Time Mastery", icon: <Clock size={20} />, tip: "Guard your time like treasure." },
    { title: "Resilience", icon: <Shield size={20} />, tip: "Turn setbacks into comebacks." },
    { title: "Leadership", icon: <Flame size={20} />, tip: "Lead by example. Inspire greatness." },
    { title: "Freedom", icon: <Globe size={20} />, tip: "Design life on your terms." },
    { title: "Spirituality", icon: <Star size={20} />, tip: "Find purpose. Align with higher values." },
    { title: "Create Custom", icon: <Plus size={20} />, tip: "A goal without a plan is just a wish. Craft it, chase it, and celebrate every step." },
];

const GoalsPage = ({ floatingInputBar }) => {
    const [goals, setGoals] = useState([]);
    const [showWizard, setShowWizard] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: "",
        category: "",
        frequency: "Daily",
    });
    const [dailyQuote, setDailyQuote] = useState("");

    const removeGoal = async (goalId) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // update UI immediately
            setGoals((prev) => prev.filter((g) => g.id !== goalId));

            // then delete from Firestore
            await deleteDoc(doc(db, "users", user.uid, "goals", goalId));
        } catch (err) {
            console.error("Failed to delete goal:", err);

            // if failed, rollback UI
            const snapshot = await getDocs(collection(db, "users", user.uid, "goals"));
            const refreshedGoals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setGoals(refreshedGoals);
        }
    };

    // Topic-mode state
    const [activeTopic, setActiveTopic] = useState(null); // e.g. "Mindset"
    const [topicChat, setTopicChat] = useState([]); // [{from: 'bot'|'user', text: ''}]
    const [topicInput, setTopicInput] = useState("");
    const [topicLoading, setTopicLoading] = useState(false);
    const topicMessagesEndRef = useRef(null);

    useEffect(() => {
        setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        const interval = setInterval(() => {
            setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // scroll topic chat to bottom
    useEffect(() => {
        topicMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [topicChat]);

    // Firestore: add goal
    const addGoal = async () => {
        if (!newGoal.title) {
            alert("Please enter a goal title!");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert("Please login to save goals.");
            return;
        }

        const goalToSave = {
            title: newGoal.title || "",
            category: newGoal.category || "Custom",
            frequency: newGoal.frequency || "Daily",
            progress: 0,
            streak: 0,
            createdAt: new Date().toISOString(),
        };

        try {
            // ✅ Save goal inside user’s goals subcollection
            const userGoalsRef = collection(db, "users", user.uid, "goals");
            const docRef = await addDoc(userGoalsRef, goalToSave);

            setGoals((prev) => [...prev, { id: docRef.id, ...goalToSave }]);
            setNewGoal({ title: "", category: "", frequency: "Daily" });
            setShowWizard(false);
        } catch (error) {
            console.error("Error saving goal:", error);
            alert("Failed to save goal. Please try again.");
        }
    };

    // Load user goals
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userGoalsRef = collection(db, "users", user.uid, "goals");
                const snapshot = await getDocs(userGoalsRef);
                const userGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGoals(userGoals);

            } else {
                setGoals([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Called when pillar clicked (non-custom)
    const openTopicMode = async (pillar) => {
        setActiveTopic(pillar.title);

        const challengeArr = challenges[pillar.title] || [];
        const challenge =
            challengeArr.length
                ? challengeArr[Math.floor(Math.random() * challengeArr.length)]
                : "";

        const intro = `You are now in ${pillar.title} mode.
Tip: ${pillar.tip}
${challenge ? `Suggested challenge: ${challenge}` : ""}`;

        setTopicChat([{ from: "bot", text: intro }]);

        try {
            const suggestions = await generateGoalSuggestions(pillar.title);

            if (suggestions) {
                setTopicChat((prev) => [
                    ...prev,
                    {
                        from: "bot",
                        text: `Here are some goals you can start today:\n\n${suggestions}`
                    }
                ]);
            }
        } catch (err) {
            console.error("Goal suggestion error:", err);
        }

        setTopicInput("");
    };

    // Close topic mode
    const closeTopicMode = () => {
        setActiveTopic(null);
        setTopicChat([]);
        setTopicInput("");
        setTopicLoading(false);
    };

    const sendTopicMessage = async () => {

        const trimmed = topicInput.trim();
        if (!trimmed) return;

        setTopicChat((prev) => [...prev, { from: "user", text: trimmed }]);
        setTopicInput("");
        setTopicLoading(true);

        try {

            const messagesToSend = [
                {
                    role: "system",
                    content: `You are an assistant helping with ${activeTopic} goals. Give short practical advice.`
                },
                {
                    role: "user",
                    content: trimmed
                }
            ];

            const response = await fetch(
                "https://mindmate-ai-api.onrender.com/api/v1/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(messagesToSend),
                }
            );

            const data = await response.json();

            const reply = data.content || "Sorry — I couldn't generate a reply.";

            setTopicChat((prev) => [
                ...prev,
                { from: "bot", text: reply }
            ]);

        } catch (err) {
            console.error("Topic AI error:", err);

            setTopicChat((prev) => [
                ...prev,
                { from: "bot", text: "Failed to respond." }
            ]);
        }

        setTopicLoading(false);
    };

    // handle Enter to send in topic mode
    const handleTopicKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendTopicMessage();
        }
    };

    return (
        <div className="goals-page">
            {/* Center: Logo */}
            <div className="brand-logo flex items-center gap-2">
                <img src={LOGO2} alt="Logo" className="logo-icon h-8 w-auto" />
                <h2 className="brand-title text-white font-bold text-lg">MindMate</h2>
            </div>

            {/* HEADER */}
            <header className="section header-section">
                <h2 className="page-title">
                    <Flame className="inline mr-2 h-6 w-6" style={{ fill: "url(#flame-gradient)" }} />
                    <svg width="6" height="6">
                        <defs>
                            <linearGradient id="flame-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#FF8C00" />
                                <stop offset="100%" stopColor="#FF0000" />
                            </linearGradient>
                        </defs>
                    </svg>
                    Goals
                </h2>
                <motion.p
                    key={dailyQuote}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="daily-quote"
                >
                    {dailyQuote}
                </motion.p>
            </header>

            {/* PILLARS */}
            <section className="section pillars-section">
                <div className="pillar-grid">
                    {pillars.map((p) => (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            key={p.title}
                            className="pillar-card"
                            onClick={() => {
                                if (p.title === "Create Custom") {
                                    setNewGoal({ title: "", category: "Custom", frequency: "Daily" });
                                    setShowWizard(true);
                                } else {
                                    openTopicMode(p);
                                }
                            }}
                        >
                            <div className="pillar-icon">{p.icon}</div>
                            <h3>{p.title}</h3>
                            <p>{p.tip}</p>
                            {challenges[p.title] && (
                                <p className="challenge">
                                    {challenges[p.title][Math.floor(Math.random() * challenges[p.title].length)]}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Topic discussion area (appears when a pillar is active) */}
            {activeTopic && (
                <section className="topic-section">
                    <div className="topic-header">
                        <h2>{activeTopic} mode</h2>
                        <div className="topic-actions">
                            <button className="cancel-btn" onClick={closeTopicMode}>Close</button>
                        </div>
                    </div>

                    <div className="topic-chat">
                        {topicChat.map((m, i) => (
                            <div key={i} className={`topic-msg ${m.from === "bot" ? "bot" : "user"}`}>
                                <div className="msg-text">{m.text}</div>
                            </div>
                        ))}
                        <div ref={topicMessagesEndRef} />
                    </div>

                    <div className="topic-input-bar">
                        <textarea
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            onKeyDown={handleTopicKeyDown}
                            placeholder={`${activeTopic} mode — ask about ${activeTopic.toLowerCase()}...`}
                            rows={1}
                            className="topic-input"
                        />
                        <button
                            className="save-btn"
                            onClick={sendTopicMessage}
                            disabled={topicLoading}
                            title={`Send in ${activeTopic} mode`}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="white"
                                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            >
                                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                            </svg>
                        </button>
                    </div>
                </section>
            )}

            {/* USER GOALS */}
            {goals.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Your Goals</h2>
                    <div className="pillar-grid">
                        {goals.map((goal) => (
                            <motion.div key={goal.id} whileHover={{ scale: 1.05 }} className="pillar-card">
                                <div className="pillar-icon">
                                    <Flame className="h-6 w-6 text-transparent bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 bg-clip-text" />
                                </div>
                                <h3>{goal.title}</h3>
                                <p>{goal.frequency}</p>
                                <button
                                    className="text-red-400 hover:text-red-600 text-sm mt-2"
                                    onClick={() => removeGoal(goal.id)}
                                >
                                    ✖ Remove
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* GOALS LIST */}
            <section className="section list-section">
                <div className="goals-list">
                    {goals.map((goal) => (
                        <motion.div key={goal.id} whileHover={{ scale: 1.02 }} className="goal-card">
                            <div className="goal-info">
                                <h3>{goal.title}</h3>
                                <p>{goal.category} • {goal.frequency}</p>
                            </div>
                            <div className="goal-actions">
                                <Flame className="icon flame" />
                                <CheckCircle
                                    onClick={async () => {
                                        const updatedGoal = {
                                            ...goal,
                                            progress: Math.min((goal.progress || 0) + 10, 100),
                                            streak: (goal.streak || 0) + 1
                                        };
                                        const updatedGoals = goals.map(g => g.id === goal.id ? updatedGoal : g);
                                        setGoals(updatedGoals);
                                        try {
                                            const user = auth.currentUser;
                                            const goalRef = doc(db, "users", user.uid, "goals", goal.id);
                                            await updateDoc(goalRef, {
                                                progress: updatedGoal.progress,
                                                streak: updatedGoal.streak,
                                            });
                                        } catch (err) {
                                            console.error("Failed to update goal:", err);
                                        }

                                    }}
                                    className="icon check"
                                />
                            </div>
                        </motion.div>
                    ))}

                </div>
            </section>

            {/* CUSTOM GOAL MODAL */}
            {showWizard && (
                <div className="modal-overlay">
                    <div className="goal-modal">
                        <h2>Create a Custom Goal</h2>
                        <input
                            type="text"
                            placeholder="What do you want to achieve?"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        />
                        <select
                            value={newGoal.frequency}
                            onChange={(e) => setNewGoal({ ...newGoal, frequency: e.target.value })}
                        >
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowWizard(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addGoal}
                                className="save-btn"
                            >
                                Save Goal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
