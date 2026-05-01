import React, { useState } from "react";
import { SHOP_NAME } from "../utils/helpers";

const CREDENTIALS = { username: "admin", password: "bakrid2024" };

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (username.trim() === CREDENTIALS.username && password === CREDENTIALS.password) {
        onLogin();
      } else {
        setError("Invalid username or password.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", padding: 16,
    }}>
      <div className="fade-in login-card" style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderTop: "3px solid var(--gold)", borderRadius: "var(--radius)",
        padding: "36px 32px", width: "100%", maxWidth: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🐐</div>
          <h1 style={{ fontFamily: "'Amiri', serif", fontSize: 24, color: "var(--gold2)", marginBottom: 4 }}>
            {SHOP_NAME}
          </h1>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>Bakrid Goat Sales Billing System</p>
          <div style={{ color: "var(--gold-dim)", fontSize: 14, marginTop: 8, fontFamily: "'Amiri', serif" }}>
            بسم الله الرحمن الرحيم
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", marginBottom: 24 }} />

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>

          {error && (
            <div style={{
              background: "var(--red-bg)", border: "1px solid var(--red)",
              color: "var(--red2)", borderRadius: 8, padding: "10px 14px",
              fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          <button className="btn btn-gold" type="submit" disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, color: "var(--text3)", fontSize: 11 }}>
          Default: admin / bakrid2024
        </div>
      </div>
    </div>
  );
}
