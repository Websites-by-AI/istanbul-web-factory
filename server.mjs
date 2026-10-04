import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function loadDotEnv() {
  const envFile = path.join(ROOT, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
loadDotEnv();
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';

const INDUSTRIES = [
  { id: 'restaurant', label: 'Restoran', query: 'restoran', short: 'Restoran', icon: '🍽️' },
  { id: 'cafe', label: 'Kafe', query: 'kafe', short: 'Kafe', icon: '☕' },
  { id: 'beauty', label: 'Güzellik & berber', query: 'güzellik salonu kuaför berber', short: 'Güzellik', icon: '✦' },
  { id: 'clinic', label: 'Klinik & diş hekimi', query: 'klinik diş hekimi', short: 'Klinik', icon: '＋' },
  { id: 'hotel', label: 'Otel & konaklama', query: 'otel butik otel', short: 'Otel', icon: '⌂' },
  { id: 'real-estate', label: 'Emlak', query: 'emlak danışmanlığı', short: 'Emlak', icon: '▤' },
  { id: 'auto', label: 'Oto servis & galeri', query: 'oto servis oto galeri', short: 'Otomotiv', icon: '◉' },
  { id: 'fitness', label: 'Spor & fitness', query: 'spor salonu fitness', short: 'Fitness', icon: '↗' },
  { id: 'retail', label: 'Mağaza & butik', query: 'butik mağaza', short: 'Mağaza', icon: '◫' },
  { id: 'professional', label: 'Profesyonel hizmet', query: 'muhasebe danışmanlık hukuk bürosu', short: 'Hizmet', icon: '◎' },
];
const DISTRICTS = ['Şişli', 'Kadıköy', 'Beşiktaş', 'Fatih', 'Beyoğlu', 'Bakırköy', 'Üsküdar', 'Ataşehir', 'Ümraniye', 'Beylikdüzü'];
const STAGES = ['Yeni', 'İnceleniyor', 'Doğrulandı', 'Denetim tamamlandı', 'Önceliklendirildi', 'Önizleme hazır', 'İzin bekliyor', 'İzinli iletişim', 'İlgileniyor', 'Müşteri', 'Uygun değil'];

const DEMO_ROWS = [
  ['demo-01','Kıyı Sofrası','restaurant','Kadıköy',null,'new'],
  ['demo-02','Mimoza Kahve','cafe','Şişli','https://mimoza.example','review'],
  ['demo-03','Ada Güzellik','beauty','Beşiktaş',null,'new'],
  ['demo-04','Marmara Dent','clinic','Fatih','https://marmara-dent.example','review'],
  ['demo-05','Lale Butik Otel','hotel','Beyoğlu',null,'new'],
  ['demo-06','Pera Emlak','real-estate','Beyoğlu','https://pera-emlak.example','new'],
  ['demo-07','Şehir Oto','auto','Ümraniye',null,'new'],
  ['demo-08','Form Stüdyo','fitness','Ataşehir',null,'preview'],
  ['demo-09','Moda Dükkan','retail','Kadıköy','https://moda-dukkkan.example','new'],
  ['demo-10','Kuzey Danışmanlık','professional','Üsküdar',null,'new'],
  ['demo-11','Güney Lokantası','restaurant','Bakırköy',null,'new'],
  ['demo-12','Papatya Kuaför','beauty','Beylikdüzü','https://papatya.example','new'],
  ['demo-13','Rota Kahve','cafe','Fatih',null,'new'],
  ['demo-14','Yelken Klinik','clinic','Kadıköy',null,'new'],
  ['demo-15','Boğaz Konaklama','hotel','Beşiktaş','https://bogaz-konaklama.example','review'],
  ['demo-16','Kent Oto Servis','auto','Şişli',null,'new'],
  ['demo-17','Atölye Stil','retail','Üsküdar',null,'new'],
  ['demo-18','İleri Mali Danışmanlık','professional','Ataşehir','https://ileri-danismanlik.example','new'],
  ['demo-19','Kare Fitness','fitness','Bakırköy','https://kare-fitness.example','new'],
  ['demo-20','Çınar Emlak','real-estate','Ümraniye',null,'new'],
  ['demo-21','Sahil Lokantası','restaurant','Beylikdüzü','https://sahil-lokantasi.example','new'],
  ['demo-22','Küçük Sahne Kafe','cafe','Beşiktaş',null,'new'],
  ['demo-23','İnci Diş Kliniği','clinic','Üsküdar','https://inci-dis.example','new'],
  ['demo-24','Liman Emlak','real-estate','Kadıköy',null,'new'],
];

function demoLeads() {
  return DEMO_ROWS.map(([id, name, industryId, district, website, stage]) => ({
    id, name, industryId, industry: INDUSTRIES.find(x => x.id === industryId)?.label || 'Diğer', district,
    website: website || '', websiteStatus: website ? 'has-website' : 'no-website',
    phone: '', email: '', description: '', services: [], evidenceUrl: '', verifiedAt: null, audit: null,
    stage: stage === 'preview' ? 'Önizleme hazır' : stage === 'review' ? 'İnceleniyor' : 'Yeni',
    contactConsent: false, consentAt: null, source: 'demo', demo: true, notes: '', createdAt: new Date().toISOString(), siteSlug: null,
  }));
}
function initialStore() { return { leads: demoLeads(), sites: [] }; }
function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore(), null, 2));
}
function readStore() {
  ensureStore();
  try {
    const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    store.leads ||= []; store.sites ||= [];
    for (const lead of store.leads) {
      lead.evidenceUrl ??= ''; lead.verifiedAt ??= null; lead.audit ??= null;
    }
    return store;
  } catch { const s = initialStore(); writeStore(s); return s; }
}
function writeStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}
function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const target = path.resolve(PUBLIC, normalized || 'index.html');
  return target === PUBLIC || target.startsWith(PUBLIC + path.sep) ? target : path.join(PUBLIC, 'index.html');
}
function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > limit) { reject(new Error('درخواست بیش از حد بزرگ است.')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('JSON درخواست معتبر نیست.')); } });
    req.on('error', reject);
  });
}
function slugify(value) {
  const slug = String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return slug || 'isletme';
}
function scoreOpportunity(lead) {
  let score = lead.website ? 38 : 76;
  score += lead.verifiedAt ? 10 : -6;
  if (lead.evidenceUrl) score += 4;
  if (!lead.description) score += 4;
  if (!lead.phone && !lead.email) score -= 3;
  if (lead.contactConsent) score += 4;
  return Math.max(0, Math.min(100, score));
}
function makeLeadAudit(lead) {
  const noWebsite = !(lead.website || '').trim();
  const completenessFields = [lead.name, lead.industryId, lead.district, lead.evidenceUrl, lead.phone || lead.email];
  const completenessScore = Math.round(completenessFields.filter(Boolean).length / completenessFields.length * 100);
  const confidenceScore = lead.verifiedAt && lead.evidenceUrl ? 90 : lead.verifiedAt ? 60 : 30;
  const packageRecommendation = noWebsite
    ? { name: 'Dijital başlangıç taslağı', includes: ['İşletme tanıtımı', 'Hizmetler', 'Konum ve iletişim'], reason: 'Kayıtta doğrulanmış resmi web adresi bulunmuyor.' }
    : { name: 'Mevcut siteyi iyileştirme taslağı', includes: ['İçerik düzeni', 'Mobil uyum kontrol listesi', 'İletişim görünürlüğü'], reason: 'Kayıtta bir web adresi var; kapsam işletme sahibiyle doğrulanmalı.' };
  return {
    checkedAt: new Date().toISOString(),
    opportunityScore: scoreOpportunity(lead), completenessScore, confidenceScore,
    websiteStatus: noWebsite ? 'website-not-recorded' : 'website-provided',
    packageRecommendation,
    nextAction: !lead.verifiedAt ? 'İşletme ve web durumu kaynak bağlantısından doğrulanmalı.' : noWebsite ? 'Başlangıç site taslağını işletme sahibi için hazırla.' : 'Mevcut siteyi ve iyileştirme kapsamını insan tarafından incele.',
    method: 'Kural tabanlı CRM kontrolü; harici web taraması veya SEO ölçümü yapılmadı.',
    demo: lead.demo === true,
  };
}
function demoDiscover(pairs, onlyNoWebsite = true) {
  const store = readStore();
  const records = store.leads.filter(l => l.demo);
  return pairs.slice(0, 100).map((p, i) => {
    const matches = records.filter(r => r.industryId === p.industryId && r.district === p.district);
    const existing = matches.find(r => !onlyNoWebsite || !r.website);
    const item = existing || {
      id: `demo-search-${p.industryId}-${slugify(p.district)}-${i}`,
      name: `${INDUSTRIES.find(x => x.id === p.industryId)?.short || 'İşletme'} örneği`,
      industryId: p.industryId, industry: INDUSTRIES.find(x => x.id === p.industryId)?.label || p.industryId,
      district: p.district, website: '', websiteStatus: 'no-website', source: 'demo', demo: true,
      phone: '', address: '', note: 'Sentetik demo kaydı; Google Maps sonucu değildir.',
    };
    return { ...item, opportunityScore: scoreOpportunity(item), demo: true, source: 'demo', disclaimer: 'Örnek veri — canlı Google Places sonucu değil.' };
  });
}
async function googlePlacesSearch(pair) {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Places API anahtarı yapılandırılmamış.');
  const industry = INDUSTRIES.find(x => x.id === pair.industryId);
  if (!industry || !DISTRICTS.includes(pair.district)) throw new Error('Sektör veya ilçe geçersiz.');
  const fieldMask = [
    'places.id','places.displayName','places.formattedAddress','places.nationalPhoneNumber',
    'places.internationalPhoneNumber','places.websiteUri','places.googleMapsUri','places.primaryTypeDisplayName','places.businessStatus'
  ].join(',');
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify({ textQuery: `${industry.query} ${pair.district}, İstanbul, Türkiye`, languageCode: 'tr', regionCode: 'TR', pageSize: 20 }),
    signal: AbortSignal.timeout(25_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Places yanıtı: ${response.status}`);
  return (data.places || []).map(place => {
    const website = place.websiteUri || '';
    return {
      id: `place-${place.id}`,
      placeId: place.id,
      name: place.displayName?.text || 'İsimsiz işletme',
      industryId: pair.industryId,
      industry: industry.label,
      district: pair.district,
      address: place.formattedAddress || '',
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
      website,
      websiteStatus: website ? 'has-website' : 'no-website',
      mapsUrl: place.googleMapsUri || '',
      businessStatus: place.businessStatus || 'UNKNOWN',
      source: 'google-places',
      demo: false,
      transient: true,
      opportunityScore: website ? 42 : 92,
      disclaimer: 'Google Places sonucu. Bu içerik oturumluk gösterim içindir; saklama/kullanım için Google Maps Platform kurallarını doğrulayın.',
    };
  });
}
async function discover(body) {
  const pairs = Array.isArray(body.pairs) ? body.pairs.slice(0, 100) : [];
  if (!pairs.length) throw new Error('En az bir sektör/ilçe seçin.');
  for (const p of pairs) {
    if (!INDUSTRIES.some(i => i.id === p.industryId) || !DISTRICTS.includes(p.district)) throw new Error('Geçersiz sektör veya ilçe.');
  }
  const live = Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
  if (!live) return { ok: true, mode: 'demo', count: demoDiscover(pairs, body.onlyNoWebsite !== false).length, items: demoDiscover(pairs, body.onlyNoWebsite !== false), notice: 'Demo modunda çalışıyor. Sonuçlar sentetiktir ve gerçek işletmeleri temsil etmez.' };
  if (pairs.length > 10) throw new Error('Canlı aramada istek/kota kontrolü için tek çalıştırmada en fazla 10 sektör/ilçe seçin.');
  const items = []; 
  // Keep API requests sequential to avoid bursts and make request counts predictable.
  for (const pair of pairs) {
    const found = await googlePlacesSearch(pair);
    items.push(...found);
    if (pairs.length > 1) await new Promise(resolve => setTimeout(resolve, 200));
  }
  const unique = new Map();
  for (const item of items) if (!unique.has(item.placeId)) unique.set(item.placeId, item);
  const filtered = [...unique.values()].filter(x => body.onlyNoWebsite === false || x.websiteStatus === 'no-website');
  return { ok: true, mode: 'google-places', count: filtered.length, items: filtered, requestCount: pairs.length, notice: 'Google Places verileri geçici olarak gösteriliyor. Google politikalarına uygunluk, atıf ve saklama kurallarını uygulamadan önce doğrulayın.' };
}

function cleanHttpUrl(value) {
  try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) ? url.toString().slice(0, 500) : ''; }
  catch { return ''; }
}
function safeServices(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 8).map(x => String(x).trim().slice(0, 100)).filter(Boolean);
}
function baseSiteContent(business) {
  const industry = INDUSTRIES.find(x => x.id === business.industryId)?.label || 'İşletme';
  const district = String(business.district || 'İstanbul').slice(0, 80);
  const name = String(business.name || 'İşletmeniz').slice(0, 120);
  const supplied = safeServices(business.services);
  const safeAbout = String(business.description || '').trim().slice(0, 600);
  return {
    title: name,
    eyebrow: `${district} · ${industry}`,
    headline: name,
    subheadline: safeAbout || `${name} için düzenlenebilir bir web sitesi taslağı. İşletme bilgileri ve hizmetler, yayın öncesinde işletme sahibi tarafından doğrulanmalıdır.`,
    aboutTitle: 'İşletmenizi tanıyın',
    about: safeAbout || 'Bu alan işletmenin gerçek hikâyesi, çalışma biçimi ve öne çıkan özellikleriyle tamamlanmalıdır.',
    servicesTitle: 'Hizmetler',
    services: supplied.length ? supplied : ['Hizmet başlığı ekleyin', 'Hizmet bilgisi işletme tarafından doğrulanmalı'],
    cta: 'İletişime geçin',
    phone: String(business.phone || '').slice(0, 60),
    email: String(business.email || '').slice(0, 120),
    address: String(business.address || '').slice(0, 180),
    district,
    industry,
    disclaimer: 'İnceleme amaçlı taslaktır. İşletme sahibi onayı olmadan resmi web sitesi değildir.',
  };
}
function extractJson(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI yanıtı JSON formatında değil.');
  return JSON.parse(clean.slice(start, end + 1));
}
async function makeSiteContent(business) {
  const fallback = baseSiteContent(business);
  const prompt = `Write Turkish-language website draft copy as JSON only for this Istanbul small business. Use only supplied facts. Never invent prices, hours, ratings, reviews, awards, licenses, guarantees, staff credentials, or services. Missing information should use neutral placeholders. This is a FREE FIRST-DRAFT PREVIEW, not a published site; the business owner must verify it. Output one JSON object matching this schema: {"title":"","eyebrow":"","headline":"","subheadline":"","aboutTitle":"","about":"","servicesTitle":"","services":[""],"cta":"","phone":"","email":"","address":"","district":"","industry":"","disclaimer":"Ücretsiz ilk taslak — işletme sahibi doğrulamalıdır."}. Business data: ${JSON.stringify({ name: business.name, industry: fallback.industry, district: fallback.district, description: business.description || '', services: safeServices(business.services), phone: business.phone || '', email: business.email || '', address: business.address || '' })}`;
  if (process.env.HF_TOKEN) {
    const model = process.env.HF_MODEL || 'Qwen/Qwen3-4B-Instruct-2507:fastest';
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.HF_TOKEN}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Return only one valid JSON object. Follow the user constraints exactly; do not add facts.' }, { role: 'user', content: prompt }], temperature: 0.35, max_tokens: 1800, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Hugging Face yanıtı: ${response.status}`);
    const raw = data.choices?.[0]?.message?.content;
    const content = { ...fallback, ...extractJson(typeof raw === 'string' ? raw : '') };
    content.services = safeServices(content.services);
    return { content, generator: 'huggingface', model };
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { content: fallback, generator: 'template-demo' };
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, maxOutputTokens: 1800 } }),
    signal: AbortSignal.timeout(35_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini yanıtı: ${response.status}`);
  const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n');
  const content = { ...fallback, ...extractJson(raw) };
  content.services = safeServices(content.services);
  return { content, generator: 'gemini', model };
}
function siteSlug(name) { return `${slugify(name)}-${crypto.randomBytes(12).toString('hex')}`; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true, mode: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY ? 'places-enabled' : 'demo', runtime: 'node', storage: 'JSON', authRequired: false, authConfigured: false, placesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY), geminiConfigured: Boolean(process.env.GEMINI_API_KEY), hfConfigured: Boolean(process.env.HF_TOKEN), hfModel: process.env.HF_MODEL || 'Qwen/Qwen3-4B-Instruct-2507:fastest' });
    }
    if (pathname === '/api/meta' && req.method === 'GET') return json(res, 200, { industries: INDUSTRIES, districts: DISTRICTS, stages: STAGES });
    if (pathname === '/api/leads' && req.method === 'GET') {
      const store = readStore();
      return json(res, 200, { ok: true, items: store.leads, demoCount: store.leads.filter(x => x.demo).length });
    }
    if (pathname === '/api/discover' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await discover(body);
      return json(res, 200, result);
    }
    if (pathname === '/api/leads' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.source === 'google-places') return json(res, 400, { ok: false, error: 'Google Places verileri varsayılan olarak CRM’de saklanamaz. Sadece place ID saklayın veya Google kurallarını doğrulayıp bu akışı açıkça yapılandırın.' });
      const name = String(body.name || '').trim().slice(0, 140);
      if (!name) return json(res, 400, { ok: false, error: 'İşletme adı gerekli.' });
      if (body.dataRightsConfirmed !== true) return json(res, 400, { ok: false, error: 'CRM’ye kaydedilen alanlar için veri kaynağı/kullanım hakkını doğrulayın.' });
      const industry = INDUSTRIES.find(x => x.id === body.industryId);
      const lead = {
        id: `lead-${crypto.randomBytes(5).toString('hex')}`,
        name, industryId: industry?.id || 'professional', industry: industry?.label || 'Profesyonel hizmet',
        district: DISTRICTS.includes(body.district) ? body.district : 'Şişli',
        website: String(body.website || '').trim().slice(0, 240),
        websiteStatus: String(body.website || '').trim() ? 'has-website' : 'no-website',
        phone: String(body.phone || '').trim().slice(0, 60), email: String(body.email || '').trim().slice(0, 120),
        address: String(body.address || '').trim().slice(0, 180), description: String(body.description || '').trim().slice(0, 600),
        evidenceUrl: cleanHttpUrl(body.evidenceUrl), verifiedAt: null, audit: null,
        services: safeServices(body.services), stage: 'Yeni', contactConsent: body.demo === true ? false : body.contactConsent === true,
        consentAt: body.demo === true || body.contactConsent !== true ? null : new Date().toISOString(),
        source: body.demo === true ? 'demo' : 'manual', demo: body.demo === true, notes: '', createdAt: new Date().toISOString(), siteSlug: null,
      };
      const store = readStore(); store.leads.unshift(lead); writeStore(store);
      return json(res, 201, { ok: true, item: lead });
    }
    const auditMatch = pathname.match(/^\/api\/leads\/([^/]+)\/audit$/);
    if (auditMatch && req.method === 'POST') {
      await readBody(req);
      const store = readStore(); const lead = store.leads.find(x => x.id === decodeURIComponent(auditMatch[1]));
      if (!lead) return json(res, 404, { ok: false, error: 'İşletme bulunamadı.' });
      if (!lead.demo && (!lead.verifiedAt || !lead.evidenceUrl)) return json(res, 403, { ok: false, error: 'Denetimden önce işletme ve web durumu için kaynak bağlantısını doğrulayın.' });
      lead.audit = makeLeadAudit(lead);
      if (!lead.demo) lead.stage = lead.audit.opportunityScore >= 70 ? 'Önceliklendirildi' : 'Denetim tamamlandı';
      writeStore(store); return json(res, 200, { ok: true, audit: lead.audit, item: lead });
    }
    const leadMatch = pathname.match(/^\/api\/leads\/([^/]+)$/);
    if (leadMatch && req.method === 'PATCH') {
      const body = await readBody(req);
      const store = readStore(); const lead = store.leads.find(x => x.id === decodeURIComponent(leadMatch[1]));
      if (!lead) return json(res, 404, { ok: false, error: 'İşletme bulunamadı.' });
      if (body.stage && STAGES.includes(body.stage)) lead.stage = body.stage;
      if (typeof body.notes === 'string') lead.notes = body.notes.slice(0, 1500);
      if (typeof body.evidenceUrl === 'string') {
        const clean = cleanHttpUrl(body.evidenceUrl);
        if (body.evidenceUrl.trim() && !clean) return json(res, 400, { ok: false, error: 'Kaynak bağlantısı yalnızca http veya https URL olabilir.' });
        if (clean !== lead.evidenceUrl) { lead.evidenceUrl = clean; lead.verifiedAt = null; lead.audit = null; }
      }
      if (typeof body.verified === 'boolean') {
        if (lead.demo && body.verified) return json(res, 403, { ok: false, error: 'Sentetik demo kaydı gerçek işletme olarak doğrulanamaz.' });
        if (body.verified && !lead.evidenceUrl) return json(res, 400, { ok: false, error: 'Doğrulama için kaynak bağlantısı gerekli.' });
        lead.verifiedAt = body.verified ? (lead.verifiedAt || new Date().toISOString()) : null;
        if (!body.verified) lead.audit = null;
        if (body.verified && ['Yeni', 'İnceleniyor'].includes(lead.stage)) lead.stage = 'Doğrulandı';
        if (!body.verified && ['Doğrulandı', 'Denetim tamamlandı', 'Önceliklendirildi'].includes(lead.stage)) lead.stage = 'İnceleniyor';
      }
      if (typeof body.contactConsent === 'boolean') {
        if (lead.demo && body.contactConsent) return json(res, 403, { ok: false, error: 'Sentetik demo kayıtları için gerçek iletişim izni atanamaz.' });
        lead.contactConsent = body.contactConsent; lead.consentAt = body.contactConsent ? new Date().toISOString() : null;
        if (body.contactConsent && !body.stage) lead.stage = 'İzinli iletişim';
        if (!body.contactConsent && lead.stage === 'İzinli iletişim') lead.stage = lead.siteSlug ? 'Önizleme hazır' : lead.audit ? 'Önceliklendirildi' : 'Doğrulandı';
      }
      if (body.stage === 'Doğrulandı' && !lead.verifiedAt) return json(res, 400, { ok: false, error: 'Önce kaynak bağlantısıyla işletmeyi doğrulayın.' });
      if (['Denetim tamamlandı', 'Önceliklendirildi'].includes(body.stage) && !lead.audit) return json(res, 400, { ok: false, error: 'Bu aşama için fırsat denetimi gerekli.' });
      if (body.stage === 'Önizleme hazır' && !lead.siteSlug) return json(res, 400, { ok: false, error: 'Bu aşama için oluşturulmuş site taslağı gerekli.' });
      if (body.stage === 'İzinli iletişim' && !lead.contactConsent) return json(res, 400, { ok: false, error: 'Bu aşama için kaydedilmiş iletişim izni gerekli.' });
      writeStore(store); return json(res, 200, { ok: true, item: lead });
    }
    if (pathname === '/api/sites' && req.method === 'POST') {
      const body = await readBody(req);
      const business = body.business && typeof body.business === 'object' ? body.business : {};
      if (!String(business.name || '').trim()) return json(res, 400, { ok: false, error: 'Önizleme için işletme adı gerekli.' });
      const store = readStore();
      if (!body.leadId) return json(res, 400, { ok: false, error: 'Taslak oluşturmak için CRM işletme kaydı gerekli.' });
      const linkedLead = store.leads.find(x => x.id === body.leadId);
      if (!linkedLead) return json(res, 404, { ok: false, error: 'Bağlı CRM kaydı bulunamadı.' });
      if (body.demo === true && !linkedLead?.demo) return json(res, 400, { ok: false, error: 'Demo taslaklar yalnızca sentetik demo CRM kaydıyla oluşturulabilir.' });
      if (linkedLead?.demo && body.demo !== true) return json(res, 400, { ok: false, error: 'Demo CRM kaydı gerçek işletme taslağı olarak kullanılamaz.' });
      if (!linkedLead.demo && !linkedLead.verifiedAt) return json(res, 403, { ok: false, error: 'Site taslağından önce işletme ve web durumu doğrulanmalı.' });
      if (!linkedLead.demo && !linkedLead.audit) return json(res, 403, { ok: false, error: 'Site taslağından önce denetim ve fırsat puanlaması gerekli.' });
      if (body.demo !== true && body.dataRightsConfirmed !== true) return json(res, 400, { ok: false, error: 'İşletme verisinin kaynağını ve kullanım hakkını doğrulayın.' });
      const result = await makeSiteContent(business);
      const site = { id: `site-${crypto.randomBytes(4).toString('hex')}`, slug: siteSlug(business.name), templateId: String(body.templateId || business.industryId || 'professional').slice(0, 60), createdAt: new Date().toISOString(), status: 'draft', business: { name: String(business.name).slice(0, 140), industryId: business.industryId || '', district: business.district || '', recommendedPackage: linkedLead.audit?.packageRecommendation?.name || '', phone: business.phone || '', email: business.email || '', address: business.address || '', description: business.description || '', services: safeServices(business.services) }, content: result.content, generator: result.generator, model: result.model || null, demo: body.demo === true };
      store.sites.unshift(site);
      if (linkedLead) { linkedLead.siteSlug = site.slug; linkedLead.stage = 'Önizleme hazır'; }
      writeStore(store);
      return json(res, 201, { ok: true, site, previewUrl: `/preview/${site.slug}`, generator: result.generator, disclaimer: 'Önizleme taslaktır; yayımlanmadan önce işletme sahibinin doğrulaması gerekir.' });
    }
    const siteMatch = pathname.match(/^\/api\/sites\/([^/]+)$/);
    if (siteMatch && req.method === 'GET') {
      const store = readStore(); const site = store.sites.find(x => x.slug === decodeURIComponent(siteMatch[1]));
      return site ? json(res, 200, { ok: true, site }) : json(res, 404, { ok: false, error: 'Önizleme bulunamadı.' });
    }
    if (pathname === '/api/message-draft' && req.method === 'POST') {
      const body = await readBody(req);
      const lead = readStore().leads.find(x => x.id === body.leadId);
      if (!lead) return json(res, 404, { ok: false, error: 'İşletme CRM’de bulunamadı.' });
      if (lead.demo) return json(res, 403, { ok: false, error: 'Sentetik demo kayıtlarına gerçek mesaj taslağı oluşturulamaz.' });
      if (!lead.verifiedAt || !lead.audit) return json(res, 403, { ok: false, error: 'İletişim taslağından önce doğrulama ve denetim tamamlanmalı.' });
      if (!lead.contactConsent) return json(res, 403, { ok: false, error: 'İletişim izni kaydedilmeden mesaj oluşturulamıyor.' });
      const site = lead.siteSlug ? readStore().sites.find(x => x.slug === lead.siteSlug) : null;
      const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
      const protocol = req.socket.encrypted || forwardedProto === 'https' ? 'https' : 'http';
      const base = (process.env.PUBLIC_BASE_URL || `${protocol}://${req.headers.host || 'localhost'}`).replace(/\/+$/, '');
      const preview = site ? `${base}/preview/${site.slug}` : '';
      const packageName = lead.audit?.packageRecommendation?.name || 'web başlangıç taslağı';
      const message = preview
        ? `Merhaba ${lead.name}, işletmeniz için hazırladığımız ücretsiz ilk web sitesi taslağını inceleyebilirsiniz: ${preview} Bu, onayınız için hazırlanmış bir önizlemedir; işletme sahibi onayı olmadan resmî site olarak yayımlanmayacaktır. Kapsam: ${packageName}. Domain, hosting veya bakım gerekirse kapsamı ve olası ücretleri ayrıca, önceden onayınıza sunarız. İncelemek ister misiniz? İletişim istemiyorsanız lütfen bize bildirin.`
        : `Merhaba ${lead.name}, işletmeniz için ücretsiz ilk web sitesi taslağı hazırlamayı önerebiliriz. Önerilen kapsam: ${packageName}. Henüz bir önizleme bağlantısı yok; taslak, işletme bilgileri doğrulandıktan sonra hazırlanır. Domain, hosting veya bakım bu ücretsiz ilk taslağa dahil değildir ve ancak ayrı onayınızla planlanır. Böyle bir önizlemeyi görmek ister misiniz? İletişim istemiyorsanız lütfen bize bildirin.`;
      return json(res, 200, { ok: true, message, previewUrl: preview, sendMode: 'manual-only' });
    }
    if (pathname === '/api/sites' && req.method === 'GET') {
      const store = readStore(); return json(res, 200, { ok: true, items: store.sites });
    }
    if (pathname.startsWith('/api/')) return json(res, 404, { ok: false, error: 'API endpoint bulunamadı.' });

    if (pathname.startsWith('/preview/')) {
      const file = path.join(PUBLIC, 'preview.html');
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Önizleme sayfası bulunamadı.'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
      return fs.createReadStream(file).pipe(res);
    }
    const file = safeStaticPath(pathname);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Dosya bulunamadı.'); }
    const ext = path.extname(file).toLowerCase();
    const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return fs.createReadStream(file).pipe(res);
  } catch (error) {
    const status = error?.name === 'AbortError' || error?.name === 'TimeoutError' ? 504 : 400;
    return json(res, status, { ok: false, error: String(error?.message || 'Bilinmeyen hata').slice(0, 600) });
  }
});

server.listen(PORT, HOST, () => {
  ensureStore();
  console.log(`İstanbul Web Factory listening on http://${HOST}:${PORT}`);
  console.log(`Mode: ${process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY ? 'Google Places configured' : 'DEMO data'}; Gemini: ${process.env.GEMINI_API_KEY ? 'configured' : 'template fallback'}`);
});
