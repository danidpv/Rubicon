$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
Start-Process -FilePath 'wsl.exe' -ArgumentList '-d','Ubuntu','--','tail','-f','/dev/null' -WindowStyle Hidden
wsl -d Ubuntu -u root -- service postgresql start
wsl -d Ubuntu -u root -- service redis-server start
if (-not (Get-NetTCPConnection -LocalPort 8025 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath (Join-Path $taskRoot '.local/mailpit/mailpit.exe') -ArgumentList '--listen','127.0.0.1:8025','--smtp','127.0.0.1:1025' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot '.local/mailpit.log') -RedirectStandardError (Join-Path $taskRoot '.local/mailpit-error.log')
}
Write-Output 'Servicios locales iniciados. Ejecuta pnpm dev para la aplicación.'
