// hooks/useMicVolume.js
import { useState, useEffect, useRef } from "react";

export default function useMicVolume(listening) {
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const smoothRef = useRef(0);

  useEffect(() => {
    if (!listening) {
      setVolume(0);
      return;
    }

    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!mounted) return;

        streamRef.current = stream;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;

        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;

          for (let i = 0; i < dataArray.length; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }

          let avg = sum / dataArray.length / 128;

          // amplify mic response
          avg = Math.min(avg * 3, 1);

          // smooth animation
          smoothRef.current =
            smoothRef.current * 0.8 + avg * 0.2;

          setVolume(smoothRef.current);

          rafRef.current = requestAnimationFrame(tick);
        };

        tick();

      } catch (err) {
        console.error("Mic volume hook error:", err);
      }
    };

    start();

    return () => {
      mounted = false;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setVolume(0);
    };

  }, [listening]);

  return volume;
}