# Angel Native Stack

Objectif : rendre Angel OS nettement plus puissant en combinant les services externes déjà fonctionnels avec des moteurs internes développés pour Angel OS.

## Principe

Angel Native n’est pas un plan de sortie des services externes. C’est une couche d’amplification.

Quand un service externe apporte des données, une infrastructure ou une puissance utile, Angel OS le conserve. En parallèle, les briques Angel Native peuvent prétraiter les entrées, enrichir les résultats, mettre en cache, agréger plusieurs sources, automatiser des étapes, journaliser, prioriser, reprendre en cas d’échec et faire tourner certaines tâches localement.

La puissance cible vient donc de l’addition : externe + natif, pas du remplacement systématique de l’un par l’autre.

## Base active

- React / TypeScript / Tailwind CSS / Vite / Framer Motion : interface, cockpit et expérience utilisateur.
- TanStack Start : serveur web/API actuel.
- Angel Native Storage : persistance locale/offline structurée via IndexedDB.
- Angel Native Cache : cache mémoire namespacé et état éphémère.
- Angel Native Worker : moteur de tâches interne et enrichissement.
- Request Queue Angel OS : file de tâches interne existante.
- Hybrid Orchestrator : coordination entre fournisseurs externes et moteurs internes.

## Équivalents internes complémentaires

| Technologie de référence | Besoin Angel OS | Brique Angel Native | Rôle complémentaire |
|---|---|---|---|
| Express | routage API, middleware, contrôles | Angel Native API Router | centraliser et pré/post-traiter les appels aux services existants |
| MySQL | collections, relations, index, requêtes structurées | Angel Native Data Engine | index local, vues dérivées, données calculées et cache structuré |
| Redis | cache, TTL, files, pub/sub, verrous | Angel Native Realtime Core | accélération, coordination, déduplication et temps réel |
| Python | automatisation, pipelines, traitement de données | Angel Native Automation Engine | analyses, enrichissements et automatisations spécialisées |
| Rust | tâches intensives et fonctions bas niveau | Angel Native Compute Layer | accélérer les traitements réellement coûteux |
| ZTP | bootstrap automatique d’une instance | Angel Native Bootstrap | préparer et réparer automatiquement l’environnement quand possible |

## Orchestration hybride

Le Hybrid Orchestrator peut utiliser plusieurs modes :

- `cascade` : utiliser le fournisseur prioritaire puis basculer automatiquement si nécessaire ;
- `race` : lancer plusieurs fournisseurs et conserver le premier résultat valide ;
- `merge` : interroger plusieurs moteurs et fusionner leurs résultats ;
- cache : éviter les appels inutiles et accélérer l’interface ;
- workers : enrichir un résultat externe avec des traitements internes sans bloquer le flux principal.

## Règles

1. Un service externe fonctionnel n’est jamais supprimé simplement parce qu’un équivalent Angel Native existe.
2. Les briques Angel Native doivent augmenter la puissance globale : vitesse, résilience, contexte, automatisation, enrichissement ou capacité hors ligne.
3. Plusieurs moteurs peuvent travailler sur la même tâche si leur combinaison apporte un résultat meilleur.
4. Aucun écran ne doit afficher « connecté », « actif » ou « équivalent » si la fonction correspondante n’existe pas réellement.
5. Une brique maison vise la parité ou un avantage fonctionnel sur les besoins d’Angel OS, pas la reproduction intégrale d’un moteur généraliste.
6. Aucune configuration manuelle utilisateur ne doit être nécessaire pour les fonctions Angel Native.
7. Les données sensibles ou multi-appareils restent sur la couche de production fiable ; Angel Native peut les indexer ou les enrichir sans prétendre remplacer cette source de vérité.
8. Le critère de réussite est la puissance obtenue par la combinaison des couches, pas l’indépendance maximale.
