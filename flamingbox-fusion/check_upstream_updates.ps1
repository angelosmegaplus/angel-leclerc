$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LockPath = Join-Path $Root 'upstreams.lock.json'
$Lock = Get-Content $LockPath -Raw | ConvertFrom-Json

function Get-RemoteHead([string]$Repository) {
  $line = git ls-remote $Repository HEAD
  if (!$line) { throw "Unable to query $Repository" }
  return ($line -split '\s+')[0]
}

$chromiumHead = Get-RemoteHead $Lock.chromium.repository
$firefoxHead = Get-RemoteHead $Lock.firefox.repository

$result = [ordered]@{
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  chromium = [ordered]@{
    pinned = $Lock.chromium.commit
    upstreamHead = $chromiumHead
    updateAvailable = ($chromiumHead -ne $Lock.chromium.commit)
  }
  firefox = [ordered]@{
    pinned = $Lock.firefox.commit
    upstreamHead = $firefoxHead
    updateAvailable = ($firefoxHead -ne $Lock.firefox.commit)
  }
  policy = 'report-only; never change pinned revisions without a tested update branch'
}

$result | ConvertTo-Json -Depth 4

if ($result.chromium.updateAvailable -or $result.firefox.updateAvailable) {
  Write-Host 'Upstream changes detected. Create a dedicated update branch, rebase FlamingBox patches, build, smoke-test, then update upstreams.lock.json.' -ForegroundColor Yellow
} else {
  Write-Host 'Pinned upstreams are current.' -ForegroundColor Green
}
