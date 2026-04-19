"use client";

function getNodeColor(node) {
  if (node.depth === 0) return "#6366F1";
  if (node.costImpact < 50000) return "#22c55e";
  if (node.costImpact < 200000) return "#eab308";
  return "#ef4444";
}

function getCostColor(cost) {
  if (cost < 50000) return "#22c55e";
  if (cost < 200000) return "#eab308";
  return "#ef4444";
}

function buildBreadcrumb(nodeId, nodes) {
  const crumbs = [];
  let current = nodeId;
  while (current) {
    crumbs.unshift({ id: current, label: nodes[current].label });
    current = nodes[current].parentId;
  }
  return crumbs;
}

const Divider = () => (
  <div
    style={{
      height: 1,
      background: "rgba(255,255,255,0.06)",
      margin: "14px 0",
    }}
  />
);

export default function ScenarioDetailPanel({
  tree,
  selectedNodeId,
  projectDuration,
  onSelectNode,
  onViewState,
}) {
  if (!selectedNodeId || !tree) {
    return (
      <div style={S.panel}>
        <div style={S.emptyState}>Click any node to explore</div>
      </div>
    );
  }

  const node = tree.nodes[selectedNodeId];
  if (!node) {
    return (
      <div style={S.panel}>
        <div style={S.emptyState}>Node not found</div>
      </div>
    );
  }

  const color = getNodeColor(node);
  const childIds = tree.nodesByParent[selectedNodeId] || [];
  const breadcrumb = buildBreadcrumb(selectedNodeId, tree.nodes);

  const triggerLabel =
    node.triggerType === "main"
      ? "BASELINE"
      : node.triggerType === "recovery_action"
      ? "RECOVERY"
      : node.triggerType.replace(/_/g, " ").toUpperCase();

  return (
    <div style={S.panel}>
      <div style={S.inner}>
        {/* Badge */}
        <div
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 4,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color,
          }}
        >
          {triggerLabel}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#e2e8f0",
            margin: "12px 0 4px",
          }}
        >
          {node.label}
        </h2>

        {/* Day */}
        {node.triggerDay && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "#8B8FA3",
            }}
          >
            DAY {node.triggerDay} OF {projectDuration}
          </div>
        )}

        <Divider />

        {/* Metrics */}
        <div style={S.metricsRow}>
          <div style={S.metric}>
            <span style={S.metricLabel}>PROBABILITY</span>
            <span
              style={{
                ...S.metricValue,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(node.probability * 100)}%
            </span>
          </div>
          <div style={S.metric}>
            <span style={S.metricLabel}>COST IMPACT</span>
            <span
              style={{
                ...S.metricValue,
                color: getCostColor(node.costImpact),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${Math.round(node.costImpact / 1000)}K
            </span>
          </div>
          <div style={S.metric}>
            <span style={S.metricLabel}>SCHEDULE</span>
            <span
              style={{
                ...S.metricValue,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {node.scheduleDelta > 0
                ? `+${node.scheduleDelta}d`
                : "0d"}
            </span>
          </div>
        </div>

        <Divider />

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: "#b0b4c3",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {node.description}
        </p>

        <Divider />

        {/* Action buttons */}
        <button
          onClick={() => onViewState(selectedNodeId, "snapshot")}
          style={S.primaryBtn}
        >
          View 3D State &rarr;
        </button>
        {node.trajectory && node.trajectory.length > 0 && (
          <button
            onClick={() => onViewState(selectedNodeId, "playback")}
            style={S.secondaryBtn}
          >
            Play from Here
          </button>
        )}

        {/* Recovery paths (depth-1 only) */}
        {node.depth === 1 && childIds.length > 0 && (
          <>
            <Divider />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#4A4E63",
                marginBottom: 8,
              }}
            >
              RECOVERY PATHS
            </div>
            {childIds.map((cid) => {
              const child = tree.nodes[cid];
              if (!child) return null;
              return (
                <div
                  key={cid}
                  onClick={() => onSelectNode(cid)}
                  style={S.recoveryRow}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#e2e8f0",
                      fontWeight: 500,
                    }}
                  >
                    {child.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "#8B8FA3",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.round(child.probability * 100)}%
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Breadcrumb */}
      <div style={S.breadcrumb}>
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.id}>
            {i > 0 && (
              <span style={{ color: "#4A4E63", margin: "0 4px" }}>
                &rarr;
              </span>
            )}
            <span
              onClick={() => onSelectNode(crumb.id)}
              style={{
                cursor: "pointer",
                color:
                  crumb.id === selectedNodeId ? "#e2e8f0" : "#8B8FA3",
                fontWeight: crumb.id === selectedNodeId ? 600 : 400,
              }}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const S = {
  panel: {
    width: 380,
    minWidth: 380,
    height: "100%",
    background: "#0F1117",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "transform 0.25s ease-out",
  },
  inner: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 20px 12px",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#4A4E63",
  },
  metricsRow: {
    display: "flex",
    gap: 0,
  },
  metric: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "#4A4E63",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e2e8f0",
    fontFamily: "monospace",
  },
  primaryBtn: {
    width: "100%",
    height: 42,
    background: "#6366F1",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginBottom: 8,
  },
  secondaryBtn: {
    width: "100%",
    height: 36,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  recoveryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  breadcrumb: {
    padding: "10px 20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 11,
    color: "#8B8FA3",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
