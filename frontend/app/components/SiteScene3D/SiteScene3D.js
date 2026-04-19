"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewcube, Grid, Environment, Html } from "@react-three/drei";

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

function LandingCameraRig() {
  const ORBIT_PERIOD = 60;
  const RADIUS = 55;
  const ELEVATION = 28;

  useFrame(({ camera, clock }) => {
    const angle = (clock.elapsedTime / ORBIT_PERIOD) * Math.PI * 2;
    camera.position.x = 15 + Math.cos(angle) * RADIUS;
    camera.position.z = 15 + Math.sin(angle) * RADIUS;
    camera.position.y = ELEVATION;
    camera.lookAt(15, 0, 15);
  });

  return null;
}

function Scene({ cells, simulationState, activeTrucks, buildPct, buildStatus, buildBlockers, blockedRoadCells, readOnly, landingMode, suppressUI }) {
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

  const fenceNeighborMap = useMemo(() => {
    const isFenceType = (idx) => {
      const c = cells[idx];
      return c && (c.id === "fence" || c.id === "boundary");
    };
    const map = {};
    cells.forEach((cell, i) => {
      if (!cell || (cell.id !== "fence" && cell.id !== "boundary")) return;
      const cx = i % GRID_SIZE;
      const cy = Math.floor(i / GRID_SIZE);
      map[i] = {
        right: cx + 1 < GRID_SIZE && isFenceType(cy * GRID_SIZE + cx + 1),
        left:  cx - 1 >= 0 && isFenceType(cy * GRID_SIZE + cx - 1),
        down:  cy + 1 < GRID_SIZE && isFenceType((cy + 1) * GRID_SIZE + cx),
        up:    cy - 1 >= 0 && isFenceType((cy - 1) * GRID_SIZE + cx),
      };
    });
    return map;
  }, [cells]);

  const buildingAnchor = useMemo(() => {
    const b = zones.find((z) => z.cell.id === "building");
    if (!b) return null;
    const w = b.cell.width || 6;
    const h = b.cell.height || 6;
    const floors = b.cell.floors ?? 5;
    const fullHeight = floors * 2;

    const clearance = 2.5;
    let roofline;
    if (buildPct <= 15) roofline = 0.3;
    else if (buildPct <= 30) roofline = 0.5;
    else if (buildPct <= 55) {
      const t = (buildPct - 30) / 25;
      const currentHeight = Math.max(2, t * fullHeight);
      roofline = currentHeight + 0.5;
    }
    else if (buildPct <= 75) roofline = fullHeight + 0.5;
    else if (buildPct <= 90) roofline = fullHeight + 0.8;
    else roofline = fullHeight + 1;

    return {
      x: b.x + w / 2,
      z: b.y + h / 2,
      y: roofline + clearance,
    };
  }, [zones, buildPct]);

  const statusStyles = {
    stalled:  { color: "#ef4444", border: "rgba(239,68,68,0.35)",  bg: "rgba(239,68,68,0.08)",  label: "STALLED" },
    delayed:  { color: "#eab308", border: "rgba(234,179,8,0.35)",  bg: "rgba(234,179,8,0.08)",  label: "DELAYED" },
    on_track: { color: "#22c55e", border: "rgba(34,197,94,0.3)",   bg: "rgba(34,197,94,0.06)",  label: "ON TRACK" },
  };
  const badge = buildStatus && statusStyles[buildStatus] ? statusStyles[buildStatus] : null;
  const primaryBlocker = Array.isArray(buildBlockers) && buildBlockers.length > 0 ? buildBlockers[0] : null;

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
            return <Building key={key} x={x} z={y} width={w} depth={h} buildPct={buildPct} floors={cell.floors ?? 5} />;

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
            return <Fence key={key} x={x} z={y} neighbors={fenceNeighborMap[index]} />;

          case "manlift":
            return <ManLift key={key} x={x} z={y} />;

          case "delivery":
            return <Delivery key={key} x={x} z={y} width={w} depth={h} />;

          case "boundary":
            return <Boundary key={key} x={x} z={y} neighbors={fenceNeighborMap[index]} />;

          case "truck_staging":
            return <TruckStaging key={key} x={x} z={y} width={w} depth={h} />;

          default:
            return null;
        }
      })}
       {/* Build status badge — floats above the building */}
       {!landingMode && !suppressUI && buildingAnchor && badge && (
        <Html
          position={[buildingAnchor.x, buildingAnchor.y, buildingAnchor.z]}
          center
          distanceFactor={50}
          occlude={false}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            background: "rgba(15,17,23,0.85)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${badge.border}`,
            borderRadius: 6,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: badge.color,
                opacity: 0.9,
              }} />
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: badge.color,
              }}>
                {badge.label}
              </span>
            </div>
            {primaryBlocker && buildStatus !== "on_track" && (
              <span style={{
                fontSize: 9,
                fontWeight: 500,
                color: "#8B8FA3",
                letterSpacing: "0.01em",
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {primaryBlocker}
              </span>
            )}
          </div>
        </Html>
      )}

      {/* Animated trucks */}
      {activeTrucks.map((truck) => (
        <Truck key={truck.id} truck={truck} blockedRoadCells={blockedRoadCells} />
      ))}

      {landingMode ? (
        <LandingCameraRig />
      ) : (
        <>
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
  buildStatus,
  buildBlockers,
  blockedRoadCells,
  readOnly = false,
  landingMode = false,
  stateOverride,
  buildPctOverride,
  buildStatusOverride,
  buildBlockersOverride,
  suppressUI = false,
}) {
  const safeBlockedRoadCells = blockedRoadCells instanceof Set ? blockedRoadCells : new Set();

  const effectiveState = stateOverride || simulationState;
  const effectiveBuildPct = buildPctOverride != null ? buildPctOverride : buildPct;
  const effectiveBuildStatus = buildStatusOverride != null ? buildStatusOverride : buildStatus;
  const effectiveBuildBlockers = buildBlockersOverride != null ? buildBlockersOverride : buildBlockers;
  const effectiveSuppressUI = suppressUI || landingMode;

  return (
    <Canvas
      camera={{
        position: landingMode ? [70, 28, 70] : [50, 45, 50],
        fov: 50,
      }}
      style={{
        width: "100%", height: "100%", background: "#0a0e1a",
        pointerEvents: landingMode ? "none" : "auto",
      }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene
          cells={cells}
          simulationState={effectiveState}
          activeTrucks={activeTrucks || []}
          buildPct={effectiveBuildPct || 0}
          buildStatus={effectiveBuildStatus}
          buildBlockers={effectiveBuildBlockers}
          blockedRoadCells={safeBlockedRoadCells}
          readOnly={readOnly}
          landingMode={landingMode}
          suppressUI={effectiveSuppressUI}
        />
      </Suspense>
    </Canvas>
  );
}
