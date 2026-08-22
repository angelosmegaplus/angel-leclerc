# FlamingBox Chromium Core

FlamingBox est un navigateur Windows construit a partir du code source open source de Chromium (Blink + V8), avec une identite propre et une trajectoire d'import des donnees Firefox/Chromium.

## Sources de reference

- Chromium: https://github.com/chromium/chromium
- Chromium source browser: https://source.chromium.org/chromium
- ChromiumOS source browser: https://source.chromium.org/chromiumos
- Firefox: https://github.com/mozilla-firefox/firefox

Firefox n'est pas fusionne avec Blink. FlamingBox conserve Chromium comme moteur unique et s'appuie sur les formats/importeurs Firefox lorsque cela est pertinent.

## Prerequis Windows

- Windows 10/11 x64
- Git
- Visual Studio 2022 avec Desktop development with C++ et Windows SDK
- Beaucoup d'espace disque disponible: Chromium est un tres gros projet
- PowerShell

Les outils depot_tools, GN et Ninja sont recuperes/utilises par le script de build.

## Construire FlamingBox

Depuis PowerShell:

```powershell
cd flamingbox\chromium-kit
Set-ExecutionPolicy -Scope Process Bypass
.\build-windows.ps1
```

Le script:

1. recupere depot_tools;
2. recupere Chromium sans historique complet;
3. synchronise les dependances;
4. applique le branding FlamingBox;
5. genere une configuration Release GN;
6. compile `chrome` et `mini_installer`;
7. produit un installateur et une archive portable.

Sorties attendues:

```text
flamingbox\dist-windows\FlamingBoxSetup.exe
flamingbox\dist-windows\FlamingBox-portable-win64.zip
```

## Donnees Firefox + Chromium

Chromium possede deja une infrastructure d'import de profils externes. La prochaine etape FlamingBox consiste a personnaliser cette interface pour proposer au premier lancement une fusion guidee des favoris, de l'historique et des donnees migrables depuis Firefox, Chrome, Edge et Chromium.

Les mots de passe et cookies ne doivent jamais etre copies brutalement: ils sont proteges par les mecanismes de chiffrement du navigateur et/ou de Windows. L'import doit passer par les composants autorises du navigateur.

## Important

Le nom, les logos et les fichiers de FlamingBox doivent rester distincts des marques Google Chrome et Mozilla Firefox. Les notices de licence et droits des composants open source ne doivent pas etre supprimees.
