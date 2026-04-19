"use client";

export default function Fence({ x, z }) {
  return (
    <mesh position={[x + 0.5, 0.5, z + 0.5]}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
}
