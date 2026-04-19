"use client";

import { useMemo } from "react";

const GRID = 30;

export default function Truck({ truck, blockedRoadCells }) {
  const { path, progress } = truck;

  const { posX, posZ, isBlocked } = useMemo(() => {
    if (!path || path.length === 0) return { posX: 0, posZ: 0, isBlocked: false };

    const p = Math.max(0, Math.min(progress, 0.99));
    const exact = p * (path.length - 1);
    const idx0 = Math.floor(exact);
    const idx1 = Math.min(idx0 + 1, path.length - 1);
    const frac = exact - idx0;

    const x0 = (path[idx0] % GRID) + 0.5;
    const z0 = Math.floor(path[idx0] / GRID) + 0.5;
    const x1 = (path[idx1] % GRID) + 0.5;
    const z1 = Math.floor(path[idx1] / GRID) + 0.5;

    const blockedIdx = path.findIndex((ci) => blockedRoadCells.has(ci));
    const pathPos = Math.min(Math.floor(p * path.length), path.length - 1);
    const blocked = blockedIdx >= 0 && pathPos >= blockedIdx;

    return {
      posX: x0 + (x1 - x0) * frac,
      posZ: z0 + (z1 - z0) * frac,
      isBlocked: blocked,
    };
  }, [path, progress, blockedRoadCells]);

  if (!path || path.length === 0 || progress < 0) return null;

  return (
    <mesh position={[posX, 0.4, posZ]}>
      <boxGeometry args={[1.2, 0.8, 0.8]} />
      <meshStandardMaterial color={isBlocked ? "#ef4444" : "#84cc16"} />
    </mesh>
  );
}
