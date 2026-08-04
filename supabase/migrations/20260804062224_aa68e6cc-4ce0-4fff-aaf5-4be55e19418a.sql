DROP POLICY "Contenus visibles publiquement" ON public.content_items;

CREATE POLICY "Contenus publies visibles par tous"
  ON public.content_items FOR SELECT
  USING (published = true);

CREATE POLICY "Admins voient tous les contenus"
  ON public.content_items FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));