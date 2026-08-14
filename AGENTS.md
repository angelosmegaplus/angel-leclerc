<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Angel OS — Règles de gouvernance et d’exploitation

- Lire et appliquer `docs/ANGEL_OS_MASTER_BRIEF.md` avant toute évolution structurante d’Angel OS.
- Le dépôt `github.com/angelosmegaplus/angel-leclerc` est l’unique source de vérité.
- `main` est la branche de production.
- Interdiction absolue de force-push sur l’historique partagé.
- Interdiction de réécrire l’historique synchronisé (pas de rebase/amend/squash sur des commits déjà poussés).
- Lovable sert uniquement à synchroniser, héberger et publier ; ne pas l’utiliser comme source de vérité pour le code.
- Préserver tout le site public et toutes les fonctions admin existantes.
- `/admin` = Angel OS / Angel Control Center.
- Préserver CMS, commentaires, favoris/étoiles, formulaires, analytics, PWA, notifications, OAuth, Studio/Journalisme, projets, candidatures, ALC.
- Ne jamais exposer de secrets dans le code ou les assets publics.
- Ne jamais envoyer automatiquement un e-mail, publier un article, poster sur les réseaux, supprimer des données ou effectuer un paiement sans confirmation explicite et revue.
- Utiliser Supabase Auth réel uniquement pour l’authentification des utilisateurs.
- Mobile-first Android (priorité ergonomie et performance pour Android).
- Ne jamais présenter de données fictives comme réelles.
- Ne jamais marquer une fonction “automatique” si rien ne s’exécute réellement.
- Pour chaque connexion ou automatisation, afficher un état réel parmi les états documentés dans le brief maître ; une interface seule n’est jamais une intégration fonctionnelle.
- Préférer OAuth/OIDC officiel et garder secrets, tokens et renouvellement côté serveur. Ne demander une activation développeur que lorsqu’elle est réellement imposée par le fournisseur.
- Budget Lovable par défaut pour le développement courant : 0 crédit. Utiliser GitHub et la CI en priorité sans casser la synchronisation ou la production existante.
- Une tâche destinée à la production n’est terminée qu’après déploiement et vérification du site réel. Une PR ou un merge seuls ne suffisent pas.
- Automatiser les opérations techniques sûres et réversibles ; conserver une validation finale pour les actions externes, publiques, financières, destructrices ou irréversibles.

## Cycle obligatoire de maintenance Angel OS

- L’issue GitHub `#17` intitulée `Angel OS — Maintenance Control` est l’interrupteur officiel de maintenance du site.
- Issue `#17` ouverte = maintenance forcée. Issue `#17` fermée = maintenance non forcée.
- Toute tâche ou tout agent qui va réellement modifier le code, la configuration, une route publique, un composant, un asset, une intégration ou tout autre élément destiné à être publié doit OUVRIR l’issue `#17` juste avant la première modification effective.
- Une simple lecture, veille, analyse, comparaison, diagnostic ou vérification sans changement ne doit PAS activer la maintenance.
- Une fois la maintenance ouverte, la garder active pendant les modifications, les vérifications, le build, la CI et le déploiement Vercel.
- Ne FERMER l’issue `#17` qu’après avoir confirmé que le dernier `main` attendu est bien déployé en production, que le déploiement est READY/success et que les pages concernées répondent correctement sur `angel-leclerc.fr`.
- Si le déploiement échoue ou reste bloqué, laisser l’issue `#17` ouverte jusqu’à résolution ou jusqu’à décision explicite de revenir à une version stable.
- Ne jamais fermer l’issue uniquement parce que le commit a été poussé sur GitHub.
- `/system-status` conserve aussi la comparaison automatique entre le SHA de production et le dernier SHA de `main` : cette détection reste un filet de sécurité, mais elle ne remplace pas l’interrupteur `#17`.
