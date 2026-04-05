-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  subject text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('clients', 'drivers', 'all')),
  recipient_count int DEFAULT 0,
  status text DEFAULT 'sent'
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on promotions" ON public.promotions
  USING ((auth.jwt() ->> 'email') = 'capeload.za@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'capeload.za@gmail.com');
