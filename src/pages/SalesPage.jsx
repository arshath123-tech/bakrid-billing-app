import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useBills } from "../context/BillsContext";
import { groupBillsByDate, fmt, fmtDate, todayStr, calcSalesSummary } from "../utils/helpers";

function MoneyBox({ label, icon, value, color }) {
  return (
    <div style={{
      background: "var(--surface2)", border: `1px solid ${color || "var(--border)"}`,
      borderRadius: "var(--radius-sm)", padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color || "var(--text)", fontFamily: "'Amiri', serif" }}>
        ₹{fmt(value)}
      </div>
    </div>
  );
}

function CountBox({ label, icon, count, sub, color }) {
  return (
    <div style={{
      background: "var(--surface2)", border: `1px solid ${color || "var(--border)"}`,
      borderRadius: "var(--radius-sm)", padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--gold2)", fontFamily: "'Amiri', serif", lineHeight: 1.1 }}>
        {count}
      </div>
      {sub && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// Reusable summary content used inside both season block and date folders
function SalesContent({ bills, accentColor }) {
  const s = calcSalesSummary(bills);
  return (
    <>
      {/* Goat counts */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, fontWeight: 600 }}>
          🐐 Goats Sold
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <CountBox
            label="Small Goats" icon="🐐"
            count={s.totalSmallGoats}
            sub={s.totalSmallKg > 0 ? `${s.totalSmallKg} kg total` : null}
            color="var(--gold)"
          />
          <CountBox label="Big Goats" icon="🐂" count={s.totalBigGoats} color="var(--gold2)" />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", margin: "10px 0" }} />

      {/* Financials */}
      <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, fontWeight: 600 }}>
        💰 Financials
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <MoneyBox label="Total Sales" icon="💰" value={s.totalAmount} color={accentColor || "var(--gold)"} />
        <MoneyBox label="Collected" icon="✅" value={s.totalPaid} color="var(--green2)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <MoneyBox label="Cash" icon="💵" value={s.totalCash} color="var(--text2)" />
        <MoneyBox label="GPay" icon="📱" value={s.totalGpay} color="var(--text2)" />
        <MoneyBox label="Balance" icon="⏳" value={s.totalBalance} color="var(--red2)" />
      </div>
    </>
  );
}

// Date folder — each date gets its own collapsible folder with full summary inside
function DateFolder({ date, bills }) {
  const [open, setOpen] = useState(date === todayStr());
  const s = calcSalesSummary(bills);

  return (
    <div className="date-folder" style={{ marginBottom: 12 }}>
      {/* Folder header */}
      <div
        className="date-folder-header"
        onClick={() => setOpen((p) => !p)}
        style={{ cursor: "pointer" }}
      >
        <div className="date-folder-title">
          <span>{open ? "📂" : "📁"}</span>
          <span>{fmtDate(date)}</span>
          <span className="badge badge-gold">{bills.length} bill{bills.length !== 1 ? "s" : ""}</span>
          {/* Mini goat count badges */}
          <span style={{ fontSize: 11, color: "var(--text2)" }}>
            🐐{s.totalSmallGoats} &nbsp; 🐂{s.totalBigGoats}
          </span>
          {s.totalBalance > 0 && (
            <span className="badge" style={{ fontSize: 10, background: "var(--red-bg)", color: "var(--red2)", border: "1px solid var(--red)" }}>
              Bal ₹{fmt(s.totalBalance)}
            </span>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold2)" }}>₹{fmt(s.totalAmount)}</div>
          <div className="date-folder-meta">{open ? "▲ collapse" : "▼ expand"}</div>
        </div>
      </div>

      {/* Folder body — full sales summary */}
      {open && (
        <div className="date-folder-body slide-in">
          <SalesContent bills={bills} accentColor="var(--gold2)" />
        </div>
      )}
    </div>
  );
}

export default function SalesPage({ onLogout }) {
  const { bills } = useBills();
  const navigate = useNavigate();
  const grouped = groupBillsByDate(bills);
  const dates = Object.keys(grouped); // already sorted descending

  return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Amiri', serif", fontSize: 24, color: "var(--gold)" }}>📊 Sales Summary</h2>
        <button className="btn btn-gold btn-sm" onClick={() => navigate("/bill/new")}>+ New Bill</button>
      </div>

      {bills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No Sales Yet</h3>
          <p>Create your first bill to see sales data here</p>
          <button className="btn btn-gold mt-4" onClick={() => navigate("/bill/new")}>+ Create First Bill</button>
        </div>
      ) : (
        <>
          {/* ── Season Sales ── */}
          <div className="phase-label">🌙 Season Sales — All Time</div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ color: "var(--gold)", fontSize: 17 }}>
                🌙 Season Total
              </div>
              <span className="badge badge-gold">{bills.length} Bills</span>
            </div>
            <SalesContent bills={bills} accentColor="var(--gold)" />
          </div>

          {/* ── Day Sales — folder per date ── */}
          <div className="phase-label">📅 Day Sales — By Date</div>

          {dates.map((date) => (
            <DateFolder key={date} date={date} bills={grouped[date]} />
          ))}
        </>
      )}

      <div style={{ height: 60 }} />
    </div>
  );
}
