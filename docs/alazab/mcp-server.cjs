#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');

const SERVER_VERSION = '2.0.0';
const PROTOCOL_VERSION = '2025-11-25';
const ROOT = __dirname;
const KB_PATH = process.env.ALAZAB_KB_PATH || path.join(ROOT, 'kb.corpus.json');
const KB = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));

function normalizeArabic(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s._:-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(input) {
  const n = normalizeArabic(input);
  return Array.from(new Set((n.match(/[\p{L}\p{N}._:-]{2,}/gu) || [])));
}

function safeLimit(n, fallback = 8, max = 20) {
  const x = Number(n || fallback);
  return Math.max(1, Math.min(max, Number.isFinite(x) ? x : fallback));
}

function textMatchScore(query, text, opts = {}) {
  const qn = normalizeArabic(query);
  const tn = normalizeArabic(text);
  if (!qn || !tn) return 0;
  let score = 0;
  if (tn.includes(qn)) score += 50;
  const qt = tokens(query);
  for (const t of qt) {
    if (tn.includes(t)) score += t.length > 4 ? 8 : 4;
  }
  if (opts.brand && opts.brand !== 'all') score += 1;
  return score;
}

function clip(text, q = '', radius = 520) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (raw.length <= radius * 2) return raw;
  const qTokens = tokens(q).filter(x => x.length > 3);
  const nraw = normalizeArabic(raw);
  let idx = -1;
  for (const t of qTokens) { idx = nraw.indexOf(t); if (idx >= 0) break; }
  if (idx < 0) return raw.slice(0, radius * 2) + '…';
  const start = Math.max(0, idx - radius);
  const end = Math.min(raw.length, idx + radius);
  return (start > 0 ? '…' : '') + raw.slice(start, end) + (end < raw.length ? '…' : '');
}

function searchKB(args = {}) {
  const query = String(args.query || '').trim();
  const brand = String(args.brand || 'all').trim();
  const limit = safeLimit(args.limit, 8, 20);
  if (!query) throw new Error('query is required');
  const rows = [];
  for (const c of KB.chunks || []) {
    if (brand !== 'all' && c.brand !== brand) continue;
    const score = textMatchScore(query, [c.title, c.text, c.source_path, c.brand].join('\n'), { brand });
    if (score > 0) rows.push({ score, id: c.id, document_id: c.document_id, brand: c.brand, type: c.type, title: c.title, source_path: c.source_path, snippet: clip(c.text, query) });
  }
  rows.sort((a,b) => b.score - a.score || a.source_path.localeCompare(b.source_path));
  return { query, brand, count: rows.length, results: rows.slice(0, limit) };
}

function getDocument(args = {}) {
  const id = String(args.id || args.document_id || '').trim();
  if (!id) throw new Error('id is required');
  const doc = (KB.documents || []).find(d => d.id === id);
  if (!doc && id === 'enterprise_master') return KB.master;
  if (!doc) throw new Error(`document not found: ${id}`);
  return { ...doc, content: KB.document_bodies[id] || '' };
}

function listDocuments(args = {}) {
  const brand = String(args.brand || 'all').trim();
  const type = String(args.type || 'all').trim();
  const docs = (KB.documents || []).filter(d => (brand === 'all' || d.brand === brand) && (type === 'all' || d.type === type));
  return { count: docs.length, documents: docs };
}

function brandProfile(args = {}) {
  const brand = String(args.brand || '').trim();
  if (!brand) throw new Error('brand is required');
  const profile = KB.brands && KB.brands[brand];
  if (!profile) throw new Error(`brand not found: ${brand}`);
  return profile;
}

function faqSearch(args = {}) {
  const query = String(args.query || '').trim();
  const limit = safeLimit(args.limit, 6, 20);
  if (!query) return { count: KB.faqs.length, results: KB.faqs.slice(0, limit) };
  const rows = [];
  for (const f of KB.faqs || []) {
    const score = textMatchScore(query, `${f.question}\n${f.answer}`);
    if (score > 0) rows.push({ score, ...f });
  }
  rows.sort((a,b) => b.score - a.score);
  return { query, count: rows.length, results: rows.slice(0, limit) };
}

function routeMessage(args = {}) {
  const message = String(args.message || args.query || '').trim();
  if (!message) throw new Error('message is required');
  const brandScores = {};
  for (const key of Object.keys(KB.brands || {})) brandScores[key] = 0;
  const results = searchKB({ query: message, limit: 20 }).results;
  for (const r of results) {
    if (brandScores[r.brand] !== undefined) brandScores[r.brand] += r.score;
  }
  const routingRaw = JSON.stringify(KB.routing_rules || {});
  const rtScore = textMatchScore(message, routingRaw);
  if (rtScore) brandScores.enterprise = (brandScores.enterprise || 0) + rtScore;
  const sorted = Object.entries(brandScores).sort((a,b) => b[1] - a[1]);
  const best = sorted[0] || ['enterprise', 0];
  return {
    message,
    suggested_brand: best[0],
    confidence: best[1] <= 0 ? 'low' : best[1] > 80 ? 'high' : 'medium',
    scores: Object.fromEntries(sorted),
    evidence: results.slice(0, 5),
    next_action: best[0] === 'uberfix' ? 'Collect service request data: issue, location, phone, images, request number if available.' : 'Collect project/service details then route to the matched brand team.'
  };
}

function contextPack(args = {}) {
  const query = String(args.query || '').trim();
  const brand = String(args.brand || 'all').trim();
  if (!query) throw new Error('query is required');
  const search = searchKB({ query, brand, limit: safeLimit(args.limit, 8, 12) });
  const faq = faqSearch({ query, limit: 3 }).results;
  const routed = routeMessage({ message: query });
  return {
    query,
    route: routed,
    search_results: search.results,
    faqs: faq,
    answer_rules: [
      'أجب من المعرفة المرفقة فقط.',
      'لو البيانات ناقصة اطلب البيانات التشغيلية المطلوبة بوضوح.',
      'لا تذكر أسعار نهائية إلا لو موجودة صراحة في السياق.',
      'وجّه الطلب للعلامة المناسبة داخل مجموعة العزب.'
    ]
  };
}

function metaInventory() {
  return { meta_whatsapp_public: KB.meta_whatsapp_public, sanitized_env_keys: KB.security.sanitized_env_keys };
}

function audioInventory(args = {}) {
  const brand = String(args.brand || 'all').trim();
  const rows = (KB.audio_assets_manifest || []).filter(a => brand === 'all' || a.brand === brand);
  return { count: rows.length, audio_assets: rows };
}

const toolHandlers = {
  alazab_kb_search: searchKB,
  alazab_kb_get_document: getDocument,
  alazab_kb_list_documents: listDocuments,
  alazab_brand_profile: brandProfile,
  alazab_faq_search: faqSearch,
  alazab_route_message: routeMessage,
  alazab_context_pack: contextPack,
  alazab_meta_whatsapp_inventory: metaInventory,
  alazab_audio_inventory: audioInventory,
};

const tools = [
  { name: 'alazab_kb_search', description: 'Search the real Alazab enterprise knowledge corpus and return source-grounded snippets.', inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' }, brand: { type: 'string', enum: ['all','enterprise','alazab_group','brand_identity','luxury_finishing','uberfix','laban_alasfour'] }, limit: { type: 'number' } } } },
  { name: 'alazab_context_pack', description: 'Build a compact answer context pack from search, FAQ, routing, and evidence.', inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' }, brand: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'alazab_route_message', description: 'Route a customer/internal message to the right Alazab brand using the actual knowledge corpus.', inputSchema: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } } },
  { name: 'alazab_brand_profile', description: 'Return the full profile/content pack for one Alazab brand.', inputSchema: { type: 'object', required: ['brand'], properties: { brand: { type: 'string', enum: ['alazab_group','brand_identity','luxury_finishing','uberfix','laban_alasfour'] } } } },
  { name: 'alazab_faq_search', description: 'Search Arabic FAQ entries from the source knowledge base.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'alazab_kb_get_document', description: 'Read a full knowledge document by ID.', inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } },
  { name: 'alazab_kb_list_documents', description: 'List indexed source documents by brand/type.', inputSchema: { type: 'object', properties: { brand: { type: 'string' }, type: { type: 'string' } } } },
  { name: 'alazab_meta_whatsapp_inventory', description: 'Return sanitized public WhatsApp/Meta integration inventory keys only; no secrets.', inputSchema: { type: 'object', properties: {} } },
  { name: 'alazab_audio_inventory', description: 'List indexed audio assets by brand without embedding audio binaries.', inputSchema: { type: 'object', properties: { brand: { type: 'string' } } } },
];

function resourcesList() {
  const resources = [
    { uri: 'alazab-kb://master', name: 'Alazab Enterprise Master Knowledge', mimeType: 'text/markdown', description: 'Master enterprise knowledge content.' },
    { uri: 'alazab-kb://faq', name: 'Arabic FAQ', mimeType: 'application/json', description: 'FAQ entries extracted from source.' },
    { uri: 'alazab-kb://routing', name: 'Intent Routing Rules', mimeType: 'application/json', description: 'Routing rules extracted from source.' },
    { uri: 'alazab-kb://meta-whatsapp-public', name: 'Meta WhatsApp Public Inventory', mimeType: 'application/json', description: 'Sanitized public inventory only.' },
    { uri: 'alazab-kb://audio-inventory', name: 'Audio Assets Inventory', mimeType: 'application/json', description: 'Audio file references without binaries.' },
  ];
  for (const [key, p] of Object.entries(KB.brands || {})) resources.push({ uri: `alazab-kb://brand/${key}`, name: p.name, mimeType: 'text/markdown', description: `Brand profile for ${p.name}` });
  return resources;
}

function readResource(uri) {
  if (uri === 'alazab-kb://master') return { mimeType: 'text/markdown', text: KB.master.content };
  if (uri === 'alazab-kb://faq') return { mimeType: 'application/json', text: JSON.stringify(KB.faqs, null, 2) };
  if (uri === 'alazab-kb://routing') return { mimeType: 'application/json', text: JSON.stringify(KB.routing_rules, null, 2) };
  if (uri === 'alazab-kb://meta-whatsapp-public') return { mimeType: 'application/json', text: JSON.stringify(metaInventory(), null, 2) };
  if (uri === 'alazab-kb://audio-inventory') return { mimeType: 'application/json', text: JSON.stringify(KB.audio_assets_manifest, null, 2) };
  const m = String(uri).match(/^alazab-kb:\/\/brand\/([^/]+)$/);
  if (m && KB.brands[m[1]]) return { mimeType: 'text/markdown', text: KB.brands[m[1]].content };
  throw new Error(`resource not found: ${uri}`);
}

const prompts = [
  { name: 'alazab_customer_answer', description: 'Answer a customer using Alazab knowledge only.', arguments: [ { name: 'question', required: true, description: 'Customer question' }, { name: 'brand_hint', required: false, description: 'Optional brand hint' } ] },
  { name: 'alazab_internal_router', description: 'Route a message to the right Alazab business unit.', arguments: [ { name: 'message', required: true, description: 'Incoming message' } ] },
  { name: 'alazab_voice_reply', description: 'Prepare a concise spoken Arabic reply using the brand voice scripts.', arguments: [ { name: 'brand', required: true, description: 'Brand key' }, { name: 'message', required: true, description: 'Message to answer' } ] },
];

function getPrompt(name, args = {}) {
  if (name === 'alazab_customer_answer') {
    return { description: 'Customer answer grounded in Alazab KB', messages: [ { role: 'user', content: { type: 'text', text: `استخدم قناة معرفة العزب فقط للإجابة.\nالسؤال: ${args.question || ''}\nتلميح العلامة: ${args.brand_hint || 'غير محدد'}\nالقواعد: لا تخترع، اذكر البيانات المطلوبة عند النقص، ووجّه للعلامة الصحيحة.` } } ] };
  }
  if (name === 'alazab_internal_router') {
    return { description: 'Internal routing prompt', messages: [ { role: 'user', content: { type: 'text', text: `حلل الرسالة ووجّهها داخل مجموعة العزب للعلامة المناسبة مع سبب مختصر.\nالرسالة: ${args.message || ''}` } } ] };
  }
  if (name === 'alazab_voice_reply') {
    return { description: 'Voice response prompt', messages: [ { role: 'user', content: { type: 'text', text: `اكتب ردًا صوتيًا عربيًا قصيرًا، واضحًا، ومناسبًا لهوية ${args.brand || ''}.\nالرسالة: ${args.message || ''}` } } ] };
  }
  throw new Error(`prompt not found: ${name}`);
}

function ok(id, result) { return { jsonrpc: '2.0', id, result }; }
function err(id, code, message, data) { return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } }; }

async function handle(req) {
  if (!req || req.jsonrpc !== '2.0') return err(req && req.id, -32600, 'Invalid JSON-RPC request');
  const { id, method, params = {} } = req;
  try {
    if (method === 'initialize') return ok(id, { protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION, capabilities: { tools: {}, resources: {}, prompts: {} }, serverInfo: { name: 'alazab-enterprise-kb-channel', version: SERVER_VERSION } });
    if (method === 'notifications/initialized') return null;
    if (method === 'ping') return ok(id, {});
    if (method === 'tools/list') return ok(id, { tools });
    if (method === 'tools/call') {
      const name = params.name;
      if (!toolHandlers[name]) return err(id, -32601, `Unknown tool: ${name}`);
      const result = toolHandlers[name](params.arguments || {});
      return ok(id, { content: [ { type: 'text', text: JSON.stringify(result, null, 2) } ] });
    }
    if (method === 'resources/list') return ok(id, { resources: resourcesList() });
    if (method === 'resources/read') {
      const uri = params.uri;
      const r = readResource(uri);
      return ok(id, { contents: [ { uri, mimeType: r.mimeType, text: r.text } ] });
    }
    if (method === 'prompts/list') return ok(id, { prompts });
    if (method === 'prompts/get') return ok(id, getPrompt(params.name, params.arguments || {}));
    return err(id, -32601, `Method not found: ${method}`);
  } catch (e) {
    return err(id, -32000, e.message || String(e));
  }
}

process.stdout.on('error', (e) => { if (e && e.code === 'EPIPE') process.exit(0); throw e; });
function writeJson(obj) { if (obj) process.stdout.write(JSON.stringify(obj) + '\n'); }

async function stdio() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { writeJson(await handle(JSON.parse(line))); }
    catch (e) { writeJson(err(null, -32700, 'Parse error', e.message)); }
  }
  process.exit(0);
}

function httpMode(port) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, name: 'alazab-enterprise-kb-channel', version: SERVER_VERSION, stats: KB.stats }));
      return;
    }
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const response = Array.isArray(payload) ? await Promise.all(payload.map(handle)) : await handle(payload);
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(response));
        } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(err(null, -32700, 'Parse error', e.message)));
        }
      });
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'not_found' }));
  });
  server.listen(port, () => console.error(`[alazab-mcp] HTTP MCP listening on http://127.0.0.1:${port}/mcp`));
}

async function selfTest() {
  const init = await handle({ jsonrpc:'2.0', id:1, method:'initialize', params:{} });
  const list = await handle({ jsonrpc:'2.0', id:2, method:'tools/list', params:{} });
  const search = await handle({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'alazab_kb_search', arguments:{ query:'طلب صيانة أوبرفيكس', limit:3 } } });
  const route = await handle({ jsonrpc:'2.0', id:4, method:'tools/call', params:{ name:'alazab_route_message', arguments:{ message:'عندي عطل في فرع وعاوز أسجل طلب صيانة' } } });
  const resources = await handle({ jsonrpc:'2.0', id:5, method:'resources/list', params:{} });
  const okAll = init.result && list.result.tools.length >= 8 && search.result && route.result && resources.result.resources.length >= 5;
  console.log(JSON.stringify({ ok: okAll, stats: KB.stats, tools: list.result.tools.map(t => t.name), resources: resources.result.resources.map(r => r.uri).slice(0,10) }, null, 2));
  process.exit(okAll ? 0 : 1);
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) selfTest();
else if (args.includes('--http')) {
  const idx = args.indexOf('--port');
  const port = idx >= 0 ? Number(args[idx + 1]) : Number(process.env.PORT || 8732);
  httpMode(port || 8732);
} else stdio();
