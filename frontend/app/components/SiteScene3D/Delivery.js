// Materials used: MAT.asphalt (ground), MAT.safetyYellow (caution border), MAT.steel (ramp)
// Delivery zone: painted asphalt square with yellow caution borders and a loading ramp.
"use client";

import { MAT } from "./matPalette";

export default function Delivery({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const borderW = 0.12;

  return (
    <group position={[cx, 0, cz]}>
      {/* Asphalt pad */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[width - 0.1, 0.04, depth - 0.1]} />
        <meshStandardMaterial {...MAT.asphalt} />
      </mesh>

      {/* Yellow caution borders — four edges */}
      {/* Front */}
      <mesh position={[0, 0.05, -depth / 2 + borderW / 2 + 0.05]} castShadow>
        <boxGeometry args={[width - 0.2, 0.02, borderW]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.05, depth / 2 - borderW / 2 - 0.05]} castShadow>
        <boxGeometry args={[width - 0.2, 0.02, borderW]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2 + borderW / 2 + 0.05, 0.05, 0]} castShadow>
        <boxGeometry args={[borderW, 0.02, depth - 0.2]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 - borderW / 2 - 0.05, 0.05, 0]} castShadow>
        <boxGeometry args={[borderW, 0.02, depth - 0.2]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>

      {/* Loading ramp — angled surface at one edge */}
      <mesh position={[0, 0.12, -depth / 2 + 0.45]} rotation={[-0.15, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.8]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>
      {/* Ramp side rails */}
      <mesh position={[-0.72, 0.15, -depth / 2 + 0.45]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.8]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
      <mesh position={[0.72, 0.15, -depth / 2 + 0.45]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.8]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>

      {/* Center chevron arrow — "unload here" */}
      <mesh position={[0, 0.045, 0.15]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <boxGeometry args={[width * 0.25, 0.1, 0.03]} />
        <meshStandardMaterial {...MAT.safetyYellow} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.045, 0.15]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <boxGeometry args={[width * 0.25, 0.1, 0.03]} />
        <meshStandardMaterial {...MAT.safetyYellow} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
