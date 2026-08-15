# Angel Native Stack

Objectif : couvrir les besoins fonctionnels des technologies cibles sans imposer de connexion, de compte ou de configuration manuelle à l’utilisateur.

## Base active

- React / TypeScript / Tailwind CSS / Vite / Framer Motion : interface et expérience utilisateur.
- TanStack Start : serveur web/API actuel, utilisé tant qu’un serveur Express autonome n’est pas provisionné automatiquement.
- Angel Native Storage : IndexedDB pour les données privées/offline qui n’ont pas besoin d’être partagées entre appareils.
- Angel Native Cache : cache mémoire rapide pour remplacer Redis quand aucun Redis auto-provisionné n’existe.
- Angel Native Worker : exécution de tâches TypeScript en processus courant, pour remplacer les petits workers Python/Rust lorsqu’aucun runtime externe n’est disponible.
- Request Queue Angel OS : file de tâches interne existante.

## Technologies cibles et alternatives automatiques

| Technologie cible | Besoin couvert | Alternative immédiate sans connexion |
|---|---|---|
| Express | API / backend | Routes serveur TanStack Start |
| MySQL | données relationnelles | couche de données actuelle + Angel Native Storage pour le privé/offline |
| Redis | cache / file / état éphémère | Angel Native Cache + request queue |
| Python | automatisation / traitement | Angel Native Worker TypeScript |
| Rust | outils système / performance | Angel Native Worker et utilitaires TypeScript |
| ZTP | provisionnement serveur | pipeline GitHub/Vercel existant tant qu’un VPS n’est pas auto-provisionnable |

## Règles

1. Une technologie externe n’est activée que si Angel OS peut la provisionner et la configurer automatiquement.
2. Aucun écran ne doit afficher « connecté » ou « actif » pour une brique qui n’a pas passé un contrôle réel.
3. Une fonction existante et fiable n’est pas supprimée avant que l’alternative Angel Native soit au moins équivalente.
4. Les données sensibles ou multi-appareils restent sur la couche de production existante tant qu’un stockage serveur Angel Native réellement persistant n’est pas disponible.
5. Les briques externes deviennent des accélérateurs optionnels, jamais des prérequis au fonctionnement du site.
