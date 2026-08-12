# Angel OS / Angel Control Center — Brief maître

Version documentaire : 2026-08-12 — 82 sections.

Ce document rassemble le cahier des charges durable du projet. Les sections 1 à 38 reprennent les briefs initiaux fournis par Angel ; les sections 39 à 82 ajoutent les règles OAuth grand public, d’automatisation, de publication et d’indépendance vis-à-vis de Lovable.

## Règles d’interprétation

- Le dépôt autorisé reste exclusivement `angelosmegaplus/angel-leclerc`.
- Les instructions explicites les plus récentes de l’utilisateur prévalent lorsqu’une section décrit une phase temporaire, par exemple « ne pas merger encore ».
- L’autonomie ne contourne jamais une permission, un consentement fournisseur, une protection de sécurité ou une validation obligatoire.
- Aucun connecteur, déploiement ou automatisme ne doit être déclaré fonctionnel sans preuve vérifiable.
- Les sections 48 à 60, présentes deux fois dans le texte source, sont conservées une seule fois ici.

Tu reprends intégralement le projet Angel OS / Angel Control Center.

Tu as CARTE BLANCHE pour auditer, corriger, améliorer, développer, tester et préparer la publication du projet, dans le respect des garde-fous ci-dessous.

Je ne veux pas devoir piloter chaque micro-action. Tu dois agir comme responsable technique du projet : inspecter avant d’agir, identifier toi-même les problèmes, choisir la solution la plus simple et robuste, exécuter ce qui peut l’être, vérifier le résultat, corriger les erreurs et poursuivre jusqu’à obtenir un état réellement fonctionnel.

==================================================
1. DÉPÔT DE RÉFÉRENCE
==================================================

Le SEUL dépôt autorisé est :

angelosmegaplus/angel-leclerc

Il correspond au vrai site angel-leclerc.fr.

NE JAMAIS modifier :

angelosmegaplus/alc

`alc` est un ancien dépôt/prototype et doit être considéré comme hors périmètre.

Avant toute opération importante, vérifie que tu travailles bien sur :
angelosmegaplus/angel-leclerc

GitHub doit devenir la SOURCE DE VÉRITÉ du projet.

Ne crée pas un nouveau dépôt et ne reconstruis pas inutilement le projet ailleurs.

==================================================
2. CONCEPT GLOBAL
==================================================

Le but n’est PAS de créer encore un nouveau site.

Le site public existant angel-leclerc.fr doit être conservé.

L’objectif est de transformer progressivement son espace :

/admin

en :

ANGEL OS / ANGEL CONTROL CENTER

Angel OS doit devenir mon cockpit numérique personnel et professionnel centralisé.

Il doit réunir progressivement tout ce dont j’ai besoin pour gérer :

- mon site ;
- mes articles ;
- mon activité journalistique ;
- mes projets ;
- mes candidatures ;
- ma communication ;
- mes statistiques ;
- mes fichiers ;
- mes mails ;
- mon agenda ;
- mes réseaux sociaux ;
- mes contenus photo/vidéo/audio ;
- podcasts ;
- interviews ;
- notes et recherches ;
- publications ;
- automatisations ;
- intelligence artificielle ;
- maintenance technique du site.

L’objectif final est d’éviter d’avoir quinze interfaces différentes.

==================================================
3. PRINCIPE FONDAMENTAL : NE RIEN CASSER
==================================================

Avant de refaire ou remplacer une interface, inspecte ce qui existe réellement.

Préserve les fonctionnalités existantes utiles, notamment lorsqu’elles existent déjà :

- CMS ;
- articles ;
- catégories ;
- commentaires ;
- notes / étoiles ;
- favoris ;
- formulaires ;
- statistiques ;
- analytics ;
- authentification ;
- uploads ;
- médias ;
- PWA ;
- notifications ;
- projets ;
- candidatures ;
- fonctions ALC ;
- fonctions Studio / Journalisme ;
- fonctionnalités administrateur existantes.

Une nouvelle interface Angel OS doit INTÉGRER l’existant et l’améliorer, pas supprimer silencieusement des fonctionnalités.

Ne remplace jamais une fonctionnalité fonctionnelle par une maquette moins fonctionnelle.

==================================================
4. ANGEL OS DOIT ÊTRE RÉEL, PAS UNE MAQUETTE
==================================================

Une fonctionnalité marquée :

- Connecté
- Synchronisé
- Automatique
- Envoyé
- Publié
- En cours
- Terminé

doit correspondre à une vraie opération.

Ne jamais afficher de fausses données comme si elles étaient réelles.

Ne jamais créer de faux connecteurs uniquement visuels.

Si une intégration n’est pas encore réellement opérationnelle, l’interface doit le dire clairement.

==================================================
5. AUTOMATISATION MAXIMALE
==================================================

Je veux automatiser au maximum Angel OS.

Le principe recherché est :

MOI
↓
Angel OS /admin
↓
ordre ou action
↓
agent / automatisation
↓
GitHub / services connectés
↓
tests
↓
résultat
↓
validation si nécessaire
↓
production

Je veux progressivement pouvoir écrire dans Angel OS des ordres du genre :

“Ajoute cette fonctionnalité au CMS.”

“Corrige cette erreur.”

“Prépare cet article.”

“Améliore cette page.”

“Analyse les candidatures.”

“Prépare une publication.”

“Vérifie le site.”

“Publie la version stable.”

Angel OS doit progressivement devenir un CENTRE DE COMMANDES.

Prévoir une architecture permettant par exemple :

- file d’actions ;
- statut des actions ;
- historique ;
- agent utilisé ;
- logs ;
- résultats ;
- erreurs ;
- validations ;
- branches GitHub ;
- PR associées ;
- état CI ;
- actions à confirmer.

Exemples de statuts :

pending
running
awaiting_approval
completed
failed

==================================================
6. VALIDATION DES ACTIONS SENSIBLES
==================================================

Tu as carte blanche pour les opérations techniques courantes et réversibles.

Ne me demande pas confirmation pour chaque :
- lecture ;
- audit ;
- inspection ;
- correction mineure ;
- création de branche ;
- test ;
- analyse CI ;
- correction directement liée à une erreur ;
- amélioration interne non destructive.

En revanche, ne réalise pas sans validation explicite les actions externes ou irréversibles importantes :

- merge final vers main lorsque je t’ai demandé de ne pas merger ;
- suppression importante de données ;
- paiement ;
- publication publique d’un article en mon nom ;
- publication sur les réseaux sociaux ;
- envoi réel d’un email à un tiers ;
- modification/destruction de secrets ;
- action pouvant avoir un impact financier ou public important.

L’objectif est :
AUTOMATISER LE MAXIMUM,
mais garder une validation humaine aux points réellement sensibles.

==================================================
7. GITHUB / CI / BRANCHES
==================================================

Architecture souhaitée :

ChatGPT = pilotage / orchestration
Codex ou Copilot = implémentation complémentaire si nécessaire
GitHub = source de vérité
GitHub Actions = tests / contrôle
Lovable = synchronisation / hébergement / publication

Pour les changements importants :

1. inspecter ;
2. créer/utiliser une branche dédiée ;
3. modifier ;
4. tester ;
5. vérifier le diff ;
6. ouvrir une PR ;
7. analyser la CI ;
8. corriger automatiquement les erreurs directement causées par le changement ;
9. ne merger que lorsque c’est approprié et autorisé.

Pas de force-push.

Pas de réécriture de l’historique déjà synchronisé avec Lovable.

Pas de nettoyage massif du dépôt sans raison.

==================================================
8. LOVABLE
==================================================

Je veux réduire au maximum ma dépendance à l’éditeur Lovable et éviter de consommer inutilement des crédits Lovable.

Le développement doit autant que possible passer par :

ChatGPT / Codex / Copilot
→ GitHub
→ CI
→ branche main
→ synchronisation Lovable
→ site publié

Lovable doit principalement servir à :

- synchroniser ;
- héberger ;
- publier le site existant ;

et non devenir l’endroit obligatoire pour chaque modification.

IMPORTANT :

Ne suppose jamais qu’un changement GitHub est publié simplement parce qu’il est mergé.

Après les changements destinés à la production :

- vérifier la synchronisation ;
- vérifier le déploiement réel ;
- inspecter le site publié ;
- contrôler que la version en ligne correspond à la version attendue ;
- vérifier les erreurs éventuelles ;
- corriger si nécessaire.

Si une publication Lovable nécessite une action que tu ne peux réellement pas effectuer, indique précisément le dernier maillon bloquant au lieu de prétendre que le site est publié.

==================================================
9. INSPECTIONS AUTOMATIQUES
==================================================

Je veux que tu inspectes régulièrement l’état technique plutôt que d’attendre que je découvre les problèmes.

Quand pertinent, vérifie :

- build ;
- CI ;
- dépendances ;
- erreurs TypeScript ;
- erreurs runtime ;
- routes cassées ;
- pages importantes ;
- /admin ;
- authentification ;
- PWA ;
- manifest ;
- service worker ;
- responsive/mobile ;
- liens ;
- formulaires ;
- console/errors si les outils le permettent ;
- synchronisation GitHub ;
- état du déploiement ;
- fonctionnalités existantes pouvant avoir régressé.

Ne corrige pas 3 000 problèmes historiques simplement parce qu’un linter les affiche.

Distingue :

A. problème introduit par nos changements ;
B. problème préexistant mais bloquant ;
C. dette technique non urgente.

Corrige automatiquement A.
Corrige B si nécessaire pour avancer.
Documente C et continue.

==================================================
10. MOBILE / PWA
==================================================

Angel OS doit être conçu MOBILE-FIRST, particulièrement pour Android.

Je dois pouvoir utiliser /admin confortablement depuis mon téléphone.

Priorités :

- navigation mobile ;
- gros éléments tactiles adaptés ;
- interface responsive ;
- performances correctes ;
- installation PWA ;
- comportement proche d’une application ;
- notifications lorsque techniquement disponibles ;
- fonctionnement desktop également.

L’objectif est qu’un utilisateur puisse éventuellement recevoir une proposition d’installation de l’application web lorsque les conditions PWA le permettent.

==================================================
11. AUTHENTIFICATION ET CONNECTEURS
==================================================

Éviter autant que possible les bricolages où je dois copier manuellement des tokens partout.

Préférer les flux standards et sécurisés :

“Se connecter avec Google”
“Se connecter avec Microsoft”
etc.

Utiliser de vrais mécanismes OAuth lorsqu’ils sont disponibles.

Ne jamais mettre de secrets dans le frontend ou le dépôt.

Pour l’authentification interne du site, conserver/utiliser la vraie authentification Supabase existante si c’est bien l’architecture actuelle.

Avant de modifier une intégration existante :
INSPECTE-LA.

Ne remplace pas une intégration fonctionnelle uniquement pour uniformiser l’architecture.

==================================================
12. CMS / JOURNALISME
==================================================

Angel OS doit devenir particulièrement utile pour mon activité éditoriale/journalistique.

À terme, prévoir ou améliorer :

- création d’article ;
- brouillon ;
- édition ;
- catégories ;
- tags ;
- chapô ;
- médias ;
- sources ;
- notes ;
- mise en page assistée ;
- suggestions automatiques ;
- badges IA ;
- indication de l’utilisation de ChatGPT/autres IA ;
- indication d’images générées par IA ;
- préparation publication ;
- prévisualisation ;
- historique ;
- éventuellement enregistrement audio ;
- podcast ;
- vidéo ;
- interviews ;
- transcription lorsque techniquement appropriée ;
- organisation des recherches et sources.

Lorsque je rédige un article, Angel OS doit pouvoir proposer intelligemment des options et me permettre de valider rapidement.

==================================================
13. ANGEL AI / CENTRE DE COMMANDES
==================================================

Prévoir progressivement un module Angel AI / Command Center.

But :

je donne un objectif depuis /admin,
le système prépare/exécute ce qu’il peut,
puis me présente le résultat.

Architecture possible à évaluer selon le projet existant :

ai_actions
agent_runs
approvals
activity_log
integration_events
ai_messages

Ce ne sont PAS des obligations de noms ou de schéma.

Inspecte d’abord l’architecture existante et choisis la solution la plus cohérente.

Ne crée pas cinq nouvelles tables si une structure existante permet de faire la même chose proprement.

==================================================
14. ÉTAT ACTUEL À AUDITER IMMÉDIATEMENT
==================================================

Commence par auditer réellement :

main
codex/repository-guidance-ci
codex/upgrade-zod-4

dans :

angelosmegaplus/angel-leclerc

Vérifie leur état réel au lieu de te fier uniquement à ce brief.

Travail déjà commencé :

A. codex/repository-guidance-ci

Doit normalement contenir :

AGENTS.md
CODEX.md
.github/workflows/ci.yml

Vérifie que :

- le bloc LOVABLE original de AGENTS.md est intact ;
- les règles Angel OS sont présentes ;
- CODEX.md explique correctement le workflow ;
- ci.yml est un YAML valide ;
- la CI utilise Bun ;
- installation frozen ;
- lint ;
- build.

Ouvre une PR vers main si elle n’existe pas.

NE MERGE PAS ENCORE.

B. codex/upgrade-zod-4

Le problème identifié était :

pagePrerenderOptionsSchema.optional(...).prefault is not a function

Cause précédemment identifiée :

@tanstack/start-plugin-core attend Zod 4 alors que le projet résolvait Zod 3 à la racine.

La branche doit passer la dépendance directe :

zod

vers :

^4.4.3

Vérifie package.json.

Vérifie bun.lock.

Si bun.lock n’a pas été régénéré, corrige-le proprement si tes outils permettent de le faire de manière fiable.

Un environnement Codex précédent avait réussi :

bun install --frozen-lockfile
bun run build

après alignement Zod 4.

Vérifie à nouveau autant que possible.

Ouvre une PR séparée vers main.

NE MERGE PAS ENCORE.

==================================================
15. PROBLÈME LINT CONNU
==================================================

Le dépôt contient déjà énormément d’erreurs Prettier/ESLint préexistantes.

Une exécution précédente remontait plusieurs milliers de problèmes.

NE LANCE PAS un nettoyage massif simplement pour obtenir artificiellement une CI verte.

Si la CI échoue uniquement à cause de dette lint historique :

- identifie-le clairement ;
- vérifie que nos fichiers n’introduisent pas de nouvelles erreurs ;
- propose ou applique une stratégie CI raisonnable si nécessaire ;
- ne reformate pas tout le projet dans les deux PR actuelles.

==================================================
16. AUTONOMIE ATTENDUE
==================================================

Je ne veux pas devoir répondre :

“oui”
“continuer”
“confirmer”
“procéder”

à chaque micro-étape.

Tu as carte blanche pour conduire le chantier dans les limites de sécurité décrites ici.

Si un outil échoue :

- diagnostique ;
- tente une autre méthode sûre ;
- utilise GitHub directement si disponible ;
- inspecte les logs ;
- corrige ;
- continue.

Ne t’arrête pas simplement parce qu’une première méthode échoue.

Ne prétends jamais avoir effectué une action que l’outil n’a pas réellement confirmée.

==================================================
17. PRIORITÉS
==================================================

Priorité 1 :
stabiliser GitHub / branches / build / CI.

Priorité 2 :
ouvrir proprement les deux PR existantes sans les merger.

Priorité 3 :
auditer l’état réel actuel de /admin et des fonctionnalités existantes.

Priorité 4 :
établir une roadmap Angel OS en distinguant :
- déjà fonctionnel ;
- partiellement fonctionnel ;
- faux/placeholder ;
- absent ;
- cassé ;
- améliorable.

Priorité 5 :
commencer les améliorations Angel OS les plus utiles sans casser l’existant.

Priorité 6 :
rendre le workflow GitHub → Lovable → production aussi automatique et vérifiable que possible.

Priorité long terme :
faire de /admin un véritable Angel Control Center où je peux commander mes outils et automatisations depuis une seule interface.

==================================================
18. CE QUE J’ATTENDS DE TOI MAINTENANT
==================================================

Ne me redonne pas simplement une roadmap théorique.

COMMENCE PAR AGIR.

1. Connecte-toi au dépôt autorisé.
2. Inspecte main et les deux branches.
3. Vérifie les fichiers et commits réels.
4. Termine ce qui manque.
5. Ouvre les deux PR si possible.
6. Analyse les CI.
7. Corrige les problèmes directement liés à nos changements.
8. Ne merge pas encore.
9. Ensuite audite /admin et l’architecture actuelle d’Angel OS.
10. Donne-moi un rapport factuel :
   - ce que tu as réellement vérifié ;
   - ce que tu as réellement modifié ;
   - PR créées ;
   - CI ;
   - problèmes détectés ;
   - état du build ;
   - état de la publication ;
   - prochaines actions prioritaires.

Tu peux prendre les décisions techniques intermédiaires toi-même.

Ne touche JAMAIS à angelosmegaplus/alc.

Et surtout : l’objectif n’est pas de “faire joli”.
L’objectif est qu’Angel OS devienne progressivement un système réellement fonctionnel, automatisé, maintenable, mobile et capable de centraliser mon activité.

==================================================
19. CARTE BLANCHE GLOBALE — MISSION COMPLÈTE
==================================================

Tu as CARTE BLANCHE pour reprendre l’intégralité d’Angel OS et mener le projet jusqu’à un état réellement fonctionnel, automatisé, maintenable et publié.

Ne te limite pas aux deux PR actuellement en cours.

Ces deux PR sont uniquement les fondations techniques.

Après les avoir terminées proprement, tu dois reprendre l’ensemble de ce que je voulais depuis le début et poursuivre le chantier de manière autonome.

Tu dois agir comme responsable technique et opérateur du projet.

Je ne veux pas devoir te dire à chaque étape :

- continuer ;
- procéder ;
- confirmer ;
- vérifie ça ;
- corrige ça ;
- publie ça ;
- teste ça.

Fais automatiquement tout ce qui est techniquement raisonnable, réversible et sûr.

==================================================
20. OBJECTIF FINAL À ATTEINDRE
==================================================

L’objectif final est que :

angel-leclerc.fr
= site public

angel-leclerc.fr/admin
= Angel OS / Angel Control Center

GitHub
= source de vérité du code

GitHub Actions
= tests / contrôles / CI

Lovable
= synchronisation / hébergement / publication

ChatGPT
= pilotage principal

Codex / Copilot
= bras techniques complémentaires lorsque nécessaire

Google Workspace
= Gmail / Drive / Calendar principaux

Microsoft
= Outlook / OneDrive / Calendar secondaires lorsque connectés

Angel OS doit progressivement devenir mon système central personnel, professionnel, éditorial et technique.

==================================================
21. TOUT AUTOMATISER AU MAXIMUM
==================================================

Je veux que tu recherches systématiquement ce qui peut être automatisé.

Pour chaque fonctionnalité ou workflow, pose-toi la question :

“Est-ce que l’utilisateur doit vraiment faire cette étape manuellement ?”

Si la réponse est non, automatise-la proprement.

Exemples :

- vérifier les builds ;
- surveiller la CI ;
- détecter une erreur ;
- proposer un correctif ;
- créer une branche ;
- préparer une PR ;
- vérifier la publication ;
- inspecter les connexions ;
- classer les actions ;
- préparer les brouillons ;
- suggérer des catégories d’article ;
- proposer des badges ;
- améliorer la mise en page ;
- vérifier les candidatures ;
- détecter les doublons ;
- détecter les relances nécessaires ;
- vérifier les projets en retard ;
- analyser les statistiques ;
- détecter des problèmes sur le site ;
- préparer les actions à valider.

Ne crée jamais une fausse automatisation.

Si une opération nécessite encore une intervention humaine, indique-le clairement.

==================================================
22. CENTRE DE COMMANDES ANGEL OS
==================================================

À terme, je veux pouvoir commander les actions directement depuis /admin.

Exemples :

“Corrige cette erreur.”

“Ajoute cette fonctionnalité.”

“Prépare une nouvelle version du site.”

“Analyse ce qui manque.”

“Vérifie la CI.”

“Prépare une PR.”

“Améliore cet article.”

“Prépare cette publication.”

“Analyse mes emails.”

“Regarde mes candidatures.”

“Quels projets sont en retard ?”

“Publie la version stable.”

Construis progressivement l’architecture nécessaire pour cela.

Angel OS doit pouvoir afficher :

- commande ;
- statut ;
- agent ;
- logs ;
- résultat ;
- erreur ;
- branche GitHub ;
- commit ;
- PR ;
- état CI ;
- état du déploiement ;
- validation nécessaire ou non.

==================================================
23. PUBLICATION ET DÉPLOIEMENT
==================================================

Je veux que les versions terminées soient réellement mises en ligne.

Le workflow cible est :

branche
→ PR
→ tests
→ validation
→ main
→ synchronisation Lovable
→ publication
→ contrôle du site réel

Quand une modification destinée à la production est validée :

1. vérifie la CI ;
2. vérifie que le build passe ;
3. fusionne si la validation nécessaire a été donnée ;
4. vérifie que Lovable a bien récupéré la nouvelle version ;
5. publie si l’outil le permet ;
6. vérifie le site public réel ;
7. vérifie /admin ;
8. vérifie mobile/PWA ;
9. détecte les régressions ;
10. corrige automatiquement les problèmes directement liés au déploiement.

Ne considère jamais “merge sur main” comme synonyme de “site publié”.

La publication doit être vérifiée réellement.

==================================================
24. INSPECTION CONTINUE
==================================================

Ne travaille pas uniquement sur ce que je te signale.

Inspecte toi-même régulièrement :

- architecture ;
- dépendances ;
- build ;
- CI ;
- erreurs ;
- routes ;
- authentification ;
- RLS ;
- sécurité ;
- CMS ;
- commentaires ;
- étoiles / favoris ;
- formulaires ;
- analytics ;
- PWA ;
- notifications ;
- OAuth ;
- responsive ;
- performances ;
- Studio ;
- projets ;
- candidatures ;
- ALC ;
- Angel AI ;
- automatisations ;
- connexions ;
- publication ;
- synchronisation GitHub ↔ Lovable.

Si tu détectes une anomalie importante :

- diagnostique ;
- corrige si c’est sûr ;
- teste ;
- documente ;
- continue.

==================================================
25. REPRENDRE TOUT CE QUI ÉTAIT PRÉVU DEPUIS LE DÉBUT
==================================================

Après stabilisation GitHub/CI, audite et développe progressivement tout ce qui était prévu pour Angel OS.

Modules cibles :

TABLEAU DE BORD

COMMUNICATION
- Emails
- Contacts
- Campagnes
- Réseaux sociaux

AGENDA

FICHIERS

ARTICLES / BLOG

SITE INTERNET

PROJETS

ALTERNANCE / CANDIDATURES

ALC / ACTIVITÉ PROFESSIONNELLE

STUDIO / JOURNALISME

IA / ANGEL AI

CENTRE DE COMMANDES

AUTOMATISATIONS

ANALYTICS

GITHUB

CONNEXIONS

PARAMÈTRES

JOURNAL D’ACTIVITÉ

NOTIFICATIONS

RECHERCHE GLOBALE

==================================================
26. ARTICLES / CMS
==================================================

Le CMS doit être réellement complet.

Préserver et améliorer :

- articles existants ;
- création ;
- modification ;
- suppression avec confirmation ;
- brouillon ;
- prévisualisation ;
- publication ;
- dépublication ;
- programmation ;
- titre ;
- chapô ;
- corps ;
- auteur ;
- date ;
- slug ;
- SEO ;
- méta description ;
- image ;
- catégories multiples ;
- tags ;
- sources ;
- historique.

Catégories possibles :

- Politique
- Société
- Économie
- Emploi
- Entreprise
- Communication
- Médias
- Technologie
- Intelligence artificielle
- Culture
- Religion
- Opinion
- International
- Local / Dordogne
- Sarlat
- Personnel

Ajouter/améliorer les éléments de transparence IA :

- ChatGPT utilisé pour reformulation
- ChatGPT utilisé pour recherche/assistance
- Autre IA utilisée
- Image générée avec une IA
- Aucun outil IA utilisé

Angel AI doit pouvoir proposer :

- catégories ;
- badges ;
- SEO ;
- chapô ;
- intertitres ;
- mise en page ;
- citations ;
- sources manquantes ;
- légendes ;
- transparence IA.

Chaque suggestion doit pouvoir être validée/refusée rapidement.

==================================================
27. EMAILS / COMMUNICATION
==================================================

Créer/améliorer une vraie boîte de communication centralisée.

Objectif :

- Gmail principal ;
- Outlook secondaire ;
- recherche ;
- non lus ;
- importants ;
- envoyés ;
- brouillons ;
- pièces jointes ;
- catégories ;
- analyse IA.

L’IA peut :

- résumer ;
- classer ;
- détecter une réponse nécessaire ;
- préparer une réponse ;
- détecter une date ;
- créer une proposition de tâche.

L’IA ne doit jamais envoyer un email sans validation explicite.

==================================================
28. GOOGLE / MICROSOFT / RÉSEAUX SOCIAUX
==================================================

Je veux des connexions simples depuis /admin.

Préférer :

“Se connecter avec Google”

“Se connecter avec Microsoft”

et équivalents OAuth officiels.

Google :

- Gmail
- Drive
- Calendar
- YouTube si pertinent

Microsoft :

- Outlook
- OneDrive
- Calendar

Réseaux sociaux à préparer lorsque possible :

- Facebook
- Instagram
- LinkedIn
- X
- autres futurs services

Éviter les manipulations manuelles de tokens lorsque OAuth peut faire le travail.

==================================================
29. FICHIERS
==================================================

Google Drive = stockage documentaire principal.

OneDrive = secondaire.

Ne pas dupliquer inutilement les fichiers en base.

Stocker surtout :

- remote_id ;
- nom ;
- type ;
- métadonnées ;
- URL ;
- service source ;
- liens avec projets/articles/clients/etc.

==================================================
30. PROJETS
==================================================

Chaque projet doit pouvoir contenir :

- titre ;
- description ;
- statut ;
- priorité ;
- échéance ;
- notes ;
- tâches ;
- documents ;
- contacts ;
- historique.

Statuts :

- idée ;
- à faire ;
- en cours ;
- en attente ;
- terminé ;
- archivé.

Liste + Kanban si pertinent.

==================================================
31. ALTERNANCE / CANDIDATURES
==================================================

Créer/améliorer :

- entreprise ;
- ville ;
- poste ;
- contact ;
- email ;
- téléphone ;
- date d’envoi ;
- relance ;
- réponse ;
- statut ;
- notes ;
- documents.

Statuts :

- à contacter ;
- candidature préparée ;
- envoyée ;
- relance nécessaire ;
- entretien prévu ;
- en attente ;
- refusée ;
- acceptée ;
- abandonnée.

Anti-doublon obligatoire.

Ne jamais renvoyer automatiquement une candidature déjà envoyée.

Filtres utiles :

- Sarlat-la-Canéda
- Périgueux
- Brive
- Bergerac
- autres

==================================================
32. ALC
==================================================

Angel Leclerc Communication doit pouvoir gérer :

- clients ;
- prospects ;
- missions ;
- projets ;
- devis ;
- factures ou liens vers factures ;
- paiements ;
- tâches ;
- documents ;
- emails liés ;
- historique client.

==================================================
33. STUDIO / JOURNALISME
==================================================

Développer progressivement un véritable studio mobile.

Fonctions :

- enregistrement audio ;
- podcast ;
- pause/reprise ;
- export ;
- vidéo ;
- caméra ;
- micro ;
- import photo ;
- import audio ;
- import vidéo ;
- carnet de reportage ;
- notes horodatées ;
- interviews ;
- questions préparatoires ;
- sources ;
- contacts ;
- dossiers d’enquête ;
- chronologies ;
- faits ;
- hypothèses séparées ;
- documents ;
- revue de presse ;
- kit terrain mobile.

Optimiser particulièrement Android.

==================================================
34. ANALYTICS
==================================================

Afficher selon les données réellement disponibles :

- visiteurs ;
- pages vues ;
- visiteurs uniques ;
- pages populaires ;
- provenance ;
- pays ;
- appareils ;
- durée ;
- rebond ;
- évolution.

Créer une synthèse IA :

“Ce qui a changé cette semaine”

avec anomalies, hausses, baisses et pages à surveiller.

==================================================
35. PWA / APPLICATION
==================================================

Angel OS doit fonctionner comme une véritable application web installable.

Vérifier/améliorer :

- manifest ;
- icônes ;
- service worker ;
- mode standalone ;
- installation ;
- responsive ;
- offline fallback ;
- notifications ;
- performance mobile.

Objectif :
pouvoir installer Angel OS depuis Android comme une application.

==================================================
36. JOURNAL D’ACTIVITÉ
==================================================

Tracer les actions importantes :

- timestamp ;
- utilisateur / IA / système ;
- action ;
- statut ;
- détails ;
- entité liée ;
- erreur éventuelle ;
- branche / commit / PR lorsqu’il s’agit de code.

==================================================
37. RECHERCHE GLOBALE
==================================================

Permettre une recherche depuis Angel OS dans :

- emails ;
- fichiers ;
- contacts ;
- articles ;
- projets ;
- candidatures ;
- clients ;
- tâches ;
- sources ;
- interviews ;
- enquêtes ;
- formulaires ;
- commentaires.

==================================================
38. RÈGLE FINALE DE CONDUITE
==================================================

Ne te contente pas de proposer.

Agis dès que possible.

Inspecte.
Décide.
Corrige.
Teste.
Publie.
Vérifie.
Continue.

Ne demande confirmation que lorsque l’action est réellement sensible, irréversible, publique ou financière.

Si un outil échoue, cherche une autre méthode sûre au lieu d’abandonner immédiatement.

Ne prétends jamais qu’une action est terminée si elle ne l’est pas réellement.

Ne touche jamais à `angelosmegaplus/alc`.

La mission n’est terminée que lorsque Angel OS est réellement devenu beaucoup plus autonome, centralisé, mobile, fonctionnel et maintenable, et que les changements validés ont réellement atteint la production.

==================================================
39. CONNEXIONS SANS JETONS MANUELS — EXPÉRIENCE GRAND PUBLIC
==================================================

L’utilisateur ne doit pas avoir à chercher, copier ou comprendre des jetons, clés API, secrets, client IDs ou paramètres techniques pour utiliser les services courants.

L’expérience cible est celle d’un site moderne :

- « Se connecter avec Google »
- « Se connecter avec Microsoft »
- « Se connecter avec LinkedIn »
- « Se connecter avec Facebook »
- « Se connecter avec Instagram »
- « Se connecter avec YouTube »
- etc.

Le fournisseur officiel s’ouvre, l’utilisateur se connecte et consent, puis revient automatiquement dans Angel OS où le service apparaît avec son état réel.

==================================================
40. PRIORITÉ À OAUTH / CONNEXIONS OFFICIELLES
==================================================

Utiliser en priorité OAuth/OIDC officiel plutôt que des jetons utilisateur copiés manuellement.

Services à préparer progressivement :

GOOGLE
- Gmail
- Google Drive
- Google Calendar
- YouTube
- autres services Google utiles

MICROSOFT
- Outlook
- OneDrive
- Microsoft Calendar
- autres services Microsoft utiles

AUTRES
- Facebook
- Instagram
- LinkedIn
- X / Twitter
- GitHub
- Canva si une intégration officielle pertinente existe
- Adobe si pertinent
- Spotify si utile
- futurs fournisseurs

==================================================
41. INTERFACE /ADMIN/CONNEXIONS
==================================================

La page /admin/connexions présente des cartes simples avec :

- logo ;
- nom ;
- statut réel ;
- compte connecté ;
- dernière synchronisation ;
- permissions principales ;
- bouton « Se connecter » ;
- bouton « Reconnecter » si nécessaire ;
- bouton « Déconnecter » ;
- état d’erreur clair.

Ne jamais afficher une clé ou un token. Ne jamais imposer un copier-coller de token lorsqu’un OAuth officiel permet de l’éviter.

==================================================
42. GESTION TECHNIQUE INVISIBLE
==================================================

Lorsque techniquement possible, Angel OS gère côté serveur :

- redirection et callback OAuth ;
- state anti-CSRF ;
- PKCE ;
- stockage sécurisé des credentials ;
- refresh tokens ;
- renouvellement automatique ;
- expiration et reconnexion ;
- révocation ;
- erreurs d’autorisation ;
- synchronisation.

Cette plomberie reste invisible pour l’utilisateur.

==================================================
43. SECRETS FOURNISSEURS
==================================================

L’utilisation quotidienne ne doit pas nécessiter de jetons utilisateur. Certains fournisseurs imposent toutefois une activation développeur initiale avec client ID, client secret, redirect URI et configuration OAuth.

Quand cette activation est incontournable :

1. construire toute l’architecture Angel OS prête à fonctionner ;
2. conserver les paramètres uniquement côté serveur/secrets ;
3. afficher normalement « Se connecter avec… » ;
4. indiquer honnêtement « activation serveur requise » tant qu’elle manque ;
5. réduire la configuration initiale au strict minimum ;
6. ne plus demander de jetons à l’utilisateur final une fois l’activation réalisée.

Objectif : une configuration administrative initiale maximale, puis une utilisation quotidienne simple.

==================================================
44. AUCUN FAUX CONNECTEUR
==================================================

Ne jamais déclarer un service connecté si seule son interface existe.

États autorisés :

- connecté ;
- non connecté ;
- activation serveur requise ;
- autorisation expirée ;
- erreur ;
- synchronisation en cours.

Une intégration non fonctionnelle doit être présentée comme telle.

==================================================
45. SYNCHRONISATION TRANSPARENTE
==================================================

Quand un service est réellement connecté, gérer automatiquement autant que possible :

- synchronisation périodique ;
- renouvellement d’autorisation ;
- détection et reprise après erreur ;
- date de dernière synchronisation ;
- notification lorsqu’une reconnexion est réellement nécessaire.

==================================================
46. ACTIONS VIA CONNECTEURS
==================================================

Une fois fonctionnels, les connecteurs doivent permettre selon les APIs officielles :

Google / Microsoft
- lire et rechercher les emails ;
- préparer des brouillons ;
- consulter l’agenda ;
- préparer ou modifier des événements avec validation si nécessaire ;
- rechercher des fichiers ;
- lier des fichiers aux projets/articles ;
- importer ou exporter des médias.

LinkedIn / Facebook / Instagram / X
- préparer et prévisualiser des publications ;
- programmer lorsque l’API le permet ;
- suivre l’état de publication ;
- afficher les statistiques disponibles.

YouTube
- afficher vidéos et chaînes utiles ;
- préparer les métadonnées ;
- gérer ce que l’API officielle autorise ;
- ne jamais publier automatiquement sans validation explicite.

==================================================
47. RÈGLE UX CONNEXIONS
==================================================

Parcours normal :

« Se connecter avec Google »
→ connexion officielle
→ écran de consentement
→ retour Angel OS
→ « Google connecté ».

Les consoles développeur, secrets et APIs ne font pas partie du parcours quotidien. Si une activation initiale est incontournable, elle est présentée comme une activation administrative unique.

==================================================
48. AUTOMATISATION TOTALE PAR DÉFAUT
==================================================

Automatiser au maximum les opérations sûres :

- inspecter ;
- décider ;
- exécuter ;
- corriger ;
- tester ;
- publier ;
- vérifier ;
- recommencer si nécessaire.

Ne pas renvoyer inutilement l’utilisateur vers GitHub, Lovable, Supabase, Google Cloud, Azure, un terminal ou une configuration manuelle lorsqu’un outil disponible permet d’effectuer l’étape automatiquement et légalement.

==================================================
49. CHATGPT EST L’OPÉRATEUR PRINCIPAL
==================================================

Lorsque techniquement possible, ChatGPT pilote :

- inspection du dépôt ;
- branches et modifications ;
- PR et CI ;
- corrections ;
- mises à jour ;
- intégrations ;
- déploiements ;
- production ;
- régressions ;
- maintenance.

Codex, Copilot et les autres agents sont des bras techniques complémentaires. L’utilisateur ne doit pas servir de messager entre plusieurs IA.

==================================================
50. PUBLICATION AUTOMATIQUE
==================================================

Workflow cible :

modification
→ branche
→ tests
→ PR
→ CI
→ validation si sensible
→ merge
→ synchronisation Lovable
→ publication
→ contrôle du site réel
→ vérification de /admin
→ vérification mobile/PWA
→ correction des régressions.

Une tâche de production n’est terminée que lorsque le code, les tests, la production et le site réellement publié ont été vérifiés.

==================================================
51. PUBLICATION SANS INTERVENTION INUTILE
==================================================

Si Lovable publie automatiquement main, vérifier que cela a réellement eu lieu. Si un outil permet une publication explicite, l’utiliser. Si un dernier geste humain est réellement obligatoire, automatiser tout le reste, expliquer précisément le blocage et réduire l’intervention au strict minimum.

==================================================
52. AUTO-CORRECTION
==================================================

Après chaque changement important, vérifier CI, build, déploiement, logs, pages concernées et fonctions critiques. Toute erreur directement causée par le changement doit être diagnostiquée, corrigée et retestée automatiquement.

==================================================
53. AUTO-MAINTENANCE
==================================================

Prévoir progressivement la surveillance de :

- site, builds et workflows ;
- erreurs ;
- connexions expirées ;
- synchronisations ;
- tâches et candidatures à relancer ;
- articles programmés ;
- automatisations échouées ;
- intégrations ;
- PWA ;
- disponibilité des services.

Corriger automatiquement les problèmes sans risque important ; sinon créer une action « validation nécessaire ».

==================================================
54. AUTOMATISER L’ADMINISTRATION QUOTIDIENNE
==================================================

Automatiser progressivement :

- tri et analyse des emails ;
- brouillons et extraction des tâches ;
- classement, rappels et agenda ;
- fichiers ;
- candidatures et projets ;
- analytics ;
- préparation d’articles ;
- mise en page, catégories, tags, SEO et résumés ;
- recherche documentaire ;
- publications sociales préparées ;
- suivi des connexions ;
- journal d’activité.

Toujours distinguer AUTO-EXÉCUTABLE et NÉCESSITE VALIDATION.

==================================================
55. AUTOMATISATION DES ACTIONS SENSIBLES
==================================================

Pour les actions sensibles, automatiser la préparation et conserver une validation finale unique.

Exemple email :
lecture → analyse → réponse préparée → brouillon → « Valider l’envoi » → envoi → journalisation.

Même principe pour article public, réseau social, suppression, paiement, merge important et action externe irréversible.

==================================================
56. ZÉRO FAUSSE AUTOMATISATION
==================================================

Ne jamais écrire « automatique » si plusieurs manipulations restent nécessaires.

États possibles :

- automatique ;
- automatique après validation ;
- planifiée ;
- déclenchée manuellement ;
- préparation uniquement ;
- activation serveur requise ;
- non configurée.

==================================================
57. PRIORITÉ À L’EXPÉRIENCE SANS TECHNIQUE
==================================================

Expérience cible :

« Je demande ce que je veux. »
→ « Angel OS s’en occupe. »

Les étapes techniques doivent être automatisées ou masquées autant que possible.

==================================================
58. SI UNE ÉTAPE HUMAINE EST OBLIGATOIRE
==================================================

Pour un consentement OAuth, une validation bancaire, un captcha, une confirmation de sécurité ou une permission sensible :

1. automatiser tout ce qui précède ;
2. demander uniquement l’action indispensable ;
3. donner une instruction simple ;
4. reprendre automatiquement ensuite ;
5. ne pas faire reconfigurer le reste.

==================================================
59. OBJECTIF ULTIME
==================================================

L’utilisateur donne un objectif dans Angel OS. Le système choisit comment l’exécuter, agit, teste, corrige, demande validation uniquement si nécessaire, publie, vérifie et fournit le résultat. Angel OS doit devenir un véritable système d’exploitation personnel et professionnel.

==================================================
60. RÈGLE FINALE ABSOLUE
==================================================

Ne pas donner une liste de tâches que l’opérateur peut réaliser lui-même. Ne pas demander de validation pour les étapes techniques réversibles. Prendre l’initiative, automatiser, exécuter, publier et vérifier, dans les limites de sécurité et des autorisations disponibles.

==================================================
61. INDÉPENDANCE MAXIMALE VIS-À-VIS DE LOVABLE
==================================================

Contrainte : environ 5 crédits Lovable par jour. Angel OS doit devenir aussi indépendant de l’éditeur Lovable que possible.

Architecture cible :

Utilisateur
→ Angel OS / ChatGPT
→ GitHub
→ Codex / Copilot / agents si nécessaire
→ GitHub Actions / CI
→ main
→ Lovable uniquement pour synchronisation, hébergement et publication lorsque nécessaire.

==================================================
62. ZÉRO CRÉDIT LOVABLE POUR LE DÉVELOPPEMENT COURANT
==================================================

Budget par défaut pour une modification : 0 crédit Lovable.

Le code, les bugs, /admin, CMS, responsive, PWA, intégrations, composants, TypeScript, styles, automatisations et workflows doivent être traités prioritairement via ChatGPT/Codex/Copilot et GitHub.

==================================================
63. LOVABLE = COUCHE DE PUBLICATION, PAS IDE
==================================================

Lovable sert à synchroniser, héberger, prévisualiser si nécessaire et publier. Le code doit rester entièrement exploitable depuis GitHub et aucune fonction ne doit dépendre d’une intervention manuelle dans l’éditeur Lovable si cette dépendance peut raisonnablement être supprimée.

==================================================
64. AUDITER LES DÉPENDANCES LOVABLE
==================================================

Classer les dépendances Lovable :

A. NÉCESSAIRE — infrastructure actuellement indispensable.
B. UTILE MAIS REMPLAÇABLE — peut migrer progressivement.
C. INUTILE — peut être retirée sans perte fonctionnelle.

Ne rien supprimer brutalement ; réduire progressivement les dépendances inutiles sans casser la production.

==================================================
65. GITHUB DOIT TOUT RECONSTRUIRE
==================================================

Le dépôt doit contenir code, configuration, migrations, workflows, documentation, scripts, dépendances, configuration PWA, règles agents et procédures de déploiement. Les secrets restent hors dépôt. Le projet doit rester maintenable si Lovable disparaît.

==================================================
66. CI/CD GITHUB-FIRST
==================================================

Flux cible :

branche → commit → PR → GitHub Actions → tests → build → validation → main → déploiement/synchronisation.

Améliorer progressivement l’installation reproductible, TypeScript, build, tests utiles et PWA. Ne pas bloquer toutes les PR à cause de milliers d’erreurs lint historiques sans rapport.

==================================================
67. PUBLICATION SANS CRÉDIT LOVABLE SI POSSIBLE
==================================================

Auditer si un merge/push sur main déclenche synchronisation et publication sans crédit. Si oui, utiliser ce mécanisme par défaut et ne jamais consommer un prompt Lovable uniquement pour publier du code déjà présent dans GitHub.

==================================================
68. NE PAS DÉPENSER LES CRÉDITS PAR HABITUDE
==================================================

Avant toute consommation, vérifier si GitHub, Codex, Copilot, Supabase, CI ou l’infrastructure existante suffisent. Si oui, ne pas utiliser Lovable.

==================================================
69. SI LOVABLE EST RÉELLEMENT NÉCESSAIRE
==================================================

Expliquer pourquoi, rechercher une alternative gratuite, minimiser les opérations, regrouper les changements, éviter les essais inutiles et vérifier le résultat. Plafond indicatif : 5 crédits/jour ; objectif normal : 0.

==================================================
70. PRÉPARER UNE SORTIE ÉVENTUELLE DE LOVABLE
==================================================

Sans migration brutale, conserver une architecture portable, tout le code dans GitHub, données et secrets séparés, configuration documentée et build reproductible.

==================================================
71. NE PAS CASSER LOVABLE EN S’EN LIBÉRANT
==================================================

Procéder progressivement :

GitHub-first
→ réduction des dépendances
→ automatisation
→ Lovable devient une couche mince
→ migration future éventuelle.

==================================================
72. OBJECTIF MESURABLE
==================================================

Pouvoir passer plusieurs semaines sans ouvrir l’éditeur Lovable et gérer modification, tests, PR, merge, publication et contrôle principalement via Angel OS, ChatGPT/Codex/Copilot et GitHub.

==================================================
73. PUBLICATION LOVABLE AUTOMATIQUE PAR DÉFAUT
==================================================

Tant que Lovable héberge le site, toute modification logicielle validée pour la production doit être synchronisée puis publiée automatiquement, sans retour manuel dans Lovable.

==================================================
74. GITHUB → LOVABLE AUTOMATIQUE
==================================================

Auditer la connexion GitHub ↔ Lovable afin qu’un merge sur main déclenche détection, synchronisation, build/déploiement, publication et contrôle. Ne pas utiliser de prompt Lovable pour récupérer du code GitHub déjà validé.

==================================================
75. PUBLICATION = DEFINITION OF DONE
==================================================

Pour une tâche destinée à la production :

- code validé ;
- tests validés ;
- build validé ;
- CI validée ;
- main mis à jour ;
- synchronisation Lovable vérifiée ;
- publication vérifiée ;
- site public vérifié ;
- admin vérifié.

Une PR seule ne suffit pas.

==================================================
76. VÉRIFIER LA PRODUCTION APRÈS PUBLICATION
==================================================

Inspecter autant que possible :

- angel-leclerc.fr ;
- /admin ;
- pages modifiées ;
- routes critiques ;
- authentification ;
- mobile ;
- PWA ;
- erreurs et régressions.

En cas de régression liée : diagnostiquer → corriger → tester → republier → revérifier.

==================================================
77. PUBLICATION AUTOMATIQUE MAIS SÛRE
==================================================

A. Changement technique validé pour production : publication automatique après les contrôles requis.
B. Contenu ou action externe sensible : validation humaine conservée.

Ne pas confondre déploiement logiciel validé et publication automatique de contenu au nom de l’utilisateur.

==================================================
78. NE PAS CONSOMMER DE CRÉDIT LOVABLE POUR PUBLIER
==================================================

Privilégier GitHub main → synchronisation/déploiement Lovable via intégration ou CI/CD officiel, sans prompt ni crédit.

==================================================
79. SI LA PUBLICATION AUTOMATIQUE N’EXISTE PAS ENCORE
==================================================

Ne pas considérer l’intervention manuelle comme l’architecture finale. Automatiser le dernier kilomètre uniquement par les mécanismes officiels et sûrs, sans contourner les protections ni stocker de credentials dans le dépôt.

==================================================
80. ÉTAT DE DÉPLOIEMENT DANS ANGEL OS
==================================================

Afficher progressivement dans /admin :

- version production ;
- dernier commit et branche ;
- PR ;
- état CI et build ;
- synchronisation Lovable ;
- déploiement ;
- date de publication ;
- URL ;
- dernière vérification ;
- erreur éventuelle.

Ne jamais inventer ces états.

==================================================
81. BOUTON DE SECOURS
==================================================

Prévoir « Vérifier et republier la production » :

1. vérifier main ;
2. vérifier la CI ;
3. identifier la dernière version validée ;
4. vérifier Lovable ;
5. republier seulement si nécessaire ;
6. vérifier le site ;
7. afficher le résultat.

Ce bouton est un mécanisme de récupération, pas le workflow normal.

==================================================
82. RÈGLE LOVABLE FINALE
==================================================

Lovable doit devenir quasi invisible pour le développement mais automatique pour la publication.

Objectif quotidien :

demande
→ Angel OS/ChatGPT
→ GitHub et CI
→ main
→ publication Lovable automatique
→ contrôle production
→ « Publié ✓ ».

L’utilisateur ne doit normalement ni ouvrir Lovable, ni consommer un crédit, ni cliquer manuellement sur Publish.
