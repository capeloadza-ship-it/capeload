-- Sprint 9: Promo code system
-- Run this via Supabase SQL Editor or Management API

-- 1. Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  discount_pct numeric(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses     int  NOT NULL DEFAULT 0,   -- 0 = unlimited
  uses_count   int  NOT NULL DEFAULT 0,
  expires_at   timestamptz,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS: anyone can read active codes (needed for client-side validation)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_read_active" ON promo_codes;
CREATE POLICY "promo_codes_read_active"
  ON promo_codes FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "promo_codes_admin_all" ON promo_codes;
CREATE POLICY "promo_codes_admin_all"
  ON promo_codes FOR ALL
  USING (auth.jwt() ->> 'email' = 'info@capeload.co.za');

-- 2. Add promo fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS promo_code      text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2);

-- 3. Sample promo code (10% off, 50 uses, no expiry)
-- INSERT INTO promo_codes (code, discount_pct, max_uses) VALUES ('CAPE10', 10, 50);
