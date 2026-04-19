"use client";

export default function Office({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const bodyHeight = 2;
  const roofHeight = 0.8;

  return (
    <group position={[cx, 0, cz]}>
      {/* Building body */}
      <mesh position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[width - 0.1, bodyHeight, depth - 0.1]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>

      {/* Pyramid roof */}
      <mesh position={[0, bodyHeight + roofHeight / 2, 0]}>
        <coneGeometry args={[Math.min(width, depth) / 2, roofHeight, 4]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
    </group>
  );
}
