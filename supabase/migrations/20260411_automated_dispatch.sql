-- Automated Dispatch System (Uber/Bolt/InDrive style)
-- Broadcast matching drivers, first to accept wins

-- 1. Job offers table — tracks dispatch attempts per driver
CREATE TABLE IF NOT EXISTS job_offers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id    uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','declined','expired','lost')),
  offered_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at   timestamptz NOT NULL,
  UNIQUE(booking_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_job_offers_booking ON job_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_driver  ON job_offers(driver_id, status);

-- 2. RLS on job_offers
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;

-- Drivers can read their own offers
DROP POLICY IF EXISTS "job_offers_driver_read" ON job_offers;
CREATE POLICY "job_offers_driver_read"
  ON job_offers FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Drivers can update their own offers (accept/decline)
DROP POLICY IF EXISTS "job_offers_driver_update" ON job_offers;
CREATE POLICY "job_offers_driver_update"
  ON job_offers FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can insert offers (booking page creates them)
DROP POLICY IF EXISTS "job_offers_insert" ON job_offers;
CREATE POLICY "job_offers_insert"
  ON job_offers FOR INSERT
  WITH CHECK (true);

-- Admin can do everything
DROP POLICY IF EXISTS "job_offers_admin_all" ON job_offers;
CREATE POLICY "job_offers_admin_all"
  ON job_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  );

-- 3. Add dispatch columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS dispatch_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_count        int DEFAULT 0;

-- 4. Enable realtime on job_offers so drivers get instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE job_offers;
