"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  LAYOUT,
  computeHorizontalLayout,
  buildEdges,
  fitToView,
} from "./scenarioTreeLayout";

function severityColor(costImpact) {
  if (costImpact < 50000) return "#22c55e";
  if (costImpact < 200000) return "#eab308";
  return "#ef4444";
}

function triggerTypeColor(type) {
  const map = {
    material_delay: "#eab308",
    equipment_failure: "#ef4444",
    weather: "#06b6d4",
    labor_shortage: "#f97316",
    inspection_fail: "#ef4444",
    recovery_action: "#64748b",
    main: "#6366F1",
  };
  return map[type] || "#64748b";
}

function triggerTypeLabel(type) {
  const map = {
    material_delay: "MATERIAL DELAY",
    equipment_failure: "EQUIPMENT FAILURE",
    weather: "WEATHER",
    labor_shortage: "LABOR SHORTAGE",
    inspection_fail: "INSPECTION FAIL",
    recovery_action: "RECOVERY",
    main: "BASELINE",
  };
  return map[type] || type?.toUpperCase() || "SCENARIO";
}

function makeBezier(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const controlOffset = Math.max(80, dx * 0.5);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
}

function RootCard({ node, pos, isSelected, onMouseDown }) {
  const totalConflicts = node.conflicts?.length || 0;
  return (
    <foreignObject x={pos.x} y={pos.y} width={LAYOUT.ROOT_WIDTH} height={LAYOUT.ROOT_HEIGHT}>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: "100%",
          height: "100%",
          background: "#0F1117",
          border: isSelected
            ? "1.5px solid #6366F1"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected ? "0 0 0 4px rgba(99,102,241,0.12)" : "none",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#6366F1",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#6366F1",
                letterSpacing: "0.08em",
              }}
            >
              BASELINE
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "#4A4E63",
              fontFamily: "monospace",
            }}
          >
            DAY {node.day}
          </span>
        </div>
        <div
          style={{
            padding: "12px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>
            Main Timeline
          </div>
          <div style={{ fontSize: 11, color: "#8B8FA3", lineHeight: 1.4 }}>
            {node.day}-day project · {totalConflicts} conflicts · $
            {Math.round(node.costImpact / 1000)}K exposure
          </div>
        </div>
      </div>
    </foreignObject>
  );
}

function ScenarioCard({ node, pos, isSelected, onMouseDown }) {
  const color = triggerTypeColor(node.triggerType);
  const borderColor = isSelected ? color : "rgba(255,255,255,0.08)";
  return (
    <foreignObject
      x={pos.x}
      y={pos.y}
      width={LAYOUT.SCENARIO_WIDTH}
      height={LAYOUT.SCENARIO_HEIGHT}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          width: "100%",
          height: "100%",
          background: "#0F1117",
          border: isSelected
            ? `1.5px solid ${borderColor}`
            : `1px solid ${borderColor}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected ? `0 0 0 4px ${color}1F` : "none",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color,
                letterSpacing: "0.08em",
              }}
            >
              {triggerTypeLabel(node.triggerType)}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "#4A4E63",
              fontFamily: "monospace",
            }}
          >
            DAY {node.triggerDay}
          </span>
        </div>
        <div
          style={{
            padding: "12px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 0,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>
            {node.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "monospace",
              display: "flex",
              gap: 6,
            }}
          >
            <span>{Math.round(node.probability * 100)}%</span>
            <span style={{ color: "#4A4E63" }}>·</span>
            <span>${Math.round(node.costImpact / 1000)}K</span>
            <span style={{ color: "#4A4E63" }}>·</span>
            <span>+{node.scheduleDelta}d</span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#8B8FA3",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.description}
          </div>
        </div>
      </div>
    </foreignObject>
  );
}

function RecoveryCard({ node, pos, isSelected, onMouseDown }) {
  const sColor = severityColor(node.costImpact);
  const borderColor = isSelected ? sColor : "rgba(255,255,255,0.08)";
  return (
    <foreignObject
      x={pos.x}
      y={pos.y}
      width={LAYOUT.RECOVERY_WIDTH}
      height={LAYOUT.RECOVERY_HEIGHT}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          width: "100%",
          height: "100%",
          background: "#0F1117",
          border: isSelected
            ? `1.5px solid ${borderColor}`
            : `1px solid ${borderColor}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected ? `0 0 0 4px ${sColor}1F` : "none",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#64748b",
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "#64748b",
                letterSpacing: "0.08em",
              }}
            >
              RECOVERY
            </span>
          </div>
          <span
            style={{
              fontSize: 9,
              color: "#4A4E63",
              fontFamily: "monospace",
            }}
          >
            +{node.scheduleDelta}d
          </span>
        </div>
        <div
          style={{
            padding: "10px 12px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
            {node.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "monospace",
            }}
          >
            {Math.round(node.probability * 100)}% · $
            {Math.round(node.costImpact / 1000)}K
          </div>
        </div>
      </div>
    </foreignObject>
  );
}

export default function ScenarioTree({ tree, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [hoveredId, setHoveredId] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const hintTimerRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const positions = useMemo(
    () => computeHorizontalLayout(tree, dims.w, dims.h),
    [tree, dims.w, dims.h]
  );
  const edges = useMemo(() => buildEdges(tree), [tree]);

  useEffect(() => {
    if (Object.keys(positions).length === 0) return;
    if (initialFitDoneRef.current) return;
    const fit = fitToView(positions, dims.w, dims.h);
    setPan(fit.pan);
    setZoom(fit.zoom);
    initialFitDoneRef.current = true;
  }, [positions, dims.w, dims.h]);

  const handleResetView = useCallback(() => {
    const fit = fitToView(positions, dims.w, dims.h);
    setPan(fit.pan);
    setZoom(fit.zoom);
  }, [positions, dims.w, dims.h]);

  const markInteraction = useCallback(() => {
    if (hasInteractedRef.current) return;
    hasInteractedRef.current = true;
    hintTimerRef.current = setTimeout(() => setShowHint(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (nodeId, e) => {
      e.stopPropagation();
      onSelect(selectedId === nodeId ? null : nodeId);
      markInteraction();
    },
    [selectedId, onSelect, markInteraction]
  );

  const handleCardMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePanStart = useCallback(
    (e) => {
      if (e.button !== 0) return;
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...pan },
      };
      setIsPanning(true);
      markInteraction();
    },
    [pan, markInteraction]
  );

  const handlePanMove = useCallback(
    (e) => {
      if (!isPanning || !panStartRef.current) return;
      const { startX, startY, startPan } = panStartRef.current;
      setPan({
        x: startPan.x + (e.clientX - startX),
        y: startPan.y + (e.clientY - startY),
      });
    },
    [isPanning]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  const handleZoom = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.97 : 1.03;
      const newZoom = Math.max(0.4, Math.min(2.5, zoom * delta));
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;
      setPan({
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      });
      setZoom(newZoom);
      markInteraction();
    },
    [zoom, pan, markInteraction]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const opts = { passive: false };
    svg.addEventListener("wheel", handleZoom, opts);
    return () => svg.removeEventListener("wheel", handleZoom, opts);
  }, [handleZoom]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelect]);

  const { nodes, rootId, nodesByParent } = tree;
  const isAnyNodeHovered = hoveredId !== null;
  const anySelected = selectedId !== null;

  const renderOrder = useMemo(() => {
    const order = [];
    order.push(rootId);
    const scenarios = nodesByParent[rootId] || [];
    scenarios.forEach((sid) => order.push(sid));
    scenarios.forEach((sid) => {
      (nodesByParent[sid] || []).forEach((rid) => order.push(rid));
    });
    return order;
  }, [rootId, nodesByParent]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        background: "#090B10",
      }}
    >
      {/* Top-left overlay */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "#4A4E63",
          zIndex: 10,
          pointerEvents: "none",
          textTransform: "uppercase",
        }}
      >
        SCENARIO ANALYSIS · {Object.keys(nodes).length} paths simulated
      </div>

      {/* Top-right overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "#4A4E63",
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleResetView}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 10,
            color: "#8B8FA3",
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "#e2e8f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "#8B8FA3";
          }}
        >
          Reset View
        </button>
      </div>

      {/* Bottom-left hint */}
      {showHint && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 16,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#4A4E63",
            zIndex: 10,
            pointerEvents: "none",
            textTransform: "uppercase",
            opacity: hasInteractedRef.current ? 0 : 1,
            transition: "opacity 1s ease",
          }}
        >
          DRAG TO PAN · SCROLL TO ZOOM
        </div>
      )}

      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{
          display: "block",
          cursor: isPanning ? "grabbing" : "grab",
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Dot grid background */}
          <defs>
            <pattern
              id="dotGrid"
              width={40}
              height={40}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={20} cy={20} r={0.8} fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>
          <rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="url(#dotGrid)"
          />

          {/* Wires */}
          {edges.map(([parentId, childId]) => {
            const parentPos = positions[parentId];
            const childPos = positions[childId];
            if (!parentPos || !childPos) return null;

            const childNode = nodes[childId];
            const wireColor = severityColor(childNode.costImpact);

            const x1 = parentPos.x + parentPos.width;
            const y1 = parentPos.y + parentPos.height / 2;
            const x2 = childPos.x;
            const y2 = childPos.y + childPos.height / 2;

            const isHighlighted =
              hoveredId === parentId ||
              hoveredId === childId ||
              selectedId === parentId ||
              selectedId === childId;

            let strokeOpacity;
            if (isHighlighted) {
              strokeOpacity = 0.9;
            } else if (isAnyNodeHovered || anySelected) {
              strokeOpacity = 0.15;
            } else {
              strokeOpacity = 0.35;
            }

            return (
              <path
                key={`wire-${parentId}-${childId}`}
                d={makeBezier(x1, y1, x2, y2)}
                stroke={wireColor}
                strokeWidth={isHighlighted ? 2 : 1.5}
                strokeOpacity={strokeOpacity}
                fill="none"
                style={{ transition: "stroke-opacity 0.2s, stroke-width 0.15s" }}
              />
            );
          })}

          {/* Connection dots */}
          {renderOrder.map((nodeId) => {
            const node = nodes[nodeId];
            const pos = positions[nodeId];
            if (!pos) return null;

            const dots = [];

            if (node.depth === 0) {
              dots.push(
                <circle
                  key={`dot-out-${nodeId}`}
                  cx={pos.x + pos.width}
                  cy={pos.y + pos.height / 2}
                  r={4}
                  fill="#6366F1"
                  stroke="none"
                />
              );
            }

            if (node.depth === 1) {
              const parentColor = "#6366F1";
              dots.push(
                <circle
                  key={`dot-in-${nodeId}`}
                  cx={pos.x}
                  cy={pos.y + pos.height / 2}
                  r={4}
                  fill={parentColor}
                  stroke="none"
                />
              );
              const hasChildren = (nodesByParent[nodeId] || []).length > 0;
              if (hasChildren) {
                dots.push(
                  <circle
                    key={`dot-out-${nodeId}`}
                    cx={pos.x + pos.width}
                    cy={pos.y + pos.height / 2}
                    r={4}
                    fill={severityColor(node.costImpact)}
                    stroke="none"
                  />
                );
              }
            }

            if (node.depth === 2) {
              const parentNode = nodes[node.parentId];
              const dotColor = parentNode
                ? severityColor(parentNode.costImpact)
                : "#64748b";
              dots.push(
                <circle
                  key={`dot-in-${nodeId}`}
                  cx={pos.x}
                  cy={pos.y + pos.height / 2}
                  r={4}
                  fill={dotColor}
                  stroke="none"
                />
              );
            }

            return dots;
          })}

          {/* Node cards */}
          {renderOrder.map((nodeId, idx) => {
            const node = nodes[nodeId];
            const pos = positions[nodeId];
            if (!pos) return null;

            const isSelected = selectedId === nodeId;
            const cardMouseDown = (e) => handleCardMouseDown(e);
            const cardClick = (e) => handleClick(nodeId, e);

            const wrapProps = {
              onMouseEnter: () => setHoveredId(nodeId),
              onMouseLeave: () => setHoveredId(null),
              onClick: cardClick,
              style: {
                opacity: mounted ? 1 : 0,
                transition: `opacity 0.3s ease ${idx * 40}ms`,
              },
            };

            if (node.depth === 0) {
              return (
                <g key={nodeId} {...wrapProps}>
                  <RootCard
                    node={node}
                    pos={pos}
                    isSelected={isSelected}
                    onMouseDown={cardMouseDown}
                  />
                </g>
              );
            }

            if (node.depth === 1) {
              return (
                <g key={nodeId} {...wrapProps}>
                  <ScenarioCard
                    node={node}
                    pos={pos}
                    isSelected={isSelected}
                    onMouseDown={cardMouseDown}
                  />
                </g>
              );
            }

            return (
              <g key={nodeId} {...wrapProps}>
                <RecoveryCard
                  node={node}
                  pos={pos}
                  isSelected={isSelected}
                  onMouseDown={cardMouseDown}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
