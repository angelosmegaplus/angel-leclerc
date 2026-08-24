# Flamme — application sociale (BÊTA)

## Point de blocage à trancher avant de coder

`/flamme` est déjà occupé par le **moteur de recherche Flamme (bêta)** — 2 191 lignes, panneaux Radio/TV/Mail/Réseaux/IA Mistral, actualités RSS régionales, PWA `flamme.webmanifest`. La demande place l'application sociale exactement sur la même URL.

Hypothèse retenue (à corriger si besoin) :

- Le **moteur de recherche reste à `/flamme`** (inchangé, aucune régression).
- L'**application sociale** vit sous **`/flamme/social`** et ses sous-routes, avec un accès croisé discret depuis le moteur (icône « Flamme social — Bêta » dans le carrousel) et depuis le pied de page du site principal.

Alternative possible si vous préférez : le social prend `/flamme` et le moteur déménage en `/flamme/recherche`. Dites-le et j'inverse.

## Périmètre livré en une seule passe (bêta réellement fonctionnelle)

Rien du site existant n'est modifié hors de ces points : ajout d'un lien discret dans le pied de page et dans le carrousel du moteur.

### Base de données (une migration, tables préfixées `flamme_`)
`flamme_profiles`, `flamme_blocks`, `flamme_follows`, `flamme_posts`, `flamme_post_media`, `flamme_reactions`, `flamme_comments`, `flamme_saved_items`, `flamme_groups`, `flamme_group_members`, `flamme_conversations`, `flamme_conversation_members`, `flamme_device_keys`, `flamme_conversation_keys`, `flamme_messages`, `flamme_notifications`, `flamme_reports`, `flamme_events`, `flamme_event_attendees`.

UUID, `created_at`, index, contraintes uniques, GRANT explicites, RLS stricte sur chaque table. Aucune table ne donne de rôle : `user_roles`/Angel OS n'est jamais touché, donc aucune élévation de privilège possible depuis Flamme. Un compte Flamme = un `auth.users` + une ligne `flamme_profiles` ; l'accès `/admin` reste conditionné à `user_roles`.

Deux buckets Storage privés : `flamme-media` (images/vidéos de publications) et `flamme-avatars`, avec politiques par propriétaire et lecture selon visibilité.

### Écrans
- **Layout `/flamme/social`** : en-tête (logo flamme dessiné en SVG interne, badge BÊTA, loupe, cloche, avatar), barre inférieure fixe mobile (Accueil, Publications, Vidéos, Groupes, Messages), colonne latérale + colonne droite sur ordinateur, bandeau « Version bêta : certaines fonctions peuvent évoluer ».
- **Non connecté** : présentation courte, « Rejoindre Flamme » / « Se connecter » (Supabase Auth e-mail + Google), création du profil (@identifiant unique).
- **Accueil** : fil mixte contacts + groupes + suggestions.
- **Publications** : compositeur (texte, images, vidéo courte, sondage simple, visibilité Public/Contacts/Moi uniquement), fil complet, J'aime / Commenter / Partager / Enregistrer / Signaler, commentaires avec réponses, édition et suppression par l'auteur, chargement progressif.
- **Vidéos** : format 9:16, défilement vertical, lecture/pause, muet par défaut, actions sociales.
- **Groupes** : création (nom, description, image, confidentialité public/privé/sur invitation), rôles propriétaire/modérateur/membre, page groupe, rejoindre/quitter, invitations, RLS bloquant les non-membres.
- **Contacts** : abonnements, abonnés, demandes en attente (acceptation requise pour les comptes privés).
- **Messages** : conversations 1-à-1 et de groupe, Realtime, états envoyé/lu, chiffrement client (détail ci-dessous), page d'explication honnête. Pas de pièces jointes en bêta.
- **Découvrir**, **Recherche globale**, **Alertes**, **Enregistrés**, **Événements** (public/privé, participer/peut-être/refuser, à venir/passés), **Mon compte**, **Paramètres** (confidentialité, sécurité, comptes bloqués, suppression du profil Flamme).

### Chiffrement des messages
Web Crypto uniquement : paire ECDH P-256 par appareil (clé privée non exportable en IndexedDB), clé de conversation AES-GCM 256 enveloppée par participant via ECDH + HKDF, IV unique par message, Supabase ne stocke que ciphertext + IV + métadonnées. Changement d'appareil : l'historique ancien reste illisible, annoncé explicitement — aucune fausse récupération. Mistral n'intervient jamais dans ce flux.

### Mistral
Réutilise la route serveur sécurisée existante, étendue avec des modes : modération de contenus **publics**, mots-clés pour Découvrir, résumé d'un fil public. Contenu privé transmis uniquement sur signalement explicite confirmé par l'utilisateur. Sans `MISTRAL_API_KEY`, les fonctions IA sont masquées et l'application fonctionne normalement.

### Qualité
États chargement/vide/erreur, aucun bouton mort, responsive, labels et focus clavier, texte rendu sans HTML arbitraire, rate limits applicatifs, validation MIME/taille des envois, aucune donnée personnelle factice.

## Note de réalisme

C'est l'équivalent d'une petite application sociale complète. Je le livre en plusieurs passes successives dans cet ordre : (1) migration + auth/profils + layout, (2) publications/commentaires/réactions/enregistrés, (3) vidéos + groupes + contacts, (4) messagerie chiffrée + Realtime, (5) alertes, découvrir, recherche, événements, modération, paramètres. Chaque passe est testée et laisse l'application utilisable.
