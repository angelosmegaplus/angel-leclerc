# Articles — stockage GitHub

Ce dossier est la source native pour les nouveaux articles d'Angel OS.

- Un article = un fichier JSON `slug.json`.
- Modifier un article = modifier ce fichier et créer un commit.
- Masquer un article = `published: false` ou `is_private: true`.
- Supprimer un article = supprimer le fichier ; l'historique Git permet une restauration.
- Les images lourdes restent externes et seules leurs URL sont enregistrées ici.

Le site fusionne temporairement ces fichiers avec le snapshot Lovable déjà versionné dans Git afin de préserver tout l'historique pendant la migration.
