"use client";

export default function ManLift({ x, z }) {
  const cx = x + 0.5;
  const cz = z + 0.5;

  return (
    <group position={[cx, 0, cz]}>
      {/* Base box */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>

      {/* Extendable arm angled 45° */}
      <mesh position={[0.3, 1.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.06, 2, 6]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>

      {/* Platform at top of arm */}
      <mesh position={[1.0, 2.2, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.4]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
    </group>
  );
}
