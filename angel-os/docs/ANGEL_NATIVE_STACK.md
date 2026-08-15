# Angel Native Stack

Objectif : construire dans Angel OS des briques maison couvrant les mêmes besoins fonctionnels que la stack cible, sans imposer de connexion, de compte ou de configuration manuelle à l’utilisateur.

## Principe

Les services externes déjà fonctionnels sont conservés. Angel Native ne les remplace pas par défaut : il fonctionne en parallèle et augmente l’autonomie du système.

Lorsqu’une technologie exige normalement une connexion ou un service séparé, Angel OS doit disposer d’une implémentation interne couvrant les usages réellement nécessaires au projet. Cette implémentation est développée de zéro pour Angel OS, sans prétendre être un clone généraliste complet du produit d’origine.

## Base active

- React / TypeScript / Tailwind CSS / Vite / Framer Motion : interface et expérience utilisateur.
- TanStack Start : serveur web/API actuel.
- Angel Native Storage : persistance locale/offline structurée via IndexedDB.
- Angel Native Cache : cache mémoire namespacé et état éphémère.
- Angel Native Worker : moteur de tâches interne.
- Request Queue Angel OS : file de tâches interne existante.

## Équivalents Angel Native à construire

| Technologie de référence | Besoin Angel OS | Brique Angel Native |
|---|---|---|
| Express | routage API, middleware, contrôles | Angel Native API Router |
| MySQL | collections, relations, index, requêtes structurées | Angel Native Data Engine |
| Redis | cache, TTL, files, pub/sub, verrous | Angel Native Realtime Core |
| Python | automatisation, pipelines, traitement de données | Angel Native Automation Engine |
| Rust | tâches intensives et fonctions bas niveau | Angel Native Compute Layer |
| ZTP | bootstrap automatique d’une instance | Angel Native Bootstrap |

## Règles

1. Les services externes fonctionnels restent disponibles tant qu’ils apportent de la valeur.
2. Une brique Angel Native est développée en parallèle pour réduire la dépendance et assurer un fallback autonome.
3. Aucun écran ne doit afficher « connecté », « actif » ou « équivalent » si la fonction correspondante n’existe pas réellement.
4. Une brique maison doit viser la parité fonctionnelle sur les besoins d’Angel OS, pas la reproduction intégrale d’un moteur généraliste comme MySQL ou Rust.
5. Aucune configuration manuelle utilisateur ne doit être nécessaire pour activer les fonctions Angel Native.
6. Les données sensibles ou multi-appareils restent sur la couche de production fiable tant que la brique maison n’offre pas la même robustesse.
