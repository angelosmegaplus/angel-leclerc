$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
$Exe=Join-Path $Root 'App\FlamingBox.exe'
$Extension=Join-Path $Root 'flamingbox-extension'
$UserData=Join-Path $env:LOCALAPPDATA 'FlamingBox\User Data'
$Default=Join-Path $UserData 'Default'
$Preferences=Join-Path $Default 'Preferences'
$LocalState=Join-Path $UserData 'Local State'

if(!(Test-Path $Exe)){throw "FlamingBox runtime missing: $Exe"}
New-Item -ItemType Directory -Force -Path $Default | Out-Null

if(!(Test-Path $Preferences)){
  $prefs=[ordered]@{
    enable_do_not_track=$true
    https_only_mode_enabled=$true
    https_upgrades_enabled=$true
    browser=[ordered]@{show_home_button=$false}
    profile=[ordered]@{
      default_content_setting_values=[ordered]@{notifications=2}
    }
  }
  $prefs | ConvertTo-Json -Depth 8 | Set-Content $Preferences -Encoding UTF8
}

if(!(Test-Path $LocalState)){
  $local=[ordered]@{
    dns_over_https=[ordered]@{mode='automatic'}
    background_mode=[ordered]@{enabled=$false}
  }
  $local | ConvertTo-Json -Depth 8 | Set-Content $LocalState -Encoding UTF8
}

$args=@(
  "--user-data-dir=$UserData",
  "--load-extension=$Extension",
  '--enable-features=GlobalPrivacyControlForce,ThirdPartyStoragePartitioning',
  '--no-first-run',
  '--no-default-browser-check'
)

Start-Process -FilePath $Exe -ArgumentList $args
