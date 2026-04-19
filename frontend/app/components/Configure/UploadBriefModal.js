"use client";

import { useState, useRef, useCallback } from "react";

const API_BASE = "http://localhost:8000";

export default function UploadBriefModal({ isOpen, currentConfig, onApply, onClose }) {
  const [state, setState] = useState("idle");
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedConfig, setParsedConfig] = useState(null);
  const [parseWarnings, setParseWarnings] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setState("idle");
    setSelectedFile(null);
    setErrorMsg("");
    setParsedConfig(null);
    setParseWarnings([]);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setState("error");
      setErrorMsg("Please select a PDF file.");
      return;
    }
    setSelectedFile(file);
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
      const res = await fetch(`${API_BASE}/api/config/parse-pdf`, {
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
      setParseWarnings(data.warnings || []);
      setState("success");
    } catch {
      setState("error");
      setErrorMsg("Network error. Is the backend running?");
    }
  };

  const handleApply = () => {
    const hasData =
      currentConfig?.phases?.length > 0 &&
      (currentConfig.cranes.length +
        currentConfig.deliveries.length +
        currentConfig.milestones.length +
        currentConfig.equipment.length) > 0;

    if (hasData && state !== "confirm_overwrite") {
      setState("confirm_overwrite");
      return;
    }
    onApply(parsedConfig);
    onClose();
  };

  if (!isOpen) return null;

  const configSummary = parsedConfig
    ? [
        parsedConfig.phases?.length && `${parsedConfig.phases.length} phases`,
        parsedConfig.cranes?.length && `${parsedConfig.cranes.length} cranes`,
        parsedConfig.deliveries?.length && `${parsedConfig.deliveries.length} deliveries`,
        Object.keys(parsedConfig.workforce || {}).length &&
          `${Object.keys(parsedConfig.workforce || {}).length} workforce entries`,
        parsedConfig.milestones?.length && `${parsedConfig.milestones.length} milestones`,
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
          width: 500,
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
              Upload Project Brief
            </div>
            <div style={{ fontSize: 12, color: "#8B8FA3", marginTop: 4, lineHeight: 1.4 }}>
              Upload a filled ConstructIQ project brief PDF to auto-configure your project.
            </div>
          </div>
          <button
            onClick={onClose}
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
          {/* ── Idle / file-select state ── */}
          {(state === "idle" || (state === "error" && !selectedFile)) && (
            <>
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  height: 160,
                  border: `2px dashed ${dragOver ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8,
                  background: dragOver
                    ? "rgba(99,102,241,0.06)"
                    : "rgba(255,255,255,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                  gap: 8,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={dragOver ? "#818cf8" : "#4A4E63"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {selectedFile ? (
                  <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
                    {selectedFile.name}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Drop PDF here or click to browse
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {/* Template download link */}
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {"Don't have a template? "}
                </span>
                <a
                  href="/constructiq_project_brief_template.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#818cf8", textDecoration: "underline" }}
                >
                  Download Project Brief Template
                </a>
              </div>

              {/* Upload button */}
              {selectedFile && (
                <button
                  onClick={handleUpload}
                  style={{
                    width: "100%",
                    height: 40,
                    marginTop: 16,
                    borderRadius: 8,
                    border: "none",
                    background: "#6366F1",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Upload &amp; Parse
                </button>
              )}
            </>
          )}

          {/* ── Uploading state ── */}
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
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(99,102,241,0.2)",
                  borderTop: "3px solid #6366F1",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 13, color: "#8B8FA3" }}>Parsing your brief...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Error state ── */}
          {state === "error" && (
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
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                  marginTop: 8,
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#8B8FA3",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "0 20px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Success state ── */}
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
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                Brief parsed successfully
              </span>
              {configSummary && (
                <span style={{ fontSize: 12, color: "#8B8FA3", textAlign: "center" }}>
                  {configSummary}
                </span>
              )}
              {parseWarnings.length > 0 && (
                <div style={{ fontSize: 11, color: "#f59e0b", textAlign: "center", marginTop: 4 }}>
                  {parseWarnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
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
                Apply Configuration
              </button>
            </div>
          )}

          {/* ── Confirm overwrite state ── */}
          {state === "confirm_overwrite" && (
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
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(245,158,11,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span style={{ fontSize: 13, color: "#e2e8f0", textAlign: "center", lineHeight: 1.5 }}>
                This will replace your current configuration. Continue?
              </span>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setState("success")}
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "#8B8FA3",
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "0 20px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onApply(parsedConfig);
                    onClose();
                  }}
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: "none",
                    background: "#6366F1",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "0 20px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Replace Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
