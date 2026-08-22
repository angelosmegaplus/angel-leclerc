param(
  [Parameter(Mandatory=$true)][string]$ChromiumSrc
)

$ErrorActionPreference = 'Stop'
$ChromiumSrc = (Resolve-Path $ChromiumSrc).Path
$Expected = '8c7281d3300aa386be904fb9ee881babe85e12dc'

Push-Location $ChromiumSrc
try {
  $head = (git rev-parse HEAD).Trim()
  if ($head -ne $Expected) { throw "Unexpected Chromium revision: $head" }

  $branding = Get-Content 'chrome\app\theme\chromium\BRANDING' -Raw
  if (!$branding.Contains('PRODUCT_FULLNAME=FlamingBox')) { throw 'FlamingBox branding missing' }

  $prefs = Get-Content 'chrome\browser\ui\browser_ui_prefs.cc' -Raw
  if (!$prefs.Contains('prefs::kEnableDoNotTrack, true,')) { throw 'DNT default not enabled' }
  if (!$prefs.Contains('prefs::kHttpsOnlyModeEnabled, true,')) { throw 'HTTPS-First default not enabled' }

  $delegate = Get-Content 'chrome\app\chrome_main_delegate.cc' -Raw
  foreach ($token in @('FLAMINGBOX_PRIVACY_DEFAULTS','GlobalPrivacyControlForce','ThirdPartyStoragePartitioning')) {
    if (!$delegate.Contains($token)) { throw "Native feature missing: $token" }
  }

  if ($delegate.Contains('disable-web-security') -or $delegate.Contains('no-sandbox')) {
    throw 'Unsafe Chromium switch detected in FlamingBox patch'
  }

  if (!(Test-Path 'FLAMINGBOX_BUILD.json')) { throw 'FLAMINGBOX_BUILD.json missing' }
  $meta = Get-Content 'FLAMINGBOX_BUILD.json' -Raw | ConvertFrom-Json
  if ($meta.chromium -ne $Expected) { throw 'Build metadata Chromium revision mismatch' }

  Write-Host 'FlamingBox native validation passed.' -ForegroundColor Green
}
finally {
  Pop-Location
}
