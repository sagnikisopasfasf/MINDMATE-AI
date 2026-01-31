import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useMicVolume from "../hooks/useMicVolume";

// Voice reactive orb particles
function VoiceOrb({ volume = 0, active = false }) {
  const pointsRef = useRef();
  const stateRef = useRef({ wake: 0 });
  const particleCount = 2200;
  const baseRadius = 1.12;

  const data = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount * 2);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      angles[i * 2] = theta;
      angles[i * 2 + 1] = phi;

      const r = baseRadius + Math.random() * 0.05;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }

    return { pos, angles };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array;
    const ang = data.angles;

    /* ---------- WAKE STATE ---------- */
    if (active) {
      stateRef.current.wake = Math.min(
        stateRef.current.wake + 0.05,
        1
      );
    } else {
      stateRef.current.wake = Math.max(
        stateRef.current.wake - 0.04,
        0
      );
    }

    const wake = stateRef.current.wake;

    /* ---------- MOTION ---------- */
    const breathe = Math.sin(t * 2) * 0.06;
    const voice = Math.min(volume * 0.9, 0.6);
    const swirl = t * (0.2 + wake * 0.8);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const i2 = i * 2;

      const theta = ang[i2] + swirl;
      const phi =
        ang[i2 + 1] +
        Math.sin(t * 1.8 + i * 0.03) * (0.1 + wake * 0.25);

      const r =
        baseRadius +
        breathe +
        voice * wake +
        Math.sin(t * 6 + i) * 0.02 * wake;

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }

    /* ---------- GLOBAL FEEL ---------- */
    pointsRef.current.rotation.y += 0.002 + wake * 0.01;
    pointsRef.current.rotation.x = Math.sin(t * 0.4) * 0.08;

    const scale = 0.92 + wake * 0.18 + voice * 0.12;
    pointsRef.current.scale.setScalar(scale);

    pointsRef.current.material.opacity = 0.35 + wake * 0.65;

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={data.pos}
          count={data.pos.length / 3}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#f3f4f6"
        size={0.028}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}


// Main Component
export default function VoiceReactiveOrb() {
    const audioRef = useRef();
    const volume = useMicVolume(audioRef);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            if (audioRef.current) {
                audioRef.current.srcObject = stream;
                audioRef.current.muted = true;
                audioRef.current.play();
            }
        });
    }, []);

    return (
        <div
            style={{
                width: "300px",
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
            }}
        >
            <audio ref={audioRef} style={{ display: "none" }} />
            <Canvas
  gl={{ alpha: true, antialias: true }}
  camera={{ position: [0, 0, 3.3], fov: 55 }}
>
  <ambientLight intensity={0.4} />
  <VoiceOrb volume={volume} />
</Canvas>


        </div>
    );
}
