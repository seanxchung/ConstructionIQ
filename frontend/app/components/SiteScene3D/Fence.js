// Materials used: MAT.steel (post, cap, rails), chain-link panel (custom semi-transparent)
// Renders connecting rails/panels only in +x and +z directions to avoid doubling.
// Accepts neighbors: { right, down, left, up } from SiteScene3D.
"use client";

import { MAT } from "./matPalette";

const PANEL_MAT = { color: "#94a3b8", metalness: 0.5, roughness: 0.6, transparent: true, opacity: 0.3, wireframe: true };

export default function Fence({ x, z, neighbors }) {
  const cx = x + 0.5;
  const cz = z + 0.5;
  const n = neighbors || {};

  return (
    <group position={[cx, 0, cz]}>
      {/* Vertical post */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 6]} />
        <meshStandardMaterial {...MAT.steel} />
      </mesh>

      {/* Rails and panels to the RIGHT (+x direction) */}
      {n.right && (
        <group>
          <mesh position={[0.5, 1.7, 0]} castShadow>
            <boxGeometry args={[1.0, 0.05, 0.05]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0.5, 0.9, 0]} castShadow>
            <boxGeometry args={[1.0, 0.05, 0.05]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0.5, 0.15, 0]} castShadow>
            <boxGeometry args={[1.0, 0.05, 0.05]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0.5, 0.925, 0]}>
            <planeGeometry args={[1.0, 1.55]} />
            <meshStandardMaterial {...PANEL_MAT} side={2} />
          </mesh>
        </group>
      )}

      {/* Rails and panels DOWN (+z direction) */}
      {n.down && (
        <group>
          <mesh position={[0, 1.7, 0.5]} castShadow>
            <boxGeometry args={[0.05, 0.05, 1.0]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0, 0.9, 0.5]} castShadow>
            <boxGeometry args={[0.05, 0.05, 1.0]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0, 0.15, 0.5]} castShadow>
            <boxGeometry args={[0.05, 0.05, 1.0]} />
            <meshStandardMaterial {...MAT.steel} />
          </mesh>
          <mesh position={[0, 0.925, 0.5]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.0, 1.55]} />
            <meshStandardMaterial {...PANEL_MAT} side={2} />
          </mesh>
        </group>
      )}
    </group>
  );
}
