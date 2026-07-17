export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "5-erreurs-lancer-entreprise",
    title: "5 erreurs à éviter quand on lance son auto-entreprise",
    excerpt:
      "Le démarrage d'une activité est un moment excitant, mais quelques pièges classiques peuvent ralentir votre croissance. Voici comment les éviter.",
    category: "Entrepreneuriat",
    date: "2026-06-15",
    readTime: "5 min",
    content: `
## 1. Sous-estimer l'importance du positionnement

De nombreux entrepreneurs essaient de tout faire pour tout le monde. Le résultat : un message confus et des clients qui ne comprennent pas votre valeur ajoutée.

**Conseil :** choisissez une niche claire et articulez votre proposition de valeur en une phrase percutante.

## 2. Négliger la présence en ligne

Aujourd'hui, un site web ou un profil professionnel soigné est souvent le premier contact avec un client potentiel. Un manque de visibilité en ligne peut vous faire passer à côté d'opportunités.

## 3. Mélanger vie pro et vie perso

Séparer les finances, créer un espace de travail dédié et fixer des horaires clairs aide à rester productif et sain d'esprit.

## 4. Ne pas fixer de prix justes

Sous-estimer son prix est un classique. Calculez vos coûts réels, incluez la valeur de votre expertise, et testez progressivement.

## 5. Essayer de tout faire seul

Externaliser, se former et s'entourer sont des leviers de croissance. Votre temps est votre ressource la plus précieuse.

---

Lancer une activité est un apprentissage continu. En évitant ces erreurs, vous poserez des bases solides pour grandir sereinement.
    `,
  },
  {
    slug: "comment-creer-site-vendre",
    title: "Comment créer un site web qui convertit vraiment",
    excerpt:
      "Un beau site ne suffit pas. Découvrez les éléments clés qui transforment vos visiteurs en clients.",
    category: "Web",
    date: "2026-05-28",
    readTime: "6 min",
    content: `
## La clarté avant tout

Un site qui convertit est avant tout un site clair. En 3 secondes, le visiteur doit comprendre ce que vous proposez, pour qui, et pourquoi c'est pertinent pour lui.

## Un appel à l'action visible

Chaque page doit guider l'utilisateur vers une action concrète : prendre rendez-vous, demander un devis, s'inscrire à la newsletter.

## La preuve sociale

Témoignages, études de cas, logos de clients : ces éléments rassurent et réduisent la friction.

## La rapidité et le mobile

Un site lent ou mal adapté au mobile fait fuir les visiteurs. Pensez performance dès la conception.

## Conclusion

Un site web efficace est un outil de conversion. Concentrez-vous sur la clarté, la confiance et l'action.
    `,
  },
  {
    slug: "fixer-prix-prestation",
    title: "Bien fixer ses prix en tant que prestataire",
    excerpt:
      "Fixer le bon prix est un défi pour tous les indépendants. Voici une méthode simple et pragmatique pour valoriser votre travail.",
    category: "Business",
    date: "2026-05-10",
    readTime: "4 min",
    content: `
## Commencez par vos coûts

Calculez vos charges fixes, vos impôts approximatifs, et le temps réellement passé sur chaque mission.

## Intégrez la valeur perçue

Votre tarif ne reflète pas seulement le temps passé, mais aussi l'impact que vous créez pour le client.

## Proposez plusieurs options

Un devis avec 3 niveaux de service permet au client de choisir et augmente souvent le panier moyen.

## Revisitez vos tarifs régulièrement

À mesure que vous gagnez en expérience, vos tarifs doivent évoluer. C'est normal et sain pour votre activité.
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
