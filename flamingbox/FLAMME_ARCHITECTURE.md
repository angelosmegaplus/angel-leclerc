# Flamme — politique d’architecture

Objectif de conception demandé : **99,5 % Chromium / 0,4 % Firefox / 0,1 % Linux**.

Ces pourcentages sont une règle de gouvernance du projet, pas une mesure littérale des lignes de code des dépendances. Flamme conserve Chromium comme unique moteur exécutable et unique pile réseau.

## 99,5 % Chromium
- Blink
- V8
- Network Service
- cache HTTP
- sandbox
- Site Isolation
- GPU process
- HTTP/2 et HTTP/3
- WebRTC
- extensions
- PDF
- téléchargements
- profils et stockage

## 0,4 % Firefox
Uniquement des idées ou comportements réimplémentés de façon compatible Chromium :
- protection anti-tracking
- permissions temporaires
- SmartBlock / exceptions contextuelles
- anti-fingerprinting prudent
- ergonomie de confidentialité

Aucun Gecko, SpiderMonkey ou second moteur réseau n’est embarqué.

## 0,1 % Linux / POSIX
Uniquement pour la portabilité et la validation :
- tests de chemins POSIX
- compatibilité de scripts
- CI Linux pour les fichiers indépendants de Windows
- aucune tentative d’injecter le noyau Linux dans la pile réseau Chromium

Le but est précisément d’éviter les bugs réseau : **une seule pile réseau Chromium**, pas trois moteurs concurrents.
