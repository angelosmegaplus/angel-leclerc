# Ancienne architecture hybride — ARCHIVÉE

Ce document décrit une architecture qui n'est plus utilisée.

## Architecture active

- **GitHub** est la source de vérité du code.
- **Lovable** synchronise le dépôt, exécute le runtime nécessaire au site et publie `angel-leclerc.fr`.
- **Aucun déploiement Vercel n'est requis ni utilisé par l'architecture active.**
- Les secrets serveur (TMDB, IA, OAuth, etc.) sont lus depuis l'environnement du runtime actif via `src/lib/runtime-credentials.server.ts`.

## Publication

Le fonctionnement attendu est désormais :

`modification GitHub → synchronisation Lovable → clic sur Publier → angel-leclerc.fr`

Ce fichier est conservé uniquement comme trace historique afin d'éviter qu'une ancienne procédure hybride soit réintroduite par erreur.
