"use client";

import { useState, useRef, useCallback } from "react";

const API_BASE = "http://localhost:8000";

export default function UploadSketchModal({ isOpen, onApply, onClose }) {
  const [state, setState] = useState("idle");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedConfig, setParsedConfig] = useState(null);
  const [zoneCount, setZoneCount] = useState(0);
  const [parseWarnings, setParseWarnings] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setState("idle");
    setSelectedFile(null);
    setPreview(null);
    setErrorMsg("");
    setParsedConfig(null);
    setZoneCount(0);
    setParseWarnings([]);
  };

  const handleFile = (file) => {
    if (!file) return;
    const valid = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!valid.includes(file.type)) {
      setState("error");
      setErrorMsg("Please select an image file (JPG, PNG, GIF, or WebP).");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setState("idle");
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setState("uploading");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/config/parse-sketch`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        setState("error");
        setErrorMsg(data.error || "Parsing failed");
        return;
      }
      setParsedConfig(data.config);
      setZoneCount(data.zone_count || 0);
      setParseWarnings(data.warnings || []);
      setState("success");
    } catch {
      setState("error");
      setErrorMsg("Network error. Is the backend running?");
    }
  };

  const handleApply = () => {
    onApply(parsedConfig);
    onClose();
    reset();
  };

  if (!isOpen) return null;

  const summary = parsedConfig
    ? [
        parsedConfig.buildings?.length && `${parsedConfig.buildings.length} building(s)`,
        parsedConfig.cranes?.length && `${parsedConfig.cranes.length} crane(s)`,
        parsedConfig.workerZones?.length && `${parsedConfig.workerZones.length} worker zone(s)`,
        parsedConfig.materialZones?.length && `${parsedConfig.materialZones.length} material zone(s)`,
        parsedConfig.roads?.length && `${parsedConfig.roads.length} road cell(s)`,
        parsedConfig.offices?.length && `${parsedConfig.offices.length} office(s)`,
        parsedConfig.parking?.length && `${parsedConfig.parking.length} parking zone(s)`,
        parsedConfig.truckStaging?.length && `${parsedConfig.truckStaging.length} truck staging`,
        parsedConfig.fences?.length && `${parsedConfig.fences.length} fence cell(s)`,
        parsedConfig.boundaries?.length && `${parsedConfig.boundaries.length} boundary cell(s)`,
      ].filter(Boolean).join(", ")
    : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          background: "#0F1117",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>
              Upload Site Sketch
            </div>
            <div style={{ fontSize: 12, color: "#8B8FA3", marginTop: 4, lineHeight: 1.4 }}>
              Take a photo of your hand-drawn 30×30 grid and AI will place the zones on the site plan.
            </div>
          </div>
          <button
            onClick={() => { onClose(); reset(); }}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 18,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            {"\u2715"}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Idle / file-select */}
          {(state === "idle" || (state === "error" && !selectedFile)) && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  height: preview ? "auto" : 160,
                  border: `2px dashed ${dragOver ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8,
                  background: dragOver
                    ? "rgba(245,158,11,0.06)"
                    : "rgba(255,255,255,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                  gap: 8,
                  padding: preview ? 8 : 0,
                  overflow: "hidden",
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Grid sketch preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 280,
                      borderRadius: 6,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <>
                    <svg
                      width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke={dragOver ? "#f59e0b" : "#4A4E63"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      Drop grid photo here or click to browse
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                  Print the 30×30 grid template, draw your site layout with a highlighter, label each zone, then snap a photo.
                </span>
                <div style={{ marginTop: 8 }}>
                  <a
                    href="/30x30-grid-template.pdf"
                    download="30x30-grid-template.pdf"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 11,
                      color: "#f59e0b",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(245,158,11,0.2)",
                      background: "rgba(245,158,11,0.05)",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(245,158,11,0.1)";
                      e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(245,158,11,0.05)";
                      e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Don&#39;t have a grid? Download printable template
                  </a>
                </div>
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  style={{
                    width: "100%",
                    height: 40,
                    marginTop: 16,
                    borderRadius: 8,
                    border: "none",
                    background: "#f59e0b",
                    color: "#000",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Analyze Sketch
                </button>
              )}
            </>
          )}

          {/* Uploading */}
          {state === "uploading" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
                gap: 16,
              }}
            >
              {preview && (
                <img
                  src={preview}
                  alt="Analyzing..."
                  style={{ maxWidth: 200, maxHeight: 140, borderRadius: 6, objectFit: "contain", opacity: 0.5 }}
                />
              )}
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(245,158,11,0.2)",
                  borderTop: "3px solid #f59e0b",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 13, color: "#8B8FA3" }}>
                AI is reading your sketch...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {state === "error" && selectedFile && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "32px 0",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span style={{ fontSize: 13, color: "#ef4444", textAlign: "center", maxWidth: 360 }}>
                {errorMsg}
              </span>
              <button
                onClick={reset}
                style={{
                  marginTop: 8, height: 36, borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent", color: "#8B8FA3",
                  fontSize: 12, fontWeight: 500, padding: "0 20px",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px 0",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                Sketch analyzed — {zoneCount} zones detected
              </span>
              {summary && (
                <span style={{ fontSize: 12, color: "#8B8FA3", textAlign: "center", lineHeight: 1.5 }}>
                  {summary}
                </span>
              )}
              {parseWarnings.length > 0 && (
                <div style={{ fontSize: 11, color: "#f59e0b", textAlign: "center", marginTop: 4 }}>
                  {parseWarnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}
              {preview && (
                <img
                  src={preview}
                  alt="Your sketch"
                  style={{ maxWidth: 200, maxHeight: 120, borderRadius: 6, objectFit: "contain", opacity: 0.6, marginTop: 4 }}
                />
              )}
              <button
                onClick={handleApply}
                style={{
                  width: "100%",
                  height: 40,
                  marginTop: 8,
                  borderRadius: 8,
                  border: "none",
                  background: "#22c55e",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Place Zones on Site Plan
              </button>
              <button
                onClick={reset}
                style={{
                  width: "100%",
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#8B8FA3",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Upload Different Sketch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
