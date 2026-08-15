# Préparation Google Cloud — Angel OS / angel-leclerc.fr

## Objectif

Préparer le site pour pouvoir remplacer progressivement Vercel par une architecture GitHub + Google Cloud, sans coupure du site et sans supprimer les services externes utiles (notamment l'envoi d'e-mails).

## Principe

- GitHub reste la source de vérité du code.
- Google Cloud devient la couche d'exécution et d'infrastructure.
- Angel OS reste la couche d'orchestration visible.
- Vercel reste actif pendant toute la phase de validation et n'est retiré qu'après bascule réussie.

## Architecture cible initiale

GitHub -> Cloud Build -> Artifact Registry -> Cloud Run -> domaine public

Services complémentaires prévus :

- Secret Manager : secrets et clés côté serveur.
- Cloud Storage : médias, fichiers et objets volumineux.
- Cloud Logging / Monitoring : logs, métriques et alertes.
- Cloud Scheduler / Cloud Run Jobs : tâches planifiées ou ponctuelles.
- Compute Engine : uniquement pour les services réellement permanents ou nécessitant une VM.

## Compatibilité existante à préserver

Le projet utilise actuellement TanStack Start/Vite/Nitro et contient des dépendances liées à Vercel ainsi qu'aux services Lovable/Supabase. La migration doit être progressive : aucune suppression de dépendance ou de fonction Vercel tant que son équivalent Google Cloud n'a pas été testé.

Le formulaire de contact et les e-mails automatiques doivent rester fonctionnels pendant toute la migration. Le moteur d'envoi existant peut être conservé même si l'hébergement principal quitte Vercel.

## Étapes de migration

1. Activer Cloud Build API dans le projet Google Cloud.
2. Connecter le dépôt GitHub `angelosmegaplus/angel-leclerc` à Google Cloud.
3. Créer un environnement Cloud Run de préproduction séparé du domaine public.
4. Adapter le build Nitro au runtime Node/Cloud Run si nécessaire.
5. Déplacer les secrets hors du dépôt vers Secret Manager.
6. Déployer une première révision Cloud Run sans toucher au DNS.
7. Tester les pages publiques, l'administration, les API, Angel OS IA, l'authentification, les formulaires et l'envoi d'e-mails.
8. Ajouter les vérifications de santé et le rollback automatique.
9. Brancher le domaine seulement après validation complète.
10. Maintenir Vercel comme secours temporaire, puis le retirer quand Google Cloud est stable.

## Règles de sécurité

- Ne jamais envoyer `.env` ou des secrets dans une image publique ou dans les logs.
- Utiliser Secret Manager ou des variables d'environnement injectées côté Cloud Run.
- Ne jamais supprimer Vercel avant validation de la version Cloud Run.
- Prévoir un endpoint de santé exploitable par le monitoring.
- Prévoir un rollback vers la révision précédente en cas d'échec.

## Points déjà repérés dans le dépôt

- Le projet contient `vercel.json` et plusieurs modules dédiés à Vercel : ils devront être conservés pendant la transition.
- Le `vite.config.ts` indique que la configuration Lovable utilise Nitro avec une cible Cloudflare par défaut ; le runtime Cloud Run devra donc être testé explicitement avant bascule.
- Le projet contient déjà une route de santé Angel OS qui pourra servir de base aux tests de disponibilité.
- Le dépôt contient actuellement des fichiers `.env` suivis par Git : une revue des secrets est prioritaire avant toute migration cloud.

## État

Branche de préparation : `prep/google-cloud`.

Cette branche ne modifie pas la production. Elle sert à préparer la migration avant connexion effective du projet Google Cloud.
