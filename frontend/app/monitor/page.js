"use client";

import { useState, useEffect } from "react";
import SiteScene3D from "../components/SiteScene3D/SiteScene3D";

export default function Monitor() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", position: "relative" }}>
      <SiteScene3D
        cells={[]}
        simulationState={null}
        activeTrucks={[]}
        day={1}
        projectDuration={90}
        buildPct={0}
        blockedRoadCells={new Set()}
        readOnly={true}
      />
      <div style={{
        position: "absolute", top: 24, left: 24,
        background: "rgba(15,17,23,0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8, padding: "16px 20px",
        fontFamily: "inherit", color: "#e2e8f0",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#4A4E63", letterSpacing: "0.06em", marginBottom: 6 }}>
          CONSTRUCTIQ MONITOR
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Project Status</div>
        <div style={{ fontSize: 12, color: "#8B8FA3", marginTop: 4 }}>Read-only stakeholder view</div>
      </div>
    </div>
  );
}
