import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
//  FILL IN YOUR SUPABASE CREDENTIALS BELOW
//  Get them from: supabase.com → Your Project → Settings → API
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bikmxfgexrnamersxwqo.supabase.co";       // e.g. https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpa214ZmdleHJuYW1lcnN4d3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDUyMzQsImV4cCI6MjA5MzEyMTIzNH0.MntGr5Il1PglYpiio12RDUu4t1TiZM1zkIdS_QHY9w8";     // e.g. eyJhbGciOiJIUzI1NiIs...
// ─────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
