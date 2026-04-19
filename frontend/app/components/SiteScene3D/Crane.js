"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

const MAST_HEIGHT = 22;
const MAST_BASE_Y = 1;
const MAST_TOP_Y = MAST_BASE_Y + MAST_HEIGHT;
const LATTICE_SPAN = 1.4;
const BEAM_SIZE = 0.15;
const BRACE_SIZE = 0.1;
const BRACE_INTERVAL = 2;

const yellowMat = { color: "#eab308", metalness: 0.4, roughness: 0.6 };
const redMat = { color: "#ef4444", metalness: 0.4, roughness: 0.6 };

function MastLattice({ tintColor }) {
  const half = LATTICE_SPAN / 2;
  const corners = [
    [half, 0, half],
    [half, 0, -half],
    [-half, 0, half],
    [-half, 0, -half],
  ];

  const braces = useMemo(() => {
    const arr = [];
    const count = Math.floor(MAST_HEIGHT / BRACE_INTERVAL);
    for (let i = 0; i <= count; i++) {
      const y = MAST_BASE_Y + i * BRACE_INTERVAL;
      arr.push({ y, axis: i % 2 === 0 ? "x" : "z" });
    }
    return arr;
  }, []);

  const diagonals = useMemo(() => {
    const arr = [];
    const count = Math.floor(MAST_HEIGHT / BRACE_INTERVAL);
    const diagLen = Math.sqrt(LATTICE_SPAN * LATTICE_SPAN + BRACE_INTERVAL * BRACE_INTERVAL);
    const angle = Math.atan2(BRACE_INTERVAL, LATTICE_SPAN);
    for (let i = 0; i < count; i++) {
      const yMid = MAST_BASE_Y + i * BRACE_INTERVAL + BRACE_INTERVAL / 2;
      const flip = i % 2 === 0 ? 1 : -1;
      arr.push({ yMid, diagLen, angle: angle * flip, side: "front" });
      arr.push({ yMid, diagLen, angle: angle * flip, side: "back" });
    }
    return arr;
  }, []);

  return (
    <group>
      {corners.map(([cx, _, cz], i) => (
        <mesh key={`vert-${i}`} position={[cx, MAST_BASE_Y + MAST_HEIGHT / 2, cz]} castShadow>
          <boxGeometry args={[BEAM_SIZE, MAST_HEIGHT, BEAM_SIZE]} />
          <meshStandardMaterial {...tintColor} />
        </mesh>
      ))}

      {braces.map((b, i) => (
        <group key={`hbrace-${i}`}>
          <mesh position={[0, b.y, half]} castShadow>
            <boxGeometry args={[LATTICE_SPAN, BRACE_SIZE, BRACE_SIZE]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
          <mesh position={[0, b.y, -half]} castShadow>
            <boxGeometry args={[LATTICE_SPAN, BRACE_SIZE, BRACE_SIZE]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
          <mesh position={[half, b.y, 0]} castShadow>
            <boxGeometry args={[BRACE_SIZE, BRACE_SIZE, LATTICE_SPAN]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
          <mesh position={[-half, b.y, 0]} castShadow>
            <boxGeometry args={[BRACE_SIZE, BRACE_SIZE, LATTICE_SPAN]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
        </group>
      ))}

      {diagonals.map((d, i) => (
        <mesh
          key={`diag-${i}`}
          position={[
            d.side === "front" ? 0 : 0,
            d.yMid,
            d.side === "front" ? half : -half,
          ]}
          rotation={[0, 0, d.angle]}
          castShadow
        >
          <boxGeometry args={[BRACE_SIZE * 0.7, d.diagLen * 0.9, BRACE_SIZE * 0.7]} />
          <meshStandardMaterial {...tintColor} />
        </mesh>
      ))}
    </group>
  );
}

function JibLattice({ length, tintColor }) {
  const braces = useMemo(() => {
    const arr = [];
    const count = Math.max(1, Math.floor(length));
    for (let i = 1; i <= count; i++) {
      arr.push(i);
    }
    return arr;
  }, [length]);

  return (
    <group>
      <mesh position={[length / 2, 0.5, 0]} castShadow>
        <boxGeometry args={[length, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial {...tintColor} />
      </mesh>
      <mesh position={[length / 2, -0.5, 0]} castShadow>
        <boxGeometry args={[length, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial {...tintColor} />
      </mesh>

      {braces.map((pos) => (
        <group key={`jb-${pos}`}>
          <mesh position={[pos, 0, 0]} castShadow>
            <boxGeometry args={[BRACE_SIZE, 1.0, BRACE_SIZE]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
          <mesh position={[pos - 0.5, 0, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[BRACE_SIZE * 0.7, 1.2, BRACE_SIZE * 0.7]} />
            <meshStandardMaterial {...tintColor} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Crane({ x, z, width, depth, craneData }) {
  const jibGroupRef = useRef();
  const breakdown = craneData?.breakdown || false;
  const swingRadius = craneData?.swing_radius || 6;
  const seed = x * 100 + z;

  const cx = x + width / 2;
  const cz = z + depth / 2;
  const jibLength = Math.max(swingRadius * 1.0, 4);
  const counterJibLength = jibLength * 0.3;

  const tintColor = breakdown ? redMat : yellowMat;
  const ringColor = breakdown ? "#ef4444" : "#eab308";

  useFrame(() => {
    if (jibGroupRef.current && !breakdown) {
      jibGroupRef.current.rotation.y += 0.003 + (seed % 7) * 0.0003;
    }
  });

  return (
    <group position={[cx, 0, cz]}>
      {/* 1. Base foundation */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1, 2.5]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>

      {/* 2. Lattice mast */}
      <MastLattice tintColor={tintColor} />

      {/* 3. Operator cab */}
      <mesh position={[0, MAST_TOP_Y + 0.6, 0]} castShadow>
        <boxGeometry args={[1.6, 1.2, 1.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
      <mesh position={[0, MAST_TOP_Y + 0.7, 0.02]}>
        <boxGeometry args={[1.4, 0.4, 1.0]} />
        <meshStandardMaterial color="#6366F1" transparent opacity={0.7} />
      </mesh>

      {/* 4. Slewing unit */}
      <mesh position={[0, MAST_TOP_Y + 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* 5-8. Rotating assembly: jib, counter-jib, counterweight, hook */}
      <group ref={jibGroupRef} position={[0, MAST_TOP_Y + 1.5, 0]}>
        {/* Jib */}
        <JibLattice length={jibLength} tintColor={tintColor} />

        {/* Counter-jib */}
        <group rotation={[0, Math.PI, 0]}>
          <JibLattice length={counterJibLength} tintColor={tintColor} />
        </group>

        {/* Counterweight */}
        <mesh position={[-counterJibLength, -0.1, 0]} castShadow>
          <boxGeometry args={[1.2, 0.8, 1.0]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} />
        </mesh>

        {/* Cable */}
        <mesh position={[jibLength, -2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 4, 4]} />
          <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Hook block */}
        <mesh position={[jibLength, -4.15, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* 10. Swing radius indicator — ring + filled disc */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[swingRadius - 0.1, swingRadius, 64]} />
        <meshStandardMaterial color={ringColor} transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[swingRadius, 64]} />
        <meshStandardMaterial color={ringColor} transparent opacity={0.06} />
      </mesh>

      {/* 11. Breakdown indicator */}
      {breakdown && (
        <Html position={[0, MAST_TOP_Y + 3, 0]} center>
          <div style={{
            background: "#ef4444", color: "#fff", fontWeight: 700,
            fontSize: 14, width: 24, height: 24, display: "flex",
            alignItems: "center", justifyContent: "center", borderRadius: 4,
            boxShadow: "0 0 12px rgba(239,68,68,0.6)", userSelect: "none",
          }}>
            ✕
          </div>
        </Html>
      )}
    </group>
  );
}
