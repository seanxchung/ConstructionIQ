// Materials used: MAT.asphalt (lot), MAT.glass (windows), MAT.darkSteel (truck beds),
// MAT.tire (wheels). Car body colors from working-vehicle palette.
// 6-8 parked pickup trucks in 2 rows, deterministic layout.
"use client";

import { useMemo } from "react";
import { MAT } from "./matPalette";

const CAR_COLORS = ["#64748b", "#1f2937", "#334155", "#7f1d1d", "#1e3a5f"];

function PickupTruck({ color }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <boxGeometry args={[0.9, 0.55, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Cab (toward front) */}
      <mesh position={[0, 0.65, -0.4]} castShadow>
        <boxGeometry args={[0.85, 0.4, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Cab windows */}
      <mesh position={[0, 0.7, -0.86]}>
        <boxGeometry args={[0.7, 0.3, 0.02]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>
      <mesh position={[0.43, 0.7, -0.4]}>
        <boxGeometry args={[0.02, 0.28, 0.7]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>
      <mesh position={[-0.43, 0.7, -0.4]}>
        <boxGeometry args={[0.02, 0.28, 0.7]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>

      {/* Truck bed */}
      <mesh position={[0, 0.425, 0.45]} castShadow>
        <boxGeometry args={[0.85, 0.15, 0.8]} />
        <meshStandardMaterial {...MAT.darkSteel} />
      </mesh>

      {/* Wheels */}
      {[[-0.4, -0.6], [-0.4, 0.55], [0.4, -0.6], [0.4, 0.55]].map(([wx, wz], i) => (
        <mesh key={`w-${i}`} position={[wx, 0.2, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 10]} />
          <meshStandardMaterial {...MAT.tire} />
        </mesh>
      ))}
    </group>
  );
}

export default function Parking({ x, z, width, depth }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;

  const { cars, stripes } = useMemo(() => {
    const margin = 0.3;
    const usableW = width - margin * 2;
    const usableD = depth - margin * 2;

    const carsPerRow = Math.min(4, Math.max(2, Math.floor(usableD / 2.2)));
    const totalCars = Math.min(8, carsPerRow * 2);
    const spacingZ = usableD / carsPerRow;
    const rowOffset = usableW / 4;

    const carArr = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < carsPerRow && carArr.length < totalCars; col++) {
        carArr.push({
          px: (row === 0 ? -1 : 1) * rowOffset,
          pz: (col - (carsPerRow - 1) / 2) * spacingZ,
          color: CAR_COLORS[(row * carsPerRow + col) % CAR_COLORS.length],
        });
      }
    }

    const stripeArr = [];
    for (let col = 0; col < carsPerRow + 1; col++) {
      const sz = (col - carsPerRow / 2) * spacingZ;
      stripeArr.push({ px: -rowOffset, pz: sz });
      stripeArr.push({ px: rowOffset, pz: sz });
    }
    stripeArr.push({ px: 0, pz: -usableD / 2, isCenter: true });
    stripeArr.push({ px: 0, pz: usableD / 2, isCenter: true });

    return { cars: carArr, stripes: stripeArr };
  }, [width, depth]);

  return (
    <group position={[cx, 0, cz]}>
      {/* Lot surface */}
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[width, 0.05, depth]} />
        <meshStandardMaterial {...MAT.asphalt} />
      </mesh>

      {/* Parking stripes */}
      {stripes.map((s, i) =>
        s.isCenter ? null : (
          <mesh key={`s-${i}`} position={[s.px, 0.055, s.pz]}>
            <boxGeometry args={[0.03, 0.01, 1.8]} />
            <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.5} />
          </mesh>
        )
      )}

      {/* Center divider line */}
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.04, 0.01, depth - 0.4]} />
        <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.5} opacity={0.6} transparent />
      </mesh>

      {/* Cars */}
      {cars.map((c, i) => (
        <group key={`car-${i}`} position={[c.px, 0, c.pz]}>
          <PickupTruck color={c.color} />
        </group>
      ))}
    </group>
  );
}
