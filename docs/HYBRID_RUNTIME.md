# Exécution hybride Vercel / Lovable

Le domaine public `angel-leclerc.fr` est déployé sur Vercel. Les fonctions qui
dépendent encore des connexions et secrets gérés par Lovable Cloud restent
exécutées par le déploiement Lovable existant.

Vercel transmet côté serveur les routes suivantes, sans redirection visible et
sans exposer de secret au navigateur :

- `/_serverFn/*` : fonctions serveur TanStack utilisées par Angel OS ;
- `/__server` : ancien point d'entrée TanStack conservé par compatibilité ;
- `/~oauth/*` : démarrage et retours OAuth ;
- `/api/public/*` : formulaires et webhooks publics ;
- `/lovable/*` : routes de compatibilité Lovable.

Le reste du site, ses assets et sa PWA sont servis directement par Vercel. Cette
séparation permet de conserver les intégrations Lovable déjà fonctionnelles
tout en gardant GitHub comme source de vérité et Vercel comme déploiement du
site. Elle pourra être réduite route par route lorsque les connexions seront
migrées officiellement vers une infrastructure indépendante.
