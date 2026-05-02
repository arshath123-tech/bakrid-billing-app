import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useBills } from "../context/BillsContext";
import Navbar from "../components/Navbar";
import { fmt, fmtDate, SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from "../utils/helpers";

// ── Paper size definitions (width x height in mm) ──────────────────────────
const PAPER_SIZES = {
  A3:     { label: "A3",     w: 297, h: 420 },
  A4:     { label: "A4",     w: 210, h: 297 },
  A5:     { label: "A5",     w: 148, h: 210 },
  A6:     { label: "A6",     w: 105, h: 148 },
  RECEIPT:{ label: "Receipt (80mm)", w: 80,  h: 297 },
  CUSTOM: { label: "Custom", w: null, h: null },
};

// ── Size selector toolbar ───────────────────────────────────────────────────
function SizeSelector({ selected, customW, customH, onChange, onCustomW, onCustomH }) {
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", padding: "12px 16px",
      marginBottom: 16, display: "flex", flexWrap: "wrap",
      alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 12, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginRight: 4 }}>
        📐 Paper Size:
      </span>
      {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="btn btn-sm"
          style={{
            background: selected === key ? "var(--gold)" : "var(--surface3)",
            color: selected === key ? "#0f0e0a" : "var(--text2)",
            border: `1px solid ${selected === key ? "var(--gold)" : "var(--border)"}`,
            fontWeight: selected === key ? 700 : 400,
            fontSize: 12,
          }}
        >
          {label}
        </button>
      ))}

      {/* Custom dimensions */}
      {selected === "CUSTOM" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, width: "100%" }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>W:</span>
          <input
            type="number" min="50" max="500" value={customW}
            onChange={(e) => onCustomW(e.target.value)}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--text)", padding: "5px 8px",
              width: 70, fontSize: 13, outline: "none",
            }}
            placeholder="mm"
          />
          <span style={{ fontSize: 12, color: "var(--text3)" }}>H:</span>
          <input
            type="number" min="50" max="800" value={customH}
            onChange={(e) => onCustomH(e.target.value)}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--text)", padding: "5px 8px",
              width: 70, fontSize: 13, outline: "none",
            }}
            placeholder="mm"
          />
          <span style={{ fontSize: 12, color: "var(--text3)" }}>mm</span>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function BillViewPage({ onLogout }) {
  const { billNo } = useParams();
  const navigate = useNavigate();
  const { bills } = useBills();
  const printRef = useRef();

  const [paperKey, setPaperKey] = useState("A4");
  const [customW, setCustomW] = useState(150);
  const [customH, setCustomH] = useState(200);

  const bill = bills.find((b) => String(b.billNo) === String(billNo));

  // Resolve paper dimensions
  const paperDims = paperKey === "CUSTOM"
    ? { w: +customW || 150, h: +customH || 200 }
    : PAPER_SIZES[paperKey];

  const mmToPx = (mm) => Math.round(mm * 3.7795); // 1mm ≈ 3.78px at 96dpi
  const billW = mmToPx(paperDims.w);
  const billH = mmToPx(paperDims.h);

  // Scale font relative to A4 width (210mm base)
  const scale = paperDims.w / 210;
  const fs = (base) => Math.max(7, Math.round(base * scale));

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Bill-${billNo}`,
    pageStyle: `
      @page {
        size: ${paperDims.w}mm ${paperDims.h}mm;
        margin: 0;
      }
      @media print {
        html, body { margin: 0; padding: 0; }
        .bill-page-wrapper {
          width: ${paperDims.w}mm !important;
          min-height: ${paperDims.h}mm !important;
          height: auto !important;
          padding: ${Math.max(4, Math.round(paperDims.w * 0.04))}mm !important;
          box-sizing: border-box !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `,
  });

  if (!bill) {
    return (
      <div className="app-wrapper">
        <Navbar onLogout={onLogout} />
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3>Bill Not Found</h3>
          <button className="btn btn-gold mt-4" onClick={() => navigate("/")}>← Go Home</button>
        </div>
      </div>
    );
  }

  const hasSmall = bill.smallRows?.some((r) => parseFloat(r.price) > 0 || parseFloat(r.qty) > 0);
  const hasBig = bill.bigRows?.some((r) => parseFloat(r.price) > 0 || parseFloat(r.qty) > 0);
  const hasInOut = bill.bigGoatIn || bill.bigGoatOut || bill.smallGoatIn || bill.smallGoatOut;

  // Shared cell style
  const th = { background: "#f5f0e0", padding: `${fs(4)}px ${fs(5)}px`, textAlign: "left", fontSize: fs(9), textTransform: "uppercase", color: "#8b6914", fontWeight: 600 };
  const td = { padding: `${fs(3)}px ${fs(5)}px`, borderBottom: "1px solid #eee", fontSize: fs(10) };
  const rowSep = { display: "flex", justifyContent: "space-between", padding: `${fs(3)}px 0`, borderBottom: "1px solid #eee", fontSize: fs(10) };

  return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />

      {/* Action bar */}
      <div className="bill-actions-row no-print" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
        <button className="btn btn-outline" onClick={() => navigate("/")}>← Home</button>
        <button className="btn btn-outline" onClick={() => navigate(`/bill/edit/${billNo}`)}>✏️ Edit</button>
        <button className="btn btn-gold" onClick={handlePrint}>🖨️ Print / PDF</button>
      </div>

      {/* Payment status */}
      <div className="no-print" style={{
        marginBottom: 12, padding: "10px 14px", borderRadius: "var(--radius-sm)",
        background: bill.balance > 0 ? "var(--red-bg)" : "var(--green-bg)",
        border: `1px solid ${bill.balance > 0 ? "var(--red)" : "var(--green)"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6,
      }}>
        <span style={{ color: bill.balance > 0 ? "var(--red2)" : "var(--green2)", fontWeight: 600 }}>
          {bill.balance > 0 ? `⏳ Balance Due: ₹${fmt(bill.balance)}` : "✅ Bill Fully Paid"}
        </span>
        <span style={{ color: "var(--text2)", fontSize: 13 }}>
          💵 ₹{fmt(bill.cashPaid)} &nbsp;|&nbsp; 📱 ₹{fmt(bill.gpayPaid)}
        </span>
      </div>

      {/* Paper size selector */}
      <div className="no-print">
        <SizeSelector
          selected={paperKey}
          customW={customW}
          customH={customH}
          onChange={setPaperKey}
          onCustomW={setCustomW}
          onCustomH={setCustomH}
        />
      </div>

      {/* Preview label */}
      <div className="no-print" style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>
        Preview — {PAPER_SIZES[paperKey]?.label || "Custom"} ({paperDims.w}mm × {paperDims.h}mm)
      </div>

      {/* ── Bill preview wrapper (screen) ── */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 40 }}>
        <div
          ref={printRef}
          className="bill-page-wrapper"
          style={{
            width: billW,
            minHeight: billH,
            height: "auto",
            background: "#fff",
            color: "#111",
            fontFamily: "'Tajawal', sans-serif",
            boxSizing: "border-box",
            padding: Math.max(10, Math.round(billW * 0.04)),
            border: "1px solid #ddd",
            borderRadius: 6,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: fs(5),
            fontSize: fs(11),
          }}
        >
          {/* ── HEADER ── */}
          <div style={{ textAlign: "center", paddingBottom: fs(5), borderBottom: "2px solid #c9a84c" }}>
            <div style={{ fontFamily: "'Amiri', serif", fontSize: fs(20), color: "#8b6914", fontWeight: 700, lineHeight: 1.2 }}>
              {SHOP_NAME}
            </div>
            <div style={{ fontSize: fs(8), color: "#888", marginTop: 2 }}>{SHOP_ADDRESS} &nbsp;|&nbsp; 📞 {SHOP_PHONE}</div>
            <div style={{ fontSize: fs(9), color: "#8b6914", fontWeight: 700, marginTop: fs(3), letterSpacing: 1 }}>TAX INVOICE</div>
          </div>

          {/* ── BILL META ── */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: fs(9) }}>
            <div style={{ lineHeight: 1.6 }}>
              <div><strong>Bill No:</strong> #{bill.billNo}</div>
              <div><strong>Date:</strong> {fmtDate(bill.date)}</div>
              <div><strong>Time:</strong> {bill.time}</div>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1.6 }}>
              {bill.customerName && <div><strong>Customer:</strong> {bill.customerName}</div>}
              {bill.customerPhone && <div><strong>Phone:</strong> {bill.customerPhone}</div>}
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #ddd" }} />

          {/* ── SMALL GOAT ── */}
          {hasSmall && (
            <div>
              <div style={{ fontWeight: 700, fontSize: fs(10), marginBottom: fs(3), color: "#555" }}>
                🐐 Small Goat
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Kg</th>
                    <th style={th}>₹/kg</th>
                    <th style={th}>Calc</th>
                    <th style={th}>Price</th>
                    <th style={th}>Disc</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.smallRows?.filter(r => parseFloat(r.price) > 0 || parseFloat(r.qty) > 0).map((r, i) => (
                    <tr key={r.id}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{r.qty}</td>
                      <td style={td}>{r.kg}</td>
                      <td style={{ ...td, color: "#8b6914", fontWeight: 600 }}>
                        ₹{parseFloat(r.rate) || 500}
                      </td>
                      <td style={td}>{fmt(r.calcPrice)}</td>
                      <td style={{ ...td, fontWeight: 700 }}>₹{fmt(r.price)}</td>
                      <td style={{ ...td, color: r.discount > 0 ? "#c0392b" : "#ccc" }}>
                        {r.discount > 0 ? `-₹${fmt(r.discount)}` : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#fdf8ee" }}>
                    <td colSpan={5} style={td} />
                    <td style={{ ...td, fontWeight: 700, color: "#8b6914" }}>₹{fmt(bill.smallTotal)}</td>
                    <td style={td} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── BIG GOAT ── */}
          {hasBig && (
            <div>
              <div style={{ fontWeight: 700, fontSize: fs(10), marginBottom: fs(3), color: "#555" }}>
                🐂 Big Goat <span style={{ fontWeight: 400, color: "#888", fontSize: fs(9) }}>(Flat Price)</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Price (₹)</th>
                    <th style={th}>Disc (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.bigRows?.filter(r => parseFloat(r.price) > 0 || parseFloat(r.qty) > 0).map((r, i) => (
                    <tr key={r.id}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{r.qty}</td>
                      <td style={{ ...td, fontWeight: 700 }}>₹{fmt(r.price)}</td>
                      <td style={{ ...td, color: r.discount > 0 ? "#c0392b" : "#ccc" }}>
                        {r.discount > 0 ? `-₹${fmt(r.discount)}` : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#fdf8ee" }}>
                    <td colSpan={2} style={td} />
                    <td style={{ ...td, fontWeight: 700, color: "#8b6914" }}>₹{fmt(bill.bigTotal)}</td>
                    <td style={td} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── GOAT IN / OUT + TOKENS ── */}
          {hasInOut && (
            <div style={{ borderTop: "1px dashed #ddd", paddingTop: fs(5) }}>
              <div style={{ fontWeight: 700, fontSize: fs(10), marginBottom: fs(4), color: "#555" }}>🔄 Goat In / Out</div>

              {(bill.bigGoatIn > 0 || bill.bigGoatOut > 0) && (
                <div style={{ marginBottom: fs(5) }}>
                  <div style={{ fontSize: fs(9), fontWeight: 600, color: "#444", marginBottom: fs(3) }}>
                    🐂 Big Goat — In: <strong>{bill.bigGoatIn || 0}</strong> | Out: <strong>{bill.bigGoatOut || 0}</strong>
                  </div>
                  {bill.bigGoatIn > 0 && bill.bigGoatTokens?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: fs(3) }}>
                      {bill.bigGoatTokens.map((token, i) => (
                        <span key={i} style={{
                          border: "1px solid #c9a84c", borderRadius: 4,
                          padding: `${fs(2)}px ${fs(6)}px`,
                          fontSize: fs(9), background: "#fdfaf3", color: "#8b6914", fontWeight: 600,
                        }}>
                          #{i + 1}: {token || "—"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(bill.smallGoatIn > 0 || bill.smallGoatOut > 0) && (
                <div style={{ marginBottom: fs(3) }}>
                  <div style={{ fontSize: fs(9), fontWeight: 600, color: "#444", marginBottom: fs(3) }}>
                    🐐 Small Goat — In: <strong>{bill.smallGoatIn || 0}</strong> | Out: <strong>{bill.smallGoatOut || 0}</strong>
                  </div>
                  {bill.smallGoatIn > 0 && bill.smallGoatTokens?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: fs(3) }}>
                      {bill.smallGoatTokens.map((token, i) => (
                        <span key={i} style={{
                          border: "1px solid #c9a84c", borderRadius: 4,
                          padding: `${fs(2)}px ${fs(6)}px`,
                          fontSize: fs(9), background: "#fdfaf3", color: "#8b6914", fontWeight: 600,
                        }}>
                          #{i + 1}: {token || "—"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {bill.maintenanceCharge > 0 && (
                <div style={{ fontSize: fs(9), marginTop: fs(3), color: "#555" }}>
                  🏠 Maintenance: <strong>₹{fmt(bill.maintenanceCharge)}</strong>
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: "1px dashed #ddd" }} />

          {/* ── SUMMARY ── */}
          <div style={{ marginLeft: "auto", width: "55%" }}>
            {hasSmall && <div style={rowSep}><span>🐐 Small Goat Total</span><span>₹{fmt(bill.smallTotal)}</span></div>}
            {hasBig && <div style={rowSep}><span>🐂 Big Goat Total</span><span>₹{fmt(bill.bigTotal)}</span></div>}
            {bill.maintenanceCharge > 0 && <div style={rowSep}><span>🏠 Maintenance</span><span>₹{fmt(bill.maintenanceCharge)}</span></div>}
            <div style={rowSep}><span>Sub Total</span><span>₹{fmt(bill.subTotal)}</span></div>
            <div style={rowSep}><span>Tax (2%)</span><span>+₹{fmt(bill.tax)}</span></div>
            <div style={{ ...rowSep, fontWeight: 600 }}><span>Before Discount</span><span>₹{fmt(bill.autoGrandTotal)}</span></div>
            {bill.grandDiscount > 0 && (
              <div style={{ ...rowSep, color: "#c0392b" }}><span>🏷️ Total Discount</span><span>-₹{fmt(bill.grandDiscount)}</span></div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: `${fs(5)}px ${fs(8)}px`,
              background: "#f5f0e0", borderRadius: 6, marginTop: fs(4),
              fontSize: fs(13), fontWeight: 700, color: "#8b6914",
            }}>
              <span>Grand Total</span><span>₹{fmt(bill.grandTotal)}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #ddd" }} />

          {/* ── PAYMENT ── */}
          <div style={{ fontSize: fs(9) }}>
            <div style={{ fontWeight: 700, marginBottom: fs(3), color: "#555" }}>💳 Payment</div>
            <div style={{ display: "flex", gap: fs(12), flexWrap: "wrap" }}>
              <span>💵 Cash: <strong>₹{fmt(bill.cashPaid)}</strong></span>
              <span>📱 GPay: <strong>₹{fmt(bill.gpayPaid)}</strong></span>
              <span>✅ Paid: <strong>₹{fmt(bill.totalPaid)}</strong></span>
              {bill.balance > 0 && (
                <span style={{ color: "#c0392b" }}>⏳ Balance: <strong>₹{fmt(bill.balance)}</strong></span>
              )}
              {!bill.balance || bill.balance === 0 ? (
                <span style={{ color: "#27ae60", fontWeight: 700 }}>✅ Fully Paid</span>
              ) : null}
            </div>
          </div>

          {/* ── CUTTING ── */}
          {(bill.bigGoatCutting > 0 || bill.smallGoatCutting > 0) && (
            <div style={{ borderTop: "1px dashed #ddd", paddingTop: fs(5) }}>
              <div style={{ fontWeight: 700, fontSize: fs(10), marginBottom: fs(5), color: "#555" }}>
                🔪 Cutting Details
              </div>
              <div style={{ display: "flex", gap: fs(10), flexWrap: "wrap" }}>
                {bill.bigGoatCutting > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: fs(6),
                    background: "#fdf8ee", border: "1px solid #c9a84c",
                    borderRadius: 6, padding: `${fs(5)}px ${fs(12)}px`,
                  }}>
                    <span style={{ fontSize: fs(14) }}>🐂</span>
                    <div>
                      <div style={{ fontSize: fs(8), color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Big Goat</div>
                      <div style={{ fontSize: fs(14), fontWeight: 700, color: "#8b6914" }}>{bill.bigGoatCutting} cutting{bill.bigGoatCutting > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                )}
                {bill.smallGoatCutting > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: fs(6),
                    background: "#fdf8ee", border: "1px solid #c9a84c",
                    borderRadius: 6, padding: `${fs(5)}px ${fs(12)}px`,
                  }}>
                    <span style={{ fontSize: fs(14) }}>🐐</span>
                    <div>
                      <div style={{ fontSize: fs(8), color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Small Goat</div>
                      <div style={{ fontSize: fs(14), fontWeight: 700, color: "#8b6914" }}>{bill.smallGoatCutting} cutting{bill.smallGoatCutting > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SEAL ── */}
          <div style={{
            textAlign: "center", borderTop: "1px dashed #ddd",
            paddingTop: fs(5), marginTop: "auto",
          }}>
            <div style={{ fontFamily: "'Amiri', serif", fontSize: fs(12), color: "#8b6914" }}>{SHOP_NAME}</div>
            <div style={{ fontSize: fs(8), color: "#bbb", marginTop: fs(2) }}>
              Thank you — بارك الله فيكم &nbsp;|&nbsp; {fmtDate(bill.date)} &nbsp;|&nbsp; Bill #{bill.billNo}
            </div>
            <div style={{
              display: "inline-block", marginTop: fs(5),
              border: "1px dashed #ccc", padding: `${fs(5)}px ${fs(16)}px`,
              borderRadius: 6, color: "#ccc", fontSize: fs(8),
            }}>
              [ Shop Seal ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
