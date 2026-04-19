"use client";

import { useMemo } from "react";

export default function Parking({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;

  const stripes = useMemo(() => {
    const arr = [];
    const count = Math.max(2, Math.floor(width / 1.2));
    for (let i = 0; i < count; i++) {
      arr.push((i - (count - 1) / 2) * 1.2);
    }
    return arr;
  }, [width]);

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.15} />
      </mesh>

      {/* Stripe lines */}
      {stripes.map((sx, i) => (
        <mesh key={i} position={[sx, 0.03, 0]}>
          <boxGeometry args={[0.06, 0.02, depth - 0.4]} />
          <meshStandardMaterial color="#e2e8f0" opacity={0.6} transparent />
        </mesh>
      ))}
    </group>
  );
}
