param([Parameter(Mandatory=$true)][string]$ProjectRoot)
$ErrorActionPreference = "Stop"
$PackageRoot = Split-Path -Parent $PSScriptRoot
if (!(Test-Path $ProjectRoot)) { throw "ProjectRoot not found: $ProjectRoot" }
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$DestDomain = Join-Path $ProjectRoot "domain\knowledge"
$DestKB = Join-Path $ProjectRoot "knowledge_base\enterprise"
$Backup = Join-Path $ProjectRoot "_backup_enterprise_kb_$Stamp"
New-Item -ItemType Directory -Force -Path $DestDomain,$DestKB,$Backup | Out-Null
if (Test-Path $DestDomain) { Copy-Item $DestDomain $Backup -Recurse -Force }
if (Test-Path $DestKB) { Copy-Item $DestKB $Backup -Recurse -Force }
Copy-Item (Join-Path $PackageRoot "04_rasa\domain\*.yml") $DestDomain -Force
Copy-Item (Join-Path $PackageRoot "07_ingestion\*") $DestKB -Recurse -Force
Copy-Item (Join-Path $PackageRoot "00_master") $DestKB -Recurse -Force
Copy-Item (Join-Path $PackageRoot "01_brands") $DestKB -Recurse -Force
Copy-Item (Join-Path $PackageRoot "02_routing") $DestKB -Recurse -Force
Copy-Item (Join-Path $PackageRoot "03_faq") $DestKB -Recurse -Force
Write-Host "Deployment files copied successfully. Backup: $Backup" -ForegroundColor Green
Write-Host "Next: run rasa data validate inside your Rasa venv."
