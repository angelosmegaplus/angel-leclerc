-- Marque l'emploi saisonnier d'agent de propreté urbaine comme terminé.
UPDATE public.content_items
SET period = 'Juillet – août 2026 · 2 mois',
    updated_at = now()
WHERE id = '5822cfce-7ccc-48fd-83e2-4307a849bb58';
