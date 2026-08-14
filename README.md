# Angel Leclerc Communication / Angel OS

Site officiel et espace Angel OS de `angel-leclerc.fr`.

## Source de vérité

- Dépôt principal : GitHub `angelosmegaplus/angel-leclerc`
- Branche de production : `main`
- Hébergement de production : Vercel
- URL publique : https://www.angel-leclerc.fr

Lovable n'est plus la voie normale de développement ou de publication. Il peut rester une référence historique ponctuelle pour comparer une interface, mais les modifications validées doivent être intégrées à ce dépôt puis publiées depuis `main`.

## Développement

Prérequis : Node.js et npm.

```sh
git clone https://github.com/angelosmegaplus/angel-leclerc.git
cd angel-leclerc
npm i
npm run dev
```

## Déploiement

Les changements poussés sur `main` sont destinés à la production Vercel. Les secrets et variables d'environnement restent configurés côté hébergeur et ne doivent jamais être stockés dans le dépôt.
