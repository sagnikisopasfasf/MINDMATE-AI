import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import "../styles/Premium.css";
import { useEffect, useState } from "react";

const Premium = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Load Razorpay script only once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Payment Handler
  const handlePayment = (amount, planName) => {
    const options = {
      key: "YOUR_RAZORPAY_KEY", // Replace with your Razorpay Key
      amount: amount * 100,
      currency: "INR",
      name: "MindMate",
      description: planName,
      handler: function (response) {
        console.log(response);
        setModalMessage("Payment Successful! 🎉 Thank you for upgrading.");
        setIsModalOpen(true);
      },
      theme: {
        color: "#6f46c7",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const plans = [
    {
      title: "Free",
      price: "₹0",
      features: [
        "Limited conversations per day",
        "Basic AI therapy responses & guidance",
        "Mood tracking with limited prompts",
        "Simple journaling",
        "Google Ads support",
        "Community support & forums",
      ],
      button: "Continue Free",
    },
    {
      title: "Pro (Monthly)",
      price: "₹199/month",
      features: [
        "Unlimited conversations with AI therapist",
        "Smart session saving & conversation history",
        "Human-like voice replies for immersive guidance",
        "Daily emotional check-ins & guided journaling",
        "Goal setting, tracking & therapy exercises",
        "Emotional nudges & reminders based on your mood",
      ],
      button: "Upgrade to Pro",
    },
    {
      title: "Pro+ (Yearly)",
      price: "₹3999/year",
      features: [
        "All Pro features",
        "Emotional check-ins & random therapy prompts",
        "Advanced journaling & AI analysis (mood insights, patterns, therapy suggestions)",
        "Customizable AI personality for therapy (friendly, motivational, calm, etc.)",
        "Premium themes & UI enhancements",
        "Priority response & early feature access",
        "Uses different models for powerful replies",
        "Exclusive Zen Theme",
        "Early access to new features",
      ],
      button: "Upgrade to Pro+",
    },
  ];

  return (
    <div className="premium-page">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="premium-title"
      >
        MindMate Pro
      </motion.h1>

      <p className="premium-sub">Unlock the full potential with Pro plans</p>

      <div className="plans-container">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            className="plan-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
          >
            <h2>{plan.title}</h2>
            <h3>{plan.price}</h3>
            <ul>
              {plan.features.map((f, i) => (
                <li key={i}>
                  <CheckCircle size={18} style={{ marginRight: "8px" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="upgrade-btn"
              onClick={() => {
                if (plan.title === "Pro (Monthly)") {
                  handlePayment(199, "Pro Monthly");
                } else if (plan.title === "Pro+ (Yearly)") {
                  handlePayment(3999, "Pro+ Yearly");
                } else {
                  setModalMessage("You’re already on Free Plan 🎉");
                  setIsModalOpen(true);
                }
              }}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Premium;
