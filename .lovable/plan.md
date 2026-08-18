# Isoler le module Articles / Blog — état réel et plan

## Ce que révèle l'audit (important à lire avant de valider)

- **Il n'existe pas, dans cette stack, de stockage persistant « interne à Lovable » autre que Lovable Cloud.** Le site tourne sur un runtime serverless sans disque persistant : tout ce qui est écrit hors base est soit un fichier du dépôt (donc GitHub, ce que vous voulez supprimer), soit perdu au redéploiement. Une persistance uniquement navigateur (localStorage) ne peut pas alimenter le blog public.
- **Lovable Cloud est déjà actif sur ce projet** et contient **27 articles**. Ce n'est pas un service externe à « activer » : c'est la base native du projet.
- Le vrai problème n'est donc pas Lovable Cloud, ce sont les **couches externes empilées par-dessus** :
  1. `src/integrations/supabase/client.ts` a été modifié à la main et pointe vers **un ancien projet de base externe** (différent de la base native du projet, qui est celle configurée dans `.env`).
  2. La route `src/routes/api/admin/articles.ts` écrit **d'abord dans GitHub** (`src/content/articles-data`, `src/content/article-tombstones`) et n'utilise la base qu'en secours.
  3. La lecture publique (`src/lib/articles.ts`) **fusionne 4 sources** : base, archive figée `src/content/lovable-archive` (29 articles JSON), articles Git « legacy » (`horrorArticle`, `macronPhilippeArticle`), fichiers JSON GitHub + pierres tombales.
  4. Des workflows GitHub (`angel-os-data-sync`, `scheduled-maintenance`, `daily-article`) touchent encore ce contenu.

Résultat actuel : **4 sources de vérité et une synchro bidirectionnelle** — exactement ce que vous voulez supprimer.

## Ce que je propose (une seule source de vérité)

Faire de la **base native du projet (Lovable Cloud)** l'unique source de vérité du module Articles, et supprimer toutes les autres voies pour ce module uniquement.

### 1. Récupération complète, une seule fois
- Importer dans la table `articles` de la base native tous les articles encore absents : les 29 JSON de `lovable-archive`, les articles Git `legacy`, les JSON de `src/content/articles-data`, et les lignes de l'ancienne base externe encore lisibles.
- Vérification chiffrée avant/après (nombre d'articles, slugs, images de couverture, pièces jointes) : aucun slug ni image ne doit disparaître, les URLs d'images historiques restent inchangées (URL absolues conservées telles quelles).

### 2. Lecture publique simplifiée
- `src/lib/articles.ts` ne lit plus que la base : suppression de la fusion archive/legacy/GitHub et des pierres tombales.
- Blog `/articles`, page article `/articles/$slug`, `LatestArticles`, sitemap : mêmes composants et même apparence, une seule requête.
- Publication et suppression prennent effet **immédiatement**, sans attendre GitHub.

### 3. Écriture / éditeur
- `src/routes/api/admin/articles.ts` : retrait des appels GitHub (création, renommage, suppression de fichiers, pierres tombales) ; écriture directe en base.
- Corbeille et restauration conservées en base (statut supprimé + restauration en brouillon privé), suppression définitive séparée.
- L'éditeur (`/admin` → Studio, `RichTextEditor`) garde son apparence, avec ces garanties :
  - titre, slug (auto + éditable), extrait, contenu riche, couverture, images dans le contenu, catégorie, thèmes, statut brouillon/publié, date de publication, aperçu ;
  - **autosauvegarde** avec brouillon de secours local, indicateur « modifications non enregistrées », confirmation avant fermeture ;
  - actions : enregistrer, publier, dépublier, **dupliquer**, supprimer avec confirmation, restaurer ;
  - messages d'erreur explicites au lieu d'échecs silencieux.

### 4. Nettoyage sans casser le reste
- Les autres modules (mail, candidatures, boutique, films, connexions) gardent leurs connecteurs actuels : aucun changement pour eux.
- Les workflows GitHub touchant les articles sont neutralisés (articles uniquement).
- Une **sauvegarde export JSON** manuelle reste possible depuis l'admin, mais elle n'est jamais relue automatiquement : pas de retour à deux sources.

### 5. Tests réels
Création, édition, autosave, publication, dépublication, duplication, suppression, restauration, purge, plus vérification des pages publiques et des images historiques, avec correction des erreurs trouvées.

## Point à trancher (bloquant)

Le module articles doit s'appuyer sur **la base native Lovable Cloud du projet** — c'est le seul stockage persistant disponible ici. Si vous refusez absolument tout stockage de ce type, il n'existe pas d'alternative capable de servir un blog public : je ne peux alors que réduire les sources externes (supprimer GitHub et l'ancienne base externe) sans obtenir un module réellement autonome.

Dites-moi simplement : **on utilise la base native du projet comme source unique (recommandé)**, ou on s'arrête au retrait de GitHub ?
