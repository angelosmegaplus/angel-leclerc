-- Keep the role-based admin policy, but make article deletion resilient to
-- owner-account recovery/recreation. Supabase RLS can otherwise silently
-- filter a DELETE when the user_roles row is temporarily missing.

DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;

CREATE POLICY "Admins can delete articles" ON public.articles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'contact@angel-leclerc.fr',
      'angel.leclerc@icloud.com',
      'angelleclerc2006@gmail.com'
    )
  );

-- Repair the durable admin role as well when one of the owner accounts already
-- exists. This keeps INSERT/UPDATE/SELECT aligned with DELETE after recovery.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'contact@angel-leclerc.fr',
  'angel.leclerc@icloud.com',
  'angelleclerc2006@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
