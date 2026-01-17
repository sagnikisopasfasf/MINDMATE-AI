import React, { useEffect, useRef } from "react";
import "../styles/VoicePulseLine.css";

const VoicePulseLine = ({ volume }) => {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.moveTo(0, h / 2);

      for (let x = 0; x < w; x++) {
        const pulse =
          Math.sin((x + phaseRef.current) * 0.05) *
          (volume * 40); // pulsation height
        ctx.lineTo(x, h / 2 + pulse);
      
      }

      ctx.strokeStyle = volume > 0.05 ? "#fff" : "#000"; // white when speaking, black idle
      ctx.lineWidth = 2;
      ctx.stroke();

      phaseRef.current += 2; // wave moves forward

      requestAnimationFrame(animate);
    };

    animate();
  }, [volume]);

  return <canvas ref={canvasRef} className="voice-line-canvas" width={300} height={40} />;
};

export default VoicePulseLine;
