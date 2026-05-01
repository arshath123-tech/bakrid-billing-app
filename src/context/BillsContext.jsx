import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const BillsContext = createContext(null);

export function BillsProvider({ children }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch all bills from Supabase ──────────────────────────
  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("bills")
        .select("bill_no, data, created_at, updated_at")
        .order("bill_no", { ascending: true });

      if (error) throw error;

      // Each row's full bill object is stored in the `data` JSONB column
      const parsed = (data || []).map((row) => ({
        ...row.data,
        bill_no: row.bill_no,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      setBills(parsed);
    } catch (err) {
      console.error("Supabase fetch error:", err);
      setError("Failed to load bills. Check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // ── Generate unique bill number via Supabase settings ──────
  async function generateBillNo() {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "bill_counter")
      .single();

    if (error) throw new Error("Could not fetch bill counter");

    const next = parseInt(data.value, 10) + 1;

    const { error: updateError } = await supabase
      .from("settings")
      .update({ value: String(next) })
      .eq("key", "bill_counter");

    if (updateError) throw new Error("Could not update bill counter");
    return next;
  }

  // ── Add bill ────────────────────────────────────────────────
  async function addBill(bill) {
    try {
      const { error } = await supabase
        .from("bills")
        .insert({ bill_no: bill.billNo, data: bill });

      if (error) throw error;
      setBills((prev) => [...prev, bill]);
    } catch (err) {
      console.error("Add bill error:", err);
      alert("Failed to save bill. Please try again.");
    }
  }

  // ── Update bill ─────────────────────────────────────────────
  async function updateBill(billNo, updated) {
    try {
      const { error } = await supabase
        .from("bills")
        .update({ data: updated })
        .eq("bill_no", billNo);

      if (error) throw error;
      setBills((prev) =>
        prev.map((b) => (b.billNo === billNo ? { ...b, ...updated } : b))
      );
    } catch (err) {
      console.error("Update bill error:", err);
      alert("Failed to update bill. Please try again.");
    }
  }

  // ── Delete bill ─────────────────────────────────────────────
  async function deleteBill(billNo) {
    try {
      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("bill_no", billNo);

      if (error) throw error;
      setBills((prev) => prev.filter((b) => b.billNo !== billNo));
    } catch (err) {
      console.error("Delete bill error:", err);
      alert("Failed to delete bill. Please try again.");
    }
  }

  return (
    <BillsContext.Provider value={{
      bills, loading, error,
      addBill, updateBill, deleteBill,
      generateBillNo, refetch: fetchBills,
    }}>
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  return useContext(BillsContext);
}
