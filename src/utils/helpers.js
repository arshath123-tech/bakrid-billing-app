export const SMALL_GOAT_RATE = 500;
export const TAX_RATE = 0.02;
export const SHOP_NAME = "Al-Baraka Goat Farm";
export const SHOP_ADDRESS = "No.12, Market Street, Chennai - 600001";
export const SHOP_PHONE = "+91 98765 43210";

export function getKgRate() {
  return parseFloat(localStorage.getItem("bakrid_kg_rate") || "500");
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function nowTimeStr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function groupBillsByDate(bills) {
  const map = {};
  bills.forEach((b) => {
    const key = b.date;
    if (!map[key]) map[key] = [];
    map[key].push(b);
  });
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  );
}

export function emptySmallRow() {
  return {
    id: Date.now() + Math.random(),
    qty: 0,
    kg: 0,
    rate: getKgRate(),
    calcPrice: 0,
    price: 0,
    discount: 0,
  };
}

export function emptyBigRow() {
  return {
    id: Date.now() + Math.random(),
    qty: 0,
    price: 0,
    discount: 0,
  };
}

export function calcSmallRow(row, rate) {
  const kgRate = parseFloat(rate) || parseFloat(row.rate) || getKgRate();
  const kg = parseFloat(row.kg) || 0;
  const qty = parseFloat(row.qty) || 1;
  const calcPrice = +(kg * kgRate * qty).toFixed(2);
  const price = parseFloat(row.price) || 0;
  const discount = price > 0 && price < calcPrice ? +(calcPrice - price).toFixed(2) : 0;
  return { calcPrice, discount };
}

export function calcBillTotals(smallRows, bigRows, manualGrandTotal, maintenanceCharge) {
  const smallTotal = smallRows.reduce((acc, r) => acc + (parseFloat(r.price) || 0), 0);
  const bigTotal = bigRows.reduce((acc, r) => acc + (parseFloat(r.price) || 0), 0);
  const smallDiscount = smallRows.reduce((acc, r) => acc + (parseFloat(r.discount) || 0), 0);
  const bigDiscount = bigRows.reduce((acc, r) => acc + (parseFloat(r.discount) || 0), 0);
  const phaseDiscount = +(smallDiscount + bigDiscount).toFixed(2);
  const maintenance = parseFloat(maintenanceCharge) || 0;
  const subTotal = +(smallTotal + bigTotal + maintenance).toFixed(2);
  const tax = +(subTotal * TAX_RATE).toFixed(2);
  const autoGrandTotal = +(subTotal + tax).toFixed(2);
  const manual = parseFloat(manualGrandTotal);
  const grandTotal =
    !isNaN(manual) && String(manualGrandTotal).trim() !== "" ? +manual.toFixed(2) : autoGrandTotal;
  const grandDiscount =
    !isNaN(manual) && String(manualGrandTotal).trim() !== ""
      ? +Math.max(0, autoGrandTotal - manual).toFixed(2)
      : phaseDiscount;
  return {
    smallTotal: +smallTotal.toFixed(2),
    bigTotal: +bigTotal.toFixed(2),
    smallDiscount,
    bigDiscount,
    phaseDiscount,
    subTotal,
    tax,
    autoGrandTotal,
    grandTotal,
    grandDiscount,
    maintenance,
  };
}

export function calcPayment(grandTotal, cashPaid, gpayPaid) {
  const cash = parseFloat(cashPaid) || 0;
  const gpay = parseFloat(gpayPaid) || 0;
  const totalPaid = +(cash + gpay).toFixed(2);
  const balance = +Math.max(0, grandTotal - totalPaid).toFixed(2);
  return { cash, gpay, totalPaid, balance };
}

export function calcSalesSummary(bills) {
  let totalAmount = 0, totalCash = 0, totalGpay = 0, totalBalance = 0;
  let totalSmallGoats = 0, totalBigGoats = 0, totalSmallKg = 0;
  let totalSmallCutting = 0, totalBigCutting = 0;

  bills.forEach((b) => {
    totalAmount += b.grandTotal || 0;
    totalCash += b.cashPaid || 0;
    totalGpay += b.gpayPaid || 0;
    totalBalance += b.balance || 0;
    totalSmallCutting += b.smallGoatCutting || 0;
    totalBigCutting += b.bigGoatCutting || 0;

    if (b.smallRows) {
      b.smallRows.forEach((r) => {
        const qty = parseFloat(r.qty) || 0;
        const kg = parseFloat(r.kg) || 0;
        const price = parseFloat(r.price) || 0;
        if (price > 0 || qty > 0) {
          totalSmallGoats += qty;
          totalSmallKg += kg * qty;
        }
      });
    }
    if (b.bigRows) {
      b.bigRows.forEach((r) => {
        const qty = parseFloat(r.qty) || 0;
        const price = parseFloat(r.price) || 0;
        if (price > 0 || qty > 0) totalBigGoats += qty;
      });
    }
  });

  return {
    totalAmount: +totalAmount.toFixed(2),
    totalCash: +totalCash.toFixed(2),
    totalGpay: +totalGpay.toFixed(2),
    totalBalance: +totalBalance.toFixed(2),
    totalPaid: +(totalCash + totalGpay).toFixed(2),
    count: bills.length,
    totalSmallGoats: +totalSmallGoats.toFixed(0),
    totalBigGoats: +totalBigGoats.toFixed(0),
    totalSmallKg: +totalSmallKg.toFixed(2),
    totalSmallCutting: +totalSmallCutting.toFixed(0),
    totalBigCutting: +totalBigCutting.toFixed(0),
  };
}
