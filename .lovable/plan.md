# Nouvelle tarification et page Accueil client détaillée

## Objectif
Mettre à jour uniquement l’accroche « Accueil client externalisé » de `/entreprise` et reconstruire `/accueil-client` comme page complète, sans toucher aux autres services ni pages.

## Modifications prévues

### `/entreprise`
- Conserver un bloc court avec le titre, deux paragraphes maximum et le lien vers la page détaillée.
- Afficher le prix fixe Mini permanence : **173,33 €/mois**, puis **soit 40 €/semaine**.
- Remplacer le bouton par **« Voir le fonctionnement détaillé »**.

### `/accueil-client`
- Mettre à jour le titre d’entrée, la promesse, le prix Mini permanence et les deux actions principales.
- Détailler visuellement le parcours réel d’un appel en huit étapes.
- Ajouter les sections sur la mise en place accompagnée, les outils prévus, l’exemple fictif « Dupont Plomberie – Sarlat », le modèle commercial et la transparence.
- Présenter les trois abonnements fixes : 173,33 €, 260 € et 390 €/mois avec leurs équivalents hebdomadaires.
- Conserver les différences actuelles entre les offres, sans promesse de 24/7 ni d’illimité, et préciser que volumes, horaires, canaux et hors-périmètre sont encadrés avant activation.
- Ajouter un grand accordéon tactile « Tout savoir » avec les onze réponses demandées.
- Conserver l’absence honnête de témoignages tant qu’aucun avis réel n’est disponible.
- Mettre à jour les métadonnées et supprimer toute trace des anciens prix sur ces deux emplacements.

## Identité visuelle et marques
- Réutiliser les composants, couleurs, typographies et espacements actuels.
- Utiliser les logos Ringover/Quicktalk uniquement si des fichiers officiels sont récupérables proprement ; sinon afficher des cartes soignées avec nom et icône générique.
- Employer les marques Google/Android/Orange uniquement comme exemples techniques, sans partenariat ni garantie fournisseur.

## Contrôles
- Vérifier qu’aucun ancien prix 39/79/149 ne subsiste dans les deux fichiers concernés.
- Lancer la vérification TypeScript.
- Contrôler visuellement `/entreprise` et `/accueil-client` sur ordinateur et mobile, ainsi que les accordéons.
- Vérifier le dernier état de compilation avant de conclure.
