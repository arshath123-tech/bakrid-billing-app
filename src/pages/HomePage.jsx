import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useBills } from "../context/BillsContext";
import { groupBillsByDate, fmt, fmtDate, todayStr } from "../utils/helpers";

export default function HomePage({ onLogout }) {
  const { bills, deleteBill, loading, error } = useBills();
  const navigate = useNavigate();
  const [openFolders, setOpenFolders] = useState(() => ({ [todayStr()]: true }));
  const [search, setSearch] = useState("");

  function toggleFolder(date) {
    setOpenFolders((prev) => ({ ...prev, [date]: !prev[date] }));
  }

  function handleDelete(billNo, e) {
    e.stopPropagation();
    if (window.confirm(`Delete Bill #${billNo}? This cannot be undone.`)) {
      deleteBill(billNo);
    }
  }

  const query = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return [];
    return bills.filter((b) =>
      String(b.billNo).includes(query) ||
      (b.customerName || "").toLowerCase().includes(query)
    );
  }, [bills, query]);

  const grouped = groupBillsByDate(bills);
  const dates   = Object.keys(grouped);

  function BillCard({ bill }) {
    return (
      <div className="bill-card-mini slide-in">
        <div className="bill-card-mini-info" style={{ cursor: "pointer", flex: 1 }}
          onClick={() => navigate(`/bill/view/${bill.billNo}`)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="bill-no">Bill #{bill.billNo}</span>
            {bill.balance > 0
              ? <span className="badge" style={{ fontSize: 10, background: "var(--red-bg)", color: "var(--red2)", border: "1px solid var(--red)" }}>Due ₹{fmt(bill.balance)}</span>
              : <span className="badge badge-green" style={{ fontSize: 10 }}>Paid</span>
            }
            {query && <span style={{ fontSize: 10, color: "var(--text3)" }}>{fmtDate(bill.date)}</span>}
          </div>
          <div className="bill-customer">{bill.customerName || "—"}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 2, flexWrap: "wrap" }}>
            <span className="bill-time">🕐 {bill.time}</span>
            {bill.cashPaid > 0 && <span className="bill-time">💵 ₹{fmt(bill.cashPaid)}</span>}
            {bill.gpayPaid > 0 && <span className="bill-time">📱 ₹{fmt(bill.gpayPaid)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div className="bill-amount">₹{fmt(bill.grandTotal)}</div>
          <div className="bill-card-actions">
            <button className="btn btn-outline btn-sm btn-icon" onClick={() => navigate(`/bill/edit/${bill.billNo}`)}>✏️</button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => handleDelete(bill.billNo, e)}>🗑️</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <h3 style={{ marginTop: 12 }}>Loading bills...</h3>
        <p>Connecting to Supabase</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h3 style={{ marginTop: 12 }}>Connection Error</h3>
        <p style={{ color: "var(--red2)", maxWidth: 320, margin: "8px auto" }}>{error}</p>
        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
          Make sure you've filled in your Supabase URL and Anon Key in <code>src/lib/supabase.js</code>
        </p>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />

      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-icon">🐐</div>
        <h1>Bakrid Billing</h1>
        <p>Manage your goat sales — day by day, bill by bill</p>
        <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => navigate("/sales")}>
          📊 View Sales Summary
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 20, position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text3)", pointerEvents: "none" }}>
          🔍
        </div>
        <input
          className="form-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bill number or customer name..."
          style={{ paddingLeft: 40, fontSize: 15 }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer",
          }}>×</button>
        )}
      </div>

      {/* Search Results */}
      {query && (
        <div style={{ marginBottom: 24 }}>
          <div className="phase-label">🔍 Results for "{search}"</div>
          {searchResults.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 16px" }}>
              <div style={{ fontSize: 32 }}>🔎</div>
              <h3 style={{ marginTop: 8 }}>No bills found</h3>
              <p>Try a different bill number or name</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
              </div>
              {searchResults.map((b) => <BillCard key={b.billNo} bill={b} />)}
            </>
          )}
        </div>
      )}

      {/* Date Folders */}
      {!query && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="phase-label" style={{ flex: 1, margin: 0 }}>📁 Bills by Date</div>
            <button className="btn btn-gold btn-sm" style={{ marginLeft: 16 }} onClick={() => navigate("/bill/new")}>
              + New Bill
            </button>
          </div>

          {dates.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Bills Yet</h3>
              <p>Create your first bill to get started</p>
              <button className="btn btn-gold mt-4" onClick={() => navigate("/bill/new")}>+ Create First Bill</button>
            </div>
          )}

          {dates.map((date) => {
            const dateBills = grouped[date];
            const isOpen    = openFolders[date];
            const dayTotal  = dateBills.reduce((a, b) => a + (b.grandTotal || 0), 0);
            const dayBalance= dateBills.reduce((a, b) => a + (b.balance || 0), 0);

            return (
              <div key={date} className="date-folder">
                <div className="date-folder-header" onClick={() => toggleFolder(date)}>
                  <div className="date-folder-title">
                    <span>{isOpen ? "📂" : "📁"}</span>
                    <span>{fmtDate(date)}</span>
                    <span className="badge badge-gold">{dateBills.length} bill{dateBills.length > 1 ? "s" : ""}</span>
                    {dayBalance > 0 && (
                      <span className="badge" style={{ background: "var(--red-bg)", color: "var(--red2)", border: "1px solid var(--red)", fontSize: 10 }}>
                        Bal ₹{fmt(dayBalance)}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold2)" }}>₹{fmt(dayTotal)}</div>
                    <div className="date-folder-meta">{isOpen ? "▲ collapse" : "▼ expand"}</div>
                  </div>
                </div>
                {isOpen && (
                  <div className="date-folder-body">
                    {dateBills.map((b) => <BillCard key={b.billNo} bill={b} />)}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <div style={{ height: 60 }} />
    </div>
  );
}
