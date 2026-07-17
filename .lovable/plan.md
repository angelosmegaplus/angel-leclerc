Plan de création du site internet

## Objectif
Créer un site professionnel, minimaliste et coloré pour une auto-entreprise, avec présentation des services, tarifs et un blog.

## Pages
- **Accueil** : hero, accroche, aperçu des services, témoignages/CTA, derniers articles du blog.
- **Services** : liste détaillée des services + grille de tarifs.
- **Blog** : liste d'articles avec cartes et page article individuelle.
- **À propos** : portrait de l'entrepreneur, parcours, valeurs.
- **Contact** : formulaire + coordonnées.

## Design
- Direction visuelle : minimaliste, aéré, avec une palette chaude et professionnelle.
- Couleurs principales : crème chaud, encre profonde, terracotta comme accent, sauge comme secondaire.
- Typographie : une police distinctive pour les titres, une police lisible pour le corps.
- Pas de mode sombre/clair toggle, design clair par défaut.
- Animations légères (framer-motion) : apparition du hero et micro-interactions sur les boutons/cartes.

## Structure technique
- Routes TanStack Start distinctes : `/`, `/services`, `/blog`, `/blog/$slug`, `/about`, `/contact`.
- Composants partagés : Header, Footer, ServiceCard, PricingCard, BlogCard, ContactForm.
- Métadonnées SEO uniques par page via `head()`.
- `sitemap.xml` et `robots.txt`.
- Génération d'images de hero/brand pour le design final.

## Stack
- TanStack Start v1 + React 19 + Tailwind CSS v4 + shadcn/ui + framer-motion.
- Pas de backend complexe pour l'instant : le blog est en données statiques (peut être migré vers Lovable Cloud plus tard si besoin).

## Vérification
- Build sans erreur.
- Navigation entre les pages fonctionnelle.
- Responsive mobile/desktop.