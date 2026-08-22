param(
  [string]$Workspace = 'C:\src\flamingbox-build',
  [switch]$SkipFetch
)

$ErrorActionPreference = 'Stop'
$DepotTools = Join-Path $Workspace 'depot_tools'
$ChromiumRoot = Join-Path $Workspace 'chromium'
$ChromiumSrc = Join-Path $ChromiumRoot 'src'
$OutDir = Join-Path $ChromiumSrc 'out\FlamingBox'
$KitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

New-Item -ItemType Directory -Force -Path $Workspace | Out-Null

if (!(Test-Path $DepotTools)) {
  Write-Host 'Clonage depot_tools...'
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git $DepotTools
}
$env:PATH = "$DepotTools;$env:PATH"
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = '0'

if (!$SkipFetch -and !(Test-Path $ChromiumSrc)) {
  New-Item -ItemType Directory -Force -Path $ChromiumRoot | Out-Null
  Push-Location $ChromiumRoot
  try {
    Write-Host 'Recuperation de Chromium (sans historique complet)...'
    fetch --no-history chromium
  } finally { Pop-Location }
}

if (!(Test-Path $ChromiumSrc)) {
  throw "Sources Chromium absentes: $ChromiumSrc"
}

Push-Location $ChromiumSrc
try {
  Write-Host 'Synchronisation des dependances Chromium...'
  gclient sync

  & (Join-Path $KitRoot 'apply-flamingbox.ps1') -ChromiumSrc $ChromiumSrc

  $args = @'
is_debug=false
is_component_build=false
symbol_level=0
blink_symbol_level=0
v8_symbol_level=0
is_official_build=false
proprietary_codecs=false
ffmpeg_branding="Chromium"
'@

  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  [IO.File]::WriteAllText((Join-Path $OutDir 'args.gn'), $args.TrimStart(), [Text.UTF8Encoding]::new($false))

  Write-Host 'Generation GN...'
  gn gen 'out\FlamingBox'

  Write-Host 'Compilation FlamingBox...'
  autoninja -C 'out\FlamingBox' chrome mini_installer

  $dist = Join-Path $KitRoot '..\dist-windows'
  New-Item -ItemType Directory -Force -Path $dist | Out-Null

  $installer = Join-Path $OutDir 'mini_installer.exe'
  if (Test-Path $installer) {
    Copy-Item $installer (Join-Path $dist 'FlamingBoxSetup.exe') -Force
  }

  $portable = Join-Path $dist 'FlamingBox-portable'
  New-Item -ItemType Directory -Force -Path $portable | Out-Null
  Get-ChildItem $OutDir -File | Where-Object {
    $_.Extension -in '.exe','.dll','.pak','.bin','.dat' -or $_.Name -in 'icudtl.dat','v8_context_snapshot.bin'
  } | Copy-Item -Destination $portable -Force

  if (Test-Path (Join-Path $portable 'chrome.exe')) {
    Copy-Item (Join-Path $portable 'chrome.exe') (Join-Path $portable 'FlamingBox.exe') -Force
  }

  $zip = Join-Path $dist 'FlamingBox-portable-win64.zip'
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Compress-Archive -Path "$portable\*" -DestinationPath $zip

  Write-Host ''
  Write-Host 'Build termine.' -ForegroundColor Green
  Write-Host "Installateur: $(Join-Path $dist 'FlamingBoxSetup.exe')"
  Write-Host "Portable: $zip"
} finally { Pop-Location }
