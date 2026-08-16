## Objectif
Décris le problème ou le résultat attendu en quelques lignes.

## Type de changement
- [ ] Correction
- [ ] Fonctionnalité
- [ ] Refactorisation
- [ ] Sécurité / authentification
- [ ] Intégration / API
- [ ] CI / déploiement
- [ ] Documentation uniquement

## Risque
- [ ] Faible — texte, style, documentation
- [ ] Moyen — logique applicative ou server function isolée
- [ ] Élevé — auth, OAuth, API, données, migrations, workflows ou production

## Validation
- [ ] Pas de secret ni fichier `.env` suivi par Git
- [ ] Lint
- [ ] TypeScript
- [ ] Build production
- [ ] Tests/sondes de la surface modifiée
- [ ] États loading / empty / error vérifiés si UI
- [ ] Mobile vérifié si UI

## Production
Pour une modification importante, indiquer la sonde ou le parcours qui permettra de vérifier réellement la production. Une PR n’est pas considérée terminée simplement parce que le build est vert.
