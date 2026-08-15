# Politique de file de publication

Objectif : éviter les déploiements Vercel inutiles lorsque plusieurs demandes sont faites en parallèle ou à quelques minutes d'intervalle.

## Règle principale

- Toute nouvelle modification validée est intégrée à `main`.
- La priorité de publication est toujours la version la plus récente de `main`.
- Une ancienne version de `main` ne doit pas être publiée avant une version plus récente qui la contient déjà.
- Quand Vercel redevient disponible, publier une seule fois le dernier commit consolidé de `main`.
- Après publication, vérifier le déploiement, les erreurs runtime et les fonctionnalités sensibles avant de traiter le backlog restant.

## Backlog après publication

Après un déploiement réussi du dernier `main`, traiter séparément :

1. branches de travail non fusionnées ;
2. changements bloqués par conflit ;
3. builds échoués pour une autre raison qu'une limite de quota ;
4. tâches encore présentes dans la file « À faire par ChatGPT » ;
5. corrections découvertes pendant le contrôle de production.

Les changements compatibles sont regroupés dans une nouvelle version consolidée de `main`, puis publiés ensemble.

## Anti-spam de builds

- Ne pas créer un commit artificiel uniquement pour déclencher un build tant qu'une version plus récente est déjà en attente.
- Éviter plusieurs déploiements successifs pour des changements déjà contenus dans le dernier `main`.
- En cas de `build-rate-limit`, conserver le dernier `main` comme source de vérité et attendre la prochaine fenêtre de build au lieu de republier les anciennes versions.

Cette politique s'applique à Angel OS / angel-leclerc.fr pour toutes les demandes futures sauf instruction explicite contraire.