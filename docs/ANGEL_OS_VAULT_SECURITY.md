# Angel OS Vault — sécurité et déploiement

## Objectif

Permettre à Angel OS de conserver dans GitHub des configurations sensibles uniquement sous forme chiffrée, tout en gardant les clés maîtres et secrets de bootstrap hors du dépôt.

## Architecture cible

1. L'administrateur saisit un secret dans l'interface privée.
2. Une fonction serveur vérifie réellement la session Supabase et le rôle `admin` côté serveur.
3. Le secret est testé contre le fournisseur concerné lorsque c'est possible.
4. Le serveur chiffre la valeur avec `ANGEL_OS_VAULT_KEY` via `src/lib/angel-vault.server.ts`.
5. Seule l'enveloppe chiffrée est écrite dans `config/angel-os-secrets.enc.json`.
6. Le runtime charge l'enveloppe et la déchiffre uniquement côté serveur au moment où le secret est requis.
7. La valeur en clair n'est jamais envoyée à React, jamais loguée et jamais commitée.

## Secrets de bootstrap qui restent hors GitHub

- `ANGEL_OS_VAULT_KEY`
- un éventuel `GITHUB_VAULT_TOKEN` / GitHub App credential utilisé pour écrire le registre chiffré
- les identifiants nécessaires à la vérification serveur des sessions si le runtime les exige

Ces secrets doivent être conservés dans Vercel Environment Variables, GitHub Environment Secrets ou un gestionnaire de secrets équivalent.

## Interdictions

- ne jamais utiliser une clé de chiffrement présente dans le JavaScript envoyé au navigateur ;
- ne jamais enregistrer la clé maître dans `localStorage`, IndexedDB ou un cookie lisible côté client ;
- ne jamais stocker la clé maître dans le même dépôt que les données qu'elle chiffre ;
- ne jamais exposer une route de chiffrement/déchiffrement sans contrôle d'autorisation côté serveur ;
- ne jamais renvoyer un secret déchiffré à l'interface après son enregistrement.

## État actuel

Le dépôt possède désormais :

- le moteur AES-256-GCM serveur ;
- un registre chiffré versionnable ;
- des règles `.gitignore` empêchant les artefacts en clair les plus courants ;
- la documentation de rotation et de bootstrap.

Avant d'activer l'écriture automatique depuis l'administration, il faut ajouter un garde `requireServerAdmin()` vérifiant la session et le rôle admin côté serveur. L'interface actuelle vérifie le rôle dans React ; ce contrôle visuel ne suffit pas pour protéger une mutation de secrets.
