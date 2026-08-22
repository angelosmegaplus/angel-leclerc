param(
  [Parameter(Mandatory=$true)][string]$ChromiumSrc
)

$ErrorActionPreference = 'Stop'
$src = (Resolve-Path $ChromiumSrc).Path

function Replace-Text([string]$Path, [string]$From, [string]$To) {
  if (!(Test-Path $Path)) { throw "Fichier Chromium introuvable: $Path" }
  $content = [IO.File]::ReadAllText($Path)
  $updated = $content.Replace($From, $To)
  if ($updated -eq $content) { Write-Host "Aucun changement: $Path" -ForegroundColor Yellow }
  [IO.File]::WriteAllText($Path, $updated, [Text.UTF8Encoding]::new($false))
}

$branding = Join-Path $src 'chrome\app\theme\chromium\BRANDING'
$brandText = @'
COMPANY_FULLNAME=FlamingBox Project
COMPANY_SHORTNAME=FlamingBox
PRODUCT_FULLNAME=FlamingBox
PRODUCT_SHORTNAME=FlamingBox
PRODUCT_INSTALLER_FULLNAME=FlamingBox Installer
PRODUCT_INSTALLER_SHORTNAME=FlamingBox Installer
COPYRIGHT=Copyright @LASTCHANGE_YEAR@ FlamingBox Project. Chromium portions copyright The Chromium Authors.
MAC_BUNDLE_ID=fr.flamingbox.browser
MAC_CREATOR_CODE=FlBx
MAC_TEAM_ID=
'@
[IO.File]::WriteAllText($branding, $brandText.TrimStart(), [Text.UTF8Encoding]::new($false))

# Chromium centralise de nombreux textes de distribution dans ce fichier.
# On remplace uniquement le nom affiché, sans toucher aux URLs/licences Chromium.
$strings = Join-Path $src 'chrome\app\chromium_strings.grd'
Replace-Text $strings '>Chromium<' '>FlamingBox<'
Replace-Text $strings ' Chromium ' ' FlamingBox '
Replace-Text $strings 'Chromium Browser' 'FlamingBox Browser'

Write-Host ''
Write-Host 'Branding FlamingBox applique.' -ForegroundColor Green
Write-Host 'Base: Chromium / Blink / V8'
Write-Host 'Les mentions de licence et URLs Chromium restent volontairement intactes.'
