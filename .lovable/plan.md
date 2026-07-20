## Périmètre

Modifier uniquement :
- La section **Services** (services principaux + services complémentaires).
- La section **Comment se déroule une mission ?** (mise en avant en frise chronologique).
- La section **Contact** : remplacer les boutons par un vrai **formulaire fonctionnel** de présentation de projet.

Le reste du site (Hero, Intro, À propos, Modalités de paiement, Footer, pages légales…) reste inchangé.

## 1. Services principaux (mis en avant)

Trois blocs sobres, plus grands et plus visibles que les services complémentaires, dans cet ordre :

1. **Gestion de projet** — organisation, suivi, coordination des étapes et prestataires.
2. **Conseil en communication** — analyse, objectifs, stratégie, choix des supports/messages.
3. **Rédaction et contenus éditoriaux** — textes pros/institutionnels/journalistiques/web, enquêtes, adaptation du ton.

Sans tarif affiché en gros ici (l'activité principale). Pictogrammes Lucide déjà présents.

## 2. « Comment se déroule une mission ? »

Section dédiée avec 4 étapes en frise horizontale (desktop) / verticale (mobile) :

1. Premier échange
2. Proposition
3. Réalisation et coordination
4. Livraison et suivi

## 3. Services complémentaires

Titre + phrase : *« Ces prestations peuvent être réalisées seules ou intégrées dans une mission globale. Elles ne constituent pas le cœur principal de l'activité. »*

Liste **limitée** à :
- Rédaction de textes — à partir de 30 € (avec petite mention **« Découvrez aussi mes articles et réflexions sur Substack »** + logo Substack cliquable → https://blog.angel-leclerc.fr)
- Affiche ou flyer — à partir de 50 €
- Identité visuelle simple — à partir de 150 €
- Recherche et coordination de prestataires — sur devis
- Production audio, vidéo ou numérique sur le terrain — sur devis

En fin de rubrique, une seule mention discrète en petit :
*« Toutes les prestations sont réalisées sur devis. Les montants affichés sont uniquement des tarifs indicatifs permettant de donner un ordre de prix. »*

Visuellement moins important que les 3 principaux.

## 4. Formulaire « Présenter mon projet »

Remplace les deux boutons Appeler / E-mail actuels de la section Contact. Les boutons Appeler / E-mail restent disponibles en secondaire à côté.

**Champs** : Nom & prénom, Email, Téléphone (fac.), Structure (fac.), Type de projet (select : Gestion / Conseil / Rédaction / Affiche-flyer / Identité visuelle / Recherche prestataires / Production audio-vidéo-num / Autre), Budget (fac.), Délai (fac.), Description, Fichier (fac., 10 Mo max, formats PDF/DOC/DOCX/PNG/JPG/JPEG/WEBP/PPT/PPTX), case obligatoire RGPD, honeypot anti-bot.

Bouton : **« Présenter mon projet »** (état « Envoi en cours… »).

**Fonctionnement technique :**

- Activation de **Lovable Cloud** (Supabase géré).
- Table `contact_requests` (privée, RLS : insert public via server function, lecture service_role uniquement) pour conserver toutes les demandes.
- Bucket privé **`contact-uploads`** dans Supabase Storage pour les fichiers joints.
- **Server function TanStack** `submitProjectRequest` :
  - Valide côté serveur avec Zod (tailles, types MIME, honeypot, rate-limit simple par IP en base).
  - Upload du fichier via `supabaseAdmin` dans le bucket privé.
  - Insertion de la demande en base.
  - Génération d'un **lien signé** (24h) pour le fichier.
  - Envoi de deux e-mails via **Resend** (connecteur, gateway) :
    - Récapitulatif à **contact@angel-leclerc.fr** (objet *« Nouvelle demande de projet – [Nom] – [Type] »*, `reply_to` = email du demandeur, lien signé si fichier).
    - Confirmation au demandeur (objet *« Votre demande a bien été reçue »*, sans lien).
- Aucune clé exposée côté client ; secrets stockés côté serveur.
- Message de succès affiché, formulaire vidé. Erreurs affichées champ par champ sans effacer la saisie.

**Prérequis à confirmer avec toi :**

- L'envoi d'e-mails nécessite un **domaine expéditeur vérifié dans Resend** (par ex. `notify.angel-leclerc.fr`). Tant qu'il n'est pas vérifié, on peut utiliser `onboarding@resend.dev` mais les mails n'arriveront qu'à toi (le propriétaire du compte Resend), pas aux visiteurs. Je propose d'utiliser Resend + ton domaine ; tu ajouteras les DNS dans Resend après.
- Je vais te demander de connecter le connecteur **Resend** au moment venu.

## Livrables techniques

- Composants React : `MainServices`, `ProcessTimeline`, `ExtraServices`, `ProjectForm`.
- Migration SQL : table `contact_requests` + GRANT + RLS + bucket privé via tool storage.
- `src/lib/contact.functions.ts` : server function protégée + validation Zod.
- Petit helper `src/lib/email.server.ts` pour l'envoi Resend via la passerelle Lovable.

Aucun autre changement en dehors de ces zones.
