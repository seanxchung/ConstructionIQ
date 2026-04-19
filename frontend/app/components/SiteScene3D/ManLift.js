// Materials used: MAT.safetyYellow (chassis, platform), MAT.tire (wheels),
// MAT.steel (scissor braces, railing posts), MAT.darkSteel (hydraulic ram, railing bars)
// Scissor lift in raised position. 1×1 footprint zone.
"use client";

import { useMemo } from "react";
import { MAT } from "./matPalette";

export default function ManLift({ x, z }) {
  const cx = x + 0.5;
  const cz = z + 0.5;

  const braces = useMemo(() => {
    const arr = [];
    const pairs = 4;
    const baseY = 0.5;
    const topY = 1.6;
    const span = topY - baseY;
    const braceLen = span / pairs / Math.cos(Math.PI / 6);
    for (let i = 0; i < pairs; i++) {
      const y = baseY + (span / pairs) * (i + 0.5);
      const angle = (i % 2 === 0 ? 1 : -1) * 0.52;
      arr.push({ y, angle, len: braceLen, key: `br-${i}` });
    }
    return arr;
  }, []);

  return (
    <group position={[cx, 0, cz]}>
      {/* Chassis */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.4, 1.8]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>

      {/* Hazard stripes on front face */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`hz-${i}`} position={[-0.61, 0.3, -0.65 + i * 0.43]} castShadow>
          <boxGeometry args={[0.02, 0.25, 0.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#1f2937" : "#eab308"} metalness={0.2} roughness={0.7} />
        </mesh>
      ))}

      {/* Wheels — 4 corners */}
      {[[-0.45, -0.7], [-0.45, 0.7], [0.45, -0.7], [0.45, 0.7]].map(([wx, wz], i) => (
        <mesh key={`w-${i}`} position={[wx, 0.2, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 10]} />
          <meshStandardMaterial {...MAT.tire} />
        </mesh>
      ))}

      {/* Scissor mechanism — left column */}
      {braces.map((b) => (
        <mesh key={`L-${b.key}`} position={[-0.35, b.y, 0]} rotation={[0, 0, b.angle]} castShadow>
          <boxGeometry args={[0.08, b.len, 0.05]} />
          <meshStandardMaterial {...MAT.steel} />
        </mesh>
      ))}

      {/* Scissor mechanism — right column */}
      {braces.map((b) => (
        <mesh key={`R-${b.key}`} position={[0.35, b.y, 0]} rotation={[0, 0, b.angle]} castShadow>
          <boxGeometry args={[0.08, b.len, 0.05]} />
          <meshStandardMaterial {...MAT.steel} />
        </mesh>
      ))}

      {/* Hydraulic ram */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 8]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>

      {/* Platform deck */}
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.1, 1.9]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>

      {/* Railing posts — 4 corners */}
      {[[-0.6, -0.85], [-0.6, 0.85], [0.6, -0.85], [0.6, 0.85]].map(([rx, rz], i) => (
        <mesh key={`rp-${i}`} position={[rx, 2.15, rz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial {...MAT.darkSteel} />
        </mesh>
      ))}

      {/* Horizontal railing bars — top rails connecting posts */}
      {/* Front & back (along X) */}
      {[-0.85, 0.85].map((rz, i) => (
        <mesh key={`rh-fb-${i}`} position={[0, 2.45, rz]} castShadow>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshStandardMaterial {...MAT.darkSteel} />
        </mesh>
      ))}
      {/* Left & right (along Z) */}
      {[-0.6, 0.6].map((rx, i) => (
        <mesh key={`rh-lr-${i}`} position={[rx, 2.45, 0]} castShadow>
          <boxGeometry args={[0.04, 0.04, 1.7]} />
          <meshStandardMaterial {...MAT.darkSteel} />
        </mesh>
      ))}
    </group>
  );
}
