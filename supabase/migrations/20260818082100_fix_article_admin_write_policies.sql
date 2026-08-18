-- Restore resilient owner access for article administration.

DROP POLICY IF EXISTS "Admins can read all articles" ON public.articles;
CREATE POLICY "Admins can read all articles" ON public.articles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'contact@angel-leclerc.fr',
      'angel.leclerc@icloud.com',
      'angelleclerc2006@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Admins can insert articles" ON public.articles;
CREATE POLICY "Admins can insert articles" ON public.articles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'contact@angel-leclerc.fr',
      'angel.leclerc@icloud.com',
      'angelleclerc2006@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Admins can update articles" ON public.articles;
CREATE POLICY "Admins can update articles" ON public.articles
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'contact@angel-leclerc.fr',
      'angel.leclerc@icloud.com',
      'angelleclerc2006@gmail.com'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'contact@angel-leclerc.fr',
      'angel.leclerc@icloud.com',
      'angelleclerc2006@gmail.com'
    )
  );

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

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'contact@angel-leclerc.fr',
  'angel.leclerc@icloud.com',
  'angelleclerc2006@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
