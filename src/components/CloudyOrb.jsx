import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useMicVolume from "../hooks/useMicVolume";

// Voice reactive orb particles
function VoiceOrb({ volume = 0 }) {
    const pointsRef = useRef();
    const particleCount = 1500;
    const radius = 1.2;

    const particles = useMemo(() => {
        const pos = [];
        for (let i = 0; i < particleCount; i++) {
            // Uniform sphere volume fill
            let u = Math.random();
            let v = Math.random();
            let theta = 2 * Math.PI * u;
            let phi = Math.acos(2 * v - 1);
            let r = radius * Math.cbrt(Math.random());
            pos.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        return new Float32Array(pos);
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const positions = pointsRef.current.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const p = new THREE.Vector3(
                positions[i3],
                positions[i3 + 1],
                positions[i3 + 2]
            );

            // Gentle breathing + voice deformation
            const wobble =
                Math.sin(t * 8 + i) * 0.025 +
                Math.cos(t * 5 + i * 1.5) * 0.02;
            const deform = wobble + volume * 0.3;

            p.normalize().multiplyScalar(p.length() + deform);

            positions[i3] = p.x;
            positions[i3 + 1] = p.y;
            positions[i3 + 2] = p.z;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#5fdd65ff"
                size={0.025}
                sizeAttenuation
                transparent
                opacity={0.85}
                depthWrite={false}
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
            <Canvas gl={{ alpha: true }} camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.9} />
                <VoiceOrb volume={volume} />
            </Canvas>
        </div>
    );
}
