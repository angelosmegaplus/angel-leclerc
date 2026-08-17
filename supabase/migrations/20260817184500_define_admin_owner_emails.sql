-- Canonical Angel OS administrator accounts.
-- Keep the admin identity list intentionally limited to these two addresses.

CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'angelleclerc2006@gmail.com',
    'contact@angel-leclerc.fr'
  );
$$;

-- Ensure existing accounts have the durable admin role.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'angelleclerc2006@gmail.com',
  'contact@angel-leclerc.fr'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove the admin role from the obsolete historical owner address if present.
DELETE FROM public.user_roles
WHERE role = 'admin'::public.app_role
  AND user_id IN (
    SELECT id FROM auth.users WHERE lower(email) = 'angel.leclerc@icloud.com'
  );

-- Future sign-ups/re-creations: only the two canonical owner emails become admins.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(new.email) IN (
    'angelleclerc2006@gmail.com',
    'contact@angel-leclerc.fr'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

-- Article deletion follows the same canonical administrator definition.
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
CREATE POLICY "Admins can delete articles" ON public.articles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_owner_admin());
