-- ═══════════════════════════════════════════════════════════
--  BAKRID BILLING — SUPABASE SQL SETUP
--  Run this entire file in: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- 1. Bills table — stores every bill as JSON
CREATE TABLE IF NOT EXISTS bills (
  id          SERIAL PRIMARY KEY,
  bill_no     INTEGER UNIQUE NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Settings table — stores bill counter and other config
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 3. Seed bill counter starting at 0
INSERT INTO settings (key, value)
VALUES ('bill_counter', '0')
ON CONFLICT (key) DO NOTHING;

-- 4. Auto-update updated_at on bill edits
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
