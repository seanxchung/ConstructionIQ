"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MAX_VISIBLE = 15;

export default function Workers({ x, z, width, depth, count }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const visibleCount = Math.min(count, MAX_VISIBLE);
  const overflow = count - MAX_VISIBLE;

  const figures = useMemo(() => {
    const rng = seededRandom(x * 1000 + z);
    const arr = [];
    for (let i = 0; i < visibleCount; i++) {
      arr.push({
        fx: (rng() - 0.5) * (width - 0.6),
        fz: (rng() - 0.5) * (depth - 0.6),
      });
    }
    return arr;
  }, [x, z, width, depth, visibleCount]);

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.1} />
      </mesh>

      {/* Worker figures */}
      {figures.map((f, i) => (
        <group key={i} position={[f.fx, 0, f.fz]}>
          {/* Body */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 6]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}

      {/* Overflow label */}
      {overflow > 0 && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            background: "rgba(15,17,23,0.85)", color: "#f97316",
            fontSize: 10, fontWeight: 700, padding: "2px 6px",
            borderRadius: 4, whiteSpace: "nowrap", userSelect: "none",
            border: "1px solid rgba(249,115,22,0.3)",
          }}>
            +{overflow}
          </div>
        </Html>
      )}
    </group>
  );
}
