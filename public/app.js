const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const root = $('#app');
const modalRoot = $('#modal-root');
const toastRoot = $('#toast-root');
const INDUSTRIES = [
  { id:'restaurant', label:'Restoran', query:'restoran', icon:'🍽️' },
  { id:'cafe', label:'Kafe', query:'kafe', icon:'☕' },
  { id:'beauty', label:'Güzellik & berber', query:'güzellik salonu kuaför berber', icon:'✦' },
  { id:'clinic', label:'Klinik & diş hekimi', query:'klinik diş hekimi', icon:'＋' },
  { id:'hotel', label:'Otel & konaklama', query:'otel butik otel', icon:'⌂' },
  { id:'real-estate', label:'Emlak', query:'emlak danışmanlığı', icon:'▤' },
  { id:'auto', label:'Oto servis & galeri', query:'oto servis oto galeri', icon:'◉' },
  { id:'fitness', label:'Spor & fitness', query:'spor salonu fitness', icon:'↗' },
  { id:'retail', label:'Mağaza & butik', query:'butik mağaza', icon:'◫' },
  { id:'professional', label:'Profesyonel hizmet', query:'muhasebe danışmanlık hukuk bürosu', icon:'◎' },
];
const DISTRICTS = ['Şişli','Kadıköy','Beşiktaş','Fatih','Beyoğlu','Bakırköy','Üsküdar','Ataşehir','Ümraniye','Beylikdüzü'];
const STAGES = ['Yeni','İnceleniyor','Doğrulandı','Denetim tamamlandı','Önceliklendirildi','Önizleme hazır','İzin bekliyor','İzinli iletişim','İlgileniyor','Müşteri','Uygun değil'];
const TEMPLATES = [
  { id:'restaurant',label:'Restoran',desc:'Menü, konum ve rezervasyon odaklı',art:'art-cafe' },
  { id:'cafe',label:'Kafe',desc:'Sıcak marka dili ve ürün vitrini',art:'art-cafe' },
  { id:'beauty',label:'Güzellik & berber',desc:'Hizmetler ve randevu için sade tasarım',art:'art-beauty' },
  { id:'clinic',label:'Klinik & diş hekimi',desc:'Güven veren, doğrulama odaklı tasarım',art:'art-clinic' },
  { id:'hotel',label:'Otel & konaklama',desc:'Konaklama bilgisi ve iletişim alanı',art:'art-hotel' },
  { id:'real-estate',label:'Emlak',desc:'Portföy ve danışmanlık görünümü',art:'art-real' },
  { id:'auto',label:'Oto servis & galeri',desc:'Hizmet ve iletişim odaklı tasarım',art:'art-auto' },
  { id:'fitness',label:'Spor & fitness',desc:'Program ve üyelik alanı',art:'art-fit' },
  { id:'retail',label:'Mağaza & butik',desc:'Koleksiyon ve mağaza bilgisi',art:'art-retail' },
  { id:'professional',label:'Profesyonel hizmet',desc:'Uzmanlık ve iletişim için kurumsal düzen',art:'art-pro' },
];
let API_BASE_URL = String(window.APP_CONFIG?.apiBaseUrl || '');
while (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);
let sessionToken = sessionStorage.getItem('iwf_session') || '';
let state = { view:new URLSearchParams(location.search).get('view') || 'home', leads:[], sites:[], config:{}, authenticated:false, discovery:[], selectedIndustries:INDUSTRIES.map(x=>x.id), selectedDistricts:[...DISTRICTS], filters:{industry:'',district:'',website:'',stage:'',q:''}, selectedTemplate:'', activeOutreachLead:'', jobs:{ q:'', industryId:'', district:'', skills:[], ran:false } };
const LANGS = window.IWF_LANGS || [];
const I18N = window.IWF_I18N || {};
const RTL = new Set(LANGS.filter(l => l.dir === 'rtl').map(l => l.code));
function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && I18N[q]) return q;
  const stored = localStorage.getItem('iwf_lang');
  if (stored && I18N[stored]) return stored;
  const nav = (navigator.language || 'tr').toLowerCase();
  const short = nav.slice(0, 2);
  if (I18N[nav]) return nav;
  if (I18N[short]) return short;
  return 'tr';
}
let LANG = detectLang();
function t(key, vars={}) {
  const pack = I18N[LANG] || I18N.en || {};
  let s = pack[key] || (I18N.en || {})[key] || (I18N.tr || {})[key] || key;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
function applyDir() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = RTL.has(LANG) ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('is-rtl', RTL.has(LANG));
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.desc'));
}
function setLang(code) {
  if (!I18N[code]) return;
  LANG = code;
  localStorage.setItem('iwf_lang', code);
  const next = new URL(location.href);
  next.searchParams.set('lang', code);
  history.replaceState({}, '', next);
  applyDir();
  render();
}
function langSwitcher() {
  const pills = ['tr', 'en', 'fa', 'ar'];
  return `<div class="lang-switch" role="navigation" aria-label="${esc(t('lang.label'))}">${pills.map(code => {
    const l = LANGS.find(x => x.code === code) || { native: code };
    return `<button type="button" class="lang-btn ${LANG === code ? 'active' : ''}" data-lang="${code}">${esc(l.native)}</button>`;
  }).join('')}<select class="lang-select" data-lang-select aria-label="${esc(t('lang.label'))}">${LANGS.map(l => `<option value="${esc(l.code)}" ${LANG === l.code ? 'selected' : ''}>${esc(l.native)}</option>`).join('')}</select></div>`;
}
const JOB_SOURCES = [
  { id: 'indeed', url: (q, loc) => `https://tr.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(loc)}` },
  { id: 'linkedin', url: (q, loc) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}` },
  { id: 'kariyer', url: (q) => `https://www.kariyer.net/is-ilanlari?q=${encodeURIComponent(q)}` },
  { id: 'yenibiris', url: (q) => `https://www.yenibiris.com/is-ilanlari?Kelime=${encodeURIComponent(q)}` },
  { id: 'secretcv', url: (q) => `https://www.secretcv.com/is-ilanlari?kelime=${encodeURIComponent(q)}` },
  { id: 'eleman', url: (q) => `https://www.eleman.net/is-ilanlari?search=${encodeURIComponent(q)}` },
  { id: 'glassdoor', url: (q, loc) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}&locKeyword=${encodeURIComponent(loc)}` },
  { id: 'jooble', url: (q, loc) => `https://tr.jooble.org/SearchResult?ukw=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}` },
  { id: 'google', url: (q, loc) => `https://www.google.com/search?ibp=htl;jobs&q=${encodeURIComponent(`${q} ${loc}`)}` },
  { id: 'bayt', url: (q) => `https://www.bayt.com/en/turkey/jobs/?keyword=${encodeURIComponent(q)}&location=istanbul` },
];
const JOB_SKILLS = ['customer','kitchen','barista','sales','cashier','reception','driving','languages','office','hygiene'];
const SKILL_INDUSTRY = { restaurant:['customer','kitchen','hygiene'], cafe:['barista','customer','cashier'], beauty:['customer','sales'], clinic:['reception','languages','office'], hotel:['reception','customer','languages'], 'real-estate':['sales','office','languages'], auto:['driving','customer','office'], fitness:['customer','sales'], retail:['sales','cashier','customer'], professional:['office','languages','sales'] };
function jobLocation() {
  const district = state.jobs.district;
  return district ? `${district}, ${t('jobs.location')}` : t('jobs.location');
}
function jobQuery() {
  const typed = (state.jobs.q || '').trim();
  const industryQ = state.jobs.industryId ? t(`jobq.${state.jobs.industryId}`) : '';
  const skillQ = (state.jobs.skills || []).map(id => t(`skillq.${id}`)).join(' ');
  const district = state.jobs.district || '';
  return [typed, skillQ, industryQ, district, 'İstanbul'].filter(Boolean).join(' ');
}
function sourceSearchUrl(src) {
  return src.url(jobQuery() || t('jobs.location'), jobLocation());
}
const workerUrl = path => new URL(path, `${API_BASE_URL || location.origin}/`).toString();
const previewUrlFor = slug => workerUrl(`/preview/${encodeURIComponent(slug)}`);
const esc = x => String(x ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const industry = id => INDUSTRIES.find(x=>x.id===id) || {label:'İşletme',icon:'◎'};
const leadById = id => state.leads.find(x=>x.id===id);
const siteBySlug = slug => state.sites.find(x=>x.slug===slug);
async function api(url, options={}) {
  const headers = { ...(options.body?{'Content-Type':'application/json'}:{}), ...(options.headers||{}) };
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  const response = await fetch(workerUrl(url), { ...options, headers });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : await response.text();
  if (response.status === 401 && sessionToken) {
    sessionToken = ''; sessionStorage.removeItem('iwf_session'); state.authenticated = false;
    if (state.config.authRequired) window.setTimeout(() => render(), 0);
  }
  if (!response.ok) throw new Error(data?.error || `İstek başarısız (${response.status})`);
  return data;
}
const post = (url, body) => api(url,{method:'POST',body:JSON.stringify(body)});
function toast(message, kind='') {
  const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = message; toastRoot.appendChild(el);
  setTimeout(()=>el.remove(),3800);
}
function industryLabel(id) { return t(`industry.${id}`) || industry(id).label; }
function isNoSite(lead) { return !(lead.website || '').trim(); }
function opportunity(lead) { let s=isNoSite(lead)?76:38;s+=lead.verifiedAt?10:-6;if(lead.evidenceUrl)s+=4;if(!lead.description)s+=4;if(!lead.phone&&!lead.email)s-=3;if(lead.contactConsent)s+=4;return Math.max(0,Math.min(100,s)); }
function stageClass(stage) { if(stage==='Önizleme hazır')return 'status-draft'; if(['İzinli iletişim','İlgileniyor','Müşteri'].includes(stage))return 'status-contact'; if(['İnceleniyor','İzin bekliyor'].includes(stage))return 'status-review'; if(['Doğrulandı','Denetim tamamlandı','Önceliklendirildi'].includes(stage))return 'status-has'; return 'status-new'; }
function demoBadge(isDemo) { return isDemo ? '<span class="demo-label">ÖRNEK VERİ</span>' : ''; }
function markSvg() { return '<span class="brand-mark">W</span>'; }
function brand(home=false) { return `<a class="brand" href="?view=home" data-nav="home">${markSvg()}<span class="brand-word">${esc(t('brand.name'))}<small>${esc(t('brand.tag'))}</small></span></a>`; }
function navLink(view,label,icon) { return `<button class="side-link ${state.view===view?'active':''}" data-nav="${view}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`; }
function publicHeader(extraActions='') {
  const langQ = LANG ? `&lang=${encodeURIComponent(LANG)}` : '';
  return `<header class="public-nav">${brand(true)}<nav class="public-links"><a href="${state.view==='home'?'#nasil-calisir':`?view=home${langQ}#nasil-calisir`}">${esc(t('nav.how'))}</a><a href="${state.view==='home'?'#sektorler':`?view=home${langQ}#sektorler`}">${esc(t('nav.industries'))}</a><a href="?view=jobs${langQ}">${esc(t('nav.jobs'))}</a><a href="${state.view==='home'?'#guven':`?view=home${langQ}#guven`}">${esc(t('nav.trust'))}</a></nav><div class="public-actions">${langSwitcher()}<button class="btn btn-light btn-jobs-nav" data-nav="jobs">${esc(t('nav.jobs'))}</button>${extraActions}</div></header>`;
}
function landing() {
  const topIndustries = INDUSTRIES.slice(0,10);
  return `<div class="public-page">
    ${publicHeader(`<button class="btn btn-light" data-nav="jobs">${esc(t('cta.jobs'))}</button><button class="btn btn-light" data-nav="discover">${esc(t('cta.discover'))}</button><button class="btn" data-nav="factory">${esc(t('cta.factory'))} <span>↗</span></button>`)}
    <main>
      <section class="hero-wrap"><div class="hero-copy"><div class="eyebrow">${esc(t('landing.eyebrow'))}</div><h1>${esc(t('landing.h1a'))} <span>${esc(t('landing.h1b'))}</span></h1><p>${esc(t('landing.p'))}</p><div class="hero-ctas"><button class="btn" data-nav="discover">${esc(t('cta.discover'))} <span>→</span></button><button class="btn btn-light" data-nav="jobs">${esc(t('cta.jobs'))}</button><button class="btn btn-light" data-nav="factory">${esc(t('cta.factory'))}</button></div><div class="hero-note"><span class="dot"></span> ${esc(t('landing.note'))}</div></div>
        <div class="hero-visual"><div class="visual-halo"></div><div class="floating-chip chip-top"><span class="floating-icon">✦</span><span><strong>${esc(t('landing.chip1t'))}</strong><small>${esc(t('landing.chip1s'))}</small></span></div><div class="visual-browser"><div class="browser-top"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-url">önizleme · taslak</span></div><div class="mock-ops"><div class="mock-ops-header"><div><b>${esc(t('landing.mockTitle'))}</b><small>${esc(t('landing.mockSub'))}</small></div><span class="mock-status">DEMO</span></div><div class="mock-ops-steps"><span>01</span><span>02</span><span>03</span><span>04</span></div><div class="mock-ops-kpis"><div><small>${esc(t('landing.mockScope'))}</small><b>10 × 10</b><em>10 · 10</em></div><div><small>${esc(t('landing.mockNext'))}</small><b>${esc(t('landing.mockFree'))}</b><em>${esc(t('landing.mockDraftSub'))}</em></div></div><div class="mock-ops-lead"><span class="mock-avatar">K</span><div class="mock-lead-info"><b>${esc(t('landing.mockLead'))}</b><small>${esc(t('landing.mockLeadSub'))}</small></div><span class="mock-score">82<small>/100</small></span></div><div class="mock-free-website"><span class="mock-free-kicker">FREE STARTER SITE</span><b>${esc(t('landing.mockDraft'))}</b><small>${esc(t('landing.mockDraftSub'))}</small><span class="mock-preview-chip">${esc(t('landing.mockPreview'))}</span></div></div></div><div class="floating-chip chip-bottom"><span class="floating-icon">✓</span><span><strong>${esc(t('landing.chip2t'))}</strong><small>${esc(t('landing.chip2s'))}</small></span></div></div></section>
      <div class="proof-line">${esc(t('proof'))}</div>
      <section class="section" id="nasil-calisir"><div class="section-head"><div><div class="eyebrow">${esc(t('how.eyebrow'))}</div><h2>${esc(t('how.h2a'))}<br>${esc(t('how.h2b'))}</h2></div><p>${esc(t('how.p'))}</p></div><div class="step-grid"><article class="step-card"><span class="step-num">01</span><h3>${esc(t('how.1t'))}</h3><p>${esc(t('how.1p'))}</p></article><article class="step-card"><span class="step-num">02</span><h3>${esc(t('how.2t'))}</h3><p>${esc(t('how.2p'))}</p></article><article class="step-card"><span class="step-num">03</span><h3>${esc(t('how.3t'))}</h3><p>${esc(t('how.3p'))}</p></article></div></section>
      <section class="section" id="sektorler"><div class="section-head"><div><div class="eyebrow">${esc(t('ind.eyebrow'))}</div><h2>${esc(t('ind.h2a'))}<br>${esc(t('ind.h2b'))}</h2></div><p>${esc(t('ind.p'))}</p></div><div class="industry-grid">${topIndustries.map(x=>`<div class="industry-card"><span class="industry-icon">${x.icon}</span>${esc(industryLabel(x.id))}</div>`).join('')}</div></section>
      <section class="section" id="is-ilanlari"><div class="section-head"><div><div class="eyebrow">${esc(t('jobs.landingEyebrow'))}</div><h2>${esc(t('jobs.landingH2'))}</h2></div><p>${esc(t('jobs.landingP'))}</p></div><div class="jobs-source-strip">${JOB_SOURCES.map(s=>`<button type="button" class="job-source-pill" data-open-source="${s.id}"><b>${esc(t('src.'+s.id) || s.id)}</b><small>${esc(t('src.'+s.id+'.blurb'))}</small></button>`).join('')}</div><div class="section-head" style="margin-top:28px"><div><div class="eyebrow">${esc(t('jobs.skills'))}</div><h2>${esc(t('jobs.skillsLanding'))}</h2></div><p>${esc(t('jobs.skillsLandingP'))}</p></div><div class="skill-grid">${JOB_SKILLS.map(id=>`<button type="button" class="industry-card" data-skill-go="${id}"><span class="industry-icon">▸</span>${esc(t('skill.'+id))}</button>`).join('')}</div><div class="hero-ctas" style="margin-top:18px"><button class="btn" data-nav="jobs">${esc(t('cta.jobsStart'))}</button></div></section>
      <section class="section" id="guven"><div class="trust-band"><div><h3>${esc(t('trust.h3'))}</h3><p>${esc(t('trust.p'))}</p></div><button class="btn btn-light" data-nav="discover">${esc(t('trust.cta'))}</button></div></section>
    </main><footer class="landing-footer"><span>${esc(t('footer.copy'))}</span><span>${esc(t('footer.note'))}</span></footer></div>`;
}
function loginView() {
  const configured = state.config.authConfigured === true;
  return `<main class="auth-page"><section class="auth-card">${brand(true)}${langSwitcher()}<div class="auth-copy"><div class="eyebrow">${esc(t('login.eyebrow'))}</div><h1>${esc(t('login.h1'))}</h1><p>${esc(t('login.p'))}</p></div>${configured?'':`<div class="auth-alert">${esc(t('login.unconfigured'))}</div>`}<form id="login-form"><div class="form-field"><label for="admin-password">${esc(t('login.password'))}</label><input class="field" id="admin-password" name="password" type="password" autocomplete="current-password" required maxlength="256" ${configured?'':'disabled'}></div><button class="btn" type="submit" ${configured?'':'disabled'}>${esc(t('login.submit'))} <span>→</span></button></form><p class="auth-foot">${esc(t('login.foot'))}</p><button class="btn btn-light" type="button" data-nav="home">${esc(t('login.back'))}</button></section></main>`;
}
function shell(content,title,subtitle='') {
  const storageLabel = state.config.storage==='KV'?'Worker + KV':state.config.storage==='D1'?'Worker + D1':'MVP DEMO';
  return `<div class="app-shell"><aside class="sidebar">${brand()}<div class="sidebar-section-label">${esc(t('nav.workspace'))}</div><nav class="side-nav">${navLink('dashboard',t('nav.dashboard'),'⌂')}${navLink('discover',t('nav.discover'),'⌕')}${navLink('jobs',t('nav.jobs'),'☰')}${navLink('leads',t('nav.leads'),'▤')}${navLink('factory',t('nav.factory'),'✦')}${navLink('sites',t('nav.sites'),'▣')}${navLink('outreach',t('nav.outreach'),'↗')}</nav><div class="sidebar-section-label">${esc(t('nav.admin'))}</div><nav class="side-nav">${navLink('settings',t('nav.settings'),'⚙')}</nav><div class="sidebar-bottom"><div class="team-card"><strong>${esc(t('team.title'))}</strong><p>${esc(state.config.authRequired?t('team.auth'):t('team.local'))}</p><span class="demo-label">${esc(storageLabel)}</span></div><button class="sidebar-back" data-nav="home">${esc(t('nav.home'))}</button></div></aside><main class="app-main"><header class="topbar"><div class="topbar-left"><div><h1>${esc(title)}</h1><p>${esc(subtitle || t('view.dashboard.sub'))}</p></div></div><div class="topbar-right">${langSwitcher()}<div class="search-mini"><span>⌕</span><input id="globalSearch" placeholder="${esc(t('search.placeholder'))}" aria-label="${esc(t('search.placeholder'))}"></div><span class="chip"><i class="dot"></i> ${esc(storageLabel)}</span>${state.config.authRequired?`<button class="btn btn-light btn-sm" data-logout>${esc(t('logout'))}</button>`:''}<div class="avatar">İW</div></div></header><section class="content">${content}</section></main></div>`;
}
function heading(eyebrow,title,subtitle,actions='') { return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`; }
function dashboardView() {
  const leads=state.leads, real=leads.filter(l=>!l.demo);
  const groups=[['Aday',leads.length],['Doğrulandı',leads.filter(l=>!!l.verifiedAt).length],['Denetim & puan',leads.filter(l=>!!l.audit).length],['Paket önerisi',leads.filter(l=>!!l.audit?.packageRecommendation).length],['Site taslağı',leads.filter(l=>!!l.siteSlug).length],['İzinli erişim',leads.filter(l=>!!l.contactConsent).length]];
  const auditQueue=real.filter(l=>!l.audit).sort((a,b)=>opportunity(b)-opportunity(a));
  const priority=real.filter(l=>l.audit).sort((a,b)=>(b.audit?.opportunityScore||0)-(a.audit?.opportunityScore||0));
  const top=(priority.length?priority:auditQueue).slice(0,5);
  const realVerified=real.filter(l=>l.verifiedAt).length, realAudited=real.filter(l=>l.audit).length, realConsent=real.filter(l=>l.contactConsent).length;
  return `${heading(t('dash.eyebrow'),t('dash.h2'),t('dash.p'),`<button class="btn btn-light" data-nav="discover">⌕ ${esc(t('nav.discover'))}</button><button class="btn btn-light" data-nav="jobs">${esc(t('nav.jobs'))}</button><button class="btn" data-nav="leads">＋ ${esc(t('nav.leads'))}</button>`)}
    <div class="grid stats-grid"><article class="card stat-card"><div class="stat-head">CRM adayları <span class="stat-icon">▤</span></div><div class="stat-value">${leads.length}</div><div class="stat-foot">${leads.filter(l=>l.demo).length} sentetik demo kayıtlı</div></article><article class="card stat-card"><div class="stat-head">Doğrulama kuyruğu <span class="stat-icon">✓</span></div><div class="stat-value">${real.length-realVerified}</div><div class="stat-foot">Gerçek kayıt · kaynak kanıtı gerekli</div></article><article class="card stat-card"><div class="stat-head">Denetim & paket <span class="stat-icon">◎</span></div><div class="stat-value">${realAudited}</div><div class="stat-foot">Kurala dayalı fırsat raporu</div></article><article class="card stat-card"><div class="stat-head">İzinli iletişim <span class="stat-icon">↗</span></div><div class="stat-value">${realConsent}</div><div class="stat-foot">İnsan onayı · otomatik gönderim kapalı</div></article></div>
    <div class="workflow-strip"><div class="workflow-label"><span>CORE WORKFLOW</span><strong>İzlenebilir satış operasyonu</strong></div><div class="pipeline">${groups.map(([name,count])=>`<div class="pipeline-step"><div class="pipeline-top"><span>${esc(name)}</span><b>${count}</b></div><div class="pipeline-bar"><i style="width:${Math.min(100,leads.length?count/leads.length*100:0)}%"></i></div></div>`).join('')}</div><span class="workflow-note">Örnekler demo olarak sayılır · gerçek KPI’lar demo hariç</span></div>
    <div class="grid dashboard-grid"><article class="card"><div class="card-head"><div><h3>${priority.length?'Öncelikli fırsatlar':'Doğrulama kuyruğu'}</h3><p>${priority.length?'Denetim puanına göre sıralı':'Önce kaynak bağlantısı ekleyin, sonra denetleyin.'}</p></div><button class="btn btn-ghost btn-sm" data-nav="leads">CRM’yi aç →</button></div><div class="lead-list">${top.map(l=>`<div class="lead-mini lead-list-item" data-open-lead="${esc(l.id)}"><span class="rank">${esc((l.name||'İ').slice(0,1))}</span><span class="lead-list-text"><strong>${esc(l.name)} ${demoBadge(l.demo)}</strong><small>${esc(industryLabel(l.industryId))} · ${esc(l.district)} · ${l.audit?'denetim tamamlandı':'doğrulama bekliyor'}</small></span><span class="score">${l.audit?.opportunityScore??opportunity(l)}<small>/100</small></span></div>`).join('')||'<div class="feature-empty"><strong>Henüz gerçek CRM adayı yok</strong><p>Sentetik örnekler dashboard akışını göstermek içindir.</p><button class="btn" data-nav="discover">Demo keşfi başlat</button></div>'}</div><div class="core-disclaimer">Puan, olasılık / iç öncelik göstergesidir; dönüşüm veya satış garantisi değildir. Denetim bu MVP’de CRM alanlarını kontrol eder, harici site crawl’ı ya da gerçek SEO testi değildir.</div></article>
      <aside class="card"><div class="card-head"><div><h3>Önerilen sonraki adımlar</h3><p>Kanıttan onaylı taslağa</p></div><span class="stat-icon">↗</span></div><div class="insight-card"><b>1 · Kanıtı doğrula</b><p>İşletme kimliğini ve web adresi durumunu, saklama hakkınız olan bir kaynakla kontrol edin.</p></div><div class="insight-card"><b>2 · Fırsatı puanla</b><p>Kayıt bütünlüğü, kaynak güveni ve web durumu üzerinden paket önerisi üretin.</p></div><div class="insight-card"><b>3 · Taslak + insan onayı</b><p>Doğrulanmış bilgileri web taslağına taşıyın; mesajı izin ve temsil yetkisi olmadan göndermeyin.</p></div><button class="btn btn-light" style="width:100%" data-nav="factory">Site oluşturucuya git</button></aside></div>`;
}
function discoveryView() {
  const live = !!state.config.placesConfigured;
  return `${heading('GOOGLE PLACES · DEMO','İşletme keşfi','10 sektör × 10 ilçe için kontrollü arama. Canlı API anahtarı yoksa yalnızca sentetik demo verisi gösterilir.',`<span class="chip"><i class="dot" style="background:${live?'#35a76f':'#d19d31'}"></i>${live?'Places API bağlı':'Places API bağlı değil'}</span>`)}
    <div class="discovery-layout"><aside class="card filter-card"><div class="card-head"><div><h3>Arama kapsamı</h3><p>Sektör ve ilçeleri seçin.</p></div><span class="demo-label">${live?'CANLI':'DEMO'}</span></div><div class="filter-group"><div class="filter-label">Sektörler <button class="btn btn-ghost btn-sm" data-select-all="industries">Tümünü seç</button></div><div class="chip-grid">${INDUSTRIES.map(i=>`<button class="select-chip ${state.selectedIndustries.includes(i.id)?'selected':''}" data-toggle-industry="${i.id}">${i.icon} ${esc(industryLabel(i.id))}</button>`).join('')}</div></div><div class="filter-group"><div class="filter-label">İstanbul ilçeleri <button class="btn btn-ghost btn-sm" data-select-all="districts">Tümünü seç</button></div><div class="chip-grid">${DISTRICTS.map(d=>`<button class="select-chip ${state.selectedDistricts.includes(d)?'selected':''}" data-toggle-district="${esc(d)}">${esc(d)}</button>`).join('')}</div></div><div class="matrix-summary"><span>Seçili arama kombinasyonu</span><strong>${state.selectedIndustries.length*state.selectedDistricts.length}</strong></div><div class="filter-foot">Canlı aramalar her sektör/ilçe çifti için Places API isteği yapar. Kota ve ücretleri kontrol edin. Bu arayüz sonuçları otomatik CRM’ye kaydetmez.</div><div style="display:grid;gap:8px;margin-top:14px"><label class="consent-box"><input id="onlyNoWebsite" type="checkbox" checked><span>Web sitesi alanı bulunmayan sonuçları göster</span></label><button class="btn" id="runDiscovery">${live?'Canlı aramayı başlat':'Demo sonuçları göster'} <span>→</span></button><button class="btn btn-light" data-nav="leads">CRM kayıtlarına git</button></div></aside>
    <div class="card search-results-card"><div class="card-head"><div><h3>Keşif sonuçları</h3><p id="discovery-summary">${state.discovery.length?`${state.discovery.length} sonuç`:'Henüz arama yapılmadı.'}</p></div><div class="filters-row"><span class="demo-label">${state.discovery.some(x=>x.demo)?'SENTETİK DEMO':'OTURUM SONUCU'}</span><button class="btn btn-light btn-sm" id="exportDiscovery" ${state.discovery.length?'':'disabled'}>CSV dışa aktar</button></div></div><div class="search-mode-note">${live?'Google Places sonuçları yalnızca oturumluk gösterilir. Bu prototipte resmî Google logo/atıf yerleşimi üretim için tamamlanmamıştır; canlıya açmadan önce Google’ın geçerli görüntüleme, atıf ve saklama kurallarını uygulayın.':'Örnek veriler gerçek işletme veya Google Maps sonucu değildir. Canlı arama için sunucuya GOOGLE_PLACES_API_KEY eklenmelidir.'}</div><div id="discovery-results">${renderDiscoveryRows()}</div></div></div>`;
}
function renderDiscoveryRows() {
  if (!state.discovery.length) return `<div class="feature-empty"><span class="empty-icon">⌕</span><strong>Aramaya hazır</strong><p>Sektör ve ilçeleri seçip aramayı başlatın. Demo modunda sonuçlar sentetik olarak etiketlenir.</p></div>`;
  return `<div class="search-results">${state.discovery.map((x,i)=>`<div class="result-row"><input class="row-check" type="checkbox" data-result-check="${i}" aria-label="Seç ${esc(x.name)}"><div class="result-name"><strong>${esc(x.name)} ${x.demo?'<span class="demo-label">DEMO</span>':''}</strong><small>${esc(industryLabel(x.industryId))} · ${esc(x.district)}</small></div><div class="result-col"><span class="status ${x.websiteStatus==='no-website'?'status-no':'status-has'}">${x.websiteStatus==='no-website'?'Site bulunamadı':'Web sitesi var'}</span><small>${x.demo?'Sentetik örnek':'Places API · geçici'}</small></div><div class="result-col hide-sm">${x.demo?'Gerçek veri değil':esc(x.businessStatus||'Bilgi yok')}<small>${x.demo?'Google sonucu değildir':`Fırsat puanı ${x.opportunityScore}/100`}</small></div><div class="result-actions"><button class="btn btn-light btn-sm" data-result-action="save" data-result-index="${i}">${x.source==='google-places'?'Haritada incele':'CRM’ye ekle'}</button></div></div>`).join('')}</div>`;
}
function renderLeadRow(l) {
  const auditCell=l.audit?`<span class="status status-draft">${l.audit.opportunityScore}/100 · ${esc(l.audit.packageRecommendation?.name||'Öneri')}</span>`:'<span class="muted">Denetim yok</span>';
  const verification=l.demo?'Demo':l.verifiedAt?'Doğrulandı':'Bekliyor';
  return `<tr><td><div class="business-cell"><span class="business-avatar">${esc((l.name||'İ').slice(0,1))}</span><span><strong>${esc(l.name)} ${demoBadge(l.demo)}</strong><small>${esc(l.email||l.phone||'İletişim bilgisi yok')}</small></span></div></td><td>${esc(industryLabel(l.industryId))}</td><td>${esc(l.district)}</td><td><span class="status ${isNoSite(l)?'status-no':'status-has'}">${isNoSite(l)?'Site yok':'Site var'}</span></td><td><span class="status ${l.verifiedAt?'status-has':'status-review'}">${verification}</span></td><td>${auditCell}</td><td><b>${l.audit?.opportunityScore??opportunity(l)}</b><small class="muted"> / 100</small></td><td><select class="select select-sm" data-stage="${esc(l.id)}">${STAGES.map(s=>`<option ${l.stage===s?'selected':''}>${esc(s)}</option>`).join('')}</select></td><td><span class="consent-state ${l.contactConsent?'yes':'no'}">${l.contactConsent?'Kayıtlı':'Yok'}</span></td><td><button class="icon-btn" title="Aç" data-open-lead="${esc(l.id)}">↗</button></td></tr>`;
}
function leadsView() {
  const list=filterLeads();
  const industryOptions=INDUSTRIES.map(i=>`<option value="${i.id}" ${state.filters.industry===i.id?'selected':''}>${esc(industryLabel(i.id))}</option>`).join('');
  const districtOptions=DISTRICTS.map(d=>`<option ${state.filters.district===d?'selected':''}>${esc(d)}</option>`).join('');
  const stageOptions=STAGES.map(s=>`<option ${state.filters.stage===s?'selected':''}>${esc(s)}</option>`).join('');
  const rows=list.map(renderLeadRow).join('');
  return `${heading('LEAD OPERATIONS','İşletmeler & CRM','Kaynak kanıtı, operatör doğrulaması, fırsat denetimi, paket önerisi ve izinli takip tek kayıtta.',`<button class="btn btn-light" data-export-leads>CSV dışa aktar</button><button class="btn" data-open="manual-lead">＋ İşletme ekle</button>`)}
    <article class="card"><div class="card-head"><div><h3>İşletme kayıtları</h3><p>${state.leads.length} kayıt · demo örnekleri açıkça etiketlidir.</p></div><div class="filters-row"><input class="field field-sm" id="lead-filter-q" value="${esc(state.filters.q)}" placeholder="Ad, ilçe veya hizmet ara"><select class="select select-sm" id="lead-filter-industry"><option value="">Tüm sektörler</option>${industryOptions}</select><select class="select select-sm" id="lead-filter-district"><option value="">Tüm ilçeler</option>${districtOptions}</select><select class="select select-sm" id="lead-filter-site"><option value="">Tüm web durumları</option><option value="no" ${state.filters.website==='no'?'selected':''}>Web sitesi yok</option><option value="yes" ${state.filters.website==='yes'?'selected':''}>Web sitesi var</option></select><select class="select select-sm" id="lead-filter-stage"><option value="">Tüm aşamalar</option>${stageOptions}</select></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>İşletme</th><th>Sektör</th><th>İlçe</th><th>Web durumu</th><th>Doğrulama</th><th>Denetim</th><th>Fırsat</th><th>Aşama</th><th>İzin</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="10"><div class="feature-empty"><strong>Sonuç bulunamadı</strong><p>Filtreleri temizleyin veya yeni işletme ekleyin.</p></div></td></tr>'}</tbody></table></div></article>`;
}
function filterLeads() {
  return state.leads.filter(l=>{
    const q=state.filters.q.toLowerCase();
    const matchesQ=!q||[l.name,l.district,l.industry,l.website,l.phone,l.email,l.description,l.evidenceUrl].join(' ').toLowerCase().includes(q);
    return matchesQ&&(!state.filters.industry||l.industryId===state.filters.industry)&&(!state.filters.district||l.district===state.filters.district)&&(!state.filters.website||(state.filters.website==='no'?isNoSite(l):!isNoSite(l)))&&(!state.filters.stage||l.stage===state.filters.stage);
  });
}
function factoryView() {
  const leads=state.leads;
  return `${heading('FREE STARTER SITE','Ücretsiz site oluşturucu','Doğrulama ve fırsat denetiminden sonra işletmeye özel ilk tek sayfalık web taslağını ücretsiz üretin. Domain ve hosting bu MVP’ye dahil değildir.',`<span class="chip">${state.config.hfConfigured?'Hugging Face hazır':state.config.geminiConfigured?'Gemini hazır':'Şablon modu'}</span>`)}
  <div class="grid" style="grid-template-columns:minmax(0,1.25fr) minmax(290px,.75fr);align-items:start"><article class="card"><div class="card-head"><div><h3>1 · İşletme bilgileri</h3><p>Gerçek kayıt veya açıkça etiketlenmiş demo seçin.</p></div><span class="progress-step active">İşletme</span></div><div class="form-field"><label for="factory-lead">CRM işletmesi</label><select class="select" id="factory-lead"><option value="">Listeden seçin…</option>${leads.map(l=>`<option value="${esc(l.id)}">${esc(l.name)} · ${esc(l.district)} ${l.demo?'[DEMO]':l.audit?'[DENETİLDİ]':'[DENETİM GEREKLİ]'}</option>`).join('')}</select></div><div class="site-form-grid" style="margin-top:12px"><div class="form-field"><label>İşletme adı</label><input class="field" id="factory-name" placeholder="Örn. Kıyı Sofrası"></div><div class="form-field"><label>Sektör</label><select class="select" id="factory-industry">${INDUSTRIES.map(i=>`<option value="${i.id}">${esc(industryLabel(i.id))}</option>`).join('')}</select></div><div class="form-field"><label>İlçe</label><select class="select" id="factory-district">${DISTRICTS.map(d=>`<option>${esc(d)}</option>`).join('')}</select></div><div class="form-field"><label>Telefon (isteğe bağlı)</label><input class="field" id="factory-phone" placeholder="İşletme tarafından doğrulanmalı"></div><div class="form-field"><label>E-posta (isteğe bağlı)</label><input class="field" id="factory-email" type="email" placeholder="Doğrulanmış adres"></div><div class="form-field full"><label>Adres (isteğe bağlı)</label><input class="field" id="factory-address" placeholder="İşletme tarafından doğrulanmalı"></div><div class="form-field full"><label>Kısa açıklama</label><textarea class="textarea" id="factory-description" placeholder="Yalnızca işletme tarafından doğrulanmış bilgileri yazın."></textarea></div><div class="form-field full"><label>Hizmetler (virgülle ayırın)</label><input class="field" id="factory-services" placeholder="Hizmet bilgisi işletme tarafından doğrulanmalı"></div></div><div class="consent-box" style="margin-top:14px"><input id="factory-data-confirm" type="checkbox"><span>Bu taslakta kullanacağım bilgilerin kaynağını ve kullanım hakkını doğruladım. Doğrulanmamış yorum, fiyat, çalışma saati veya başarı iddiası eklemeyeceğim.</span></div><div class="form-hint" style="margin-top:10px">Üretim öncesi işletme sahibinden izin alın. Google Places yanıtındaki alanları otomatik saklamayın; kullanım kurallarını kontrol edin.</div></article>
  <aside class="card"><div class="card-head"><div><h3>2 · Ücretsiz ilk site taslağı</h3><p>Tek sayfalık, paylaşılabilir önizleme; hosting/domain değil.</p></div><span class="progress-step">Şablon</span></div><div class="template-grid">${TEMPLATES.map(t=>`<button type="button" class="template-card ${state.selectedTemplate===t.id?'selected':''}" data-template="${t.id}"><div class="template-art ${t.art}"></div><h4>${esc(t.label)}</h4><p>${esc(t.desc)}</p></button>`).join('')}</div><div class="site-actions" style="margin-top:15px"><button class="btn" id="generateSite">Ücretsiz taslağı üret ↗</button><button class="btn btn-light" data-open="manual-lead">İşletme ekle</button></div><p class="form-hint" style="margin-top:10px">Hugging Face önceliklidir; token yoksa Gemini, ikisi de yoksa düzenlenebilir şablon kullanılır. Ücretsiz olan ilk taslak ve önizlemedir; yayın/hosting veya ek hizmet için ayrıca onay gerekir.</p></aside></div>`;
}
function sitesView() {
  return `${heading('TASLAK SİTELER','Önizleme siteleri','Her taslak için paylaşılabilir önizleme bağlantısı üretilir. Bağlantı şifre korumalı değildir; işletme sahibi onayı olmadan resmi site olarak yayımlanmaz.',`<button class="btn" data-nav="factory">＋ Yeni site taslağı</button>`)}<article class="card"><div class="card-head"><div><h3>Üretilen önizlemeler</h3><p>${state.sites.length} taslak</p></div><span class="status status-draft">Yayımlanmadı</span></div><div class="site-list">${state.sites.length?state.sites.map(s=>`<div class="site-list-item"><div class="site-thumb">${esc((s.business?.name||'İ').slice(0,1))}</div><div class="site-list-main"><strong>${esc(s.business?.name||s.content?.title||'İşletme taslağı')} ${demoBadge(s.demo)}</strong><small>${esc(industryLabel(s.business?.industryId))} · ${esc(s.business?.district||'İstanbul')}${s.business?.recommendedPackage?` · Paket: ${esc(s.business.recommendedPackage)}`:''} · ${s.generator==='huggingface'?`Hugging Face · ${esc(s.model||'AI')}`:s.generator==='gemini'?'Gemini taslağı':'Şablon taslağı'}</small></div><span class="status status-draft">Önizleme</span><a class="btn btn-light btn-sm" href="${esc(previewUrlFor(s.slug))}" target="_blank" rel="noopener">Aç ↗</a><button class="btn btn-ghost btn-sm" data-copy-preview="${esc(s.slug)}">Linki kopyala</button></div>`).join(''):'<div class="feature-empty"><span class="empty-icon">✦</span><strong>Henüz site taslağı yok</strong><p>CRM’den bir işletme seçin veya oluşturucudan ilk taslağı üretin.</p><button class="btn" data-nav="factory" style="margin-top:12px">Site oluşturucuya git</button></div>'}</div></article>`;
}
function outreachView() {
  const chosen=leadById(state.activeOutreachLead) || state.leads.find(l=>!l.demo) || state.leads[0];
  return `${heading('İLETİŞİM · MANUEL','İletişim taslakları','Mesaj otomatik gönderilmez. Yalnızca uygun izin/iletişim dayanağı ve insan kontrolüyle kullanın.',`<span class="chip"><i class="dot" style="background:#d19d31"></i>Otomatik gönderim kapalı</span>`)}<div class="crm-layout"><article class="card"><div class="card-head"><div><h3>Önizleme bağlantılı mesaj</h3><p>Türkçe taslak; gönderimden önce düzenleyin ve doğrulayın.</p></div><span class="demo-label">MANUEL ONAY</span></div><div class="form-field"><label>İşletme</label><select class="select" id="outreach-lead">${state.leads.map(l=>`<option value="${esc(l.id)}" ${chosen?.id===l.id?'selected':''}>${esc(l.name)} · ${esc(l.district)} ${l.demo?'[DEMO]':''}</option>`).join('')}</select></div><div class="consent-box" style="margin-top:14px"><input type="checkbox" id="outreach-consent" ${chosen?.contactConsent?'checked':''}><span>Bu işletme için kaydedilmiş iletişim iznini ve iletişim kanalı kapsamını doğruladım. Demo kayıtları engellenir.</span></div><div class="form-field" style="margin-top:14px"><label>Mesaj taslağı</label><textarea id="message-output" class="textarea" style="min-height:180px" placeholder="Önce işletme, denetim ve izin durumunu seçin."></textarea></div><label class="consent-box" style="margin-top:10px"><input type="checkbox" id="outreach-approval"><span>Mesajı son kez okudum; işletme bilgisi ve taslak bağlantısı doğru, gönderici olarak temsil yetkim var.</span></label><div class="site-actions" style="margin-top:12px"><button class="btn" id="make-message">Taslak oluştur</button><button class="btn btn-light" id="copy-message">Mesajı kopyala</button><button class="btn btn-outline" id="open-wa" disabled>WhatsApp’ı aç</button></div><p class="form-hint" style="margin-top:12px">Bu MVP mesaj göndermez. WhatsApp bağlantısı yalnızca kullanıcı tıklarsa açılır; spam veya toplu soğuk mesaj otomasyonu eklenmemiştir.</p></article><aside class="card"><div class="card-head"><div><h3>İletişim kontrolü</h3><p>Önerilen sıra</p></div></div><div class="insight-card"><b>1. Önce taslağı doğrula</b><p>İşletme adı, sektör, ilçe ve önizlemedeki bilgileri kontrol edin.</p></div><div class="insight-card"><b>2. İzin kaydını kontrol et</b><p>Google Maps’te telefon görünmesi, mesaj izni olduğu anlamına gelmez.</p></div><div class="insight-card"><b>3. İnsan onayıyla paylaş</b><p>Mesajı işletme sahibine göndermeden önce içerik, bağlantı ve kapsamı kontrol edin.</p></div><button class="btn btn-light" style="width:100%" data-nav="leads">İşletme izinlerini gör</button></aside></div>`;
}
function settingsView() {
  const place=!!state.config.placesConfigured,gem=!!state.config.geminiConfigured,hf=!!state.config.hfConfigured,d1=state.config.storage==='D1',auth=!!(state.config.authRequired&&state.config.authConfigured);
  return `${heading('YAPILANDIRMA','Ayarlar & bağlantılar','API anahtarları sunucuda kalır. Tarayıcıya veya GitHub’a gizli anahtar koymayın.')}
    <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:15px"><article class="card"><div class="card-head"><div><h3>Google Places API</h3><p>İşletme keşfi için resmi Places Text Search.</p></div><span class="status ${place?'status-has':'status-no'}">${place?'Bağlı':'Yapılandırılmadı'}</span></div><p class="crm-info">Sunucuda <code>GOOGLE_PLACES_API_KEY</code> tanımlandığında arama düğmesi resmi API’ye istek gönderir. Bu prototip Places alanlarını kalıcı CRM’ye yazmaz; yalnızca Place ID saklanabilir istisnasını kullanır. Atıf, görüntüleme, gizlilik ve saklama koşullarını uygulamadan önce doğrulayın.</p><div class="insight-card"><b>Canlı API isteği sayısı</b><p>Seçtiğiniz sektör × ilçe kombinasyonları kadar arama yapılır. API kotası ve ücretleri hesabınıza bağlıdır.</p></div></article><article class="card"><div class="card-head"><div><h3>Hugging Face Inference</h3><p>Türkçe ilk site taslağı için model API'si.</p></div><span class="status ${hf?'status-has':'status-review'}">${hf?'Bağlı':'Worker secret gerekli'}</span></div><p class="crm-info">Worker secret <code>HF_TOKEN</code> için Hugging Face'te Inference Providers izni gerekir. Model: <code>${esc(state.config.hfModel||'Qwen/Qwen3-4B-Instruct-2507:fastest')}</code>. Token tarayıcıya gönderilmez; Hugging Face yapılandırılırsa taslakta ilk tercih olur.</p><div class="insight-card"><b>Çıktı sınırları</b><p>Model sadece doğrulanmış girdilerden Türkçe taslak metin üretir; yayınlamaz ve otomatik iletişim göndermez.</p></div></article><article class="card"><div class="card-head"><div><h3>Gemini içerik üretimi</h3><p>İşletmeye özel Türkçe web sayfası metni.</p></div><span class="status ${gem?'status-has':'status-review'}">${gem?'Bağlı':'Şablon modu'}</span></div><p class="crm-info">Sunucu ortamında <code>GEMINI_API_KEY</code> ve isteğe bağlı <code>GEMINI_MODEL</code> tanımlayın. Anahtar istemci tarafına gönderilmez. Anahtar yoksa gerçek AI çağrısı yapılmaz; düzenlenebilir temel taslak kullanılır.</p><div class="insight-card"><b>İçerik güvenliği</b><p>Fiyat, yorum, puan, çalışma saati, sertifika ve hizmet bilgileri doğrulanmadan üretilmez.</p></div></article><article class="card"><div class="card-head"><div><h3>Veri saklama</h3><p>${d1?'Cloudflare Worker · D1':'Yerel Node.js · JSON dosyası'}</p></div><span class="status ${d1?'status-has':'status-review'}">${d1?'D1':'JSON · demo'}</span></div><p class="crm-info">${d1?'Lead ve site kayıtları D1’de tutulur; API parola girişi ve imzalı 12 saatlik oturum ister. Genel yazma API’leri saatlik 300, canlı keşif günlük 30, AI taslakları günlük 25 istekle sınırlandırılır; login ayrıca D1 tabanlı limitlidir.':'Yerel Node modu data/store.json kullanır ve login içermez; yalnızca geliştirme için kullanın.'} ${d1?'Tek ortak yönetici hesabı vardır; kullanıcı/rol yönetimi, kayıt silme ve kapsamlı saklama politikası ayrıca eklenmelidir.':'Yerel sunucuyu internete açmayın.'}</p></article><article class="card"><div class="card-head"><div><h3>Yönetici erişimi</h3><p>Worker CRM/API koruması.</p></div><span class="status ${auth?'status-has':state.config.authRequired?'status-no':'status-review'}">${auth?'Etkin':state.config.authRequired?'Secret gerekli':'Yerel geliştirme'}</span></div><p class="crm-info">${state.config.authRequired?'Worker secret ADMIN_PASSWORD (16+ karakter) ve SESSION_SECRET (32+ karakter) gerekir. Oturum 12 saat sürer; 10 giriş denemesi/15 dakika, saatlik 300 yazma, günde 30 keşif ve 25 AI taslağı sınırı vardır.':'Yerel Node modunda doğrulama kapalıdır; production için kullanmayın.'}</p></article><article class="card"><div class="card-head"><div><h3>İletişim kanalları</h3><p>WhatsApp API bağlantısı yok.</p></div><span class="status status-no">Kapalı</span></div><p class="crm-info">Mesaj metni hazırlanabilir ve kopyalanabilir. Otomatik veya toplu gönderim yoktur. WhatsApp/İYS/KVKK şartlarını ve gerekli izinleri ayrıca değerlendirin.</p></article></div>`;
}
function viewTitle(view) {
  return ({dashboard:[t('view.dashboard'),t('view.dashboard.sub')],discover:[t('view.discover'),t('view.discover.sub')],leads:[t('view.leads'),t('view.leads.sub')],factory:[t('view.factory'),t('view.factory.sub')],sites:[t('view.sites'),t('view.sites.sub')],outreach:[t('view.outreach'),t('view.outreach.sub')],settings:[t('view.settings'),t('view.settings.sub')],jobs:[t('view.jobs'),t('view.jobs.sub')]})[view]||[t('brand.name'),''];
}
function jobsPanel() {
  const loc = jobLocation();
  const q = jobQuery();
  const selectedSkills = state.jobs.skills || [];
  const industryOptions = INDUSTRIES.map(i => `<option value="${i.id}" ${state.jobs.industryId===i.id?'selected':''}>${esc(industryLabel(i.id))}</option>`).join('');
  const districtOptions = DISTRICTS.map(d => `<option value="${esc(d)}" ${state.jobs.district===d?'selected':''}>${esc(d)}</option>`).join('');
  const skillChips = JOB_SKILLS.map(id => `<button type="button" class="select-chip ${selectedSkills.includes(id)?'selected':''}" data-toggle-skill="${id}">${esc(t('skill.'+id))}</button>`).join('');
  const sources = JOB_SOURCES.map(s => {
    const href = sourceSearchUrl(s);
    return `<article class="job-source-card"><div class="job-source-head"><b>${esc(t('src.'+s.id) || s.id)}</b><span class="demo-label">${esc(t('jobs.applyHint'))}</span></div><p>${esc(t('src.'+s.id+'.blurb'))}</p><a class="btn btn-light btn-sm" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(t('jobs.open'))} ↗</a></article>`;
  }).join('');
  const sampleIds = selectedSkills.length ? selectedSkills.slice(0, 4) : (SKILL_INDUSTRY[state.jobs.industryId] || JOB_SKILLS.slice(0, 4));
  const samples = sampleIds.map((id, i) => {
    const role = t(`skill.${id}`);
    const href = JOB_SOURCES[i % JOB_SOURCES.length].url(`${t(`skillq.${id}`)} ${q}`, loc);
    return `<div class="job-sample"><span class="demo-label">${esc(t('jobs.demo'))}</span><strong>${esc(role)}</strong><small>${esc(loc)}</small><a class="btn btn-ghost btn-sm" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(t('jobs.open'))}</a></div>`;
  }).join('');
  return `${heading(t('jobs.eyebrow'), t('jobs.h1'), t('jobs.p'), `<span class="chip">${esc(t('jobs.count', { n: String(JOB_SOURCES.length) }))}</span>`)}
    <div class="jobs-layout"><aside class="card filter-card"><div class="card-head"><div><h3>${esc(t('jobs.search'))}</h3><p>${esc(t('jobs.sources'))}</p></div></div>
      <div class="form-field"><label>${esc(t('jobs.keyword'))}</label><input class="field" id="jobs-q" value="${esc(state.jobs.q)}" placeholder="${esc(t('search.jobs'))}"></div>
      <div class="form-field" style="margin-top:10px"><label>${esc(t('jobs.industry'))}</label><select class="select" id="jobs-industry"><option value="">${esc(t('jobs.allIndustries'))}</option>${industryOptions}</select></div>
      <div class="form-field" style="margin-top:10px"><label>${esc(t('jobs.district'))}</label><select class="select" id="jobs-district"><option value="">${esc(t('jobs.allDistricts'))}</option>${districtOptions}</select></div>
      <div class="filter-group"><div class="filter-label">${esc(t('jobs.skills'))}</div><div class="chip-grid">${skillChips}</div><p class="form-hint" style="margin-top:8px">${esc(t('jobs.skillsHint'))}</p></div>
      <div style="display:grid;gap:8px;margin-top:14px"><button class="btn" id="run-jobs">${esc(t('jobs.search'))} <span>→</span></button><button class="btn btn-light" id="open-all-jobs">${esc(t('jobs.openFirst'))}</button></div>
      <p class="form-hint" style="margin-top:12px">${esc(t('jobs.notice'))}</p></aside>
      <div class="card search-results-card"><div class="card-head"><div><h3>${esc(t('jobs.results'))}</h3><p>${esc(q || t('jobs.empty'))}</p></div></div>
        <div class="search-mode-note">${esc(t('jobs.demoNote'))}</div>
        <div class="job-samples">${samples}</div>
        <div class="jobs-source-grid">${sources}</div>
      </div></div>`;
}
function jobsPublic() {
  return `<div class="public-page">${publicHeader(`<button class="btn btn-light" data-nav="home">${esc(t('nav.home'))}</button><button class="btn" data-nav="discover">${esc(t('cta.discover'))}</button>`)}<main class="jobs-public">${jobsPanel()}</main><footer class="landing-footer"><span>${esc(t('footer.copy'))}</span><span>${esc(t('jobs.notice'))}</span></footer></div>`;
}
function jobsView() { return jobsPanel(); }
function renderAdmin() {
  const [title,subtitle]=viewTitle(state.view);
  const bodies={dashboard:dashboardView,discover:discoveryView,leads:leadsView,factory:factoryView,sites:sitesView,outreach:outreachView,settings:settingsView,jobs:jobsView};
  root.innerHTML=shell((bodies[state.view]||dashboardView)(),title,subtitle);
  bindViewEvents();
}
function navigate(view) {
  state.view=view;
  const next=new URL(location.href);
  if(view==='home') next.searchParams.delete('view'); else next.searchParams.set('view',view);
  if (LANG) next.searchParams.set('lang', LANG);
  next.hash=''; history.pushState({},'',next);
  render(); window.scrollTo({top:0,behavior:'smooth'});
}
function render() {
  applyDir();
  if(state.view==='home') { root.innerHTML=landing(); return; }
  if(state.view==='jobs' && (!state.config.authRequired || !state.authenticated)) { root.innerHTML=jobsPublic(); bindJobsEvents(); return; }
  if(state.config.authRequired && !state.authenticated) {
    root.innerHTML=loginView();
    $('#login-form')?.addEventListener('submit',submitLogin);
    return;
  }
  renderAdmin();
}
function openModal(title, subtitle, body, footer='') {
  modalRoot.innerHTML=`<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><div><h3>${title}</h3><p>${subtitle||''}</p></div><button class="modal-close" data-close-modal aria-label="Kapat">×</button></header><div class="modal-body">${body}</div>${footer?`<footer class="modal-foot">${footer}</footer>`:''}</section></div>`;
}
function closeModal() { modalRoot.innerHTML=''; }
function manualLeadForm(source='manual') {
  openModal('İşletme kaydı oluştur','Yalnızca kaynağını ve saklama hakkını doğruladığınız alanları ekleyin.',`<form id="manual-lead-form"><div class="site-form-grid"><div class="form-field"><label>İşletme adı *</label><input name="name" class="field" required maxlength="140" placeholder="İşletme adı"></div><div class="form-field"><label>Sektör *</label><select name="industryId" class="select">${INDUSTRIES.map(i=>`<option value="${i.id}">${esc(industryLabel(i.id))}</option>`).join('')}</select></div><div class="form-field"><label>İlçe *</label><select name="district" class="select">${DISTRICTS.map(d=>`<option>${esc(d)}</option>`).join('')}</select></div><div class="form-field"><label>Web sitesi (isteğe bağlı)</label><input name="website" class="field" placeholder="https://"></div><div class="form-field"><label>Telefon (isteğe bağlı)</label><input name="phone" class="field" placeholder="İşletme tarafından doğrulansın"></div><div class="form-field"><label>E-posta (isteğe bağlı)</label><input name="email" type="email" class="field" placeholder="name@example.com"></div><div class="form-field full"><label>Adres (isteğe bağlı)</label><input name="address" class="field" placeholder="İşletme tarafından sağlandıysa"></div><div class="form-field full"><label>İşletme açıklaması / hizmetler (isteğe bağlı)</label><textarea name="description" class="textarea" placeholder="Sadece doğrulanmış bilgiler."></textarea></div><div class="form-field full"><label>Kaynak bağlantısı (isteğe bağlı)</label><input name="evidenceUrl" type="url" class="field" placeholder="https://… · izinli/uygun bir kaynak"></div></div><label class="consent-box" style="margin-top:12px"><input type="checkbox" name="dataRightsConfirmed" required><span>Bu bilgileri CRM’de saklamak ve taslakta kullanmak için uygun kaynağa/kullanım hakkına sahibim. Google Places verilerini izinsiz kopyalamıyorum.</span></label><label class="consent-box" style="margin-top:9px"><input type="checkbox" name="contactConsent"><span>İşletme sahibinden iletişim izni aldım ve izin kaydını tutuyorum. Bu kutu varsayılan olarak boştur; işaretlemek gerçek iznin kanıtı değildir.</span></label></form>`,`<button class="btn btn-light" data-close-modal>Vazgeç</button><button class="btn" form="manual-lead-form">Kaydı oluştur</button>`);
}
function siteForm(lead=null) {
  const l=lead||{};
  if (l.industryId) state.selectedTemplate=l.industryId;
  const packageNote=l.audit?.packageRecommendation?`<div class="insight-card"><b>Denetim önerisi · ${esc(l.audit.packageRecommendation.name)}</b><p>${esc(l.audit.packageRecommendation.reason)} İş kapsamı ve fiyat bu prototipte belirlenmez.</p></div>`:l.demo?'<div class="insight-card"><b>Sentetik demo taslağı</b><p>Bu içerik gerçek bir işletme veya audit sonucu değildir.</p></div>':'';
  openModal('Ücretsiz web sitesi taslağı oluştur','İlk tek sayfalık taslak ve önizleme ücretsizdir; yayın, domain, hosting veya bakım kapsamı varsa ayrıca ve önceden onaylanır.',`<form id="site-form" data-lead-id="${esc(l.id||'')}">${packageNote}<div class="form-field"><label>Şablon</label><div class="template-grid" style="grid-template-columns:repeat(2,1fr);max-height:270px;overflow:auto">${TEMPLATES.map(t=>`<button type="button" class="template-card ${state.selectedTemplate===t.id?'selected':''}" data-template="${t.id}"><div class="template-art ${t.art}" style="height:75px"></div><h4>${esc(t.label)}</h4><p>${esc(t.desc)}</p></button>`).join('')}</div></div><div class="site-form-grid" style="margin-top:14px"><div class="form-field"><label>İşletme adı *</label><input class="field" name="name" required value="${esc(l.name||'')}"></div><div class="form-field"><label>Sektör</label><select class="select" name="industryId">${INDUSTRIES.map(i=>`<option value="${i.id}" ${l.industryId===i.id?'selected':''}>${esc(industryLabel(i.id))}</option>`).join('')}</select></div><div class="form-field"><label>İlçe</label><select class="select" name="district">${DISTRICTS.map(d=>`<option ${l.district===d?'selected':''}>${esc(d)}</option>`).join('')}</select></div><div class="form-field"><label>Telefon</label><input class="field" name="phone" value="${esc(l.phone||'')}" placeholder="İşletme tarafından doğrulanmalı"></div><div class="form-field"><label>E-posta</label><input class="field" name="email" type="email" value="${esc(l.email||'')}" placeholder="Doğrulanmış adres"></div><div class="form-field full"><label>Adres</label><input class="field" name="address" value="${esc(l.address||'')}" placeholder="İşletme tarafından doğrulanmalı"></div><div class="form-field full"><label>Kısa açıklama</label><textarea class="textarea" name="description" placeholder="Doğrulanmış bilgilerle doldurun.">${esc(l.description||'')}</textarea></div><div class="form-field full"><label>Hizmetler (virgülle ayırın)</label><input class="field" name="services" value="${esc((l.services||[]).join(', '))}" placeholder="Bilgileri işletme doğrulamalı"></div></div><label class="consent-box" style="margin-top:12px"><input type="checkbox" name="dataRightsConfirmed" ${l.demo||l.dataRightsConfirmed?'checked':''} ${l.demo||l.dataRightsConfirmed?'':'required'}><span>${l.demo?'Bu sentetik demo kaydıdır.':'Taslakta kullanacağım işletme bilgilerinin kaynağını ve kullanım hakkını doğruladım.'} İçerik taslaktır; işletme sahibi yayından önce doğrulamalıdır.</span></label><input type="hidden" name="demo" value="${l.demo?'true':'false'}"></form>`,`<button class="btn btn-light" data-close-modal>Vazgeç</button><button class="btn" form="site-form">Taslağı oluştur ↗</button>`);
}
function bindJobsEvents() {
  const sync = () => {
    state.jobs.q = $('#jobs-q')?.value || '';
    state.jobs.industryId = $('#jobs-industry')?.value || '';
    state.jobs.district = $('#jobs-district')?.value || '';
  };
  $('#jobs-q')?.addEventListener('change', sync);
  $('#jobs-industry')?.addEventListener('change', e => {
    state.jobs.industryId = e.target.value;
    if (e.target.value && !(state.jobs.skills || []).length) state.jobs.skills = [...(SKILL_INDUSTRY[e.target.value] || [])];
    render();
  });
  $('#jobs-district')?.addEventListener('change', e => { state.jobs.district = e.target.value; render(); });
  $$('[data-toggle-skill]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.toggleSkill;
    const cur = new Set(state.jobs.skills || []);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    state.jobs.skills = [...cur];
    render();
  }));
  $('#run-jobs')?.addEventListener('click', () => { sync(); state.jobs.ran = true; render(); toast(t('jobs.notice'), 'warn'); });
  $('#open-all-jobs')?.addEventListener('click', () => {
    sync();
    window.open(sourceSearchUrl(JOB_SOURCES[0]), '_blank', 'noopener');
    window.open(sourceSearchUrl(JOB_SOURCES[1]), '_blank', 'noopener');
  });
}
function bindViewEvents() {
  bindJobsEvents();
  // Controlled filters
  const q=$('#lead-filter-q'); if(q)q.addEventListener('input',e=>{state.filters.q=e.target.value;const pos=e.target.selectionStart;renderAdmin();const next=$('#lead-filter-q');next?.focus();next?.setSelectionRange(pos,pos);});
  ['industry','district','site','stage'].forEach(k=>{const el=$(`#lead-filter-${k}`);if(el)el.addEventListener('change',e=>{state.filters[k]=e.target.value;renderAdmin()})});
  $$('[data-stage]').forEach(el=>el.addEventListener('change',async e=>{try{await api(`/api/leads/${encodeURIComponent(el.dataset.stage)}`,{method:'PATCH',body:JSON.stringify({stage:e.target.value})});await refreshData();toast('CRM aşaması güncellendi.')}catch(err){await refreshData();render();toast(err.message,'error')}}));
  $('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){state.filters.q=e.target.value;navigate('leads')}});
  $('#runDiscovery')?.addEventListener('click',runDiscovery);
  $$('[data-toggle-industry]').forEach(el=>el.onclick=()=>{const id=el.dataset.toggleIndustry;state.selectedIndustries=state.selectedIndustries.includes(id)?state.selectedIndustries.filter(x=>x!==id):[...state.selectedIndustries,id];renderAdmin()});
  $$('[data-toggle-district]').forEach(el=>el.onclick=()=>{const d=el.dataset.toggleDistrict;state.selectedDistricts=state.selectedDistricts.includes(d)?state.selectedDistricts.filter(x=>x!==d):[...state.selectedDistricts,d];renderAdmin()});
  $$('[data-select-all]').forEach(el=>el.onclick=()=>{const target=el.dataset.selectAll;if(target==='industries')state.selectedIndustries=state.selectedIndustries.length===INDUSTRIES.length?[]:INDUSTRIES.map(x=>x.id);else state.selectedDistricts=state.selectedDistricts.length===DISTRICTS.length?[]:[...DISTRICTS];renderAdmin()});
  $('#exportDiscovery')?.addEventListener('click',()=>{if(state.discovery.some(x=>x.source==='google-places')){toast('Google Places sonuçları bu uygulamadan dışa aktarılamaz; Google kullanım kurallarını izleyin.','warn');return}exportCsv(state.discovery,'istanbul-discovery.csv')});
  $$('[data-result-action="save"]').forEach(el=>el.onclick=()=>{const item=state.discovery[Number(el.dataset.resultIndex)];if(item?.source==='google-places'){if(item.mapsUrl)window.open(item.mapsUrl,'_blank','noopener');toast('Google Places kaydı CRM’ye aktarılmadı; yalnızca harita bağlantısı açıldı.','warn')}else saveDemoResult(item)});
  $('#manual-lead-form')?.addEventListener('submit',submitManualLead);
  $('#site-form')?.addEventListener('submit',submitSite);
  $('#generateSite')?.addEventListener('click',()=>{const id=$('#factory-lead')?.value;const lead=leadById(id);if(!lead){toast('Önce CRM’den işletme seçin.','warn');return}if(!lead.demo&&(!lead.verifiedAt||!lead.audit)){toast('Gerçek taslak öncesi kaynak doğrulaması ve fırsat denetimi gerekli.','warn');showLeadDetails(lead.id);return}const confirmed=lead.demo||$('#factory-data-confirm')?.checked===true;if(!confirmed){toast('Gerçek işletme verisi için kaynak/kullanım hakkını doğrulayın.','warn');return}const edited={...lead,name:$('#factory-name').value.trim()||lead.name,industryId:$('#factory-industry').value,district:$('#factory-district').value,phone:$('#factory-phone').value,email:$('#factory-email').value,address:$('#factory-address').value,description:$('#factory-description').value,services:($('#factory-services').value||'').split(/,|،/).map(x=>x.trim()).filter(Boolean),dataRightsConfirmed:confirmed};siteForm(edited)});
  $('#factory-lead')?.addEventListener('change',e=>{const l=leadById(e.target.value);if(!l)return;$('#factory-name').value=l.name;$('#factory-industry').value=l.industryId;$('#factory-district').value=l.district;$('#factory-phone').value=l.phone||'';$('#factory-email').value=l.email||'';$('#factory-address').value=l.address||'';$('#factory-description').value=l.description||'';$('#factory-services').value=(l.services||[]).join(', ');$('#factory-data-confirm').checked=!!l.demo});
  $('#factory-industry')?.addEventListener('change',e=>{state.selectedTemplate=e.target.value;$$('[data-template]').forEach(x=>x.classList.toggle('selected',x.dataset.template===state.selectedTemplate))});
  $$('[data-template]').forEach(el=>el.onclick=()=>{state.selectedTemplate=el.dataset.template;$$('[data-template]').forEach(x=>x.classList.toggle('selected',x.dataset.template===state.selectedTemplate));const sel=$('#factory-industry');if(sel)sel.value=state.selectedTemplate});
  $('#make-message')?.addEventListener('click',makeMessage);
  $('#copy-message')?.addEventListener('click',()=>{if(!$('#outreach-approval')?.checked){toast('Metni okuduktan sonra insan onayını işaretleyin.','warn');return}copyText($('#message-output')?.value||'')});
  $('#outreach-lead')?.addEventListener('change',e=>{state.activeOutreachLead=e.target.value;const lead=leadById(e.target.value);if($('#outreach-consent'))$('#outreach-consent').checked=!!lead?.contactConsent;$('#message-output').value='';$('#outreach-approval').checked=false;$('#open-wa').disabled=true});
  $('#message-output')?.addEventListener('input',()=>{if($('#outreach-approval'))$('#outreach-approval').checked=false});
  $('#outreach-consent')?.addEventListener('change',async e=>{const lead=leadById($('#outreach-lead').value);if(!lead)return;if(lead.demo&&e.target.checked){e.target.checked=false;toast('Demo kaydına gerçek izin atanamaz.','warn');return}try{await api(`/api/leads/${encodeURIComponent(lead.id)}`,{method:'PATCH',body:JSON.stringify({contactConsent:e.target.checked})});await refreshData();toast(e.target.checked?'İzin durumu kaydedildi.':'İzin kaldırıldı.')}catch(err){toast(err.message,'error')}});
  $('#open-wa')?.addEventListener('click',openWhatsAppDraft);
  $$('[data-export-leads]').forEach(el=>el.onclick=()=>exportCsv(state.leads,'istanbul-crm.csv'));
}
async function runDiscovery() {
  const pairs=[];for(const industryId of state.selectedIndustries)for(const district of state.selectedDistricts)pairs.push({industryId,district});
  if(!pairs.length){toast('En az bir sektör ve ilçe seçin.','warn');return}
  if(state.config.placesConfigured && pairs.length>10){toast('Canlı arama bir istekte en fazla 10 sektör/ilçe kombinasyonuyla sınırlandırıldı. Seçimi daraltın; 100 aramayı tek seferde çalıştırmayın.','warn');return}
  if(state.config.placesConfigured){const ok=window.confirm(`${pairs.length} Google Places arama isteği gönderilecek. Kota/ücret oluşabilir. Sonuçlar geçici gösterilecek; CRM’ye otomatik kaydedilmeyecek. Devam edilsin mi?`);if(!ok)return}
  const button=$('#runDiscovery');if(button){button.disabled=true;button.textContent='Aranıyor…'}
  const resultsBox=$('#discovery-results'); if(resultsBox)resultsBox.innerHTML='<div class="feature-empty"><div class="loader"></div><strong>Arama çalışıyor…</strong></div>';
  try{const data=await post('/api/discover',{pairs,onlyNoWebsite:$('#onlyNoWebsite')?.checked!==false});state.discovery=data.items||[];renderAdmin();const summary=$('#discovery-summary');if(summary)summary.textContent=`${data.count||state.discovery.length} sonuç · ${data.mode==='demo'?'sentetik demo':'Google Places oturum sonucu'}`;toast(data.notice||`${state.discovery.length} sonuç alındı.`,data.mode==='demo'?'warn':'');}
  catch(err){toast(err.message,'error');if(resultsBox)resultsBox.innerHTML=`<div class="feature-empty"><strong>Arama tamamlanamadı</strong><p>${esc(err.message)}</p></div>`}
  finally{const b=$('#runDiscovery');if(b)b.disabled=false}
}
async function saveDemoResult(item) {
  if(!item)return;
  try{const data=await post('/api/leads',{name:item.name,industryId:item.industryId,district:item.district,website:item.website||'',source:'demo',demo:true,dataRightsConfirmed:true});await refreshData();toast('Sentetik demo kaydı CRM’ye eklendi.','warn');navigate('leads')}
  catch(err){toast(err.message,'error')}
}
async function submitManualLead(e) {
  e.preventDefault();const form=e.target,fd=new FormData(form);
  const body={name:fd.get('name'),industryId:fd.get('industryId'),district:fd.get('district'),website:fd.get('website'),phone:fd.get('phone'),email:fd.get('email'),address:fd.get('address'),description:fd.get('description'),evidenceUrl:fd.get('evidenceUrl'),dataRightsConfirmed:fd.get('dataRightsConfirmed')==='on',contactConsent:fd.get('contactConsent')==='on'};
  try{await post('/api/leads',body);closeModal();await refreshData();toast('İşletme CRM’ye eklendi. İletişim izni varsayılan olarak kapalıdır.');navigate('leads')}
  catch(err){toast(err.message,'error')}
}
async function submitSite(e) {
  e.preventDefault();const form=e.target,fd=new FormData(form);const leadId=form.dataset.leadId||'';const services=String(fd.get('services')||'').split(/,|،/).map(x=>x.trim()).filter(Boolean);
  const business={name:fd.get('name'),industryId:fd.get('industryId'),district:fd.get('district'),phone:fd.get('phone'),email:fd.get('email'),address:fd.get('address'),description:fd.get('description'),services};
  const lead=leadById(leadId);const demo=fd.get('demo')==='true';
  if(!demo&&fd.get('dataRightsConfirmed')!=='on'){toast('İşletme verisinin kaynağını ve kullanım hakkını doğrulayın.','warn');return}
  try{const result=await post('/api/sites',{business,leadId,demo,templateId:state.selectedTemplate,dataRightsConfirmed:fd.get('dataRightsConfirmed')==='on'});closeModal();await refreshData();toast(result.generator==='huggingface'?'Hugging Face modeliyle taslak oluşturuldu.':result.generator==='gemini'?'Gemini ile site taslağı oluşturuldu.':'Şablon taslağı oluşturuldu; AI sağlayıcısı bağlı değil.',result.generator==='template-demo'?'warn':'');navigate('sites');window.open(workerUrl(result.previewUrl),'_blank','noopener')}
  catch(err){toast(err.message,'error')}
}
async function makeMessage() {
  const lead=leadById($('#outreach-lead')?.value);if(!lead)return toast('İşletme seçin.','warn');
  if(lead.demo)return toast('Demo işletmeye gerçek mesaj oluşturulmaz.','warn');
  if(!lead.verifiedAt||!lead.audit)return toast('Önce CRM’de kaynak doğrulaması ve fırsat denetimini tamamlayın.','warn');
  if(!lead.contactConsent||!$('#outreach-consent')?.checked)return toast('Önce gerçek iletişim iznini doğrulayın ve kaydedin.','warn');
  try{const result=await post('/api/message-draft',{leadId:lead.id});$('#message-output').value=result.message;$('#outreach-approval').checked=false;$('#open-wa').disabled=!lead.phone;toast('Mesaj taslağı hazır. Önce metni gözden geçirin; gönderim otomatik değildir.','warn')}
  catch(err){toast(err.message,'error')}
}
function openWhatsAppDraft() {
  const lead=leadById($('#outreach-lead')?.value);const text=$('#message-output')?.value||'';
  if(!lead?.phone||!lead.contactConsent||!lead.verifiedAt||!lead.audit||!text||!$('#outreach-approval')?.checked){toast('Doğrulanmış, denetlenmiş ve izinli kayıtla birlikte son mesaj/gönderici onayı gerekli.','warn');return}
  let phone=lead.phone.replace(/\D/g,'');if(phone.startsWith('0'))phone='90'+phone.slice(1);if(!phone)return toast('Telefon biçimini kontrol edin.','warn');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener');
}
async function submitLogin(e) {
  e.preventDefault();
  const button=$('#login-form button[type="submit"]'), original=button?.textContent;
  if(button){button.disabled=true;button.textContent=t('login.busy')}
  try {
    const result=await post('/api/auth/login',{password:$('#admin-password')?.value||''});
    sessionToken=result.token;sessionStorage.setItem('iwf_session',sessionToken);state.authenticated=true;
    await api('/api/auth/session');await refreshData();render();toast(t('login.ok'));
  } catch(err) { toast(err.message,'error'); }
  finally { if(button){button.disabled=false;button.textContent=original||`${t('login.submit')} →`} }
}
async function refreshData() {
  const [leads,sites,health]=await Promise.all([api('/api/leads'),api('/api/sites'),api('/api/health')]);
  state.leads=leads.items||[];state.sites=sites.items||[];state.config=health;
}
function exportCsv(rows,name) {
  const cols=['name','industry','district','website','websiteStatus','evidenceUrl','verifiedAt','auditScore','packageRecommendation','stage','contactConsent','consentAt','source'];
  const value=(r,k)=>k==='industry'?industryLabel(r.industryId):k==='auditScore'?(r.audit?.opportunityScore??''):k==='packageRecommendation'?(r.audit?.packageRecommendation?.name??''):r[k]??'';
  const lines=[cols.join(','),...rows.map(r=>cols.map(k=>`"${String(value(r,k)).replaceAll('"','""')}"`).join(','))];
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function copyText(text) { if(!text)return toast('Kopyalanacak içerik yok.','warn');try{await navigator.clipboard.writeText(text);toast('Kopyalandı.')}catch{const input=document.createElement('textarea');input.value=text;document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();toast('Kopyalandı.')} }
function showLeadDetails(id) {
  const l=leadById(id);if(!l)return;
  const site=l.siteSlug?siteBySlug(l.siteSlug):null;
  const audit=l.audit;
  const canGenerate=l.demo||Boolean(l.verifiedAt&&audit);
  const auditPanel=audit?`<div class="audit-report"><div class="audit-report-head"><div><span class="eyebrow">KURAL TABANLI DENETİM</span><h4>${esc(audit.packageRecommendation?.name||'Öneri hazırlanıyor')}</h4></div><span class="score-pill">${audit.opportunityScore}/100</span></div><div class="audit-metrics"><div><strong>${audit.completenessScore}%</strong><small>Kayıt bütünlüğü</small></div><div><strong>${audit.confidenceScore}%</strong><small>Kaynak güveni</small></div><div><strong>${audit.websiteStatus==='website-not-recorded'?'Site kaydı yok':'Site URL’si var'}</strong><small>İşletme sahibi doğrulamalı</small></div></div><p>${esc(audit.nextAction)}</p><div class="audit-includes">${(audit.packageRecommendation?.includes||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><small class="form-hint">${esc(audit.method)} ${audit.demo?'<b>· DEMO</b>':''}</small></div>`:`<div class="audit-empty"><strong>Henüz fırsat denetimi yapılmadı</strong><p>Kaynak doğrulamasından sonra kayıt bütünlüğü, web durumu ve uygun başlangıç paketi puanlanır. Bu prototip harici SEO taraması yapmaz.</p></div>`;
  openModal(esc(l.name),`${esc(industryLabel(l.industryId))} · ${esc(l.district)} ${demoBadge(l.demo)}`,`<div class="lead-audit-layout"><div class="lead-audit-summary"><div class="lead-audit-tile"><span>WEB DURUMU</span><strong>${isNoSite(l)?'Adres kayıtlı değil':'Web adresi var'}</strong></div><div class="lead-audit-tile"><span>FIRSAT PUANI</span><strong>${opportunity(l)} <small>/100</small></strong></div><div class="lead-audit-tile"><span>CRM AŞAMASI</span><select class="select" id="detail-stage">${STAGES.map(s=>`<option ${l.stage===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="lead-audit-tile"><span>İLETİŞİM İZNİ</span><strong class="consent-state ${l.contactConsent?'yes':'no'}">${l.contactConsent?'Kayıtlı':'Kayıtlı değil'}</strong></div></div><section class="card verification-card"><div class="card-head"><div><h3>1 · Kaynağı doğrula</h3><p>Kaynağı saklayın; işletme ve web durumu için insan kontrolü gereklidir.</p></div><span class="status ${l.verifiedAt?'status-has':'status-review'}">${l.verifiedAt?'Doğrulandı':'Kontrol bekliyor'}</span></div><div class="form-field"><label>Kanıt / kaynak URL’si</label><input id="detail-evidence" type="url" class="field" value="${esc(l.evidenceUrl||'')}" placeholder="https://izinli-kaynak.example"><small class="form-hint">Resmî işletme sitesi veya kullanım hakkınız olan kaynak. Google Places içeriğini kopyalamayın.</small></div><label class="consent-box" style="margin-top:12px"><input id="detail-verified" type="checkbox" ${l.verifiedAt?'checked':''} ${l.demo?'disabled':''}><span>${l.demo?'Demo kayıt doğrulanmış işletme değildir.':`Kaynak bağlantısındaki işletmeyi ve “web sitesi yok” durumunu kendim kontrol ettim${l.verifiedAt?` · ${new Date(l.verifiedAt).toLocaleDateString('tr-TR')}`:''}.`}</span></label></section><section class="card audit-card"><div class="card-head"><div><h3>2 · Denetle, puanla, öner</h3><p>Kaynağa dayalı fırsat görünümü ve önerilen başlangıç paketi.</p></div><span class="tag">${audit?new Date(audit.checkedAt).toLocaleDateString('tr-TR'):'Denetim bekliyor'}</span></div>${auditPanel}</section><section class="card"><div class="card-head"><div><h3>İşletme bilgisi</h3><p>Yalnızca işletme tarafından doğrulanmış içeriği taslağa taşıyın.</p></div></div><p class="crm-info">${esc(l.description||'Açıklama eklenmedi. Taslakta doğrulanmamış bilgi kullanılmamalıdır.')}</p><div class="lead-facts"><span>${esc(l.phone||'Telefon yok')}</span><span>${esc(l.email||'E-posta yok')}</span><span>${esc(l.address||'Adres yok')}</span>${l.evidenceUrl?`<a href="${esc(l.evidenceUrl)}" target="_blank" rel="noopener noreferrer">Kaynağı aç ↗</a>`:''}</div><div class="form-field" style="margin-top:12px"><label>Not</label><textarea id="detail-notes" class="textarea">${esc(l.notes||'')}</textarea></div></section></div>`,`<button class="btn btn-light" data-close-modal>Kapat</button><button class="btn btn-light" id="detail-save">Doğrulamayı kaydet</button><button class="btn" id="run-audit">Denetle & puanla</button>${site?`<a class="btn btn-light" href="${esc(previewUrlFor(site.slug))}" target="_blank" rel="noopener">Önizleme ↗</a>`:''}<button class="btn btn-outline" data-generate-from="${esc(l.id)}" ${canGenerate?'':'disabled'}>${l.demo?'Demo taslak oluştur':canGenerate?'Web sitesi taslağı oluştur':'Önce doğrula ve denetle'}</button>`);
  $('#detail-save')?.addEventListener('click',async()=>{try{await api(`/api/leads/${encodeURIComponent(l.id)}`,{method:'PATCH',body:JSON.stringify({stage:$('#detail-stage').value,notes:$('#detail-notes').value,evidenceUrl:$('#detail-evidence').value,verified:$('#detail-verified').checked})});await refreshData();showLeadDetails(id);toast('Kaynak ve doğrulama durumu kaydedildi.')}catch(err){toast(err.message,'error')}});
  $('#run-audit')?.addEventListener('click',async()=>{try{await api(`/api/leads/${encodeURIComponent(l.id)}`,{method:'PATCH',body:JSON.stringify({stage:$('#detail-stage').value,notes:$('#detail-notes').value,evidenceUrl:$('#detail-evidence').value,verified:$('#detail-verified').checked})});await api(`/api/leads/${encodeURIComponent(l.id)}/audit`,{method:'POST',body:JSON.stringify({})});await refreshData();showLeadDetails(id);toast('Denetim tamamlandı; paket önerisi güncellendi.')}catch(err){toast(err.message,'error')}});
}
function bindGlobalEvents() {
  document.addEventListener('change', e => {
    const sel = e.target.closest('[data-lang-select]');
    if (sel) setLang(sel.value);
  });
  document.addEventListener('click',e=>{
    const langBtn=e.target.closest('[data-lang]'); if(langBtn){ e.preventDefault(); setLang(langBtn.dataset.lang); return; }
    const skillGo=e.target.closest('[data-skill-go]'); if(skillGo){ const id=skillGo.dataset.skillGo; const cur=new Set(state.jobs.skills||[]); cur.add(id); state.jobs.skills=[...cur]; navigate('jobs'); return; }
    const srcBtn=e.target.closest('[data-open-source]'); if(srcBtn){ const src=JOB_SOURCES.find(s=>s.id===srcBtn.dataset.openSource); if(src) window.open(sourceSearchUrl(src),'_blank','noopener'); return; }
    const logout=e.target.closest('[data-logout]');if(logout){sessionToken='';sessionStorage.removeItem('iwf_session');state.authenticated=false;state.leads=[];state.sites=[];navigate('home');toast(t('logout.ok'));return}
    const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();navigate(nav.dataset.nav);return}
    const closeTarget=e.target.closest('[data-close-modal]');if(closeTarget){if(closeTarget.classList.contains('modal-backdrop')){if(e.target===closeTarget){closeModal();return}}else{closeModal();return}}
    const template=e.target.closest('[data-template]');if(template){state.selectedTemplate=template.dataset.template;$$('[data-template]').forEach(x=>x.classList.toggle('selected',x.dataset.template===state.selectedTemplate));const sel=$('#factory-industry');if(sel)sel.value=state.selectedTemplate;return}
    const open=e.target.closest('[data-open]');if(open){if(open.dataset.open==='request')manualLeadForm();else if(open.dataset.open==='manual-lead')manualLeadForm();return}
    const row=e.target.closest('[data-open-lead]');if(row){showLeadDetails(row.dataset.openLead);return}
    const preview=e.target.closest('[data-copy-preview]');if(preview){copyText(previewUrlFor(preview.dataset.copyPreview));return}
    const generate=e.target.closest('[data-generate-from]');if(generate){siteForm(leadById(generate.dataset.generateFrom));return}
  });
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);state.view=p.get('view')||'home';const lang=p.get('lang');if(lang&&I18N[lang])LANG=lang;render()});
}
async function boot() {
  applyDir();
  try {
    const [meta,health]=await Promise.all([api('/api/meta'),api('/api/health')]);
    if(meta.industries?.length) INDUSTRIES.splice(0,INDUSTRIES.length,...meta.industries);
    if(meta.stages?.length) STAGES.splice(0,STAGES.length,...meta.stages);
    state.config=health;
    if(!health.authRequired) {
      sessionToken='';sessionStorage.removeItem('iwf_session');state.authenticated=true;await refreshData();
    } else if(sessionToken) {
      try { await api('/api/auth/session');state.authenticated=true;await refreshData(); }
      catch { sessionToken='';sessionStorage.removeItem('iwf_session');state.authenticated=false; }
    }
  } catch(err) { state.config={authRequired:true,authConfigured:false};state.authenticated=false;console.error(err); }
  bindGlobalEvents();render();
}

// Modal form and view-specific forms use delegated submit listeners so rerendering stays simple.
document.addEventListener('submit',e=>{
  if(e.target.id==='manual-lead-form'){submitManualLead(e)}
  if(e.target.id==='site-form'){submitSite(e)}
});
boot();
