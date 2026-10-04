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
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const fail = (status, message) => Object.assign(new Error(message), { status });
const json = (data, status=200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });
const cap = (s, max) => String(s ?? '').trim().slice(0, max);
const randomHex = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
function slugify(value) { return String(value || '').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'isletme'; }
function cleanHttpUrl(value) {
  try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) ? url.toString().slice(0, 500) : ''; }
  catch { return ''; }
}
function safeServices(input) { return Array.isArray(input) ? input.slice(0, 8).map(x => String(x ?? '').trim().slice(0, 100)).filter(Boolean) : []; }
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
    checkedAt: new Date().toISOString(), opportunityScore: scoreOpportunity(lead), completenessScore, confidenceScore,
    websiteStatus: noWebsite ? 'website-not-recorded' : 'website-provided', packageRecommendation,
    nextAction: !lead.verifiedAt ? 'İşletme ve web durumu kaynak bağlantısından doğrulanmalı.' : noWebsite ? 'Başlangıç site taslağını işletme sahibi için hazırla.' : 'Mevcut siteyi ve iyileştirme kapsamını insan tarafından incele.',
    method: 'Kural tabanlı CRM kontrolü; harici web taraması veya SEO ölçümü yapılmadı.', demo: lead.demo === true,
  };
}
function demoLead([id, name, industryId, district, website, stage]) {
  const industry = INDUSTRIES.find(x => x.id === industryId);
  return {
    id, name, industryId, industry: industry?.label || 'Diğer', district,
    website: website || '', websiteStatus: website ? 'has-website' : 'no-website',
    phone: '', email: '', description: '', services: [], evidenceUrl: '', verifiedAt: null, audit: null,
    stage: stage === 'preview' ? 'Önizleme hazır' : stage === 'review' ? 'İnceleniyor' : 'Yeni',
    contactConsent: false, consentAt: null, source: 'demo', demo: true, notes: '', createdAt: new Date().toISOString(), siteSlug: null,
  };
}
function leadFromRow(row) { try { return JSON.parse(row.data); } catch { return null; } }
async function ensureDemoSeed(env) {
  const marker = await env.DB.prepare('SELECT value FROM app_meta WHERE key = ?').bind('demo_seed_v1').first();
  if (marker) return;
  const now = new Date().toISOString();
  const statements = DEMO_ROWS.map(row => {
    const lead = demoLead(row); lead.createdAt = now;
    return env.DB.prepare('INSERT OR IGNORE INTO leads (id, created_at, updated_at, data) VALUES (?, ?, ?, ?)').bind(lead.id, now, now, JSON.stringify(lead));
  });
  statements.push(env.DB.prepare('INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)').bind('demo_seed_v1', '1'));
  await env.DB.batch(statements);
}
async function listLeads(env) {
  await ensureDemoSeed(env);
  const { results=[] } = await env.DB.prepare('SELECT data FROM leads ORDER BY created_at DESC, id ASC').all();
  return results.map(leadFromRow).filter(Boolean);
}
async function getLead(env, id) {
  await ensureDemoSeed(env);
  const row = await env.DB.prepare('SELECT data FROM leads WHERE id = ?').bind(id).first();
  return row ? leadFromRow(row) : null;
}
async function saveLead(env, lead) {
  const now = new Date().toISOString();
  lead.updatedAt = now;
  await env.DB.prepare('INSERT INTO leads (id, created_at, updated_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at, data=excluded.data')
    .bind(lead.id, lead.createdAt || now, now, JSON.stringify(lead)).run();
}
async function listSites(env) {
  const { results=[] } = await env.DB.prepare('SELECT data FROM sites ORDER BY created_at DESC, id ASC').all();
  return results.map(row => { try { return JSON.parse(row.data); } catch { return null; } }).filter(Boolean);
}
async function getSite(env, slug) {
  const row = await env.DB.prepare('SELECT data FROM sites WHERE slug = ?').bind(slug).first();
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}
async function saveSite(env, site) {
  await env.DB.prepare('INSERT INTO sites (id, slug, created_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, data=excluded.data')
    .bind(site.id, site.slug, site.createdAt, JSON.stringify(site)).run();
}
async function readJson(request) {
  const size = Number(request.headers.get('content-length') || 0);
  if (size > 1_000_000) throw fail(413, 'İstek gövdesi çok büyük.');
  const text = await request.text();
  if (text.length > 1_000_000) throw fail(413, 'İstek gövdesi çok büyük.');
  try { return JSON.parse(text || '{}'); } catch { throw fail(400, 'JSON isteği geçersiz.'); }
}
const encoder = new TextEncoder();
function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}
function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signSession(payload, secret) {
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(encoded));
  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}
async function verifySession(token, env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || String(token || '').length > 2048) return null;
  try {
    const [payloadPart, signaturePart, extra] = String(token || '').split('.');
    if (!payloadPart || !signaturePart || extra) return null;
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), fromBase64Url(signaturePart), encoder.encode(payloadPart));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart)));
    return payload?.sub === 'admin' && Number(payload.exp) > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}
async function hashText(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function constantTimePasswordMatch(provided, expected) {
  const [a, b] = await Promise.all([hashText(provided), hashText(expected)]);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function rateLimit(env, key, limit, windowMs) {
  const now = Date.now(), windowStart = Math.floor(now / windowMs) * windowMs;
  await env.DB.prepare('INSERT INTO rate_limits (rate_key, window_start, request_count) VALUES (?, ?, 1) ON CONFLICT(rate_key, window_start) DO UPDATE SET request_count=request_count+1').bind(key, windowStart).run();
  const row = await env.DB.prepare('SELECT request_count FROM rate_limits WHERE rate_key = ? AND window_start = ?').bind(key, windowStart).first();
  if (Number(row?.request_count || 0) > limit) throw fail(429, 'İstek sınırına ulaşıldı. Bir süre sonra tekrar deneyin.');
}
async function login(request, env) {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 16 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw fail(503, 'Yönetici girişi henüz yapılandırılmadı. ADMIN_PASSWORD ve SESSION_SECRET Worker secret olarak eklenmeli.');
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashText(`${env.SESSION_SECRET}:${ip}`);
  await rateLimit(env, `login:${ipHash}`, 10, 15 * 60 * 1000);
  await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Date.now() - 2 * 24 * 60 * 60 * 1000).run();
  const body = await readJson(request), password = String(body.password || '').slice(0, 256);
  if (!await constantTimePasswordMatch(password, env.ADMIN_PASSWORD)) throw fail(401, 'Giriş bilgileri geçersiz.');
  const now = Math.floor(Date.now() / 1000), expiresAt = now + 12 * 60 * 60;
  const token = await signSession({ sub: 'admin', iat: now, exp: expiresAt }, env.SESSION_SECRET);
  return json({ ok: true, token, expiresAt });
}
async function requireAdmin(request, env) {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 16 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw fail(503, 'Yönetici girişi henüz yapılandırılmadı.');
  }
  const authorization = request.headers.get('Authorization') || '';
  const separator = authorization.indexOf(' ');
  const token = separator >= 0 && authorization.slice(0, separator).toLowerCase() === 'bearer' ? authorization.slice(separator + 1).trim() : '';
  const session = await verifySession(token, env);
  if (!session) throw fail(401, 'Oturum gerekli veya süresi dolmuş. Yeniden giriş yapın.');
  return session;
}
function corsAllowed(origin, request, env) {
  if (!origin) return false;
  if (origin === new URL(request.url).origin) return true;
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => {
    try { return new URL(value.trim()).origin; } catch { return ''; }
  }).filter(Boolean);
  return allowed.includes(origin);
}
function withApiCors(response, request, env) {
  if (!new URL(request.url).pathname.startsWith('/api/')) return response;
  const origin = request.headers.get('Origin');
  if (!corsAllowed(origin, request, env)) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function baseSiteContent(business) {
  const industry = INDUSTRIES.find(x => x.id === business.industryId)?.label || 'İşletme';
  const district = String(business.district || 'İstanbul').slice(0, 80);
  const name = String(business.name || 'İşletmeniz').slice(0, 120);
  const supplied = safeServices(business.services);
  const safeAbout = String(business.description || '').trim().slice(0, 600);
  return {
    title: name, eyebrow: `${district} · ${industry}`, headline: name,
    subheadline: safeAbout || `${name} için düzenlenebilir bir web sitesi taslağı. Bilgiler yayın öncesinde işletme sahibi tarafından doğrulanmalıdır.`,
    aboutTitle: 'İşletmenizi tanıyın',
    about: safeAbout || 'Bu alan işletmenin gerçek hikâyesi ve çalışma biçimiyle tamamlanmalıdır.',
    servicesTitle: 'Hizmetler', services: supplied.length ? supplied : ['Hizmet başlığı ekleyin', 'İşletme bilgisi doğrulanmalı'],
    cta: 'İletişime geçin', phone: String(business.phone || '').slice(0, 60),
    email: String(business.email || '').slice(0, 120), address: String(business.address || '').slice(0, 180),
    district, industry, disclaimer: 'Ücretsiz ilk taslak. Yayın öncesinde işletme sahibi doğrulamalıdır.',
  };
}
function extractJson(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw fail(502, 'AI yanıtı JSON formatında değil.');
  try { return JSON.parse(clean.slice(start, end + 1)); } catch { throw fail(502, 'AI JSON yanıtı geçersiz.'); }
}
function sitePrompt(business, fallback) {
  return `Write Turkish-language website draft copy as JSON only for this Istanbul small business. Use only supplied facts. Never invent prices, hours, ratings, reviews, awards, licenses, guarantees, staff credentials, or services. Missing information should use neutral placeholders. This is a FREE FIRST-DRAFT PREVIEW, not a published site; the business owner must verify it. Output one JSON object matching this schema: {"title":"","eyebrow":"","headline":"","subheadline":"","aboutTitle":"","about":"","servicesTitle":"","services":[""],"cta":"","phone":"","email":"","address":"","district":"","industry":"","disclaimer":"Ücretsiz ilk taslak — işletme sahibi doğrulamalıdır."}. Business data: ${JSON.stringify({ name: business.name, industry: fallback.industry, district: fallback.district, description: business.description || '', services: safeServices(business.services), phone: business.phone || '', email: business.email || '', address: business.address || '' })}`;
}
async function makeSiteContent(business, env) {
  const fallback = baseSiteContent(business), prompt = sitePrompt(business, fallback);
  if (env.HF_TOKEN) {
    const model = env.HF_MODEL || 'Qwen/Qwen3-4B-Instruct-2507:fastest';
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.HF_TOKEN}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Return only one valid JSON object. Follow the user constraints exactly; do not add facts.' }, { role: 'user', content: prompt }], temperature: 0.35, max_tokens: 1800, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw fail(502, data?.error?.message || `Hugging Face yanıtı: ${response.status}`);
    const raw = data.choices?.[0]?.message?.content;
    const content = { ...fallback, ...extractJson(typeof raw === 'string' ? raw : '') };
    content.services = safeServices(content.services);
    return { content, generator: 'huggingface', model };
  }
  if (env.GEMINI_API_KEY) {
    const model = env.GEMINI_MODEL || 'gemini-flash-latest';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, maxOutputTokens: 1800 } }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw fail(502, data?.error?.message || `Gemini yanıtı: ${response.status}`);
    const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n');
    const content = { ...fallback, ...extractJson(raw) };
    content.services = safeServices(content.services);
    return { content, generator: 'gemini', model };
  }
  return { content: fallback, generator: 'template-demo' };
}
async function googlePlacesSearch(pair, env) {
  const industry = INDUSTRIES.find(x => x.id === pair.industryId);
  if (!industry || !DISTRICTS.includes(pair.district)) throw fail(400, 'Sektör veya ilçe geçersiz.');
  const fieldMask = ['places.id','places.displayName','places.formattedAddress','places.nationalPhoneNumber','places.internationalPhoneNumber','places.websiteUri','places.googleMapsUri','places.primaryTypeDisplayName','places.businessStatus'].join(',');
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify({ textQuery: `${industry.query} ${pair.district}, İstanbul, Türkiye`, languageCode: 'tr', regionCode: 'TR', pageSize: 20 }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw fail(502, data?.error?.message || `Google Places yanıtı: ${response.status}`);
  return (data.places || []).map(place => {
    const website = place.websiteUri || '';
    return {
      id: `place-${place.id}`, placeId: place.id, name: place.displayName?.text || 'İsimsiz işletme',
      industryId: pair.industryId, industry: industry.label, district: pair.district,
      address: place.formattedAddress || '', phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
      website, websiteStatus: website ? 'has-website' : 'no-website', mapsUrl: place.googleMapsUri || '',
      businessStatus: place.businessStatus || 'UNKNOWN', source: 'google-places', demo: false, transient: true,
      opportunityScore: website ? 42 : 92,
      disclaimer: 'Google Places sonucu; bu entegrasyonda oturumluk gösterilir, saklama/kullanım için Google politikalarını doğrulayın.',
    };
  });
}
async function demoDiscover(pairs, onlyNoWebsite, env) {
  const records = (await listLeads(env)).filter(l => l.demo);
  return pairs.slice(0, 100).map((p, i) => {
    const existing = records.find(r => r.industryId === p.industryId && r.district === p.district && (!onlyNoWebsite || !r.website));
    const item = existing || {
      id: `demo-search-${p.industryId}-${slugify(p.district)}-${i}`,
      name: `${INDUSTRIES.find(x => x.id === p.industryId)?.short || 'İşletme'} örneği`,
      industryId: p.industryId, industry: INDUSTRIES.find(x => x.id === p.industryId)?.label || p.industryId,
      district: p.district, website: '', websiteStatus: 'no-website', source: 'demo', demo: true,
      phone: '', address: '', note: 'Sentetik demo kaydı; Google Maps sonucu değildir.',
    };
    return { ...item, opportunityScore: scoreOpportunity(item), demo: true, source: 'demo', disclaimer: 'Sentetik örnek — gerçek işletme veya Google Maps sonucu değildir.' };
  });
}
async function discover(body, env) {
  const pairs = Array.isArray(body.pairs) ? body.pairs.slice(0, 100) : [];
  if (!pairs.length) throw fail(400, 'En az bir sektör/ilçe seçin.');
  for (const p of pairs) if (!INDUSTRIES.some(i => i.id === p.industryId) || !DISTRICTS.includes(p.district)) throw fail(400, 'Geçersiz sektör veya ilçe.');
  const onlyNoWebsite = body.onlyNoWebsite !== false;
  if (!env.GOOGLE_PLACES_API_KEY) {
    const items = await demoDiscover(pairs, onlyNoWebsite, env);
    return { ok: true, mode: 'demo', count: items.length, items, notice: 'Demo modunda çalışıyor. Sonuçlar sentetik ve gerçek işletmeleri temsil etmez.' };
  }
  if (pairs.length > 10) throw fail(400, 'Canlı aramada tek seferde en fazla 10 sektör/ilçe isteği seçin.');
  const items = [];
  for (let i=0;i<pairs.length;i++) { items.push(...await googlePlacesSearch(pairs[i], env)); if (i < pairs.length-1) await new Promise(r => setTimeout(r, 150)); }
  const unique = new Map();
  for (const item of items) if (!unique.has(item.placeId)) unique.set(item.placeId, item);
  const filtered = [...unique.values()].filter(x => !onlyNoWebsite || x.websiteStatus === 'no-website');
  return { ok: true, mode: 'google-places', count: filtered.length, items: filtered, requestCount: pairs.length, notice: 'Google Places sonuçları geçici gösterilir; resmî atıf ve kullanım koşullarını uygulamadan önce doğrulayın.' };
}
async function servePreview(request, env) {
  const assetUrl = new URL('/preview.html', request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl, { method: 'GET' }));
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, headers });
}
async function route(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (path === '/api/health' && method === 'GET') return json({ ok: true, mode: env.GOOGLE_PLACES_API_KEY ? 'places-enabled' : 'demo', runtime: 'cloudflare-worker', storage: 'D1', authRequired: true, authConfigured: Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET && env.ADMIN_PASSWORD.length >= 16 && env.SESSION_SECRET.length >= 32), placesConfigured: Boolean(env.GOOGLE_PLACES_API_KEY), geminiConfigured: Boolean(env.GEMINI_API_KEY), hfConfigured: Boolean(env.HF_TOKEN), hfModel: env.HF_MODEL || 'Qwen/Qwen3-4B-Instruct-2507:fastest' });
  if (path === '/api/meta' && method === 'GET') return json({ industries: INDUSTRIES, districts: DISTRICTS, stages: STAGES });
  if (path === '/api/auth/login' && method === 'POST') return login(request, env);
  if (path === '/api/auth/session' && method === 'GET') { const session = await requireAdmin(request, env); return json({ ok: true, user: session.sub, expiresAt: session.exp }); }
  const publicSiteMatch = path.match(new RegExp('^/api/sites/([^/]+)$'));
  if (publicSiteMatch && method === 'GET') {
    const site = await getSite(env, decodeURIComponent(publicSiteMatch[1]));
    return site ? json({ ok: true, site }) : json({ ok: false, error: 'Önizleme bulunamadı.' }, 404);
  }
  if (path.startsWith('/api/')) {
    const session = await requireAdmin(request, env);
    if (['POST','PATCH','PUT','DELETE'].includes(method)) await rateLimit(env, `writes:${session.sub}`, 300, 60 * 60 * 1000);
    if (path === '/api/discover' && method === 'POST') await rateLimit(env, `discover:${session.sub}`, 30, 24 * 60 * 60 * 1000);
    if (path === '/api/sites' && method === 'POST') await rateLimit(env, `ai-drafts:${session.sub}`, 25, 24 * 60 * 60 * 1000);
  }
  if (path === '/api/leads' && method === 'GET') { const leads = await listLeads(env); return json({ ok: true, items: leads, demoCount: leads.filter(l => l.demo).length }); }
  if (path === '/api/discover' && method === 'POST') return json(await discover(await readJson(request), env));
  if (path === '/api/leads' && method === 'POST') {
    const body = await readJson(request);
    if (body.source === 'google-places') throw fail(400, 'Google Places sonuçları varsayılan olarak CRM’ye aktarılamaz.');
    const name = cap(body.name, 140); if (!name) throw fail(400, 'İşletme adı gerekli.');
    if (body.dataRightsConfirmed !== true) throw fail(400, 'CRM’ye kaydedilen alanlar için veri kaynağı/kullanım hakkını doğrulayın.');
    const industry = INDUSTRIES.find(x => x.id === body.industryId);
    const website = cap(body.website, 240);
    const lead = {
      id: `lead-${randomHex(5)}`, name, industryId: industry?.id || 'professional', industry: industry?.label || 'Profesyonel hizmet',
      district: DISTRICTS.includes(body.district) ? body.district : 'Şişli', website, websiteStatus: website ? 'has-website' : 'no-website',
      phone: cap(body.phone,60), email: cap(body.email,120), address: cap(body.address,180), description: cap(body.description,600),
      services: safeServices(body.services), evidenceUrl: cleanHttpUrl(body.evidenceUrl), verifiedAt: null, audit: null,
      stage: 'Yeni', contactConsent: body.demo === true ? false : body.contactConsent === true,
      consentAt: body.demo === true || body.contactConsent !== true ? null : new Date().toISOString(),
      source: body.demo === true ? 'demo' : 'manual', demo: body.demo === true, notes: '', createdAt: new Date().toISOString(), siteSlug: null,
    };
    await saveLead(env, lead); return json({ ok: true, item: lead }, 201);
  }
  const auditMatch = path.match(/^\/api\/leads\/([^/]+)\/audit$/);
  if (auditMatch && method === 'POST') {
    await readJson(request);
    const lead = await getLead(env, decodeURIComponent(auditMatch[1]));
    if (!lead) throw fail(404, 'İşletme bulunamadı.');
    if (!lead.demo && (!lead.verifiedAt || !lead.evidenceUrl)) throw fail(403, 'Denetimden önce kaynak URL’siyle işletme ve web durumunu doğrulayın.');
    lead.audit = makeLeadAudit(lead);
    if (!lead.demo) lead.stage = lead.audit.opportunityScore >= 70 ? 'Önceliklendirildi' : 'Denetim tamamlandı';
    await saveLead(env, lead); return json({ ok: true, audit: lead.audit, item: lead });
  }
  const leadMatch = path.match(/^\/api\/leads\/([^/]+)$/);
  if (leadMatch && method === 'PATCH') {
    const body = await readJson(request), lead = await getLead(env, decodeURIComponent(leadMatch[1]));
    if (!lead) throw fail(404, 'İşletme bulunamadı.');
    if (body.stage && STAGES.includes(body.stage)) lead.stage = body.stage;
    if (typeof body.notes === 'string') lead.notes = body.notes.slice(0, 1500);
    if (typeof body.evidenceUrl === 'string') {
      const clean = cleanHttpUrl(body.evidenceUrl);
      if (body.evidenceUrl.trim() && !clean) throw fail(400, 'Kaynak bağlantısı yalnızca http veya https URL olabilir.');
      if (clean !== lead.evidenceUrl) { lead.evidenceUrl = clean; lead.verifiedAt = null; lead.audit = null; }
    }
    if (typeof body.verified === 'boolean') {
      if (lead.demo && body.verified) throw fail(403, 'Sentetik demo kaydı gerçek işletme olarak doğrulanamaz.');
      if (body.verified && !lead.evidenceUrl) throw fail(400, 'Doğrulama için kaynak bağlantısı gerekli.');
      lead.verifiedAt = body.verified ? (lead.verifiedAt || new Date().toISOString()) : null;
      if (!body.verified) lead.audit = null;
      if (body.verified && ['Yeni','İnceleniyor'].includes(lead.stage)) lead.stage = 'Doğrulandı';
      if (!body.verified && ['Doğrulandı','Denetim tamamlandı','Önceliklendirildi'].includes(lead.stage)) lead.stage = 'İnceleniyor';
    }
    if (typeof body.contactConsent === 'boolean') {
      if (lead.demo && body.contactConsent) throw fail(403, 'Sentetik demo kayıtları için gerçek iletişim izni atanamaz.');
      lead.contactConsent = body.contactConsent; lead.consentAt = body.contactConsent ? new Date().toISOString() : null;
      if (body.contactConsent && !body.stage) lead.stage = 'İzinli iletişim';
      if (!body.contactConsent && lead.stage === 'İzinli iletişim') lead.stage = lead.siteSlug ? 'Önizleme hazır' : lead.audit ? 'Önceliklendirildi' : 'Doğrulandı';
    }
    if (body.stage === 'Doğrulandı' && !lead.verifiedAt) throw fail(400, 'Önce kaynak bağlantısıyla işletmeyi doğrulayın.');
    if (['Denetim tamamlandı','Önceliklendirildi'].includes(body.stage) && !lead.audit) throw fail(400, 'Bu aşama için fırsat denetimi gerekli.');
    if (body.stage === 'Önizleme hazır' && !lead.siteSlug) throw fail(400, 'Bu aşama için oluşturulmuş site taslağı gerekli.');
    if (body.stage === 'İzinli iletişim' && !lead.contactConsent) throw fail(400, 'Bu aşama için kaydedilmiş iletişim izni gerekli.');
    await saveLead(env, lead); return json({ ok: true, item: lead });
  }
  if (path === '/api/sites' && method === 'POST') {
    const body = await readJson(request), business = body.business && typeof body.business === 'object' ? body.business : {};
    if (!String(business.name || '').trim()) throw fail(400, 'Önizleme için işletme adı gerekli.');
    if (!body.leadId) throw fail(400, 'Taslak oluşturmak için CRM işletme kaydı gerekli.');
    const lead = await getLead(env, body.leadId);
    if (!lead) throw fail(404, 'Bağlı CRM kaydı bulunamadı.');
    if (body.demo === true && !lead.demo) throw fail(400, 'Demo taslaklar yalnızca sentetik demo CRM kaydıyla oluşturulabilir.');
    if (lead.demo && body.demo !== true) throw fail(400, 'Demo CRM kaydı gerçek işletme taslağı olarak kullanılamaz.');
    if (!lead.demo && !lead.verifiedAt) throw fail(403, 'Site taslağından önce işletme ve web durumu doğrulanmalı.');
    if (!lead.demo && !lead.audit) throw fail(403, 'Site taslağından önce denetim ve fırsat puanlaması gerekli.');
    if (body.demo !== true && body.dataRightsConfirmed !== true) throw fail(400, 'İşletme verisinin kaynağını ve kullanım hakkını doğrulayın.');
    const result = await makeSiteContent(business, env);
    const site = {
      id: `site-${randomHex(6)}`, slug: `${slugify(business.name)}-${randomHex(12)}`,
      templateId: String(body.templateId || business.industryId || 'professional').slice(0,60),
      createdAt: new Date().toISOString(), status: 'draft',
      business: {
        name: String(business.name).slice(0,140), industryId: business.industryId || '', district: business.district || '',
        recommendedPackage: lead.audit?.packageRecommendation?.name || '', phone: business.phone || '', email: business.email || '',
        address: business.address || '', description: business.description || '', services: safeServices(business.services),
      },
      content: result.content, generator: result.generator, model: result.model || null, demo: body.demo === true,
    };
    await saveSite(env, site);
    lead.siteSlug = site.slug; lead.stage = 'Önizleme hazır'; await saveLead(env, lead);
    return json({ ok: true, site, previewUrl: `/preview/${site.slug}`, generator: result.generator, disclaimer: 'Ücretsiz ilk taslak; yayın öncesi işletme sahibi doğrulamalıdır.' }, 201);
  }
  if (path === '/api/sites' && method === 'GET') return json({ ok: true, items: await listSites(env) });
  const siteMatch = path.match(/^\/api\/sites\/([^/]+)$/);
  if (siteMatch && method === 'GET') {
    const site = await getSite(env, decodeURIComponent(siteMatch[1]));
    return site ? json({ ok: true, site }) : json({ ok: false, error: 'Önizleme bulunamadı.' }, 404);
  }
  if (path === '/api/message-draft' && method === 'POST') {
    const body = await readJson(request), lead = await getLead(env, body.leadId);
    if (!lead) throw fail(404, 'İşletme CRM’de bulunamadı.');
    if (lead.demo) throw fail(403, 'Sentetik demo kayıtlarına gerçek mesaj taslağı oluşturulamaz.');
    if (!lead.verifiedAt || !lead.audit) throw fail(403, 'İletişim taslağından önce doğrulama ve denetim tamamlanmalı.');
    if (!lead.contactConsent) throw fail(403, 'İletişim izni kaydedilmeden mesaj oluşturulamıyor.');
    const site = lead.siteSlug ? await getSite(env, lead.siteSlug) : null;
    const base = (env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const preview = site ? `${base}/preview/${site.slug}` : '';
    const packageName = lead.audit?.packageRecommendation?.name || 'web başlangıç taslağı';
    const message = preview
      ? `Merhaba ${lead.name}, işletmeniz için hazırladığımız ücretsiz ilk web sitesi taslağını inceleyebilirsiniz: ${preview} Bu, onayınız için hazırlanmış bir önizlemedir; işletme sahibi onayı olmadan resmî site olarak yayımlanmayacaktır. Kapsam: ${packageName}. Domain, hosting veya bakım gerekirse kapsamı ve olası ücretleri ayrıca, önceden onayınıza sunarız. İncelemek ister misiniz? İletişim istemiyorsanız lütfen bize bildirin.`
      : `Merhaba ${lead.name}, işletmeniz için ücretsiz ilk web sitesi taslağı hazırlamayı önerebiliriz. Önerilen kapsam: ${packageName}. Henüz bir önizleme bağlantısı yok; taslak, işletme bilgileri doğrulandıktan sonra hazırlanır. Domain, hosting veya bakım bu ücretsiz ilk taslağa dahil değildir ve ancak ayrı onayınızla planlanır. Böyle bir önizlemeyi görmek ister misiniz? İletişim istemiyorsanız lütfen bize bildirin.`;
    return json({ ok: true, message, previewUrl: preview, sendMode: 'manual-only' });
  }
  if (path.startsWith('/api/')) return json({ ok: false, error: 'API endpoint bulunamadı.' }, 404);
  if (path.startsWith('/preview/')) return servePreview(request, env);
  return env.ASSETS.fetch(request);
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/') && request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      if (origin && !corsAllowed(origin, request, env)) return new Response(null, { status: 403 });
      const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin',
      });
      if (origin) headers.set('Access-Control-Allow-Origin', origin);
      return new Response(null, { status: 204, headers });
    }
    try { return withApiCors(await route(request, env), request, env); }
    catch (error) {
      const status = Number(error?.status) || (error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 504 : 500);
      return withApiCors(json({ ok: false, error: String(error?.message || 'Bilinmeyen hata').slice(0, 600) }, status), request, env);
    }
  },
};
