# Déploiement & indépendance — angel-leclerc.fr

## Principe : GitHub d'abord, Lovable seulement pour l'hébergement

1. **La source de vérité est GitHub.** Tout le code du site (TanStack Start + React + Tailwind) est versionné dans le dépôt GitHub connecté au projet. Aucune modification ne doit exister uniquement dans Lovable.
2. **CI avant production.** Chaque branche/PR doit passer :
   - `bun install --frozen-lockfile`
   - `bunx tsc --noEmit --pretty false` (TypeScript)
   - `bun run build` (build de production)
   Une PR qui échoue ne doit jamais être fusionnée sur `main`.
3. **Lovable = hébergement / publication.** Lovable sert uniquement à builder et publier `main` sur `angel-leclerc.fr`. Aucun service de déploiement supplémentaire (Cloudflare, Vercel, etc.) n'est utilisé ni nécessaire.
4. **Base de données & auth.** Le backend (base Postgres, authentification, stockage, fonctions serveur) reste géré par Lovable Cloud / Supabase. Les migrations SQL sont conservées dans `supabase/migrations/`.

## Chemin automatique

- La synchronisation GitHub native du projet est bidirectionnelle : un commit poussé sur `main` est repris par Lovable, une modification faite dans Lovable est commitée dans le dépôt.
- Flux recommandé : brancher depuis `main` → PR → CI verte → merge → publication depuis Lovable.

### Exemple de workflow GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx tsc --noEmit --pretty false
      - run: bun run build
```

## Ce qui reste dépendant de credentials externes

| Service | Variables serveur requises | État sans credentials |
| --- | --- | --- |
| Google Workspace (Gmail, Drive, Agenda) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | UI prête, bouton « Activation serveur requise » |
| YouTube | mêmes identifiants Google (scope séparé) | idem |
| Microsoft 365 (Outlook, OneDrive, Agenda) | `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID` | idem |
| Meta (Facebook/Instagram) | `META_APP_ID`, `META_APP_SECRET` | idem |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | idem |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` | idem |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | idem |
| Canva | `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET` | idem |
| Adobe | `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET` | idem |
| Analyse IA externe (optionnelle) | `OPENAI_API_KEY` | Angel OS fonctionne, seules les suggestions IA externes sont désactivées |

### URL de redirection à déclarer chez chaque fournisseur

```
https://angel-leclerc.fr/api/public/oauth/<fournisseur>/callback
```

(`google`, `youtube`, `microsoft`, `meta`, `linkedin`, `x`, `github`, `canva`, `adobe`)

## Sécurité des jetons

- Les jetons d'accès et de rafraîchissement sont **chiffrés (AES-256-GCM)** puis stockés dans la table privée `oauth_connections`.
- Cette table n'a **aucune politique d'accès client** : seuls les traitements serveur peuvent la lire.
- Aucun jeton n'est jamais envoyé au navigateur, ni stocké dans `localStorage`.
- Le paramètre `state` OAuth est chiffré et signé (HMAC), avec expiration de 10 minutes → protection anti-CSRF.
