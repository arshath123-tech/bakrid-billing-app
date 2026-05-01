import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome  = location.pathname === "/";
  const isSales = location.pathname === "/sales";

  return (
    <div className="navbar no-print">
      <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <div className="navbar-icon">🐐</div>
        <div>
          <div className="navbar-title">Bakrid Billing</div>
          <div className="navbar-subtitle">Goat Sales Management</div>
        </div>
      </div>

      <div className="navbar-actions">
        {!isHome && (
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/")}>← Home</button>
        )}
        {isHome && (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/sales")}>📊 Sales</button>
            <button className="btn btn-gold btn-sm" onClick={() => navigate("/bill/new")}>+ New Bill</button>
          </>
        )}
        {isSales && (
          <button className="btn btn-gold btn-sm" onClick={() => navigate("/bill/new")}>+ New Bill</button>
        )}
        <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
