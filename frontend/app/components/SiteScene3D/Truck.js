// Materials used: MAT.trailerWhite (cab), MAT.glass (windows), MAT.safetyOrange (cargo),
// MAT.darkSteel (chassis, hubs), MAT.tire (wheels)
// Blocked state: cargo turns muted red, amber roof light pulses.
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MAT } from "./matPalette";

const GRID = 30;
const BLOCKED_CARGO = { color: "#7f1d1d", metalness: 0.3, roughness: 0.6 };

function TruckBody({ isBlocked }) {
  const hazardRef = useRef();

  useFrame(({ clock }) => {
    if (hazardRef.current && isBlocked) {
      hazardRef.current.material.emissiveIntensity =
        Math.sin(clock.getElapsedTime() * 6) > 0 ? 1.5 : 0.2;
    }
  });

  const cargoMat = isBlocked ? BLOCKED_CARGO : MAT.safetyOrange;

  return (
    <group>
      {/* Chassis */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.1, 0.15, 3.0]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>

      {/* Cab */}
      <mesh position={[0, 0.9, -0.9]} castShadow>
        <boxGeometry args={[1.1, 1.0, 1.2]} />
        <meshStandardMaterial {...MAT.trailerWhite} />
      </mesh>

      {/* Cab front window */}
      <mesh position={[0, 1.05, -1.51]}>
        <boxGeometry args={[0.9, 0.4, 0.02]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>
      {/* Cab side windows */}
      <mesh position={[0.56, 1.05, -0.9]}>
        <boxGeometry args={[0.02, 0.35, 0.8]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>
      <mesh position={[-0.56, 1.05, -0.9]}>
        <boxGeometry args={[0.02, 0.35, 0.8]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>

      {/* Cargo box */}
      <mesh position={[0, 1.05, 0.6]} castShadow>
        <boxGeometry args={[1.2, 1.3, 1.8]} />
        <meshStandardMaterial {...cargoMat} />
      </mesh>

      {/* Wheels (4) */}
      {[[-0.5, -1.1], [-0.5, 0.8], [0.5, -1.1], [0.5, 0.8]].map(([wx, wz], i) => (
        <group key={`w-${i}`} position={[wx, 0.28, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 12]} />
            <meshStandardMaterial {...MAT.tire} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.22, 8]} />
            <meshStandardMaterial {...MAT.darkSteel} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      <mesh position={[-0.35, 0.75, -1.52]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.35, 0.75, -1.52]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>

      {/* Amber roof light */}
      <mesh ref={hazardRef} position={[0, 1.45, -0.9]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={isBlocked ? 1.0 : 0.3}
        />
      </mesh>
    </group>
  );
}

export default function Truck({ truck, blockedRoadCells }) {
  const { path, progress } = truck;

  const { posX, posZ, rotation, isBlocked } = useMemo(() => {
    if (!path || path.length === 0) return { posX: 0, posZ: 0, rotation: 0, isBlocked: false };

    const p = Math.max(0, Math.min(progress, 0.99));
    const exact = p * (path.length - 1);
    const idx0 = Math.floor(exact);
    const idx1 = Math.min(idx0 + 1, path.length - 1);
    const frac = exact - idx0;

    const x0 = (path[idx0] % GRID) + 0.5;
    const z0 = Math.floor(path[idx0] / GRID) + 0.5;
    const x1 = (path[idx1] % GRID) + 0.5;
    const z1 = Math.floor(path[idx1] / GRID) + 0.5;

    const dx = x1 - x0;
    const dz = z1 - z0;
    const rot = Math.atan2(dx, dz) + Math.PI;

    const blockedIdx = path.findIndex((ci) => blockedRoadCells.has(ci));
    const pathPos = Math.min(Math.floor(p * path.length), path.length - 1);
    const blocked = blockedIdx >= 0 && pathPos >= blockedIdx;

    return {
      posX: x0 + (x1 - x0) * frac,
      posZ: z0 + (z1 - z0) * frac,
      rotation: rot,
      isBlocked: blocked,
    };
  }, [path, progress, blockedRoadCells]);

  if (!path || path.length === 0 || progress < 0) return null;

  return (
    <group position={[posX, 0, posZ]} rotation={[0, rotation, 0]}>
      <TruckBody isBlocked={isBlocked} />
    </group>
  );
}
