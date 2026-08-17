# Migration des articles historiques

Snapshot récupéré en lecture seule le 17 août 2026 depuis l'ancienne base associée au projet Lovable.

- 29 articles archivés dans `articles-01.json`, `articles-02.json` et `articles-03.json`.
- Lovable n'est pas modifié et n'est pas utilisé comme moteur du site.
- La base Supabase actuelle reste la source de vérité prioritaire.
- Le snapshot GitHub prend uniquement le relais si le catalogue courant renvoie zéro article ou échoue complètement.
- Les médias historiques peuvent encore référencer l'ancien stockage Supabase et devront être migrés séparément pour une indépendance totale.
