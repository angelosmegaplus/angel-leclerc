DROP POLICY IF EXISTS authenticated_can_read_hourly_mail_reports ON public.hourly_mail_reports;

CREATE POLICY authenticated_can_read_hourly_mail_reports
  ON public.hourly_mail_reports
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));