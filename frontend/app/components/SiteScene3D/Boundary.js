// Materials used: MAT.safetyOrange (posts, rails)
// Taller/thicker posts than fence. No chain-link — just thick orange rails.
// Renders connecting rails only in +x and +z directions to avoid doubling.
"use client";

import { MAT } from "./matPalette";

export default function Boundary({ x, z, neighbors }) {
  const cx = x + 0.5;
  const cz = z + 0.5;
  const n = neighbors || {};

  return (
    <group position={[cx, 0, cz]}>
      {/* Vertical post — taller + thicker */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.5, 6]} />
        <meshStandardMaterial {...MAT.safetyOrange} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 6]} />
        <meshStandardMaterial {...MAT.safetyOrange} />
      </mesh>

      {/* Rails to the RIGHT (+x) */}
      {n.right && (
        <group>
          <mesh position={[0.5, 2.35, 0]} castShadow>
            <boxGeometry args={[1.0, 0.06, 0.06]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
          <mesh position={[0.5, 1.25, 0]} castShadow>
            <boxGeometry args={[1.0, 0.06, 0.06]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
          <mesh position={[0.5, 0.15, 0]} castShadow>
            <boxGeometry args={[1.0, 0.06, 0.06]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
        </group>
      )}

      {/* Rails DOWN (+z) */}
      {n.down && (
        <group>
          <mesh position={[0, 2.35, 0.5]} castShadow>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
          <mesh position={[0, 1.25, 0.5]} castShadow>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
          <mesh position={[0, 0.15, 0.5]} castShadow>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial {...MAT.safetyOrange} />
          </mesh>
        </group>
      )}
    </group>
  );
}
