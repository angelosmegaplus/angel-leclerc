param(
  [Parameter(Mandatory=$true)][string]$ChromiumSrc
)

$ErrorActionPreference = 'Stop'
$Expected = '8c7281d3300aa386be904fb9ee881babe85e12dc'
$ChromiumSrc = (Resolve-Path $ChromiumSrc).Path

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
  $prefs = $prefs.Replace('prefs::kEnableDoNotTrack, false,', 'prefs::kEnableDoNotTrack, true,')
  $prefs = $prefs.Replace('prefs::kHttpsOnlyModeEnabled, false,', 'prefs::kHttpsOnlyModeEnabled, true,')
  Set-Content $prefsPath $prefs -Encoding UTF8

  # 3) Enable native Chromium privacy primitives at startup. Do not intercept requests in JS.
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

  # 4) Record the exact source state used for the build.
  @{
    product = 'FlamingBox'
    chromium = $Expected
    firefoxReference = '5b17b585c394a469267f65da3f9794162dd9c5a5'
    privacy = @{
      globalPrivacyControl = $true
      doNotTrackDefault = $true
      httpsFirstDefault = $true
      thirdPartyStoragePartitioning = $true
      javascriptNetworkInterceptor = $false
    }
  } | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $ChromiumSrc 'FLAMINGBOX_BUILD.json') -Encoding UTF8

  Write-Host 'FlamingBox native patches applied.' -ForegroundColor Green
  git diff -- chrome/app/theme/chromium/BRANDING chrome/browser/ui/browser_ui_prefs.cc chrome/app/chrome_main_delegate.cc
}
finally {
  Pop-Location
}
