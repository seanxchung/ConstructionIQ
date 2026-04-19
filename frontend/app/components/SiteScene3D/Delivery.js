"use client";

export default function Delivery({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#84cc16" transparent opacity={0.15} />
      </mesh>

      {/* Arrow pointing inward (chevron shape from 3 boxes) */}
      <mesh position={[0, 0.04, -depth / 6]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <boxGeometry args={[width * 0.4, 0.15, 0.04]} />
        <meshStandardMaterial color="#84cc16" opacity={0.5} transparent />
      </mesh>
      <mesh position={[0, 0.04, -depth / 6]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <boxGeometry args={[width * 0.4, 0.15, 0.04]} />
        <meshStandardMaterial color="#84cc16" opacity={0.5} transparent />
      </mesh>
      <mesh position={[0, 0.04, depth / 8]}>
        <boxGeometry args={[0.15, 0.04, depth * 0.3]} />
        <meshStandardMaterial color="#84cc16" opacity={0.5} transparent />
      </mesh>
    </group>
  );
}
