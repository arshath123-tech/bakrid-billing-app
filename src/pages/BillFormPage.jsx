import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useBills } from "../context/BillsContext";
import {
  SHOP_NAME, getKgRate, fmt,
  todayStr, nowTimeStr,
  emptySmallRow, emptyBigRow,
  calcSmallRow, calcBillTotals, calcPayment,
} from "../utils/helpers";

function PhaseLabel({ children }) {
  return <div className="phase-label">{children}</div>;
}
function FieldGroup({ label, children, style }) {
  return (
    <div className="form-group" style={style}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
function SummaryRow({ label, value, color, bold, indent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: color || "var(--text2)", fontSize: 14, paddingLeft: indent ? 16 : 0 }}>{label}</span>
      <span style={{ color: color || "var(--text)", fontWeight: bold ? 700 : 500, fontSize: bold ? 16 : 14 }}>{value}</span>
    </div>
  );
}
function TokenRow({ index, tokenNo, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ color: "var(--text3)", fontSize: 13, minWidth: 60 }}>Goat {index + 1}</span>
      <input
        style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--gold2)", padding: "7px 12px", flex: 1, outline: "none", fontSize: 13 }}
        placeholder="Enter token number"
        value={tokenNo}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function BillFormPage({ onLogout }) {
  const navigate = useNavigate();
  const { billNo: editBillNo } = useParams();
  const { bills, addBill, updateBill, generateBillNo } = useBills();
  const isEdit   = !!editBillNo;
  const existing = isEdit ? bills.find((b) => String(b.billNo) === String(editBillNo)) : null;

  // Bill number — fetched from Supabase for new bills
  const [billNo, setBillNo]     = useState(existing ? existing.billNo : null);
  const [billNoReady, setBillNoReady] = useState(!!existing);

  useEffect(() => {
    if (!isEdit && !billNo) {
      generateBillNo()
        .then((no) => { setBillNo(no); setBillNoReady(true); })
        .catch(() => { alert("Could not generate bill number. Check Supabase connection."); });
    }
  }, []);

  // Phase 1
  const [shopName]       = useState(SHOP_NAME);
  const [date, setDate]  = useState(existing ? existing.date : todayStr());
  const [time, setTime]  = useState(existing ? existing.time : nowTimeStr());
  const [customerName, setCustomerName]   = useState(existing?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone || "");

  // Phase 2
  const [smallRows, setSmallRows] = useState(existing?.smallRows?.length ? existing.smallRows : [emptySmallRow()]);
  const [bigRows, setBigRows]     = useState(existing?.bigRows?.length ? existing.bigRows : [emptyBigRow()]);
  const [kgRate] = useState(() => getKgRate());

  // Phase 3
  const [bigGoatIn,  setBigGoatIn]  = useState(existing?.bigGoatIn  ?? 0);
  const [bigGoatOut, setBigGoatOut] = useState(existing?.bigGoatOut ?? 0);
  const [smallGoatIn,  setSmallGoatIn]  = useState(existing?.smallGoatIn  ?? 0);
  const [smallGoatOut, setSmallGoatOut] = useState(existing?.smallGoatOut ?? 0);
  const [maintenanceCharge, setMaintenanceCharge] = useState(existing?.maintenanceCharge ?? 0);
  const [bigGoatTokens,   setBigGoatTokens]   = useState(existing?.bigGoatTokens   || []);
  const [smallGoatTokens, setSmallGoatTokens] = useState(existing?.smallGoatTokens || []);

  function handleBigGoatInChange(val) {
    const n = parseInt(val) || 0;
    setBigGoatIn(n);
    setBigGoatTokens((prev) => { const a = [...prev]; while (a.length < n) a.push(""); return a.slice(0, n); });
  }
  function handleSmallGoatInChange(val) {
    const n = parseInt(val) || 0;
    setSmallGoatIn(n);
    setSmallGoatTokens((prev) => { const a = [...prev]; while (a.length < n) a.push(""); return a.slice(0, n); });
  }
  function updateBigToken(i, val)   { setBigGoatTokens((p)   => p.map((t, idx) => idx === i ? val : t)); }
  function updateSmallToken(i, val) { setSmallGoatTokens((p) => p.map((t, idx) => idx === i ? val : t)); }

  // Phase 4
  const [manualGrandTotal, setManualGrandTotal] = useState(existing?.manualGrandTotal ?? "");

  // Payment
  const [cashPaid, setCashPaid] = useState(existing?.cashPaid ?? 0);
  const [gpayPaid, setGpayPaid] = useState(existing?.gpayPaid ?? 0);

  // Cutting
  const [bigGoatCutting,   setBigGoatCutting]   = useState(existing?.bigGoatCutting   ?? 0);
  const [smallGoatCutting, setSmallGoatCutting] = useState(existing?.smallGoatCutting ?? 0);

  // Computed
  const totals  = calcBillTotals(smallRows, bigRows, manualGrandTotal, maintenanceCharge);
  const payment = calcPayment(totals.grandTotal, cashPaid, gpayPaid);

  // Row handlers
  function updateSmallRow(id, field, value) {
    setSmallRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      return { ...updated, ...calcSmallRow(updated) };
    }));
  }
  function addSmallRow()    { setSmallRows((p) => [...p, emptySmallRow()]); }
  function removeSmallRow(id) { setSmallRows((p) => p.length > 1 ? p.filter((r) => r.id !== id) : p); }

  function updateBigRow(id, field, value) { setBigRows((p) => p.map((r) => r.id !== id ? r : { ...r, [field]: value })); }
  function addBigRow()    { setBigRows((p) => [...p, emptyBigRow()]); }
  function removeBigRow(id) { setBigRows((p) => p.length > 1 ? p.filter((r) => r.id !== id) : p); }

  async function handleSave() {
    if (!billNoReady || !billNo) return;
    const billData = {
      billNo, date, time, shopName, customerName, customerPhone,
      smallRows, bigRows, kgRate,
      bigGoatIn: +bigGoatIn, bigGoatOut: +bigGoatOut,
      smallGoatIn: +smallGoatIn, smallGoatOut: +smallGoatOut,
      bigGoatTokens, smallGoatTokens,
      maintenanceCharge: +maintenanceCharge,
      manualGrandTotal, ...totals,
      cashPaid: payment.cash, gpayPaid: payment.gpay,
      totalPaid: payment.totalPaid, balance: payment.balance,
      bigGoatCutting: +bigGoatCutting,
      smallGoatCutting: +smallGoatCutting,
    };
    if (isEdit) await updateBill(billNo, billData);
    else        await addBill(billData);
    navigate(`/bill/view/${billNo}`);
  }

  const hasSmall = smallRows.some((r) => parseFloat(r.price) > 0);
  const hasBig   = bigRows.some((r)   => parseFloat(r.price) > 0);

  if (!billNoReady) return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <h3 style={{ marginTop: 12 }}>Generating Bill Number...</h3>
        <p>Connecting to Supabase</p>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />

      <div className="bill-actions-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "var(--gold)" }}>
          {isEdit ? `Edit Bill #${billNo}` : "New Bill"}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={() => navigate("/")}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSave}>{isEdit ? "Update Bill" : "Save Bill"} ✓</button>
        </div>
      </div>

      {/* PHASE 1 */}
      <PhaseLabel>Phase 1 — Bill Header</PhaseLabel>
      <div className="card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "var(--gold2)" }}>{shopName}</div>
          <div style={{ color: "var(--text3)", fontSize: 12 }}>Tax Invoice</div>
        </div>
        <div className="three-col" style={{ marginBottom: 12 }}>
          <FieldGroup label="Bill No">
            <input className="form-input" value={`#${billNo}`} readOnly style={{ color: "var(--gold)", fontWeight: 700 }} />
          </FieldGroup>
          <FieldGroup label="Date">
            <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Time">
            <input className="form-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </FieldGroup>
        </div>
        <div className="two-col">
          <FieldGroup label="Customer Name">
            <input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
          </FieldGroup>
          <FieldGroup label="Customer Phone">
            <input className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </FieldGroup>
        </div>
      </div>

      {/* PHASE 2 — Small Goat */}
      <PhaseLabel>Phase 2 — Goat Details</PhaseLabel>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🐐 Small Goat <span style={{ fontSize: 12, color: "var(--text3)" }}>(rate per row, default ₹500/kg)</span></div>
          <button className="btn btn-green btn-sm" onClick={addSmallRow}>+ Add Row</button>
        </div>
        <div className="table-wrap">
          <table className="goat-table">
            <thead>
              <tr><th>#</th><th>Qty</th><th>Kg</th><th>₹/kg</th><th>Calc ₹</th><th>Final ₹</th><th>Disc ₹</th><th></th></tr>
            </thead>
            <tbody>
              {smallRows.map((row, i) => (
                <tr key={row.id}>
                  <td style={{ color: "var(--text3)", fontSize: 12 }}>{i + 1}</td>
                  <td><input type="number" min="0" value={row.qty} onChange={(e) => updateSmallRow(row.id, "qty", e.target.value)} placeholder="0" /></td>
                  <td><input type="number" min="0" step="0.1" value={row.kg} onChange={(e) => updateSmallRow(row.id, "kg", e.target.value)} placeholder="0.0" /></td>
                  <td><input type="number" min="1" value={row.rate ?? 500} onChange={(e) => updateSmallRow(row.id, "rate", e.target.value)} placeholder="500" style={{ color: "var(--gold2)", fontWeight: 600 }} /></td>
                  <td><input className="calc" type="text" value={row.calcPrice > 0 ? row.calcPrice : ""} readOnly placeholder="Auto" /></td>
                  <td><input type="number" min="0" value={row.price} onChange={(e) => updateSmallRow(row.id, "price", e.target.value)} placeholder="0" /></td>
                  <td><input className={row.discount > 0 ? "disc" : ""} type="text" value={row.discount > 0 ? row.discount : "0"} readOnly /></td>
                  <td><button style={{ background: "none", border: "none", color: "var(--red2)", fontSize: 16, cursor: "pointer", padding: "4px 6px" }} onClick={() => removeSmallRow(row.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasSmall && <div style={{ textAlign: "right", marginTop: 10, color: "var(--gold)", fontWeight: 600 }}>Small Total: ₹{fmt(totals.smallTotal)}</div>}
      </div>

      {/* Big Goat */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🐂 Big Goat <span style={{ fontSize: 12, color: "var(--text3)" }}>(Flat Price)</span></div>
          <button className="btn btn-green btn-sm" onClick={addBigRow}>+ Add Row</button>
        </div>
        <div className="table-wrap">
          <table className="goat-table">
            <thead>
              <tr><th>#</th><th>Qty</th><th>Price ₹</th><th>Discount ₹</th><th></th></tr>
            </thead>
            <tbody>
              {bigRows.map((row, i) => (
                <tr key={row.id}>
                  <td style={{ color: "var(--text3)", fontSize: 12 }}>{i + 1}</td>
                  <td><input type="number" min="0" value={row.qty} onChange={(e) => updateBigRow(row.id, "qty", e.target.value)} placeholder="0" /></td>
                  <td><input type="number" min="0" value={row.price} onChange={(e) => updateBigRow(row.id, "price", e.target.value)} placeholder="0" /></td>
                  <td><input type="number" min="0" value={row.discount} onChange={(e) => updateBigRow(row.id, "discount", e.target.value)} placeholder="0" /></td>
                  <td><button style={{ background: "none", border: "none", color: "var(--red2)", fontSize: 16, cursor: "pointer", padding: "4px 6px" }} onClick={() => removeBigRow(row.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasBig && <div style={{ textAlign: "right", marginTop: 10, color: "var(--gold)", fontWeight: 600 }}>Big Total: ₹{fmt(totals.bigTotal)}</div>}
      </div>

      {/* PHASE 3 */}
      <PhaseLabel>Phase 3 — Goat In / Out & Maintenance</PhaseLabel>
      <div className="card">
        <div className="inout-grid" style={{ marginBottom: 16 }}>
          <FieldGroup label="🐂 Big Goat In"><input className="form-input" type="number" min="0" value={bigGoatIn} onChange={(e) => handleBigGoatInChange(e.target.value)} placeholder="0" /></FieldGroup>
          <FieldGroup label="🐂 Big Goat Out"><input className="form-input" type="number" min="0" value={bigGoatOut} onChange={(e) => setBigGoatOut(e.target.value)} placeholder="0" /></FieldGroup>
          <FieldGroup label="🐐 Small Goat In"><input className="form-input" type="number" min="0" value={smallGoatIn} onChange={(e) => handleSmallGoatInChange(e.target.value)} placeholder="0" /></FieldGroup>
          <FieldGroup label="🐐 Small Goat Out"><input className="form-input" type="number" min="0" value={smallGoatOut} onChange={(e) => setSmallGoatOut(e.target.value)} placeholder="0" /></FieldGroup>
        </div>
        {+bigGoatIn > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, fontWeight: 600 }}>🏷️ Big Goat Token Numbers</div>
            {bigGoatTokens.map((token, i) => <TokenRow key={i} index={i} tokenNo={token} onChange={(val) => updateBigToken(i, val)} />)}
          </div>
        )}
        {+smallGoatIn > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, fontWeight: 600 }}>🏷️ Small Goat Token Numbers</div>
            {smallGoatTokens.map((token, i) => <TokenRow key={i} index={i} tokenNo={token} onChange={(val) => updateSmallToken(i, val)} />)}
          </div>
        )}
        <FieldGroup label="🏠 Maintenance Charge (₹)">
          <input className="form-input" type="number" min="0" value={maintenanceCharge} onChange={(e) => setMaintenanceCharge(e.target.value)} placeholder="0" />
        </FieldGroup>
      </div>

      {/* PHASE 4 */}
      <PhaseLabel>Phase 4 — Bill Summary & Tax</PhaseLabel>
      <div className="card">
        {hasSmall && <SummaryRow label="🐐 Small Goat Total" value={`₹${fmt(totals.smallTotal)}`} indent />}
        {hasBig   && <SummaryRow label="🐂 Big Goat Total"   value={`₹${fmt(totals.bigTotal)}`}   indent />}
        {+maintenanceCharge > 0 && <SummaryRow label="🏠 Maintenance Charge" value={`₹${fmt(totals.maintenance)}`} indent />}
        <SummaryRow label="Sub Total (before tax)" value={`₹${fmt(totals.subTotal)}`} bold />
        <SummaryRow label="Tax @ 2%" value={`+ ₹${fmt(totals.tax)}`} color="var(--text2)" />
        <SummaryRow label="Total (Sub Total + Tax)" value={`₹${fmt(totals.autoGrandTotal)}`} bold color="var(--gold)" />
        {totals.smallDiscount > 0 && <SummaryRow label="🐐 Small Goat Discounts" value={`- ₹${fmt(totals.smallDiscount)}`} color="var(--red2)" indent />}
        {totals.bigDiscount   > 0 && <SummaryRow label="🐂 Big Goat Discounts"   value={`- ₹${fmt(totals.bigDiscount)}`}   color="var(--red2)" indent />}
        {totals.grandDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", margin: "8px 0", background: "var(--red-bg)", border: "1px solid var(--red)", borderRadius: "var(--radius-sm)" }}>
            <span style={{ color: "var(--red2)", fontWeight: 600, fontSize: 14 }}>🏷️ Total Discount</span>
            <span style={{ color: "var(--red2)", fontWeight: 700, fontSize: 16 }}>- ₹{fmt(totals.grandDiscount)}</span>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <FieldGroup label="Grand Total (₹) — Edit to apply overall discount">
            <input className="form-input" type="number" min="0" value={manualGrandTotal}
              onChange={(e) => setManualGrandTotal(e.target.value)}
              placeholder={totals.autoGrandTotal}
              style={{ fontSize: 18, fontWeight: 700, color: "var(--gold2)" }} />
          </FieldGroup>
          {manualGrandTotal !== "" && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Auto-calculated: ₹{fmt(totals.autoGrandTotal)}</div>}
        </div>
        <div className="summary-grand" style={{ marginTop: 14 }}>
          <span className="label">Grand Total</span>
          <span className="value">₹{fmt(totals.grandTotal)}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <PhaseLabel>Payment Details</PhaseLabel>
      <div className="card">
        <div className="two-col" style={{ marginBottom: 14 }}>
          <FieldGroup label="💵 Cash Paid (₹)"><input className="form-input" type="number" min="0" value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} placeholder="0" /></FieldGroup>
          <FieldGroup label="📱 GPay Paid (₹)"><input className="form-input" type="number" min="0" value={gpayPaid} onChange={(e) => setGpayPaid(e.target.value)} placeholder="0" /></FieldGroup>
        </div>
        <SummaryRow label="Grand Total" value={`₹${fmt(totals.grandTotal)}`} />
        <SummaryRow label="Total Paid (Cash + GPay)" value={`₹${fmt(payment.totalPaid)}`} color="var(--green2)" bold />
        <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: "var(--radius-sm)", background: payment.balance > 0 ? "var(--red-bg)" : "var(--green-bg)", border: `1px solid ${payment.balance > 0 ? "var(--red)" : "var(--green)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Amiri', serif", fontSize: 16, color: payment.balance > 0 ? "var(--red2)" : "var(--green2)" }}>{payment.balance > 0 ? "⏳ Balance Due" : "✅ Fully Paid"}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: payment.balance > 0 ? "var(--red2)" : "var(--green2)" }}>{payment.balance > 0 ? `₹${fmt(payment.balance)}` : "Cleared"}</span>
        </div>
      </div>

      {/* CUTTING */}
      <PhaseLabel>Cutting Details</PhaseLabel>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔪 Goat Cutting</div>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Enter 0 if no cutting</span>
        </div>
        <div className="two-col">
          <FieldGroup label="🐂 Big Goat Cutting"><input className="form-input" type="number" min="0" value={bigGoatCutting} onChange={(e) => setBigGoatCutting(e.target.value)} placeholder="0" /></FieldGroup>
          <FieldGroup label="🐐 Small Goat Cutting"><input className="form-input" type="number" min="0" value={smallGoatCutting} onChange={(e) => setSmallGoatCutting(e.target.value)} placeholder="0" /></FieldGroup>
        </div>
        {(+bigGoatCutting > 0 || +smallGoatCutting > 0) && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text2)" }}>
            🔪 Cutting summary will appear on the printed bill.
            {+bigGoatCutting   > 0 && <span style={{ marginLeft: 12 }}>🐂 Big: <strong style={{ color: "var(--gold)" }}>{bigGoatCutting}</strong></span>}
            {+smallGoatCutting > 0 && <span style={{ marginLeft: 12 }}>🐐 Small: <strong style={{ color: "var(--gold)" }}>{smallGoatCutting}</strong></span>}
          </div>
        )}
      </div>

      {/* SAVE */}
      <div className="bill-actions-row" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 40 }}>
        <button className="btn btn-outline" onClick={() => navigate("/")}>Cancel</button>
        <button className="btn btn-gold" style={{ padding: "12px 32px", fontSize: 15 }} onClick={handleSave}>
          {isEdit ? "✓ Update Bill" : "✓ Save Bill"}
        </button>
      </div>
    </div>
  );
}
