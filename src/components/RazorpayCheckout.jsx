// RazorpayCheckout.jsx
import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const RazorpayCheckout = ({ user, amount, planName }) => {

  const handlePayment = async () => {
    if (!user) return alert("Please login first");

    // 1️⃣ Create order on your backend (or use Razorpay test key for frontend demo)
    const options = {
      key: "YOUR_RAZORPAY_KEY", // 🔑 Replace with your Razorpay Key
      amount: amount * 100, // in paise (₹1 = 100 paise)
      currency: "INR",
      name: "MindMate Premium",
      description: planName,
      image: "/logo.png", // optional
      handler: async function (response) {
        // Payment successful
        alert("Payment Successful!");
        console.log(response);

        // 2️⃣ Update Firebase user metadata
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          isPremium: true,
          premiumStart: new Date(),
          premiumEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        });
      },
      prefill: {
        name: user.displayName,
        email: user.email,
      },
      theme: {
        color: "#6f46c7",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <button className="upgrade-btn" onClick={handlePayment}>
      Upgrade to Pro
    </button>
  );
};

export default RazorpayCheckout;
