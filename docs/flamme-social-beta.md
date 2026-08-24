# Flamme social — bêta

Flamme social est l’application sociale du site, séparée du moteur de recherche Flamme existant.

- Moteur Flamme : `/flamme`
- Réseau Flamme : `/flamme/social`

## Fonctions de la bêta

Accueil, Publications, Vidéos, Groupes, Messages, Découvrir, Alertes, Contacts, Enregistrés, Événements, Recherche, Mon compte et Paramètres.

## Données et sécurité

Les données sociales utilisent des tables `flamme_*` dédiées dans Supabase avec RLS activé. Le rôle `anon` n’a aucun privilège direct sur ces tables. Les rôles sociaux ne confèrent aucun privilège Angel OS.

Les messages privés sont chiffrés côté navigateur avec Web Crypto : ECDH P-256 pour l’accord de secret, HKDF SHA-256 pour la dérivation et AES-GCM 256 pour la clé de conversation et les messages. Les clés privées restent dans IndexedDB sur l’appareil. Supabase stocke le texte chiffré, l’IV et les métadonnées nécessaires, pas le texte en clair.

Un changement ou une perte d’appareil peut rendre un ancien historique illisible si aucune clé de conversation n’a été enveloppée pour ce nouvel appareil. La bêta préfère afficher cette limite plutôt que simuler une récupération impossible.

## Mistral

Mistral n’est pas utilisé comme système de chiffrement. Il est facultatif et sert uniquement à aider à la modération de contenus publics. Les messages privés déchiffrés ne sont jamais transmis automatiquement à Mistral. Un message privé signalé ne peut être transmis à la modération que sur action explicite et confirmée de l’utilisateur.

## Médias privés

Le bucket média de cette première bêta sert uniquement aux contenus publics. Les publications `Contacts` et `Moi uniquement` restent texte seulement jusqu’à l’ajout d’un stockage/chiffrement média adapté.

## Limites actuelles

La messagerie utilisateur expose les conversations individuelles. Le schéma de données prévoit les conversations de groupe, mais leur interface n’est pas activée dans cette première bêta.
