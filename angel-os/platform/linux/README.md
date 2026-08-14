# Angel OS — plateforme Linux

Cette plateforme permet d’exécuter angel-leclerc.fr sans dépendre de Vercel pour le runtime principal.

## Architecture

- **angel-app** : application web TanStack/Nitro construite en cible Node Linux.
- **angel-data** : service de données natif Angel OS, exécuté avec Bun et connecté à PostgreSQL.
- **angel-postgres** : base PostgreSQL persistante.
- **angel-caddy** : terminaison HTTPS et reverse proxy vers l’application.
- **angel-storage** : volume persistant pour les fichiers et futurs services de stockage natifs.
- **angel-backup** : sauvegarde PostgreSQL quotidienne gérée par systemd.

Le service `angel-data` fournit une API interne authentifiée pour stocker des documents JSON par namespace/clé. L’application y accède via l’adaptateur `angel.data.native`. Supabase reste utilisable pendant la migration, mais n’est plus la seule cible architecturale.

## Installation

1. Installer Podman et systemd sur une distribution Linux compatible.
2. Copier `env.example` vers `/etc/angel-os/angel-os.env` et remplacer tous les secrets, notamment `POSTGRES_PASSWORD` et `ANGEL_DATA_TOKEN`.
3. Copier `Caddyfile` vers `/etc/angel-os/Caddyfile` et vérifier le domaine.
4. Exécuter `scripts/install.sh` avec l’utilisateur qui exécutera les services rootless.
5. Vérifier `angel-postgres`, `angel-data`, `angel-app` et `angel-caddy` avec `systemctl --user status`.

## Migration progressive

La migration doit se faire fonction par fonction :

1. écrire une fonction via l’adaptateur Angel Data ;
2. conserver temporairement Supabase en lecture/fallback si nécessaire ;
3. copier les données existantes ;
4. comparer les résultats ;
5. basculer la lecture vers Angel Data ;
6. retirer la dépendance Supabase seulement lorsque la fonction est validée.

L’authentification et le stockage de fichiers seront migrés dans des services séparés afin de ne pas mélanger identité, données applicatives et médias.

## Sauvegardes

`angel-backup.timer` déclenche une sauvegarde PostgreSQL quotidienne. Les sauvegardes doivent ensuite être répliquées vers une seconde machine ou un stockage chiffré externe pour qu’une panne matérielle du serveur principal ne soit pas un point de défaillance unique.
