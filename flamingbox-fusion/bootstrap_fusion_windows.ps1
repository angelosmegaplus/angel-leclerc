$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Work = Join-Path $Root 'work'
$ChromiumDir = Join-Path $Work 'chromium'
$FirefoxDir = Join-Path $Work 'firefox-reference'
$DepotTools = Join-Path $Work 'depot_tools'

$ChromiumCommit = '8c7281d3300aa386be904fb9ee881babe85e12dc'
$FirefoxCommit = '5b17b585c394a469267f65da3f9794162dd9c5a5'

New-Item -ItemType Directory -Force -Path $Work | Out-Null

git config --global core.longpaths true

if (!(Test-Path (Join-Path $DepotTools '.git'))) {
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git $DepotTools
}
$env:PATH = "$DepotTools;$env:PATH"
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = '0'

if (!(Test-Path (Join-Path $ChromiumDir 'src\.git'))) {
  New-Item -ItemType Directory -Force -Path $ChromiumDir | Out-Null
  Push-Location $ChromiumDir
  fetch --no-history chromium
  Pop-Location
}

Push-Location (Join-Path $ChromiumDir 'src')
git fetch origin $ChromiumCommit --depth=1
git checkout --detach $ChromiumCommit
gclient sync -D
Pop-Location

if (!(Test-Path (Join-Path $FirefoxDir '.git'))) {
  git clone --filter=blob:none --no-checkout https://github.com/mozilla-firefox/firefox.git $FirefoxDir
}
Push-Location $FirefoxDir
git fetch origin $FirefoxCommit --depth=1
git checkout --detach $FirefoxCommit
Pop-Location

$Meta = @{
  chromium = $ChromiumCommit
  firefox = $FirefoxCommit
  architecture = 'Chromium-native; Firefox feature-port reference'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json -Depth 3
$Meta | Set-Content (Join-Path $Work 'FUSION-LOCK.json') -Encoding UTF8

Write-Host ''
Write-Host 'FlamingBox Fusion workspace ready.' -ForegroundColor Green
Write-Host "Chromium: $ChromiumCommit"
Write-Host "Firefox:  $FirefoxCommit"
Write-Host "Chromium source: $ChromiumDir\src"
Write-Host "Firefox reference: $FirefoxDir"
Write-Host ''
Write-Host 'Next step: apply FlamingBox patches to Chromium, then compile chrome with autoninja.'
