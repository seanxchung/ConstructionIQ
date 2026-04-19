"use client";

import ScenarioTree from "./ScenarioTree";
import ScenarioDetailPanel from "./ScenarioDetailPanel";

function TreeIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity: 0.5 }}
    >
      <circle cx="24" cy="8" r="4" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="10" cy="26" r="4" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="24" cy="26" r="4" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="38" cy="26" r="4" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="6" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="14" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="20" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="28" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="34" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <circle cx="42" cy="42" r="3" stroke="#4A4E63" strokeWidth="1.5" />
      <line x1="24" y1="12" x2="10" y2="22" stroke="#4A4E63" strokeWidth="1" />
      <line x1="24" y1="12" x2="24" y2="22" stroke="#4A4E63" strokeWidth="1" />
      <line x1="24" y1="12" x2="38" y2="22" stroke="#4A4E63" strokeWidth="1" />
      <line x1="10" y1="30" x2="6" y2="39" stroke="#4A4E63" strokeWidth="1" />
      <line x1="10" y1="30" x2="14" y2="39" stroke="#4A4E63" strokeWidth="1" />
      <line x1="24" y1="30" x2="20" y2="39" stroke="#4A4E63" strokeWidth="1" />
      <line x1="24" y1="30" x2="28" y2="39" stroke="#4A4E63" strokeWidth="1" />
      <line x1="38" y1="30" x2="34" y2="39" stroke="#4A4E63" strokeWidth="1" />
      <line x1="38" y1="30" x2="42" y2="39" stroke="#4A4E63" strokeWidth="1" />
    </svg>
  );
}

function EmptyState({ headline, subtext, buttonLabel, onButton }) {
  return (
    <div style={S.emptyRoot}>
      <TreeIcon />
      <div style={S.emptyHeadline}>{headline}</div>
      <div style={S.emptySubtext}>{subtext}</div>
      {buttonLabel && (
        <button onClick={onButton} style={S.emptyBtn}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

function SkeletonTree() {
  const circles = [
    { cx: 400, cy: 80, r: 28, delay: 0 },
    { cx: 200, cy: 220, r: 22, delay: 0.15 },
    { cx: 400, cy: 220, r: 22, delay: 0.3 },
    { cx: 600, cy: 220, r: 22, delay: 0.45 },
    { cx: 150, cy: 360, r: 16, delay: 0.6 },
    { cx: 250, cy: 360, r: 16, delay: 0.7 },
    { cx: 350, cy: 360, r: 16, delay: 0.8 },
    { cx: 450, cy: 360, r: 16, delay: 0.9 },
    { cx: 550, cy: 360, r: 16, delay: 1.0 },
    { cx: 650, cy: 360, r: 16, delay: 1.1 },
  ];
  return (
    <svg width="800" height="440" style={{ opacity: 0.4 }}>
      <defs>
        <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.02)">
            <animate
              attributeName="offset"
              values="-0.5;1.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)">
            <animate
              attributeName="offset"
              values="0;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)">
            <animate
              attributeName="offset"
              values="0.5;2.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>
      <line x1="400" y1="108" x2="200" y2="198" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="400" y1="108" x2="400" y2="198" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="400" y1="108" x2="600" y2="198" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="200" y1="242" x2="150" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="200" y1="242" x2="250" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="400" y1="242" x2="350" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="400" y1="242" x2="450" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="600" y1="242" x2="550" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="600" y1="242" x2="650" y2="344" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {circles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="url(#shimmer)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function ScenariosView({
  scenarioTree,
  projectDuration,
  simulationComplete,
  isGenerating,
  progress,
  selectedNodeId,
  onSelectNode,
  onGenerate,
  onRegenerate,
  onViewState,
  onGotoSitePlan,
}) {
  const nodeCount = scenarioTree
    ? Object.keys(scenarioTree.nodes).length
    : 0;

  // State A: no sim complete
  if (!simulationComplete && !scenarioTree) {
    return (
      <EmptyState
        headline="Scenarios appear after simulation"
        subtext="Run the main timeline to project end, then explore how it could have gone differently."
        buttonLabel="Go to Site Plan &rarr;"
        onButton={onGotoSitePlan}
      />
    );
  }

  // State C: generating
  if (isGenerating) {
    const pct =
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;
    return (
      <div style={S.emptyRoot}>
        <SkeletonTree />
        <div
          style={{
            fontSize: 13,
            color: "#e2e8f0",
            marginTop: 20,
            fontWeight: 500,
          }}
        >
          Running scenario {progress.current} of {progress.total}...
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#8B8FA3",
            marginTop: 4,
          }}
        >
          {progress.label}
        </div>
        <div
          style={{
            width: 320,
            height: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 2,
            marginTop: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#6366F1",
              borderRadius: 2,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  }

  // State B: sim complete but no tree
  if (!scenarioTree) {
    return (
      <EmptyState
        headline="Ready to analyze scenarios"
        subtext="Generate a decision tree showing how the project could fail — and how to recover. Takes about 5 seconds."
        buttonLabel="Generate Scenarios &rarr;"
        onButton={onGenerate}
      />
    );
  }

  // State D: tree generated
  return (
    <div style={S.treeRoot}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <span style={S.toolbarLabel}>
          SCENARIO ANALYSIS &middot; {nodeCount} paths simulated
        </span>
        <button onClick={onRegenerate} style={S.regenBtn}>
          Regenerate
        </button>
      </div>

      {/* Split view */}
      <div style={S.splitView}>
        <div style={{ flex: 1, minWidth: 0, height: "100%" }}>
          <ScenarioTree
            tree={scenarioTree}
            selectedId={selectedNodeId}
            onSelect={onSelectNode}
          />
        </div>
        {selectedNodeId && (
          <ScenarioDetailPanel
            tree={scenarioTree}
            selectedNodeId={selectedNodeId}
            projectDuration={projectDuration}
            onSelectNode={onSelectNode}
            onViewState={onViewState}
          />
        )}
      </div>
    </div>
  );
}

const S = {
  emptyRoot: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 40,
  },
  emptyHeadline: {
    fontSize: 16,
    fontWeight: 600,
    color: "#e2e8f0",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#8B8FA3",
    maxWidth: 400,
    textAlign: "center",
    lineHeight: 1.5,
  },
  emptyBtn: {
    marginTop: 12,
    padding: "10px 24px",
    background: "#6366F1",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  treeRoot: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  toolbarLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "#8B8FA3",
  },
  regenBtn: {
    background: "none",
    border: "none",
    fontSize: 11,
    color: "#6366F1",
    cursor: "pointer",
    fontWeight: 500,
    padding: "4px 8px",
    borderRadius: 4,
    transition: "background 0.15s",
  },
  splitView: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
};
