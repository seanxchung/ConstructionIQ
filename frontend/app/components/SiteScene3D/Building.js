"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

const FLOOR_HEIGHT = 2;

function getPhase(buildPct) {
  if (buildPct <= 15) return "excavation";
  if (buildPct <= 30) return "foundation";
  if (buildPct <= 55) return "structure";
  if (buildPct <= 75) return "mep";
  if (buildPct <= 90) return "finishing";
  return "complete";
}

/* ── Excavation (0-15%) ── */
function Excavation({ width, depth }) {
  const dirtPiles = useMemo(() => {
    const piles = [];
    const positions = [
      [width / 2 + 0.4, 0.15, 0],
      [-(width / 2 + 0.4), 0.15, 0],
      [0, 0.15, depth / 2 + 0.4],
      [0, 0.15, -(depth / 2 + 0.4)],
      [width / 2 + 0.3, 0.15, depth / 2 + 0.3],
      [-(width / 2 + 0.3), 0.15, -(depth / 2 + 0.3)],
    ];
    for (const p of positions) {
      piles.push(p);
    }
    return piles;
  }, [width, depth]);

  return (
    <group>
      <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial color="#1A1D2B" />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[width - 0.4, 0.6, depth - 0.4]} />
        <meshStandardMaterial color="#111318" />
      </mesh>
      {dirtPiles.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.6, 0.3, 0.6]} />
          <meshStandardMaterial color="#78350f" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Foundation (15-30%) ── */
function Foundation({ width, depth }) {
  const rebars = useMemo(() => {
    const arr = [];
    const spacingX = width / 4;
    const spacingZ = depth / 4;
    for (let ix = 1; ix < 4; ix++) {
      for (let iz = 1; iz < 4; iz++) {
        arr.push([
          -width / 2 + ix * spacingX,
          0.9,
          -depth / 2 + iz * spacingZ,
        ]);
      }
    }
    return arr;
  }, [width, depth]);

  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.1} roughness={0.9} />
      </mesh>
      {rebars.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
          <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Structural Frame (30-55%) ── */
function StructuralFrame({ width, depth, buildPct, floors }) {
  const fullHeight = floors * FLOOR_HEIGHT;
  const t = (buildPct - 30) / 25;
  const currentHeight = Math.max(FLOOR_HEIGHT, t * fullHeight);
  const floorCount = Math.max(1, Math.ceil(t * floors));

  const columns = useMemo(() => {
    const arr = [];
    const xCount = Math.max(2, Math.round(width / 2) + 1);
    const zCount = Math.max(2, Math.round(depth / 2) + 1);
    for (let ix = 0; ix < xCount; ix++) {
      for (let iz = 0; iz < zCount; iz++) {
        if (ix > 0 && ix < xCount - 1 && iz > 0 && iz < zCount - 1) continue;
        arr.push([
          -width / 2 + (ix / (xCount - 1)) * width,
          -depth / 2 + (iz / (zCount - 1)) * depth,
        ]);
      }
    }
    return arr;
  }, [width, depth]);

  const floorBeams = useMemo(() => {
    const arr = [];
    for (let f = 1; f <= floorCount; f++) {
      arr.push(f * FLOOR_HEIGHT);
    }
    return arr;
  }, [floorCount]);

  const steelMat = { color: "#475569", metalness: 0.6, roughness: 0.4 };

  return (
    <group>
      {/* Foundation slab persists */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.1} roughness={0.9} />
      </mesh>

      {columns.map(([cx, cz], i) => (
        <mesh key={`col-${i}`} position={[cx, currentHeight / 2 + 0.5, cz]} castShadow>
          <boxGeometry args={[0.2, currentHeight, 0.2]} />
          <meshStandardMaterial {...steelMat} />
        </mesh>
      ))}

      {floorBeams.filter(y => y <= currentHeight + 0.5).map((fy) => (
        <group key={`fb-${fy}`}>
          <mesh position={[0, fy + 0.5, -depth / 2]} castShadow>
            <boxGeometry args={[width, 0.12, 0.12]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          <mesh position={[0, fy + 0.5, depth / 2]} castShadow>
            <boxGeometry args={[width, 0.12, 0.12]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          <mesh position={[-width / 2, fy + 0.5, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, depth]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          <mesh position={[width / 2, fy + 0.5, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, depth]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          {/* Floor slab */}
          <mesh position={[0, fy + 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width - 0.1, 0.08, depth - 0.1]} />
            <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── MEP (55-75%) ── */
function MEPPhase({ width, depth, floors }) {
  const fullHeight = floors * FLOOR_HEIGHT;
  const columns = useMemo(() => {
    const arr = [];
    const xCount = Math.max(2, Math.round(width / 2) + 1);
    const zCount = Math.max(2, Math.round(depth / 2) + 1);
    for (let ix = 0; ix < xCount; ix++) {
      for (let iz = 0; iz < zCount; iz++) {
        if (ix > 0 && ix < xCount - 1 && iz > 0 && iz < zCount - 1) continue;
        arr.push([
          -width / 2 + (ix / (xCount - 1)) * width,
          -depth / 2 + (iz / (zCount - 1)) * depth,
        ]);
      }
    }
    return arr;
  }, [width, depth]);

  const steelMat = { color: "#475569", metalness: 0.6, roughness: 0.4 };

  const conduits = useMemo(() => {
    const arr = [];
    const step = Math.max(1, width / 3);
    for (let i = 0; i < 3; i++) {
      arr.push({
        x: -width / 2 + 0.3 + i * step,
        z: -depth / 2 + 0.3,
        color: i % 2 === 0 ? "#f59e0b" : "#b45309",
      });
    }
    return arr;
  }, [width, depth]);

  return (
    <group>
      {/* Foundation slab */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Frame columns */}
      {columns.map(([cx, cz], i) => (
        <mesh key={`col-${i}`} position={[cx, fullHeight / 2 + 0.5, cz]} castShadow>
          <boxGeometry args={[0.2, fullHeight, 0.2]} />
          <meshStandardMaterial {...steelMat} />
        </mesh>
      ))}

      {/* Floor beams + translucent wall panels */}
      {Array.from({ length: floors }, (_, f) => {
        const fy = (f + 1) * FLOOR_HEIGHT + 0.5;
        return (
          <group key={`mep-floor-${f}`}>
            <mesh position={[0, fy, 0]} castShadow receiveShadow>
              <boxGeometry args={[width - 0.1, 0.08, depth - 0.1]} />
              <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.8} />
            </mesh>
            {/* Translucent wall panels on perimeter */}
            <mesh position={[0, fy - FLOOR_HEIGHT / 2, depth / 2]}>
              <boxGeometry args={[width, FLOOR_HEIGHT, 0.08]} />
              <meshStandardMaterial color="#1e3a5f" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, fy - FLOOR_HEIGHT / 2, -depth / 2]}>
              <boxGeometry args={[width, FLOOR_HEIGHT, 0.08]} />
              <meshStandardMaterial color="#1e3a5f" transparent opacity={0.5} />
            </mesh>
            <mesh position={[width / 2, fy - FLOOR_HEIGHT / 2, 0]}>
              <boxGeometry args={[0.08, FLOOR_HEIGHT, depth]} />
              <meshStandardMaterial color="#1e3a5f" transparent opacity={0.5} />
            </mesh>
            <mesh position={[-width / 2, fy - FLOOR_HEIGHT / 2, 0]}>
              <boxGeometry args={[0.08, FLOOR_HEIGHT, depth]} />
              <meshStandardMaterial color="#1e3a5f" transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}

      {/* Conduit / pipe lines */}
      {conduits.map((c, i) => (
        <mesh key={`conduit-${i}`} position={[c.x, fullHeight / 2 + 0.5, c.z]}>
          <cylinderGeometry args={[0.06, 0.06, fullHeight, 6]} />
          <meshStandardMaterial color={c.color} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Finishing (75-90%) ── */
function Finishing({ width, depth, floors }) {
  const fullHeight = floors * FLOOR_HEIGHT;
  const windowBands = useMemo(() => {
    const arr = [];
    for (let f = 0; f < floors; f++) {
      arr.push(f * FLOOR_HEIGHT + 1.5 + 0.5);
    }
    return arr;
  }, [floors]);

  return (
    <group>
      {/* Solid walls — 4 faces */}
      <mesh position={[0, fullHeight / 2 + 0.5, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, fullHeight, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, fullHeight / 2 + 0.5, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, fullHeight, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[width / 2, fullHeight / 2 + 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, fullHeight, depth]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-width / 2, fullHeight / 2 + 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, fullHeight, depth]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Roof slab */}
      <mesh position={[0, fullHeight + 0.5 + 0.15, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.3, depth + 0.2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Window bands */}
      {windowBands.map((wy) => (
        <group key={`wband-${wy}`}>
          <mesh position={[0, wy, depth / 2 + 0.07]}>
            <boxGeometry args={[width - 0.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#0a0e1a" />
          </mesh>
          <mesh position={[0, wy, -(depth / 2 + 0.07)]}>
            <boxGeometry args={[width - 0.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#0a0e1a" />
          </mesh>
          <mesh position={[width / 2 + 0.07, wy, 0]}>
            <boxGeometry args={[0.02, 0.8, depth - 0.3]} />
            <meshStandardMaterial color="#0a0e1a" />
          </mesh>
          <mesh position={[-(width / 2 + 0.07), wy, 0]}>
            <boxGeometry args={[0.02, 0.8, depth - 0.3]} />
            <meshStandardMaterial color="#0a0e1a" />
          </mesh>
        </group>
      ))}

      {/* Floor slabs (interior) */}
      {Array.from({ length: floors }, (_, f) => (
        <mesh key={`fslab-${f}`} position={[0, (f + 1) * FLOOR_HEIGHT + 0.5, 0]}>
          <boxGeometry args={[width - 0.2, 0.08, depth - 0.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
    </group>
  );
}

/* ── Complete (90-100%) ── */
function Complete({ width, depth, floors }) {
  const fullHeight = floors * FLOOR_HEIGHT;
  const beaconRef = useRef();

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }
  });

  const windowBands = useMemo(() => {
    const arr = [];
    for (let f = 0; f < floors; f++) {
      arr.push(f * FLOOR_HEIGHT + 1.5 + 0.5);
    }
    return arr;
  }, [floors]);

  return (
    <group>
      {/* Solid walls */}
      <mesh position={[0, fullHeight / 2 + 0.5, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, fullHeight, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, fullHeight / 2 + 0.5, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, fullHeight, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[width / 2, fullHeight / 2 + 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, fullHeight, depth]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-width / 2, fullHeight / 2 + 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, fullHeight, depth]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Roof slab */}
      <mesh position={[0, fullHeight + 0.5 + 0.15, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.3, depth + 0.2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Emissive window bands */}
      {windowBands.map((wy) => (
        <group key={`gwin-${wy}`}>
          <mesh position={[0, wy, depth / 2 + 0.07]}>
            <boxGeometry args={[width - 0.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#0a0e1a" emissive="#6366F1" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, wy, -(depth / 2 + 0.07)]}>
            <boxGeometry args={[width - 0.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#0a0e1a" emissive="#6366F1" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[width / 2 + 0.07, wy, 0]}>
            <boxGeometry args={[0.02, 0.8, depth - 0.3]} />
            <meshStandardMaterial color="#0a0e1a" emissive="#6366F1" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-(width / 2 + 0.07), wy, 0]}>
            <boxGeometry args={[0.02, 0.8, depth - 0.3]} />
            <meshStandardMaterial color="#0a0e1a" emissive="#6366F1" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Floor slabs */}
      {Array.from({ length: floors }, (_, f) => (
        <mesh key={`fslab-${f}`} position={[0, (f + 1) * FLOOR_HEIGHT + 0.5, 0]}>
          <boxGeometry args={[width - 0.2, 0.08, depth - 0.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}

      {/* Aviation warning light */}
      <mesh ref={beaconRef} position={[0, fullHeight + 1, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* ── Main Building Component ── */
export default function Building({ x, z, width, depth, buildPct, floors = 5 }) {
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const phase = getPhase(buildPct);

  return (
    <group position={[cx, 0, cz]}>
      {phase === "excavation" && <Excavation width={width} depth={depth} />}
      {phase === "foundation" && <Foundation width={width} depth={depth} />}
      {phase === "structure" && <StructuralFrame width={width} depth={depth} buildPct={buildPct} floors={floors} />}
      {phase === "mep" && <MEPPhase width={width} depth={depth} floors={floors} />}
      {phase === "finishing" && <Finishing width={width} depth={depth} floors={floors} />}
      {phase === "complete" && <Complete width={width} depth={depth} floors={floors} />}
    </group>
  );
}
