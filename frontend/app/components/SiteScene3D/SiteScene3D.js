"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewcube, Grid, Environment } from "@react-three/drei";

import Building from "./Building";
import Crane from "./Crane";
import Workers from "./Workers";
import Materials from "./Materials";
import Road from "./Road";
import Office from "./Office";
import Parking from "./Parking";
import Fence from "./Fence";
import ManLift from "./ManLift";
import Delivery from "./Delivery";
import Boundary from "./Boundary";
import TruckStaging from "./TruckStaging";
import Truck from "./Truck";

const GRID_SIZE = 30;

function simZoneId(type, x, y) {
  return `${type}-${x}-${y}`;
}

function Scene({ cells, simulationState, activeTrucks, buildPct, blockedRoadCells, readOnly }) {
  const simCranes = simulationState?.cranes || [];
  const workersByZone = simulationState?.workers || {};

  const matStatusByZone = useMemo(() => {
    const map = {};
    Object.values(simulationState?.materials || {}).forEach((m) => {
      (map[m.zone_id] ||= []).push(m);
    });
    return map;
  }, [simulationState?.materials]);

  const craneByPos = useMemo(() => {
    const map = {};
    simCranes.forEach((c) => { map[`${c.x}-${c.y}`] = c; });
    return map;
  }, [simCranes]);

  const zones = useMemo(() => {
    const arr = [];
    cells.forEach((cell, i) => {
      if (!cell || !cell.isOrigin) return;
      if (cell.id === "eraser") return;
      const x = i % GRID_SIZE;
      const y = Math.floor(i / GRID_SIZE);
      arr.push({ cell, x, y, index: i });
    });
    return arr;
  }, [cells]);

  const roadCells = useMemo(() => {
    const arr = [];
    cells.forEach((cell, i) => {
      if (!cell || cell.id !== "road") return;
      const x = i % GRID_SIZE;
      const y = Math.floor(i / GRID_SIZE);
      arr.push({ x, y, index: i, blocked: blockedRoadCells.has(i) });
    });
    return arr;
  }, [cells, blockedRoadCells]);

  return (
    <>
      <ambientLight intensity={0.55} color="#4a5578" />
      <hemisphereLight args={["#6366F1", "#1a1a2e", 0.7]} />

      <directionalLight
        position={[20, 40, 20]}
        intensity={1.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={0.1}
        shadow-camera-far={80}
      />
      <directionalLight position={[-20, 25, -15]} intensity={0.4} color="#818cf8" />
      <directionalLight position={[0, 10, -30]} intensity={0.3} color="#8b5cf6" />

      <Environment preset="warehouse" />

      {/* Ground plane */}
      <mesh position={[15, 0, 15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <Grid
        args={[30, 30]}
        position={[15, 0, 15]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1f2937"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#374151"
        infiniteGrid={false}
        fadeDistance={100}
        fadeStrength={1}
      />

      {/* Road cells (rendered individually, not just origins) */}
      {roadCells.map((r) => (
        <Road key={`road-${r.index}`} x={r.x} z={r.y} blocked={r.blocked} />
      ))}

      {/* Origin-based zones */}
      {zones.map(({ cell, x, y, index }) => {
        const w = cell.width || 1;
        const h = cell.height || 1;
        const key = `${cell.id}-${index}`;

        switch (cell.id) {
          case "building":
            return <Building key={key} x={x} z={y} width={w} depth={h} buildPct={buildPct} />;

          case "crane": {
            const craneData = craneByPos[`${x}-${y}`];
            return <Crane key={key} x={x} z={y} width={w} depth={h} craneData={craneData} />;
          }

          case "workers": {
            const wData = workersByZone[simZoneId("workers", x, y)];
            const count = wData?.count || 0;
            return <Workers key={key} x={x} z={y} width={w} depth={h} count={count} />;
          }

          case "materials": {
            const mats = matStatusByZone[simZoneId("materials", x, y)] || [];
            const avgPct = mats.length > 0
              ? mats.reduce((s, m) => s + m.pct_remaining, 0) / mats.length
              : 100;
            return <Materials key={key} x={x} z={y} width={w} depth={h} avgPct={avgPct} />;
          }

          case "road":
            return null;

          case "office":
            return <Office key={key} x={x} z={y} width={w} depth={h} />;

          case "parking":
            return <Parking key={key} x={x} z={y} width={w} depth={h} />;

          case "fence":
            return <Fence key={key} x={x} z={y} />;

          case "manlift":
            return <ManLift key={key} x={x} z={y} />;

          case "delivery":
            return <Delivery key={key} x={x} z={y} width={w} depth={h} />;

          case "boundary":
            return <Boundary key={key} x={x} z={y} />;

          case "truck_staging":
            return <TruckStaging key={key} x={x} z={y} width={w} depth={h} />;

          default:
            return null;
        }
      })}

      {/* Animated trucks */}
      {activeTrucks.map((truck) => (
        <Truck key={truck.id} truck={truck} blockedRoadCells={blockedRoadCells} />
      ))}

      <OrbitControls
        makeDefault
        target={[15, 0, 15]}
        minDistance={15}
        maxDistance={120}
        enablePan={!readOnly}
        autoRotate={readOnly}
        autoRotateSpeed={0.3}
      />

      {!readOnly && (
        <GizmoHelper alignment="top-right" margin={[80, 80]}>
          <GizmoViewcube color="#1A1D2B" strokeColor="#6366F1" textColor="#e2e8f0" />
        </GizmoHelper>
      )}
    </>
  );
}

export default function SiteScene3D({
  cells,
  simulationState,
  activeTrucks,
  day,
  projectDuration,
  buildPct,
  blockedRoadCells,
  readOnly = false,
}) {
  const safeBlockedRoadCells = blockedRoadCells instanceof Set ? blockedRoadCells : new Set();

  return (
    <Canvas
      camera={{ position: [50, 45, 50], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "#0a0e1a" }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene
          cells={cells}
          simulationState={simulationState}
          activeTrucks={activeTrucks || []}
          buildPct={buildPct || 0}
          blockedRoadCells={safeBlockedRoadCells}
          readOnly={readOnly}
        />
      </Suspense>
    </Canvas>
  );
}
