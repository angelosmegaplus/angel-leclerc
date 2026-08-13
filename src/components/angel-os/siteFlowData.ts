export const siteFlow = [
  {
    title: "1. Visiteur, navigateur et PWA",
    text: "L'utilisateur ouvre angel-leclerc.fr depuis Chrome, Safari ou un autre navigateur. Le site peut aussi être utilisé comme PWA : l'interface web reste la même, mais peut être installée comme une application.",
    tech: "Navigateur · PWA · HTML/CSS · CDN",
  },
  {
    title: "2. Interface React + TanStack",
    text: "React construit l'interface. TanStack gère les routes, les pages, le chargement des données et la navigation. C'est cette couche qui affiche le portfolio, le blog, la boutique, les formulaires et l'administration.",
    tech: "React · TanStack Start/Router · TypeScript · Vite",
  },
  {
    title: "3. Angel OS Web",
    text: "Le site initialise Angel OS comme couche commune via son adaptateur web. Le Core fournit les mécanismes génériques : événements, modules, configuration et capacités, sans décider du design ou du contenu du site.",
    tech: "Angel OS Core · Event Bus · Module Registry · Web Adapter",
  },
  {
    title: "4. Angel OS IA",
    text: "Au-dessus du Core se trouve Angel OS IA, l'environnement personnel : administration, assistance IA, automatisations, projets, candidatures, statistiques, studio et outils de pilotage. Cette couche n'est pas nécessaire pour réutiliser Angel OS ailleurs.",
    tech: "IA · automatisations · administration · modules personnels",
  },
  {
    title: "5. Données et authentification",
    text: "Supabase sert de backend applicatif pour les données, l'authentification et le stockage. Les articles, paramètres, comptes et autres données dynamiques peuvent être lus ou modifiés par les fonctions autorisées du site.",
    tech: "Supabase · PostgreSQL · Auth · Storage",
  },
  {
    title: "6. Fonctions serveur et services externes",
    text: "Les fonctions serveur relient le site aux services qui ne doivent pas tourner directement dans le navigateur : intelligence artificielle, e-mail, OAuth, statistiques, paiements et autres API externes selon les modules activés.",
    tech: "Server functions · APIs · OAuth · e-mail · IA",
  },
  {
    title: "7. Code source et évolution",
    text: "Le code est versionné sur GitHub. Chaque modification peut être historisée, comparée et déployée. Le dossier angel-os contient le noyau public réutilisable, séparé des fonctions personnelles du site.",
    tech: "GitHub · Git · Angel OS open source",
  },
  {
    title: "8. Build et mise en ligne",
    text: "Vercel récupère le code, construit l'application et publie la version web. Le site est ensuite servi aux visiteurs via l'infrastructure de déploiement, sans rendre l'affichage dépendant du fonctionnement interne d'Angel OS.",
    tech: "Vercel · build · déploiement · CDN",
  },
] as const;
