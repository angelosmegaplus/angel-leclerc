# FlamingBox Native — matrice de fonctions

## Base Chromium native

- Blink / V8 / Mojo / Network Service
- sandbox multi-processus et Site Isolation
- cache HTTP natif
- HTTP/2 et HTTP/3/QUIC gérés par Chromium
- DevTools
- PDF
- téléchargements
- extensions Chromium
- profils
- favoris / historique
- gestionnaire de mots de passe Chromium
- import utilisateur depuis navigateurs installés

## Couche FlamingBox / Angel OS

### Niveau 1 — performance et sécurité par défaut

- aucune interception JavaScript globale des requêtes
- HTTPS-First
- blocage natif des pop-up Chromium
- permissions sensibles par site
- télémétrie FlamingBox désactivée par défaut
- mémoire/cache laissés au gestionnaire Chromium
- mode économie mémoire Chromium

### Niveau 2 — fonctions inspirées de Firefox

- Total Cookie Protection-like : partitionnement des cookies/stockages tiers par top-level site
- Enhanced Tracking Protection-like : listes de domaines et règles de tracking appliquées via composants Chromium natifs
- SmartBlock-like : shims/compatibilité uniquement pour les ressources connues qui cassent un site après blocage
- Global Privacy Control
- rapport de protection par site
- bouton de désactivation temporaire des protections pour un site
- nettoyage configurable des données à la fermeture

### Niveau 3 — paiements et connexions

- ne jamais désactiver globalement cookies, JavaScript ou stockage lors d'un checkout
- exceptions limitées au site et à la durée du flux de paiement
- conserver sandbox, HTTPS et isolation de site pendant le paiement
- compatibilité 3-D Secure / Stripe / PayPal / Adyen / Worldline sans liste blanche réseau globale

### Niveau 4 — mots de passe

- coffre local Chromium protégé par les mécanismes Windows/Chromium
- import explicite via les importeurs Chromium quand disponible
- accès à Google Password Manager via le site officiel
- aucune extraction ou déchiffrement artisanal du coffre Chrome

## Ce que FlamingBox ne fera pas

- exécuter Gecko et Blink simultanément pour la même page
- copier des fichiers Firefox au hasard dans Chromium
- installer un proxy réseau local juste pour bloquer les pubs/trackers
- relire un fichier de configuration à chaque requête réseau
- contourner les mécanismes de sécurité de Google Password Manager
