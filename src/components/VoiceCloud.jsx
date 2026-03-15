import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, PhoneOff } from "lucide-react";
import "../styles/VoiceCloud.css";
import CloudyOrb from "./CloudyOrb";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
const VoiceCloud = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [volume, setVolume] = useState(0);
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [error, setError] = useState(null);
  const voiceLevel = Math.max(volume, assistantVolume);
  const [micActive, setMicActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  let state = "idle";
  if (listening) state = "listening";
  if (assistantVolume > 0.02) state = "speaking";
  if (!browserSupportsSpeechRecognition) {
    return <div>Speech recognition not supported in this browser.</div>;
  }
  // Speak using backend Riva WAV
  const speakWithRiva = async (text) => {
    try {

      // 🔴 Stop mic before assistant speaks
      SpeechRecognition.stopListening();

      const res = await fetch(
        "https://mindmate-ai-api.onrender.com/api/v1/audio/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voice: "Mia",
          }),
        }
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 256;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);

        const avg =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

        setAssistantVolume(avg);

        if (!audio.paused) {
          requestAnimationFrame(updateVolume);
        }
      };

      audio.onplay = () => {
        updateVolume();
      };

      audio.onended = () => {
        setAssistantVolume(0);
        ctx.close();
        URL.revokeObjectURL(url);

        if (micActive) {
          SpeechRecognition.startListening({
            continuous: true,
            interimResults: true,
             maxAlternatives: 3,
            language: "en-IN"
          });
        }
      };

      await audio.play();

    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const sendVoiceMessage = async (text) => {
    try {
      const res = await fetch(
        "https://mindmate-ai-api.onrender.com/api/v1/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify([
            {
              role: "user",
              content: text
            }
          ])
        }
      );

      const data = await res.json();

      const reply = data.content || "Sorry, I didn't understand.";

      speakWithRiva(reply);

    } catch (err) {
      console.error("Voice AI error:", err);
    }
  };

  useEffect(() => {
    if (transcript.trim().length > 3 && !processing) {

      if (transcript.trim().length < 2) return;


      const timeout = setTimeout(async () => {
        setProcessing(true);

        await sendVoiceMessage(transcript);

        resetTranscript();
        setProcessing(false);
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [transcript]);

  useEffect(() => {
    let ctx, analyser, source, dataArray, rafId, stream;

    const startMic = async () => {
      if (
        window.isSecureContext === false &&
        location.hostname !== "localhost"
      ) {
        setError("Microphone requires HTTPS.");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone not supported.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
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

          const amplified = Math.min(avg * 3.5, 1);

          smoothedVolume = smoothedVolume * 0.8 + amplified * 0.2;

          setVolume(smoothedVolume);

          rafId = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error("Mic error:", err);

        if (err.name === "NotAllowedError") {
          setError("Please allow microphone access.");
        } else {
          setError("Unable to access microphone.");
        }
      }
    };

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
        <div
          className={`avatar orb-container ${volume > 0.02 || assistantVolume > 0.02 ? "show" : ""
            }`}
        >
          <CloudyOrb
            volume={volume}
            assistantVolume={assistantVolume}
            listening={listening}
          />
        </div>
      </div>

      <div className="controls">
        <button
          className={`control-btn mic ${micActive ? "active" : ""}`}
          onClick={() => {
            if (micActive) {
              SpeechRecognition.stopListening();
              setMicActive(false);
            } else {
              resetTranscript();
              SpeechRecognition.startListening({
                continuous: true,
                interimResults: true,
                 maxAlternatives: 3,
                language: "en-IN"
              });
              setMicActive(true);
            }
          }}
        >
          <Mic size={28} />
        </button>
        <button
          className="control-btn end"
          onClick={() => navigate("/")}
        >
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
