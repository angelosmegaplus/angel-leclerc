# Angel OS — plateforme Linux

Cette arborescence fournit une cible d'hébergement autonome pour angel-leclerc.fr. L'objectif est que le site puisse fonctionner sur un serveur Linux standard sans dépendre de Vercel ou Lovable pour l'exécution.

## Architecture

Caddy reçoit le trafic HTTPS et le transmet à l'application Angel OS. L'application tourne dans un conteneur Podman rootless. PostgreSQL fournit la base de données locale. Les volumes restent persistants sur l'hôte. systemd/Quadlet démarre et surveille les services. Un timer systemd déclenche les sauvegardes PostgreSQL.

Chaîne cible :

internet → Caddy → Angel OS App → adaptateurs → PostgreSQL / stockage / fournisseurs optionnels

Les fournisseurs externes restent interchangeables derrière les adaptateurs Angel OS. GitHub, Vercel, Google, Supabase ou d'autres services ne doivent jamais devenir des dépendances structurelles du noyau.

## Installation

1. Installer Podman et systemd sur Debian ou Ubuntu.
2. Autoriser le compte de service rootless à écouter sur 80/443 (par exemple via `net.ipv4.ip_unprivileged_port_start=80`) ou placer Caddy système devant les conteneurs.
3. Copier `env.example` vers `/etc/angel-os/angel-os.env` et renseigner les secrets.
4. Copier `Caddyfile` vers `/etc/angel-os/Caddyfile`.
5. Construire l'image avec `podman build -f angel-os/platform/linux/Containerfile -t localhost/angel-leclerc:latest .`.
6. Exécuter `angel-os/platform/linux/scripts/install.sh` avec l'utilisateur de service.

Cette configuration est une base reproductible. Les migrations de données depuis Supabase/Lovable doivent être réalisées séparément et validées avant toute bascule DNS. Les adaptateurs permettent de conserver ces fournisseurs pendant la migration puis de les remplacer sans modifier le noyau.
