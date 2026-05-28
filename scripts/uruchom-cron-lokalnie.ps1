# Pełny przebieg automatyzacji (jak Vercel Cron co 4h)
# Użycie: .\scripts\uruchom-cron-lokalnie.ps1
#        .\scripts\uruchom-cron-lokalnie.ps1 -Port 3002

param([int]$Port = 3000)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error "Brak .env.local w $root"
}

$secret = $null
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*CRON_SECRET=(.+)$') { $secret = $matches[1].Trim() }
}
if (-not $secret) { Write-Error "Brak CRON_SECRET w .env.local" }

$url = "http://localhost:$Port/api/automatyzacje/run"
Write-Host "POST $url"
$res = curl.exe -s -w "`nHTTP:%{http_code}" -H "Authorization: Bearer $secret" $url
Write-Host $res
