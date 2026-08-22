param(
  [switch]$SkipBootstrap
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Work = Join-Path $Root 'work'
$Src = Join-Path $Work 'chromium\src'
$DepotTools = Join-Path $Work 'depot_tools'
$Out = Join-Path $Src 'out\FlamingBox'

& (Join-Path $Root 'validate_product_config.ps1')

if (!$SkipBootstrap) {
  & (Join-Path $Root 'bootstrap_fusion_windows.ps1')
}

if (!(Test-Path (Join-Path $Src '.git'))) {
  throw 'Chromium checkout missing. Run bootstrap_fusion_windows.ps1 first.'
}

$env:PATH = "$DepotTools;$env:PATH"
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = '0'

& (Join-Path $Root 'apply_flamingbox.ps1') -ChromiumSrc $Src
& (Join-Path $Root 'validate_flamingbox.ps1') -ChromiumSrc $Src

Copy-Item (Join-Path $Root 'args.gn') (Join-Path $Src 'flamingbox.args.gn') -Force

Push-Location $Src
try {
  gn gen out\FlamingBox --args-file=flamingbox.args.gn
  autoninja -C out\FlamingBox chrome

  $ChromeExe = Join-Path $Out 'chrome.exe'
  if (!(Test-Path $ChromeExe)) { throw 'Chromium build finished without chrome.exe' }

  $Dist = Join-Path $Root 'dist\windows-x64'
  if (Test-Path $Dist) { Remove-Item $Dist -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $Dist | Out-Null

  Copy-Item (Join-Path $Out '*') $Dist -Recurse -Force
  Copy-Item $ChromeExe (Join-Path $Dist 'FlamingBox.exe') -Force

  $PolicyDist = Join-Path $Dist 'flamingbox-policy'
  New-Item -ItemType Directory -Force -Path $PolicyDist | Out-Null
  Copy-Item (Join-Path $Root 'config\*.json') $PolicyDist -Force

  @{
    product = 'FlamingBox Native'
    chromium = '8c7281d3300aa386be904fb9ee881babe85e12dc'
    firefoxReference = '5b17b585c394a469267f65da3f9794162dd9c5a5'
    engine = 'Blink + V8 + Chromium Network Service'
    privacyDefaults = @('GPC','DNT','HTTPS-First','third-party storage partitioning')
    performanceProfile = 'balanced'
    guardianMode = 'observe-first'
    secureDnsMode = 'automatic'
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json -Depth 3 | Set-Content (Join-Path $Dist 'FLAMINGBOX_VERSION.json') -Encoding UTF8

  & (Join-Path $Root 'smoke_test_windows.ps1') -FlamingBoxExe (Join-Path $Dist 'FlamingBox.exe')

  $Zip = Join-Path $Root 'dist\FlamingBox-Native-Windows-x64.zip'
  if (Test-Path $Zip) { Remove-Item $Zip -Force }
  Compress-Archive -Path (Join-Path $Dist '*') -DestinationPath $Zip -CompressionLevel Optimal

  Write-Host ''
  Write-Host 'FlamingBox native build complete and smoke-tested.' -ForegroundColor Green
  Write-Host "Executable: $(Join-Path $Dist 'FlamingBox.exe')"
  Write-Host "Archive:    $Zip"
}
finally {
  Pop-Location
}
