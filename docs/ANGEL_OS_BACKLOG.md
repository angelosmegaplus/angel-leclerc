# Angel OS — backlog consolidé

Ce fichier sert de file durable pour les demandes validées qui ne doivent pas dépendre de l’historique d’une conversation ChatGPT.

## Règles

- GitHub `angelosmegaplus/angel-leclerc` est la source de vérité.
- Vérifier si une demande existe déjà avant de la développer.
- Une demande terminée doit être cochée seulement après vérification sur `main` et, si elle concerne l’interface publique/admin, après confirmation en production.
- Regrouper les changements cohérents pour éviter les builds inutiles.
- Ne jamais réintroduire Lovable comme dépendance normale.

## Priorité haute

- [ ] Vérifier que toutes les actualités admin utilisent réellement le flux frais et que « À la une » privilégie les contenus des dernières heures, diversifie les catégories et ne recycle pas inutilement les mêmes sujets.
- [ ] Vérifier que météo et actualités apparaissent réellement sur l’accueil admin et se mettent à jour automatiquement.
- [ ] Ajouter/maintenir une barre de recherche universelle Pixel/Google-like dans tout l’espace admin, sans doublons de destinations.
- [ ] Angel AI doit être visible très haut sur l’accueil admin, compact, et réutiliser le même fil de discussion que « Demander à l’IA ».
- [ ] Corriger le générique d’intro PWA/admin : démarrage immédiat à l’ouverture fraîche de l’app, mais pas de relance intempestive pendant la navigation normale.
- [ ] Afficher sur l’accueil admin le prochain rendez-vous Google Calendar et un résumé utile de l’agenda.
- [ ] Afficher les mails importants et un résumé des autres mails, avec propositions de réponse non envoyées automatiquement sauf workflow explicitement autorisé.
- [ ] Page Candidatures : bilan passé / présent / futur, réponses, refus, entretiens, relances dues et prochaines actions à partir de données réelles.
- [ ] Accueil admin : bilan général compact des publications, modifications, agenda, mails, candidatures, tâches et blocages.
- [ ] Page Actualités admin : bilan général Angel OS IA et fil détaillé réellement actualisé.

## Fichiers et contenus

- [ ] Dans l’admin, permettre l’ajout de fichiers de formats variés (PDF, documents, images, etc.), stockage persistant et copie simple du lien pour réutilisation dans articles ou autres contenus.
- [ ] Vérifier que les articles générés/ajoutés dans l’admin restent supprimables et éditables.
- [ ] CMS : catégories multiples, couverture URL/upload, images internes éditables/remplaçables/supprimables/redimensionnables, alt/légende/alignement lorsque possible, section Sources/crédits.

## Angel OS / présentation

- [ ] Page Angel OS IA : corriger tout texte masqué, conserver animations utiles, effet typewriter/hacker lisible et responsive.
- [ ] Maintenir la page de présentation Angel OS dans un ton officiel/tech, sans « je », avec architecture, noyau, tâches, connecteurs, GitHub, CI/CD et déploiement clairement expliqués.
- [ ] Le badge « Propulsé par Angel OS » doit pointer vers `/angel-os-ia`, rester cohérent avec le logo et ne pas gêner l’interface.

## Connexions et indépendance

- [ ] Continuer la migration vers APIs officielles et OAuth natifs pour Google/Microsoft et futurs connecteurs.
- [ ] `/admin/connexions` doit afficher l’état réel : connecté, reconnexion requise, activation serveur requise, scopes et dernière synchro quand disponible.
- [ ] Rechercher des implémentations open source compatibles/licenciées pour les connecteurs complexes, en documentant les crédits/licences.
- [ ] Maintenir une page publique « Logiciels, licences et crédits » liée depuis les mentions légales.

## Publication / exploitation

- [ ] Tout changement validé sur `main` reste en file de publication jusqu’à ce que la production serve réellement le dernier `main`.
- [ ] Ne pas créer de commits artificiels pour contourner un quota/build-rate-limit.
- [ ] Vérifier le fournisseur d’hébergement réellement actif et adapter la publication au mécanisme officiel disponible.

## Maintenance continue

- [ ] Contrôler les vrais doublons dans admin et site public ; fusionner proprement avant suppression.
- [ ] Contrôler mobile, PWA, auth, recherche, statistiques, formulaires, liens, assets, thèmes clair/sombre et régressions.
- [ ] Ne pas fabriquer de statistiques, statuts, mails, rendez-vous ou succès de déploiement.
