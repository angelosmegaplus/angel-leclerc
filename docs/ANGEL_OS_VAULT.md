# Angel OS Vault

Angel OS Vault permet de versionner sur GitHub des valeurs sensibles uniquement sous forme chiffrée.

## Règle de sécurité

La clé maître ne doit jamais être commitée dans GitHub, envoyée au navigateur ou affichée dans l'administration.

La variable serveur obligatoire est :

- `ANGEL_OS_VAULT_KEY` : clé aléatoire de 32 octets encodée en base64.

Elle doit être stockée dans un gestionnaire de secrets (Vercel Environment Variables, GitHub Environment Secrets ou équivalent).

## Format

Les secrets sont chiffrés avec AES-256-GCM. Chaque valeur possède un IV aléatoire, un tag d'authentification et un identifiant de clé (`kid`). Le contenu chiffré peut être commité dans le dépôt.

Exemple de structure :

```json
{
  "v": 1,
  "alg": "aes-256-gcm",
  "kid": "0123456789abcdef",
  "iv": "...",
  "tag": "...",
  "ciphertext": "...",
  "createdAt": "2026-08-16T00:00:00.000Z"
}
```

## Ce qui peut aller dans GitHub

- clés API chiffrées ;
- jetons chiffrés ;
- mots de passe techniques chiffrés ;
- configuration privée chiffrée ;
- fichiers de configuration dont seuls certains champs sont chiffrés.

## Ce qui ne doit jamais aller dans GitHub

- `ANGEL_OS_VAULT_KEY` ;
- une clé de récupération en clair ;
- un dump mémoire contenant les secrets déchiffrés ;
- un fichier `.env` réel ;
- un log affichant une valeur sensible.

## Bootstrap

Angel OS doit conserver au minimum quelques secrets hors du dépôt :

1. `ANGEL_OS_VAULT_KEY` pour déchiffrer le coffre ;
2. les identifiants nécessaires au runtime avant que le coffre ne soit accessible ;
3. éventuellement un jeton GitHub serveur si Angel OS doit écrire automatiquement les fichiers chiffrés dans le dépôt.

Le coffre ne peut pas déchiffrer sa propre clé maître : elle reste un secret d'infrastructure.

## Administration

L'écran `Connexions API` doit évoluer vers un coffre central :

- saisie d'un secret depuis l'espace administrateur ;
- transmission HTTPS vers une fonction serveur ;
- chiffrement immédiat côté serveur ;
- suppression de la valeur en clair de la mémoire applicative dès que possible ;
- stockage du seul contenu chiffré ;
- jamais de réaffichage du secret dans l'interface ;
- bouton Tester ;
- statut opérationnel / erreur ;
- date de dernière vérification ;
- journal d'audit sans valeur sensible ;
- rotation de clé et re-chiffrement contrôlé.

## Contexte de chiffrement

Le module accepte un `context` qui est utilisé comme AAD (Additional Authenticated Data). Pour une clé API, utiliser un contexte stable tel que :

`angel-os:integration:openai:OPENAI_API_KEY`

Ainsi un bloc chiffré copié dans un autre emplacement ou utilisé sous un autre nom ne peut pas être déchiffré avec succès si le contexte ne correspond pas.

## Rotation

Une future rotation doit suivre :

1. charger l'ancienne clé côté serveur ;
2. déchiffrer chaque secret ;
3. chiffrer avec la nouvelle clé ;
4. vérifier chaque valeur ;
5. publier les nouveaux blocs chiffrés ;
6. remplacer la clé serveur ;
7. retirer l'ancienne clé après validation.

Ne jamais écraser la seule copie récupérable d'un secret avant validation du nouveau chiffrement.
