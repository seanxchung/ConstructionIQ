// Materials used: MAT.lumber, MAT.rebar, MAT.darkSteel, MAT.concrete, MAT.safetyOrange
// Lumber stack + rebar bundle + concrete pallet. pctRemaining mapped from avgPct prop.
"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { MAT } from "./matPalette";

function LumberStack({ position }) {
  const planks = useMemo(() => {
    const arr = [];
    for (let row = 0; row < 3; row++) {
      const rotated = row % 2 === 1;
      const count = row === 2 ? 3 : 4;
      for (let i = 0; i < count; i++) {
        const y = row * 0.09;
        if (rotated) {
          arr.push({
            pos: [0, y, (i - (count - 1) / 2) * 0.22],
            rot: [0, Math.PI / 2, 0],
            key: `l-${row}-${i}`,
          });
        } else {
          arr.push({
            pos: [(i - (count - 1) / 2) * 0.22, y, 0],
            rot: [0, 0, 0],
            key: `l-${row}-${i}`,
          });
        }
      }
    }
    return arr;
  }, []);

  return (
    <group position={position}>
      {planks.map((p) => (
        <mesh key={p.key} position={p.pos} rotation={p.rot} castShadow>
          <boxGeometry args={[1.8, 0.08, 0.2]} />
          <meshStandardMaterial {...MAT.lumber} />
        </mesh>
      ))}
    </group>
  );
}

function RebarBundle({ position }) {
  const rods = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.06;
      arr.push({
        y: Math.sin(angle) * r,
        z: Math.cos(angle) * r,
        key: `r-${i}`,
      });
    }
    return arr;
  }, []);

  return (
    <group position={position}>
      {/* Support blocks */}
      <mesh position={[-0.5, -0.06, 0]} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.2]} />
        <meshStandardMaterial {...MAT.lumber} />
      </mesh>
      <mesh position={[0.5, -0.06, 0]} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.2]} />
        <meshStandardMaterial {...MAT.lumber} />
      </mesh>

      {/* Rods */}
      {rods.map((rod) => (
        <mesh
          key={rod.key}
          position={[0, rod.y, rod.z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
          <meshStandardMaterial {...MAT.rebar} />
        </mesh>
      ))}

      {/* Binding bands */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.015, 4, 12]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.015, 4, 12]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
    </group>
  );
}

function ConcretePallet({ position }) {
  const bags = useMemo(() => {
    const arr = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const isTop = row === 2;
        arr.push({
          pos: [
            (col - 1) * 0.33 + (isTop ? (col - 1) * 0.02 : 0),
            0.05 + row * 0.16,
            (isTop ? (col - 1) * 0.03 : 0),
          ],
          key: `b-${row}-${col}`,
        });
      }
    }
    return arr;
  }, []);

  return (
    <group position={position}>
      {/* Pallet base */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.1, 1.0]} />
        <meshStandardMaterial {...MAT.lumber} />
      </mesh>

      {/* Bags */}
      {bags.map((bag) => (
        <mesh key={bag.key} position={bag.pos} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial {...MAT.concrete} />
        </mesh>
      ))}
    </group>
  );
}

function Toolbox({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.25]} />
        <meshStandardMaterial {...MAT.safetyOrange} />
      </mesh>
      <mesh position={[0, 0.21, 0]} castShadow>
        <boxGeometry args={[0.3, 0.02, 0.08]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>
    </group>
  );
}

function statusColor(pct) {
  if (pct > 50) return "#22c55e";
  if (pct > 20) return "#eab308";
  return "#ef4444";
}

export default function Materials({ x, z, width, depth, avgPct }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const pct = avgPct ?? 100;
  const color = statusColor(pct);
  const depleted = pct < 30;

  const layout = useMemo(() => {
    const margin = 0.3;
    const hw = (width - margin * 2) / 2;
    const hd = (depth - margin * 2) / 2;

    const stacks = [];

    stacks.push({ type: "lumber", pos: [-hw * 0.4, 0.04, -hd * 0.45] });
    if (!depleted) {
      stacks.push({ type: "lumber", pos: [hw * 0.5, 0.04, hd * 0.3] });
    }

    stacks.push({ type: "rebar", pos: [hw * 0.1, 0.1, -hd * 0.1] });

    if (!depleted) {
      stacks.push({ type: "concrete", pos: [-hw * 0.35, 0.05, hd * 0.4] });
    }

    stacks.push({ type: "toolbox", pos: [hw * 0.55, 0, -hd * 0.55] });

    return stacks;
  }, [width, depth, depleted]);

  return (
    <group position={[cx, 0, cz]}>
      {layout.map((item, i) => {
        switch (item.type) {
          case "lumber":
            return <LumberStack key={i} position={item.pos} />;
          case "rebar":
            return <RebarBundle key={i} position={item.pos} />;
          case "concrete":
            return <ConcretePallet key={i} position={item.pos} />;
          case "toolbox":
            return <Toolbox key={i} position={item.pos} />;
          default:
            return null;
        }
      })}

      <Html position={[0, 1.2, 0]} center>
        <div style={{
          background: "rgba(15,17,23,0.85)", color,
          fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 4, whiteSpace: "nowrap", userSelect: "none",
          border: `1px solid ${color}40`,
        }}>
          {Math.round(pct)}%
        </div>
      </Html>
    </group>
  );
}
