CREATE POLICY "No public access to contact_requests"
  ON public.contact_requests
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);