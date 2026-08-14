#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
PLATFORM="$ROOT_DIR/angel-os/platform/linux"
QUADLET_DIR="$HOME/.config/containers/systemd"
SYSTEMD_DIR="$HOME/.config/systemd/user"
LIB_DIR="$HOME/.local/lib/angel-os"

command -v podman >/dev/null || { echo "Podman est requis" >&2; exit 1; }
command -v systemctl >/dev/null || { echo "systemd est requis" >&2; exit 1; }

mkdir -p "$QUADLET_DIR" "$SYSTEMD_DIR" "$LIB_DIR" /tmp/angel-os-install
install -m 0644 "$PLATFORM"/quadlet/* "$QUADLET_DIR"/
install -m 0644 "$PLATFORM"/systemd/* "$SYSTEMD_DIR"/
install -m 0755 "$PLATFORM/scripts/backup.sh" "$LIB_DIR/backup.sh"

if [ ! -f /etc/angel-os/angel-os.env ]; then
  echo "Configuration manquante: /etc/angel-os/angel-os.env" >&2
  echo "Copier env.example dans /etc/angel-os/angel-os.env puis renseigner les secrets." >&2
  exit 2
fi
if [ ! -f /etc/angel-os/Caddyfile ]; then
  echo "Configuration manquante: /etc/angel-os/Caddyfile" >&2
  exit 2
fi

podman build -f "$PLATFORM/Containerfile" -t localhost/angel-leclerc:latest "$ROOT_DIR"
systemctl --user daemon-reload
systemctl --user enable --now angel-postgres.service angel-app.service angel-caddy.service angel-backup.timer

echo "Angel OS Linux est installé. Vérifier: systemctl --user status angel-app angel-postgres angel-caddy"
