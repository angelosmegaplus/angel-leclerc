-- blog_subscribers : écriture interdite depuis le client (anon/authenticated).
-- Les inscriptions/désinscriptions passent exclusivement par les server functions
-- (client service_role), qui valident l'e-mail et le honeypot.
REVOKE INSERT, UPDATE, DELETE ON public.blog_subscribers FROM anon;
REVOKE INSERT, UPDATE ON public.blog_subscribers FROM authenticated;
REVOKE SELECT ON public.blog_subscribers FROM anon;
GRANT SELECT, DELETE ON public.blog_subscribers TO authenticated; -- filtré par RLS admin
GRANT ALL ON public.blog_subscribers TO service_role;

COMMENT ON TABLE public.blog_subscribers IS
  'Liste des abonnés au blog. Aucune écriture cliente : inscription/désinscription uniquement via server functions (service_role). Lecture/suppression réservées aux administrateurs via RLS.';

-- user_roles : aucune écriture possible depuis le client, quelle que soit la session.
-- Empêche toute élévation de privilèges (auto-attribution du rôle admin).
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE SELECT ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated; -- limité à ses propres rôles par RLS
GRANT ALL ON public.user_roles TO service_role;

COMMENT ON TABLE public.user_roles IS
  'Attribution des rôles. Écriture interdite depuis le client (aucun GRANT ni policy INSERT/UPDATE/DELETE) : les rôles sont gérés uniquement côté serveur (trigger handle_new_user_role / service_role).';