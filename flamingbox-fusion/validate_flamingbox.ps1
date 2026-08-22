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

  $performance = Get-Content 'components\performance_manager\user_tuning\prefs.cc' -Raw
  if (!$performance.Contains('kMemorySaverModeState, static_cast<int>(MemorySaverModeState::kEnabled)')) {
    throw 'Memory Saver is not enabled by default'
  }
  if (!$performance.Contains("kMemorySaverModeTimeBeforeDiscardInMinutes,`n      60)")) {
    throw 'Balanced 60-minute inactive-tab threshold missing'
  }

  $dns = Get-Content 'chrome\browser\net\default_dns_over_https_config_source.cc' -Raw
  if (!$dns.Contains('net::SecureDnsMode::kAutomatic')) { throw 'Secure DNS automatic mode missing' }
  if (!$dns.Contains("prefs::kDnsOverHttpsAutomaticModeFallbackToDoh,`n                                true)")) {
    throw 'Automatic DoH fallback is not enabled'
  }

  if (!(Test-Path 'FLAMINGBOX_BUILD.json')) { throw 'FLAMINGBOX_BUILD.json missing' }
  $meta = Get-Content 'FLAMINGBOX_BUILD.json' -Raw | ConvertFrom-Json
  if ($meta.chromium -ne $Expected) { throw 'Build metadata Chromium revision mismatch' }
  if ($meta.performance.profile -ne 'balanced') { throw 'Unexpected FlamingBox performance profile' }
  if ($meta.network.guardian -ne 'observe-first') { throw 'Guardian must start in observe-first mode' }

  Write-Host 'FlamingBox native validation passed.' -ForegroundColor Green
}
finally {
  Pop-Location
}
