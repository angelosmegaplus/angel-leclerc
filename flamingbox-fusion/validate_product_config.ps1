$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigDir = Join-Path $Root 'config'

$required = @(
  'performance_profiles.json',
  'guardian_policy.json',
  'smartblock_policy.json',
  'secure_dns_providers.json',
  'permissions_policy.json',
  'blocker_policy.json',
  'privacy_dashboard.json'
)

foreach ($name in $required) {
  $path = Join-Path $ConfigDir $name
  if (!(Test-Path $path)) { throw "Missing FlamingBox config: $name" }
  try {
    Get-Content $path -Raw | ConvertFrom-Json | Out-Null
  } catch {
    throw "Invalid JSON in $name: $($_.Exception.Message)"
  }
}

$perf = Get-Content (Join-Path $ConfigDir 'performance_profiles.json') -Raw | ConvertFrom-Json
if ($perf.default -ne 'balanced') { throw 'Balanced performance profile must remain the default' }
if ($perf.profiles.ultra_light.discardInactiveAfterMinutes -lt 10) {
  throw 'Ultra-light tab discard threshold is too aggressive'
}

$guardian = Get-Content (Join-Path $ConfigDir 'guardian_policy.json') -Raw | ConvertFrom-Json
if ($guardian.mode -ne 'observe-first') { throw 'Guardian must ship in observe-first mode' }
if ($guardian.actions.forbidden -notcontains 'kill-network-service') {
  throw 'Guardian safety invariant missing: kill-network-service must be forbidden'
}

$smart = Get-Content (Join-Path $ConfigDir 'smartblock_policy.json') -Raw | ConvertFrom-Json
if ($smart.rules.globalPaymentWhitelist -ne $false) { throw 'Global payment whitelist is forbidden' }
if ($smart.rules.globalLoginWhitelist -ne $false) { throw 'Global login whitelist is forbidden' }
if ($smart.sessionExceptions.persistAcrossRestart -ne $false) { throw 'SmartBlock exceptions must remain session scoped' }

$dns = Get-Content (Join-Path $ConfigDir 'secure_dns_providers.json') -Raw | ConvertFrom-Json
if ($dns.defaultMode -ne 'automatic') { throw 'Secure DNS must default to automatic for compatibility' }
if ($dns.rules.neverChangeWindowsSystemDns -ne $true) { throw 'FlamingBox must never silently change Windows DNS' }

$permissions = Get-Content (Join-Path $ConfigDir 'permissions_policy.json') -Raw | ConvertFrom-Json
if ($permissions.defaults.notifications -ne 'block') { throw 'Notification default must remain block' }
if ($permissions.persistentGrantRequiresExplicitUserChoice -ne $true) { throw 'Persistent permission grants require explicit choice' }

$blocker = Get-Content (Join-Path $ConfigDir 'blocker_policy.json') -Raw | ConvertFrom-Json
if ($blocker.networkHotPathDiskReads -ne $false) { throw 'Blocker must not read disk in request hot path' }
if ($blocker.networkHotPathJsonParsing -ne $false) { throw 'Blocker must not parse JSON per request' }
if ($blocker.safety.neverBlanketWhitelistPaymentProviders -ne $true) { throw 'Payment providers must never be blanket-whitelisted' }

$dashboard = Get-Content (Join-Path $ConfigDir 'privacy_dashboard.json') -Raw | ConvertFrom-Json
if ($dashboard.privacy.localOnly -ne $true) { throw 'Privacy dashboard must remain local-only by default' }
if ($dashboard.privacy.storeFullUrls -ne $false) { throw 'Privacy dashboard must not store full URLs by default' }

Write-Host 'FlamingBox product configuration validation passed.' -ForegroundColor Green
