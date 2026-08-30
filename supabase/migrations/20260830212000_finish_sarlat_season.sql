-- Termine l'expérience saisonnière de propreté urbaine affichée sur le parcours.
UPDATE public.content_items
SET period = 'Juillet – août 2026 · 2 mois',
    updated_at = now()
WHERE section = 'experience'
  AND title = 'Agent de propreté urbaine (emploi saisonnier)'
  AND subtitle = 'Mairie de Sarlat-la-Canéda';
