"use client";

export default function TruckStaging({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;

  const trucks = [
    { tx: -width / 4, tz: 0 },
    { tx: width / 4, tz: 0 },
    { tx: 0, tz: depth / 4 },
  ];

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground tile */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#84cc16" transparent opacity={0.15} />
      </mesh>

      {/* Parked truck boxes */}
      {trucks.map((t, i) => (
        <mesh key={i} position={[t.tx, 0.35, t.tz]}>
          <boxGeometry args={[0.8, 0.6, 0.5]} />
          <meshStandardMaterial color="#65a30d" />
        </mesh>
      ))}
    </group>
  );
}
