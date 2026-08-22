# FlamingBox Native

FlamingBox Native remplace progressivement le prototype Electron par un vrai fork Chromium pour Windows.

## Architecture

- Moteur : Chromium complet (Blink + V8 + réseau Chromium + sandbox multi-processus).
- UI : chrome/browser + chrome/app renommés et personnalisés FlamingBox.
- Couche Angel OS : politiques de confidentialité, import, configuration et identité FlamingBox.
- Firefox n'est pas embarqué comme second moteur. Les fonctions utiles sont réimplémentées sur les primitives Chromium afin d'éviter deux moteurs, deux caches, deux piles réseau et deux sandboxes dans le même navigateur.

## Fonctions Firefox à reprendre

1. Protection renforcée contre le pistage : listes de trackers + blocage natif, sans proxy JavaScript.
2. Total Cookie Protection : isolation/partitionnement des cookies tiers par site de premier niveau.
3. SmartBlock-like compatibility : exceptions minimales lorsque le blocage casse connexion ou paiement.
4. Global Privacy Control et Do Not Track.
5. HTTPS-First.
6. Contrôle permissions caméra, micro, notifications et localisation par site.
7. Effacement configurable des données à la fermeture.
8. Mode privé avec profil éphémère.
9. Rapport de confidentialité par site.

## Fonctions Chromium conservées

- compatibilité Web complète Blink/V8 ;
- sandbox Chromium ;
- Site Isolation ;
- GPU process ;
- cache réseau natif ;
- DevTools ;
- gestionnaire de téléchargements ;
- PDF ;
- extensions Chromium ;
- historique, favoris et profils ;
- gestionnaire de mots de passe local Chromium ;
- import explicite depuis Chrome/Edge/Firefox via les importeurs Chromium lorsqu'ils sont disponibles.

## Objectif réseau

Aucun intercepteur JavaScript global de requêtes. Le navigateur ne doit pas générer de trafic supplémentaire pour bloquer du trafic. Le blocage et le partitionnement doivent être appliqués dans les couches Chromium prévues pour cela.

## Construction Windows

Chromium demande une machine Windows x64, Visual Studio avec C++, depot_tools, beaucoup de RAM et au moins 100 Go d'espace libre. Exécuter `bootstrap_windows.cmd` dans un terminal cmd.exe. Il télécharge le vrai checkout Chromium puis génère `out/FlamingBox`.

Le dépôt Angel OS ne contient volontairement pas une copie vendorisée de dizaines de gigaoctets de Chromium. Il contient les scripts, configurations et patches FlamingBox ; `depot_tools` récupère la révision Chromium correspondante. C'est le modèle maintenable pour suivre les mises à jour de sécurité Chromium.
