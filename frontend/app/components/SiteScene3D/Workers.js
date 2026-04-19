// Materials used: MAT.vestOrange (torso, arms), MAT.denim (legs), MAT.skin (head), MAT.hardHat (hat, brim)
// Max 8 visible figures. Deterministic pseudo-random layout with Y rotation variation.
"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { MAT } from "./matPalette";

const MAX_VISIBLE = 8;
const ORIENTATIONS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

function Worker({ rotation }) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Legs */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.15, 0.7, 0.18]} />
        <meshStandardMaterial {...MAT.denim} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.15, 0.7, 0.18]} />
        <meshStandardMaterial {...MAT.denim} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.4, 0.8, 0.25]} />
        <meshStandardMaterial {...MAT.vestOrange} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.28, 1.1, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial {...MAT.vestOrange} />
      </mesh>
      <mesh position={[0.28, 1.1, 0]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial {...MAT.vestOrange} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial {...MAT.skin} />
      </mesh>

      {/* Hard hat crown */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.1, 8]} />
        <meshStandardMaterial {...MAT.hardHat} />
      </mesh>
      {/* Hard hat brim */}
      <mesh position={[0, 1.635, 0.03]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 8]} />
        <meshStandardMaterial {...MAT.hardHat} />
      </mesh>
    </group>
  );
}

export default function Workers({ x, z, width, depth, count }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const visibleCount = Math.min(count, MAX_VISIBLE);
  const overflow = count - MAX_VISIBLE;

  const figures = useMemo(() => {
    if (visibleCount <= 0) return [];
    const arr = [];
    const cols = Math.ceil(Math.sqrt(visibleCount));
    const rows = Math.ceil(visibleCount / cols);
    const spacingX = (width - 0.8) / Math.max(cols, 1);
    const spacingZ = (depth - 0.8) / Math.max(rows, 1);
    let idx = 0;
    for (let r = 0; r < rows && idx < visibleCount; r++) {
      for (let c = 0; c < cols && idx < visibleCount; c++) {
        const jitterX = ((idx * 37) % 7 - 3) * 0.06;
        const jitterZ = ((idx * 53) % 7 - 3) * 0.06;
        arr.push({
          fx: (c - (cols - 1) / 2) * spacingX + jitterX,
          fz: (r - (rows - 1) / 2) * spacingZ + jitterZ,
          rot: ORIENTATIONS[idx % 4],
        });
        idx++;
      }
    }
    return arr;
  }, [width, depth, visibleCount]);

  if (count <= 0) return <group />;

  return (
    <group position={[cx, 0, cz]}>
      {figures.map((f, i) => (
        <group key={i} position={[f.fx, 0, f.fz]}>
          <Worker rotation={f.rot} />
        </group>
      ))}

      {overflow > 0 && (
        <Html position={[0, 2.1, 0]} center>
          <div style={{
            background: "rgba(15,17,23,0.85)", color: "#f97316",
            fontSize: 10, fontWeight: 700, padding: "2px 6px",
            borderRadius: 4, whiteSpace: "nowrap", userSelect: "none",
            border: "1px solid rgba(249,115,22,0.3)",
          }}>
            +{overflow}
          </div>
        </Html>
      )}
    </group>
  );
}
