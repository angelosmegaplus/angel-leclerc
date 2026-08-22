param(
  [Parameter(Mandatory=$true)][string]$ChromiumSrc
)

$ErrorActionPreference = 'Stop'
$Expected = '8c7281d3300aa386be904fb9ee881babe85e12dc'
$FirefoxExpected = '5b17b585c394a469267f65da3f9794162dd9c5a5'
$ChromiumSrc = (Resolve-Path $ChromiumSrc).Path

function Replace-Or-Throw([string]$Text, [string]$Old, [string]$New, [string]$Label) {
  if (!$Text.Contains($Old) -and !$Text.Contains($New)) {
    throw "FlamingBox patch target not found: $Label"
  }
  return $Text.Replace($Old, $New)
}

Push-Location $ChromiumSrc
try {
  $head = (git rev-parse HEAD).Trim()
  if ($head -ne $Expected) { throw "Wrong Chromium revision: $head (expected $Expected)" }

  # 1) FlamingBox identity. Keep Chromium licensing intact while changing product labels.
  $brandingPath = Join-Path $ChromiumSrc 'chrome\app\theme\chromium\BRANDING'
  @'
COMPANY_FULLNAME=FlamingBox Project
COMPANY_SHORTNAME=FlamingBox
PRODUCT_FULLNAME=FlamingBox
PRODUCT_SHORTNAME=FlamingBox
PRODUCT_INSTALLER_FULLNAME=FlamingBox Installer
PRODUCT_INSTALLER_SHORTNAME=FlamingBox Installer
COPYRIGHT=Copyright @LASTCHANGE_YEAR@ FlamingBox Project. Chromium portions Copyright The Chromium Authors.
MAC_BUNDLE_ID=org.flamingbox.FlamingBox
MAC_CREATOR_CODE=FlBx
MAC_TEAM_ID=
'@ | Set-Content $brandingPath -Encoding ASCII

  # 2) Privacy defaults implemented in Chromium's own preference layer.
  $prefsPath = Join-Path $ChromiumSrc 'chrome\browser\ui\browser_ui_prefs.cc'
  $prefs = Get-Content $prefsPath -Raw
  $prefs = Replace-Or-Throw $prefs 'prefs::kEnableDoNotTrack, false,' 'prefs::kEnableDoNotTrack, true,' 'DNT default'
  $prefs = Replace-Or-Throw $prefs 'prefs::kHttpsOnlyModeEnabled, false,' 'prefs::kHttpsOnlyModeEnabled, true,' 'HTTPS-First default'
  Set-Content $prefsPath $prefs -Encoding UTF8

  # 3) Performance defaults. Use Chromium Performance Manager instead of a custom scheduler.
  # Balanced profile: memory saver enabled, medium aggressiveness, 60 minute inactive-tab threshold.
  $performancePrefsPath = Join-Path $ChromiumSrc 'components\performance_manager\user_tuning\prefs.cc'
  $performancePrefs = Get-Content $performancePrefsPath -Raw
  $performancePrefs = Replace-Or-Throw $performancePrefs 'registry->RegisterBooleanPref(kMemorySaverModeEnabled, false);' 'registry->RegisterBooleanPref(kMemorySaverModeEnabled, true);' 'legacy memory saver default'

  $oldState = @'
  registry->RegisterIntegerPref(
      kMemorySaverModeState, static_cast<int>(MemorySaverModeState::kDisabled));
'@
  $newState = @'
  registry->RegisterIntegerPref(
      kMemorySaverModeState, static_cast<int>(MemorySaverModeState::kEnabled));
'@
  $performancePrefs = Replace-Or-Throw $performancePrefs $oldState $newState 'memory saver state default'

  $oldTimeout = @'
  registry->RegisterIntegerPref(
      kMemorySaverModeTimeBeforeDiscardInMinutes,
      kDefaultMemorySaverModeTimeBeforeDiscardInMinutes);
'@
  $newTimeout = @'
  registry->RegisterIntegerPref(
      kMemorySaverModeTimeBeforeDiscardInMinutes,
      60);
'@
  $performancePrefs = Replace-Or-Throw $performancePrefs $oldTimeout $newTimeout 'memory saver discard timeout'
  # Medium aggressiveness remains Chromium's default; it is the balanced FlamingBox profile.
  Set-Content $performancePrefsPath $performancePrefs -Encoding UTF8

  # 4) Secure DNS. Keep Chromium Automatic mode for captive portals/VPN compatibility,
  # while enabling Chromium's own automatic DoH fallback preference.
  $dnsPath = Join-Path $ChromiumSrc 'chrome\browser\net\default_dns_over_https_config_source.cc'
  $dns = Get-Content $dnsPath -Raw
  $oldDns = @'
  registry->RegisterBooleanPref(prefs::kDnsOverHttpsAutomaticModeFallbackToDoh,
                                false);
'@
  $newDns = @'
  registry->RegisterBooleanPref(prefs::kDnsOverHttpsAutomaticModeFallbackToDoh,
                                true);
'@
  $dns = Replace-Or-Throw $dns $oldDns $newDns 'Secure DNS automatic fallback'
  Set-Content $dnsPath $dns -Encoding UTF8

  # 5) Enable native Chromium privacy primitives at startup. Do not intercept requests in JS.
  $delegatePath = Join-Path $ChromiumSrc 'chrome\app\chrome_main_delegate.cc'
  $delegate = Get-Content $delegatePath -Raw
  $marker = '// FLAMINGBOX_PRIVACY_DEFAULTS'
  if (!$delegate.Contains($marker)) {
    $needle = 'ChromeMainDelegate::BasicStartupComplete() {'
    $idx = $delegate.IndexOf($needle)
    if ($idx -lt 0) { throw 'Could not locate ChromeMainDelegate::BasicStartupComplete()' }
    $insertAt = $idx + $needle.Length
    $block = @'

  // FLAMINGBOX_PRIVACY_DEFAULTS
  // Keep these in the native Chromium feature stack: GPC is emitted by Blink/
  // Network Service and storage partitioning is handled by Chromium itself.
  base::CommandLine* flamingbox_command_line =
      base::CommandLine::ForCurrentProcess();
  constexpr char kFlamingBoxFeatures[] =
      "GlobalPrivacyControlForce,ThirdPartyStoragePartitioning";
  std::string enabled_features =
      flamingbox_command_line->GetSwitchValueASCII("enable-features");
  if (enabled_features.find("GlobalPrivacyControlForce") == std::string::npos) {
    if (!enabled_features.empty())
      enabled_features.append(",");
    enabled_features.append(kFlamingBoxFeatures);
    flamingbox_command_line->AppendSwitchASCII("enable-features",
                                               enabled_features);
  }
'@
    $delegate = $delegate.Insert($insertAt, $block)
    Set-Content $delegatePath $delegate -Encoding UTF8
  }

  # 6) Record exact source state and product policy. Guardian initially relies on
  # Chromium performance interventions; network-budget enforcement stays observe-first
  # until native integration tests prove it does not throttle legitimate downloads/video.
  @{
    product = 'FlamingBox'
    architecture = 'Chromium native + Firefox-inspired privacy behavior'
    chromium = $Expected
    firefoxReference = $FirefoxExpected
    privacy = @{
      globalPrivacyControl = $true
      doNotTrackDefault = $true
      httpsFirstDefault = $true
      thirdPartyStoragePartitioning = $true
      javascriptNetworkInterceptor = $false
      contextualSmartBlock = 'planned-native'
    }
    performance = @{
      profile = 'balanced'
      chromiumMemorySaver = $true
      discardInactiveAfterMinutes = 60
      aggressiveness = 'medium'
      performanceInterventions = $true
    }
    network = @{
      secureDns = 'automatic'
      automaticDohFallback = $true
      requestHotPathDiskReads = $false
      guardian = 'observe-first'
    }
  } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $ChromiumSrc 'FLAMINGBOX_BUILD.json') -Encoding UTF8

  Write-Host 'FlamingBox native patches applied.' -ForegroundColor Green
  git diff -- chrome/app/theme/chromium/BRANDING chrome/browser/ui/browser_ui_prefs.cc chrome/app/chrome_main_delegate.cc components/performance_manager/user_tuning/prefs.cc chrome/browser/net/default_dns_over_https_config_source.cc
}
finally {
  Pop-Location
}
