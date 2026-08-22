param(
  [Parameter(Mandatory=$true)][string]$FlamingBoxExe
)

$ErrorActionPreference = 'Stop'
$FlamingBoxExe = (Resolve-Path $FlamingBoxExe).Path
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("flamingbox-smoke-" + [guid]::NewGuid().ToString('N'))
$Profile = Join-Path $TempRoot 'profile'
$Page = Join-Path $TempRoot 'privacy.html'
New-Item -ItemType Directory -Force -Path $Profile | Out-Null

@'
<!doctype html><meta charset="utf-8">
<body><script>
document.body.textContent = JSON.stringify({
  gpc: navigator.globalPrivacyControl === true,
  dnt: navigator.doNotTrack
});
</script></body>
'@ | Set-Content $Page -Encoding UTF8

try {
  $uri = ([System.Uri]$Page).AbsoluteUri
  $output = & $FlamingBoxExe `
    --headless=new `
    --no-first-run `
    --disable-default-apps `
    --user-data-dir="$Profile" `
    --dump-dom `
    $uri 2>&1 | Out-String

  if ($LASTEXITCODE -ne 0) {
    throw "FlamingBox headless smoke test failed with exit code $LASTEXITCODE`n$output"
  }
  if ($output -notmatch '"gpc":true') {
    throw "GPC is not active in the built browser.`n$output"
  }
  if ($output -notmatch '"dnt":"1"') {
    throw "DNT default is not active in the built browser.`n$output"
  }

  Write-Host 'FlamingBox runtime privacy smoke test passed.' -ForegroundColor Green
}
finally {
  Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
