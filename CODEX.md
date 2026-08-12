# Codex — Flux de travail et responsabilités

- ChatGPT = opérateur principal, orchestration et contrôle du résultat réel.
- Copilot / Codex / autres agents = implémentation complémentaire lorsque nécessaire.
- GitHub (`angelosmegaplus/angel-leclerc`) = source de vérité.
- GitHub Actions = installation reproductible, TypeScript, tests utiles et build.
- Lovable = couche mince de synchronisation, hébergement et publication ; budget de développement courant par défaut : 0 crédit.

## Références obligatoires

- `docs/ANGEL_OS_MASTER_BRIEF.md` : vision, priorités, garde-fous et définition de terminé.
- `docs/DEPLOYMENT.md` : fonctionnement réel du déploiement, secrets et dépendances externes.
- `AGENTS.md` : règles opérationnelles applicables à tous les agents.

## Processus par défaut

1. Vérifier que le dépôt est `angelosmegaplus/angel-leclerc` ; ne jamais toucher à `angelosmegaplus/alc`.
2. Inspecter l’existant et préserver les fonctions réellement opérationnelles.
3. Créer ou utiliser une branche descriptive pour tout changement non trivial.
4. Modifier le minimum nécessaire, sans force-push ni réécriture de l’historique partagé.
5. Exécuter l’installation figée, le contrôle TypeScript, les tests pertinents et le build.
6. Vérifier le diff puis ouvrir une Pull Request vers `main`.
7. Analyser la CI et corriger automatiquement les erreurs causées par le changement.
8. Ne merger que lorsque la CI et la validation requise l’autorisent.
9. Pour une livraison de production : vérifier synchronisation, publication, site public, `/admin`, mobile et PWA.

## Connexions et automatisations

- Préférer les flux OAuth/OIDC officiels avec callback serveur, state anti-CSRF et PKCE lorsqu’il est pertinent.
- Ne jamais exposer de token ou de secret au navigateur, au dépôt ou à l’utilisateur.
- Si des credentials d’application fournisseur manquent, afficher « activation serveur requise » ; ne jamais simuler « connecté ».
- Distinguer explicitement : automatique, automatique après validation, planifiée, déclenchée manuellement, préparation uniquement, activation serveur requise et non configurée.
- Automatiser les étapes techniques sûres et réversibles. Une action publique, financière, destructive ou externe sensible conserve sa validation finale.

## Principe de vérité

Ne jamais déclarer une tâche publiée, synchronisée, connectée ou terminée sans contrôle vérifiable du résultat réel.
