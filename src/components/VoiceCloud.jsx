import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, PhoneOff } from "lucide-react";
import "../styles/voiceCloud.css";
import CloudyOrb from "./CloudyOrb";

const VoiceCloud = ({ assistantVolume, speakWithRachel }) => {
  const navigate = useNavigate();
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);

  // 🎤 Auto Greeting
  useEffect(() => {
    if (speakWithRachel) {
      speakWithRachel(
        "Hello, I’m Rachel 🌿. I’m here to listen and help you reflect. Share anything on your mind, and we’ll work through it together."
      );
    }
  }, [speakWithRachel]);

  // ✅ Start microphone safely for mobile
  useEffect(() => {
    let ctx, analyser, source, dataArray, rafId, stream;

    const startMic = async () => {
      // 1️⃣ Check if secure context (required on mobile)
      if (
        window.isSecureContext === false &&
        location.hostname !== "localhost"
      ) {
        setError("Microphone access requires HTTPS.");
        return;
      }

      // 2️⃣ Ensure mediaDevices exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone not supported in this browser.");
        return;
      }

      try {
        // 3️⃣ Request mic permission
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = ctx.createAnalyser();
        source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 1024;
        dataArray = new Uint8Array(analyser.fftSize);

        let smoothedVolume = 0;

        const tick = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }
          const avg = sum / dataArray.length / 128;
          const amplified = Math.min(avg * 8, 1);
          smoothedVolume = smoothedVolume * 0.8 + amplified * 0.2;
          setVolume(smoothedVolume);
          rafId = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error("Mic error:", err);
        if (err.name === "NotAllowedError") {
          setError("Please allow microphone access in your browser settings.");
        } else {
          setError("Unable to access microphone. Try reopening the app.");
        }
      }
    };

    // Only start after user gesture (important for Safari/iOS)
    const handleUserInteraction = () => {
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("click", handleUserInteraction);
      startMic();
    };

    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("click", handleUserInteraction);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (source) source.disconnect();
      if (ctx) ctx.close();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  return (
    <div className="voice-screen">
      <div className="voice-avatar-wrapper">
        <div className={`avatar orb-container ${volume > 0.02 ? "show" : ""}`}>
          <CloudyOrb volume={volume} assistantVolume={assistantVolume} />
        </div>
      </div>

      <div className="controls">
        <button className="control-btn mic">
          <Mic size={28} />
        </button>
        <button className="control-btn end" onClick={() => navigate("/")}>
          <PhoneOff size={28} />
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#ff6b6b",
            fontSize: "14px",
            textAlign: "center",
            marginTop: "20px",
            padding: "0 20px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceCloud;
