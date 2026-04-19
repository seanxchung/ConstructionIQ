"use client";

import { useState } from "react";
import { supabase } from "../../auth";

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (activeTab === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccessMsg("Account created! Check your email to confirm, then log in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = activeTab === "login";

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: "flex", margin: "0 0 24px", borderRadius: 8,
        background: "#1A1D2B", border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {["login", "signup"].map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            style={{
              flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600,
              color: activeTab === tab ? "#e2e8f0" : "#8B8FA3",
              background: activeTab === tab ? "#6366F1" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {tab === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#8B8FA3" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%", height: 42, padding: "0 14px", borderRadius: 8,
              background: "#1A1D2B", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0",
              fontSize: 13, outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s, box-shadow 0.15s",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#8B8FA3" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? "Enter your password" : "Min 6 characters"}
            required
            minLength={isLogin ? undefined : 6}
            style={{
              width: "100%", height: 42, padding: "0 14px", borderRadius: 8,
              background: "#1A1D2B", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0",
              fontSize: 13, outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s, box-shadow 0.15s",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", height: 44, borderRadius: 8, border: "none",
            background: loading ? "rgba(255,255,255,0.04)" : "#6366F1",
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.6 : 1, transition: "all 0.15s",
            marginTop: 4,
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: "inline-block", width: 14, height: 14,
                border: "2px solid #ffffff40", borderTopColor: "#fff",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              {isLogin ? "Signing in..." : "Creating account..."}
            </>
          ) : (
            isLogin ? "Login" : "Sign Up"
          )}
        </button>

        {error && (
          <p style={{
            fontSize: 13, color: "#ef4444", margin: 0,
            textAlign: "center", lineHeight: 1.4,
          }}>
            {error}
          </p>
        )}

        {successMsg && (
          <p style={{
            fontSize: 13, color: "#4ade80", margin: 0,
            textAlign: "center", lineHeight: 1.4,
          }}>
            {successMsg}
          </p>
        )}
      </form>
    </div>
  );
}
