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
- Règle d’autonomie infrastructure : ne jamais ajouter une dépendance, un service, une base, un cache ou un connecteur qui impose à Angel une configuration manuelle, la création d’un compte, l’ajout manuel d’une clé, une opération DNS ou une intervention console pour que la fonctionnalité soit utilisable.
- Toute brique technique optionnelle (MySQL, Redis, Express, Python, Rust, ZTP ou autre) doit être installée et configurée automatiquement avec les accès et infrastructures déjà disponibles. Si ce n’est pas possible de bout en bout sans intervention utilisateur, ne pas la rendre obligatoire et conserver la solution fonctionnelle existante.
- Préférer une dégradation propre à une intégration incomplète : si une technologie cible ne peut pas être déployée, l’abandonner ou la différer plutôt que laisser une fonction cassée, une maquette ou un écran “à configurer”.
- Architecture cible privilégiée lorsque cela peut être réalisé automatiquement : React/TypeScript/Tailwind/Vite/Framer Motion pour l’interface ; API serveur Node/Express ; MySQL pour les données structurées ; Redis pour cache/files/sessions ; Python pour traitements et automatisations ; Rust uniquement pour composants système/performance justifiés ; ZTP pour provisionnement automatisé. Ne jamais multiplier les services externes payants uniquement pour respecter cette liste.
- Ne pas rétrograder ou migrer une dépendance majeure uniquement pour correspondre à l’architecture cible si cela risque de casser la production ; la compatibilité et le fonctionnement réel priment sur le numéro de version souhaité.
- Une tâche destinée à la production n’est terminée qu’après déploiement et vérification du site réel. Une PR ou un merge seuls ne suffisent pas.
- Automatiser les opérations techniques sûres et réversibles ; conserver une validation finale pour les actions externes, publiques, financières, destructrices ou irréversibles.
- MAINTENANCE : lorsqu’une tâche commence une modification réelle destinée à la production, ouvrir l’issue GitHub #17 « Angel OS — Maintenance Control » avant la première écriture. La garder ouverte pendant les changements, tests, CI et déploiement. Dès que la production est vérifiée saine et à jour, fermer systématiquement l’issue #17. Ne jamais laisser volontairement l’interrupteur ouvert après la fin d’une intervention. La route `/system-status` possède en plus une auto-libération de sécurité pour éviter qu’un oubli ne bloque le site indéfiniment.
