// Materials used: MAT.trailerWhite (body), MAT.darkSteel (roof, door), MAT.glass (windows),
// MAT.steel (steps, HVAC), MAT.concrete (support blocks)
// Fixed-size trailer centered on zone footprint. On cinder blocks.
"use client";

import { MAT } from "./matPalette";

export default function Office({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;

  return (
    <group position={[cx, 0, cz]}>
      {/* Support blocks — 4 corners under the trailer */}
      {[[-1.6, -0.9], [-1.6, 0.9], [1.6, -0.9], [1.6, 0.9]].map(([bx, bz], i) => (
        <mesh key={`block-${i}`} position={[bx, 0.2, bz]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 6]} />
          <meshStandardMaterial {...MAT.concrete} />
        </mesh>
      ))}

      {/* Main body */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.0, 2.3]} />
        <meshStandardMaterial {...MAT.trailerWhite} />
      </mesh>

      {/* Roof with slight overhang */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[4.0, 0.15, 2.5]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>

      {/* Front windows — 3 evenly spaced */}
      {[-1.1, 0, 1.1].map((wx, i) => (
        <mesh key={`win-${i}`} position={[wx, 1.4, 1.17]}>
          <boxGeometry args={[0.6, 0.7, 0.04]} />
          <meshStandardMaterial {...MAT.glass} />
        </mesh>
      ))}

      {/* Door — on the right end */}
      <mesh position={[1.92, 0.85, 0.3]} castShadow>
        <boxGeometry args={[0.05, 1.3, 0.7]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
      {/* Door handle */}
      <mesh position={[1.96, 0.9, 0.05]}>
        <boxGeometry args={[0.03, 0.06, 0.15]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>

      {/* Door steps */}
      <mesh position={[2.0, 0.15, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>
      <mesh position={[2.15, 0.05, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>

      {/* HVAC unit on roof */}
      <mesh position={[-0.8, 2.55, -0.3]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>

      {/* Antenna on roof */}
      <mesh position={[1.2, 2.6, 0.5]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
    </group>
  );
}
