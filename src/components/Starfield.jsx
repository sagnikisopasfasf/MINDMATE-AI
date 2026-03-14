import React, { useRef, useEffect } from "react";

const Starfield = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;

    const createStars = () => {
      const numStars = window.innerWidth < 768 ? 120 : 400;

      starsRef.current = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * canvas.width,
        radius: Math.random() * 1.5 + 0.5,
      }));
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      createStars(); // regenerate stars for new size
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const stars = starsRef.current;

      for (const s of stars) {
        s.z -= 2;

        if (s.z <= 0) {
          s.z = canvas.width;
          s.x = Math.random() * canvas.width;
          s.y = Math.random() * canvas.height;
        }

        const k = 128 / s.z;
        const px = (s.x - canvas.width / 2) * k + canvas.width / 2;
        const py = (s.y - canvas.height / 2) * k + canvas.height / 2;
        const size = (1 - s.z / canvas.width) * s.radius * 2;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,   // important so UI stays above
        pointerEvents: "none",
      }}
    />
  );
};

export default Starfield;