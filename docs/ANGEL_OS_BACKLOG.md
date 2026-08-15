# Angel OS — backlog consolidé

Ce fichier sert de file durable pour les demandes validées qui ne doivent pas dépendre de l’historique d’une conversation ChatGPT.

## Règles

- GitHub `angelosmegaplus/angel-leclerc` est la source de vérité.
- Vérifier si une demande existe déjà avant de la développer.
- Une demande terminée doit être cochée seulement après vérification sur `main` et, si elle concerne l’interface publique/admin, après confirmation en production.
- Regrouper les changements cohérents pour éviter les builds inutiles.
- Ne jamais réintroduire Lovable comme dépendance normale.
- La file visible de l’admin doit montrer les travaux concrets et récents, pas les règles permanentes de maintenance.
- Les anciennes demandes visibles qui n’ont plus d’action concrète à mener doivent être retirées de la file active, sans perdre leur historique dans ce backlog.

## Demandes récentes — 15 août 2026

- [ ] Films & séries — adaptation maximale de MovixOpenSource : reprendre au maximum les fonctions utiles et compatibles de `movixcorp/MovixOpenSource` dans `/admin-movix`, sans importer les modules de contournement publicitaire, proxy, débridage, extraction ou lecture de sources non autorisées. Conserver attribution CC BY-NC 4.0. Priorité : architecture TMDB, vraie Home cinéma, hero, carrousels tactiles, skeletons, recherche/autocomplétion, filtres, affiches/backdrops localisés, fiches film/série riches, casting/équipe, trailers, fournisseurs légaux France, similaires/recommandations, collections/sagas, watchlist/favoris, historique/progression locale, classement, lazy loading, cache, préchargement, navigation mobile et états d’erreur propres.
  - Déjà porté sur `main` : couche TMDB serveur, enrichissement des affiches du catalogue personnel, fiche détaillée avec poster mobile, backdrop, synopsis, genres, casting, bande-annonce, fournisseurs légaux et recommandations.
  - Référence analysée : `src/pages/Home.tsx` de Movix charge tendances, populaires, mieux notés, genres, recommandations personnalisées, cache 15 min et chargement progressif ; `src/components/EmblaCarousel.tsx` apporte lazy-loading, préchargement d’images, watchlist, progression et navigation touch ; `src/pages/Search.tsx` apporte recherche riche, autocomplétion, filtres et vues grille/liste.
  - Condition d’activation complète : `TMDB_API_KEY` doit être présent dans l’environnement serveur. L’ancien projet Lovable utilisait ce secret côté serveur mais sa valeur n’est pas stockée dans le dépôt.
- [ ] Accès administrateur : remplacer le PIN actif par un CAPTCHA visuel aléatoire avec plusieurs familles de défis, limitation des tentatives, écran noir de sécurité intermédiaire, puis page de connexion. Vérifier régulièrement le parcours complet et l’absence de boucle/régression via la tâche de maintenance existante, sans créer une automatisation séparée.
- [ ] Vérifier en production que l’ancien code PIN `2005` n’est plus requis par le flux actif et que les anciens modules PIN morts peuvent être retirés proprement s’ils ne servent plus.
- [ ] Actualités admin : chaque rubrique (Politique, Radio & médias, Journalisme & com, IA & tech, Sarlat & Dordogne, Emploi & alternance) doit réellement recevoir des contenus et ne pas afficher « indisponible » simplement parce qu’un lot global est incomplet.
  - Validation technique du 15 août 2026 : la recherche web OpenAI répondait bien mais renvoyait du texte non parsable, ce qui produisait zéro élément IA exploitable. Le commit `a408ed7b44ccc55f17b864d5b0145fac797b8dc1` impose désormais un schéma JSON strict et porte le délai de recherche à 20 s. Déploiement production READY vérifié ; `/api/admin/news` répond HTTP 200 sur cette release sans nouvel avertissement `provider returned no usable structured news items` lors du test post-déploiement.
- [ ] « À la une » : privilégier fortement les articles des dernières heures, éviter les contenus anciens recyclés et personnaliser davantage selon les centres d’intérêt définis pour Angel OS.
- [ ] File GitHub admin : distinguer clairement « code prêt sur main » de « publication production en attente » ; ne jamais présenter le dernier `main` lui-même comme bloqué lorsque seul le déploiement l’est.
- [ ] File GitHub admin : limiter l’affichage des demandes anciennes encore visibles. Une modification en attente depuis plus d’environ 1 h 30 doit être requalifiée avec un état explicite (toujours pertinente, bloquée, remplacée, déjà faite ou obsolète) au lieu de rester indéfiniment en pause jaune.
- [ ] Nettoyer régulièrement la file visible : fusionner les doublons, retirer les règles permanentes et objectifs généraux de l’affichage des « choses à publier », conserver seulement les demandes concrètes en cours/récentes et les vrais blocages de publication.

## Priorité haute

- [ ] Corriger et vérifier de bout en bout Angel AI dans tout l’espace administrateur : les vraies questions doivent appeler le moteur IA principal, conserver le contexte et afficher une réponse conversationnelle ; le moteur local ne doit intervenir qu’en secours réel. Contrôler les logs, erreurs OpenAI, timeouts, quotas, anciens messages locaux parasites, routage des commandes et réponses persistées. Tester sur l’accueil admin, la recherche universelle et tout autre point d’entrée IA avant de considérer ce point terminé.
  - Diagnostic production du 15 août 2026 : `/api/assistant` renvoyait 500 avant tout appel OpenAI, car `aiMemoryPrompt()` déclenchait la création du client Supabase admin alors que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` n’étaient pas configurées dans le runtime Vercel.
  - Correctif sur `main` : commit `729d7e957a195acb11347550774f04ac17bedd97` rend la mémoire IA optionnelle ; une panne/absence Supabase ne doit plus empêcher le cœur OpenAI de répondre.
  - Validation production du 15 août 2026 : le cœur IA public est réellement fonctionnel. Plusieurs requêtes `POST /api/assistant` ont reçu HTTP 200 avec `OpenAI`, modèle `gpt-4.1-mini`, credential serveur `env`, texte exploitable et aucun fallback local. `/api/angel-os/health` confirme OpenAI `configured:true` et `reachable:true` sur la release `a408ed7b44ccc55f17b864d5b0145fac797b8dc1`.
  - Reste à valider directement avec une session admin authentifiée le chemin privé `runPrivateAngelOsIaChat` et sa persistance `ai_messages`. Le code utilise le même `resilientAngelAi`, interdit explicitement un moteur local de remplacement et marque l’échec au lieu de simuler une réponse ; aucune invocation privée authentifiée n’était disponible dans les logs de ce cycle.
- [ ] Vérifier que la récupération automatique des questions échouées fonctionne : une question laissée sans vraie réponse par l’IA embarquée doit pouvoir être reprise par la maintenance ChatGPT existante, sans doublon, puis la cause technique doit être diagnostiquée et corrigée quand c’est sûr.
- [ ] Vérifier que météo et actualités apparaissent réellement sur l’accueil admin et se mettent à jour automatiquement.
- [ ] Ajouter/maintenir une barre de recherche universelle Pixel/Google-like dans tout l’espace admin, sans doublons de destinations.
- [ ] Angel AI doit être visible très haut sur l’accueil admin, compact, et réutiliser le même fil de discussion que « Demander à l’IA ».
- [ ] Corriger le générique d’intro PWA/admin : démarrage immédiat à l’ouverture fraîche de l’app, mais pas de relance intempestive pendant la navigation normale.
- [ ] Afficher sur l’accueil admin le prochain rendez-vous Google Calendar et un résumé utile de l’agenda.
- [ ] Afficher les mails importants et un résumé des autres mails, avec propositions de réponse non envoyées automatiquement sauf workflow explicitement autorisé.
- [ ] Page Candidatures : bilan passé / présent / futur, réponses, refus, entretiens, relances dues et prochaines actions à partir de données réelles.
- [ ] Accueil admin : bilan général compact des publications, modifications, agenda, mails, candidatures, tâches et blocages.
- [ ] Page Actualités admin : bilan général Angel OS IA et fil détaillé réellement actualisé.

## Contact public

- [ ] Le formulaire Contact ne doit contenir aucun chat, ancien historique, champ « poser une question », suggestion de question ou texte décrivant le moteur IA. Il sert uniquement à préparer et transmettre une demande.
- [ ] Le fil de questions doit rester séparé sous le formulaire, conserver son historique de discussion et répondre sans exposer au visiteur la distinction entre moteur principal, fallback local, fournisseur IA ou logique interne.
- [ ] Vérifier en production mobile et desktop qu’aucun ancien historique de `ContactChat` ne réapparaît après restauration de session/cache navigateur.

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
