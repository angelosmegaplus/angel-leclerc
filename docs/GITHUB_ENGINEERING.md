# GitHub Engineering — Angel OS

## Principes

`main` représente uniquement une version intégrable. Les changements importants passent par une branche et une pull request. Les données vivantes (météo, mails, états runtime, snapshots d’actualité) ne doivent pas produire de commits Git : elles appartiennent au stockage runtime/Supabase.

## Risque

- Faible : documentation, texte, style isolé.
- Moyen : logique applicative, composant, server function isolée.
- Élevé : authentification, OAuth, sécurité, base de données, migrations, workflows, déploiement, secrets ou intégrations structurantes.

Le niveau de validation augmente avec le risque. Une modification à risque élevé doit documenter sa stratégie de vérification en production.

## Quality gate

Le dépôt doit rester bloquant sur : hygiène des secrets, installation reproductible, lint, TypeScript, build production et vérification de l’artefact. Les tests spécifiques d’une surface s’ajoutent à ce socle.

## Production

Une build verte n’est pas une preuve de fonctionnement. Une release critique n’est déclarée saine qu’après trois contrôles successifs sur la production réelle. Le SHA servi, la santé globale et la fonction métier touchée doivent rester stables lors des trois contrôles.

## Déploiements

Une seule version consolidée de `main` doit être publiée. Ne jamais créer de commit artificiel ou de redéploiement en boucle pour réveiller Vercel. En cas de quota, conserver `main` stable et attendre le retour du chemin officiel.

## Historique

Préférer le squash merge pour que chaque PR devienne une unité lisible dans l’historique. Les workflows ponctuels, scripts de migration one-shot et snapshots temporaires sont supprimés après leur utilisation ou déplacés hors du chemin permanent de CI.

## Architecture cible

La séparation logique reste : application web, Angel OS Core, Angel OS IA, Angel Guard OS et adaptateurs d’intégration. Les extractions en packages se font progressivement, sans migration massive qui casserait l’application existante.
