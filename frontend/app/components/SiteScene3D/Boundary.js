"use client";

import { useMemo } from "react";

export default function Boundary({ x, z }) {
  const cx = x + 0.5;
  const cz = z + 0.5;
  const wallHeight = 2;
  const segments = 4;

  const boxes = useMemo(() => {
    const arr = [];
    const segH = wallHeight / segments;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) {
        arr.push({ y: segH * i + segH / 2, h: segH });
      }
    }
    return arr;
  }, []);

  return (
    <group position={[cx, 0, cz]}>
      {boxes.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]}>
          <boxGeometry args={[1, b.h, 1]} />
          <meshStandardMaterial color="#ef4444" opacity={0.7} transparent />
        </mesh>
      ))}
    </group>
  );
}
