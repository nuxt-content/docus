$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Write-Host "== Alazab Knowledge Package Validation ==" -ForegroundColor Cyan
$Required = @(
  "00_master\alazab_enterprise_master_knowledge.md",
  "00_master\alazab_enterprise_master_knowledge.json",
  "02_routing\enterprise_intent_routing_rules.json",
  "03_faq\faqs_ar.jsonl",
  "04_rasa\domain\enterprise_brands.yml",
  "04_rasa\domain\enterprise_slots_forms.yml",
  "07_ingestion\enterprise_knowledge_corpus.jsonl",
  "07_ingestion\enterprise_knowledge_chunks.jsonl",
  "integrations\meta_whatsapp\meta_whatsapp.env.example"
)
foreach ($Rel in $Required) { $Path = Join-Path $Root $Rel; if (!(Test-Path $Path)) { throw "Missing: $Rel" }; Write-Host "OK  $Rel" }
Get-ChildItem $Root -Recurse -File -Include *.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null; Write-Host "OK JSON $($_.Name)" }
Get-ChildItem $Root -Recurse -File -Include *.jsonl | ForEach-Object { $i=0; Get-Content $_.FullName | ForEach-Object { $i++; if ($_.Trim()) { $_ | ConvertFrom-Json | Out-Null } }; Write-Host "OK JSONL $($_.Name)" }
$Patterns = @("EAA[A-Za-z0-9_-]{20,}","ya29\.[A-Za-z0-9_\.-]+","ACCESS_TOKEN\s*=\s*(?!__SET_IN_SECRET_MANAGER__)","APP_SECRET\s*=\s*(?!__SET_IN_SECRET_MANAGER__)","PASSWORD\s*=\s*(?!__SET_IN_SECRET_MANAGER__)")
$Files = Get-ChildItem $Root -Recurse -File | Where-Object { $_.FullName -notmatch "audio_assets" }
foreach ($File in $Files) { $Text = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue; foreach ($Pattern in $Patterns) { if ($Text -match $Pattern) { throw "Potential secret: $($File.FullName)" } } }
$Count=(Get-ChildItem $Root -Recurse -File).Count
$Size=((Get-ChildItem $Root -Recurse -File | Measure-Object Length -Sum).Sum/1MB).ToString("0.00")
Write-Host "Files: $Count | Size: $Size MB" -ForegroundColor Cyan
Write-Host "VALIDATION PASSED" -ForegroundColor Green
