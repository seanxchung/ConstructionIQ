"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import SiteScene3D from "../SiteScene3D/SiteScene3D";
import AuthForm from "./AuthForm";

const GRID = 30;

const ZONE_DEFS = {
  crane:         { id: "crane",         label: "Crane",          code: "CR", color: "#eab308", bg: "#eab30815" },
  workers:       { id: "workers",       label: "Workers",        code: "WK", color: "#3b82f6", bg: "#3b82f615" },
  materials:     { id: "materials",     label: "Materials",      code: "MT", color: "#f97316", bg: "#f9731615" },
  building:      { id: "building",      label: "Building",       code: "BD", color: "#22c55e", bg: "#22c55e15" },
  office:        { id: "office",        label: "Site Office",    code: "OF", color: "#8b5cf6", bg: "#8b5cf615" },
  parking:       { id: "parking",       label: "Parking",        code: "PK", color: "#64748b", bg: "#64748b15" },
  fence:         { id: "fence",         label: "Fence/Boundary", code: "FC", color: "#f59e0b", bg: "#f59e0b15" },
  manlift:       { id: "manlift",       label: "Man Lift",       code: "ML", color: "#06b6d4", bg: "#06b6d415" },
  delivery:      { id: "delivery",      label: "Delivery Zone",  code: "DZ", color: "#84cc16", bg: "#84cc1615" },
  truck_staging: { id: "truck_staging", label: "Truck Staging",  code: "TS", color: "#84cc16", bg: "#84cc1615" },
};

function placeOrigin(cells, zone, x, y, w, h, extra) {
  const idx = y * GRID + x;
  const origin = { ...zone, width: w, height: h, isOrigin: true, ...extra };
  cells[idx] = origin;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ti = (y + dy) * GRID + (x + dx);
      if (ti !== idx) cells[ti] = { ref: idx, id: zone.id };
    }
  }
}

function buildLandingCells() {
  const cells = Array(GRID * GRID).fill(null);

  placeOrigin(cells, ZONE_DEFS.building, 12, 12, 6, 6, { floors: 8, buildingType: "office" });
  placeOrigin(cells, ZONE_DEFS.crane, 10, 10, 2, 2);
  placeOrigin(cells, ZONE_DEFS.crane, 18, 10, 2, 2);
  placeOrigin(cells, ZONE_DEFS.office, 4, 4, 4, 2);
  placeOrigin(cells, ZONE_DEFS.parking, 22, 20, 4, 3);
  placeOrigin(cells, ZONE_DEFS.materials, 6, 18, 3, 2);
  placeOrigin(cells, ZONE_DEFS.materials, 22, 6, 3, 2);
  placeOrigin(cells, ZONE_DEFS.workers, 15, 20, 2, 2);
  placeOrigin(cells, ZONE_DEFS.workers, 8, 8, 2, 2);
  placeOrigin(cells, ZONE_DEFS.manlift, 20, 16, 1, 1);
  placeOrigin(cells, ZONE_DEFS.delivery, 3, 22, 3, 2);
  placeOrigin(cells, ZONE_DEFS.truck_staging, 26, 24, 3, 2);

  const fenceZone = ZONE_DEFS.fence;
  for (let i = 2; i <= 28; i++) {
    if (!cells[2 * GRID + i])  cells[2 * GRID + i]  = { ...fenceZone, width: 1, height: 1, isOrigin: true };
    if (!cells[28 * GRID + i]) cells[28 * GRID + i] = { ...fenceZone, width: 1, height: 1, isOrigin: true };
    if (!cells[i * GRID + 2])  cells[i * GRID + 2]  = { ...fenceZone, width: 1, height: 1, isOrigin: true };
    if (!cells[i * GRID + 28]) cells[i * GRID + 28] = { ...fenceZone, width: 1, height: 1, isOrigin: true };
  }

  return cells;
}

const EMPTY_SIM = {};
const EMPTY_SET = new Set();

export default function Landing() {
  const demoCells = useMemo(() => buildLandingCells(), []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      background: "#0A0B10",
    }}>
      {/* Layer 1: 3D scene background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
      }}>
        <Suspense fallback={null}>
          <SiteScene3D
            cells={demoCells}
            simulationState={EMPTY_SIM}
            activeTrucks={[]}
            buildPct={40}
            buildStatus={null}
            buildBlockers={[]}
            blockedRoadCells={EMPTY_SET}
            readOnly
            landingMode
          />
        </Suspense>
      </div>

      {/* Layer 2: dark overlay + vignette */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "radial-gradient(ellipse at center, rgba(10,11,16,0.35) 0%, rgba(10,11,16,0.85) 100%)",
        pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(10, 11, 16, 0.55)",
        }} />
      </div>

      {/* Layer 3: foreground content */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        pointerEvents: "none",
      }}>
        {/* Top-left nav wordmark */}
        <div style={{
          position: "absolute", top: 20, left: 24,
          display: "flex", alignItems: "center", gap: 10,
          pointerEvents: "auto",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "#6366F1",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>
            C
          </div>
          <span style={{
            fontSize: 16, fontWeight: 600, color: "#ffffff",
            letterSpacing: "-0.02em",
          }}>
            ConstructIQ
          </span>
        </div>

        {/* Centered content */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 24px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          pointerEvents: visible ? "auto" : "none",
        }}>
          {/* Wordmark */}
          <h1 style={{
            fontSize: 56, fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#ffffff", lineHeight: 1,
            margin: 0, textAlign: "center",
          }}>
            ConstructIQ
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: 16, fontWeight: 400,
            color: "#8B8FA3", maxWidth: 480,
            textAlign: "center", lineHeight: 1.5,
            margin: "12px 0 0",
          }}>
            Pre-construction simulation for projects that can&apos;t afford surprises.
          </p>

          {/* Login card */}
          <div style={{
            marginTop: 48, width: 400, maxWidth: "90vw",
            background: "#0F1117",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            padding: 32,
          }}>
            <AuthForm />
          </div>
        </div>
      </div>

      {/* Spin keyframes for loading spinner in AuthForm */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          h1 { font-size: 40px !important; }
        }
      `}</style>
    </div>
  );
}
