@echo off
setlocal EnableExtensions EnableDelayedExpansion

set ROOT=%~dp0
set WORK=%ROOT%work
set DEPOT=%WORK%\depot_tools
set CHECKOUT=%WORK%\chromium

if not exist "%WORK%" mkdir "%WORK%"

if not exist "%DEPOT%\.git" (
  echo [FlamingBox] Installation de depot_tools...
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git "%DEPOT%" || exit /b 1
)

set PATH=%DEPOT%;%PATH%
set DEPOT_TOOLS_WIN_TOOLCHAIN=0

git config --global core.longpaths true

if not exist "%CHECKOUT%\src\.git" (
  echo [FlamingBox] Telechargement du checkout Chromium complet...
  mkdir "%CHECKOUT%" 2>nul
  pushd "%CHECKOUT%"
  call fetch --no-history chromium || (popd & exit /b 1)
  popd
) else (
  echo [FlamingBox] Mise a jour Chromium...
  pushd "%CHECKOUT%\src"
  call gclient sync || (popd & exit /b 1)
  popd
)

pushd "%CHECKOUT%\src"

echo [FlamingBox] Generation de la configuration Release...
if not exist "out\FlamingBox" mkdir "out\FlamingBox"
copy /Y "%ROOT%args.gn" "out\FlamingBox\args.gn" >nul || (popd & exit /b 1)
call gn gen out\FlamingBox || (popd & exit /b 1)

echo [FlamingBox] Checkout pret.
echo Pour compiler : autoninja -C out\FlamingBox chrome

popd
endlocal
