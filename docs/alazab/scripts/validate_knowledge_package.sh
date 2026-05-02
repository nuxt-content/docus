#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - "$ROOT" <<'INNERPY'
import json, pathlib, sys
root=pathlib.Path(sys.argv[1])
required=['00_master/alazab_enterprise_master_knowledge.md','00_master/alazab_enterprise_master_knowledge.json','02_routing/enterprise_intent_routing_rules.json','03_faq/faqs_ar.jsonl','04_rasa/domain/enterprise_brands.yml','04_rasa/domain/enterprise_slots_forms.yml','07_ingestion/enterprise_knowledge_corpus.jsonl','07_ingestion/enterprise_knowledge_chunks.jsonl','integrations/meta_whatsapp/meta_whatsapp.env.example']
for f in required:
    p=root/f
    if not p.exists(): raise SystemExit(f'Missing: {f}')
    print('OK', f)
for p in root.rglob('*.json'): json.loads(p.read_text('utf-8')); print('OK JSON', p.relative_to(root))
for p in root.rglob('*.jsonl'):
    for i,line in enumerate(p.read_text('utf-8').splitlines(),1):
        if line.strip(): json.loads(line)
    print('OK JSONL', p.relative_to(root))
print('VALIDATION PASSED')
INNERPY
