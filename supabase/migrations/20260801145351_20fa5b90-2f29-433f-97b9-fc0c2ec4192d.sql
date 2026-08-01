-- 1. Article images/files: remove unrestricted public read, scope to admins
DROP POLICY IF EXISTS "article images readable" ON storage.objects;
DROP POLICY IF EXISTS "article files readable" ON storage.objects;

CREATE POLICY "admins read article images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read article files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'article-files' AND public.has_role(auth.uid(), 'admin'));

-- 2. Contact uploads: admin-only access
CREATE POLICY "admins read contact uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contact-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete contact uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contact-uploads' AND public.has_role(auth.uid(), 'admin'));

-- 3. Trigger-only SECURITY DEFINER function must not be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;