# CodeX — Flux de travail et responsabilités

- ChatGPT = pilotage (description, choix, validation).
- Copilot / Codex = implémentation (génération de code, suggestions).
- GitHub (`angelosmegaplus/angel-leclerc`) = source de vérité.
- Lovable = synchronisation + hébergement / publication uniquement.

Processus recommandé

1. Créer une branche pour tout changement non trivial (nommer la branche de manière descriptive).
2. Exécuter les tests et la CI locale si applicable.
3. Ouvrir une Pull Request vers `main` pour revue.
4. Ne MERGER que si la CI est verte et la revue approuvée.
5. Ne jamais toucher à `angelosmegaplus/alc`.
