"use client";

export default function Road({ x, z, blocked }) {
  return (
    <mesh position={[x + 0.5, 0.02, z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={blocked ? "#ef4444" : "#64748b"}
        transparent
        opacity={blocked ? 0.3 : 0.4}
      />
    </mesh>
  );
}
