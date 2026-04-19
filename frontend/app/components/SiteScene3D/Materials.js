"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";

function palletColor(avgPct) {
  if (avgPct > 50) return "#22c55e";
  if (avgPct > 20) return "#eab308";
  return "#ef4444";
}

export default function Materials({ x, z, width, depth, avgPct }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const color = palletColor(avgPct);

  const pallets = useMemo(() => {
    const arr = [];
    const cols = Math.max(1, Math.floor(width / 1.2));
    const rows = Math.max(1, Math.floor(depth / 1.2));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = (c - (cols - 1) / 2) * 1.2;
        const pz = (r - (rows - 1) / 2) * 1.2;
        arr.push({ px, pz });
      }
    }
    return arr;
  }, [width, depth]);

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f97316" transparent opacity={0.1} />
      </mesh>

      {/* Pallet stacks */}
      {pallets.map((p, i) => (
        <group key={i} position={[p.px, 0, p.pz]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.8]} />
            <meshStandardMaterial color={color} opacity={0.8} transparent />
          </mesh>
        </group>
      ))}

      {/* Percentage label */}
      <Html position={[0, 1.5, 0]} center>
        <div style={{
          background: "rgba(15,17,23,0.85)", color,
          fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 4, whiteSpace: "nowrap", userSelect: "none",
          border: `1px solid ${color}40`,
        }}>
          {Math.round(avgPct)}%
        </div>
      </Html>
    </group>
  );
}
