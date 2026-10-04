# İstanbul Web Atölyesi

Türkçe bir İstanbul lead-discovery ve web taslağı MVP'si. Ana sayfa, İstanbul işletmelerini anında keşfetme ve her uygun işletmeye ücretsiz, işletmeye özel ilk web sitesi taslağı sunma akışını anlatır.

**Ücretsiz teklifin kapsamı:** tek sayfalık ilk taslak ve paylaşılabilir önizleme. Domain, kalıcı hosting, yayına alma ve bakım dahil değildir; ayrıca sunulacaksa kapsam/ücret önceden açıklanmalı ve işletme sahibi onaylamalıdır.

Bu uygulama, Adv-seo-2 projesindeki ürün akışlarından özellik düzeyinde yararlanılarak ayrı bir uygulama olarak yazıldı; kaynak dosyaları kopyalanmadı. İncelenen GitHub deposunda açık bir MIT/Apache lisansı doğrulanmadı. Bu nedenle doğrudan kaynak kod uyarlaması veya o projenin lisans koşulları hakkında varsayım yapılmamalıdır.

## Ürün akışı

1. **Keşif:** 10 sektör × 10 İstanbul ilçesinde sentetik demo araması veya isteğe bağlı sunucu tarafı Google Places Text Search.
2. **Kaynak doğrulaması:** Operatör, uygun bir kaynak URL'si üzerinden işletmeyi ve web sitesi durumunu kontrol eder.
3. **Denetim ve puanlama:** Kayıt bütünlüğü ile fırsat puanı için kural tabanlı iç rapor ve başlangıç paketi önerisi üretir. Bu, canlı SEO taraması veya satış garantisi değildir.
4. **Ücretsiz ilk site taslağı:** Doğrulanmış alanlardan tek sayfalık, düzenlenebilir bir taslak ve paylaşılabilir önizleme üretir. Varsayılan AI sağlayıcısı Hugging Face Inference Providers; token yoksa isteğe bağlı Gemini, o da yoksa temel şablon kullanılır.
5. **İzinli, insan onaylı iletişim:** Gerçek kayıtlar için doğrulama, denetim ve kaydedilmiş iletişim izni olmadan mesaj taslağı oluşturulmaz. Gönderim otomatik değildir; son içerik ve yetki kontrolü operatördedir.

Demo işletmeler ve keşif sonuçları **sentetiktir**; gerçek işletme veya Google Maps kaydı değildir. Demo kayıtları gerçek işletme gibi doğrulanamaz ve demo için gerçek iletişim izni atanamaz.

## Teknoloji ve çalışma modları

- **Yerel Node modu:** `server.mjs` ve `data/store.json`; yalnızca yerel geliştirme ve UI denemeleri için. Yönetici girişi yoktur; internete açmayın.
- **Cloudflare modu:** `worker/index.mjs`, Workers Static Assets ve D1. Worker API'sinde ortak yönetici parolası, 12 saatlik imzalı oturum, D1 tabanlı istek limitleri ve GitHub Pages için izin listeli CORS vardır.
- **GitHub Pages:** public frontend'in statik kopyasıdır; D1/API ve önizlemeler Cloudflare Worker'da kalır. Worker URL'si Pages build sırasında konfigüre edilir. GitHub Pages'te gizli anahtar bulunmaz.
- **AI:** Hugging Face Inference API Worker tarafından sunucu tarafında çağrılır; ayrı bir Hugging Face Space bu entegrasyon için gerekli değildir. İstersen daha sonra bağımsız bir Space eklenebilir.

## Yerel Node modunda çalıştırma

Yerel sunucu Node.js 20 veya üstüyle çalışır; güncel Wrangler v4 için Node.js 22+ gerekir (`.nvmrc` 22'yi seçer). Uygulamanın runtime'ında harici npm paketi kullanılmaz.

```bash
npm run dev
```

`http://localhost:4173` adresini açın. İlk çalıştırmada yerel JSON deposunda sentetik demo kayıtları oluşturulur. Node modu giriş doğrulaması yapmaz.

## Cloudflare Worker + D1 — yerel deneme

İlk kullanımda `npx` Wrangler internetten indirilir. Önce migration'ları çalıştırıp D1 tablolarını oluşturun, sonra Worker'ı başlatın:

```bash
npm run d1:migrate:local
npm run dev:worker
```

Varsayılan Worker adresi `http://localhost:8787` olur. Sır içermeyen local Worker değerleri için `.dev.vars.example` dosyasını `.dev.vars` olarak kopyalayın; gerçek değerleri `.dev.vars` veya repoya eklemeyin.

Yerel Worker API'sinde protected endpoint'leri test etmek için `.dev.vars` içine **yalnızca test amaçlı** `ADMIN_PASSWORD` ve `SESSION_SECRET` verin. Yönetici parolası en az 16 karakter, `SESSION_SECRET` en az 32 karakter olmalıdır. Bu dosya `.gitignore` içindedir.

## Hugging Face AI

Taslak üretimi, `https://router.huggingface.co/v1/chat/completions` üzerinden Hugging Face Inference Providers'a gider. Başlangıç modeli `Qwen/Qwen3-4B-Instruct-2507:fastest` olarak ayarlanmıştır; model kimliği `wrangler.jsonc` içindeki `HF_MODEL` ile değiştirilebilir. Bu model çok dilli metin üretimi için tasarlanmıştır; model ve sağlayıcı uygunluğunu Hugging Face'ten kontrol edin.

Hugging Face hesabında **Inference Providers** iznine sahip bir token üretip Worker secret olarak ekleyin:

```bash
npx wrangler@latest secret put HF_TOKEN
```

Token yalnızca Cloudflare Worker'da bulunur; frontend'e, `vars` alanına, GitHub Actions variable/secret'ına veya sohbet mesajına koymayın. Hugging Face sağlayıcı/model erişimi, kota ve ücretler hesabınıza bağlıdır. HF token yoksa Gemini yapılandırılmışsa o kullanılır; ikisi de yoksa taslak şablonla üretilir.

Kaynaklar: [Hugging Face Inference Providers — Chat Completion](https://huggingface.co/docs/inference-providers/tasks/chat-completion), [Qwen3-4B-Instruct-2507 model kartı](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507).

## Yeni GitHub deposu ve dağıtım

Hedef depo: `website_by_ai/istanbul-web-factory`. Yerel proje klasörü henüz Git deposu değil; uzaktaki depo oluşturulmadı ve dağıtım yapılmadı. Kurulumu depo sahibi/organizasyon yöneticisi tamamlamalıdır.

### 1. D1 veritabanını oluşturun

Cloudflare hesabında proje kökünden çalıştırın:

```bash
npm run d1:create
```

Dönen veritabanı kimliğini `wrangler.jsonc` içindeki `d1_databases[0].database_id` alanına yazın. Dosyadaki sıfır UUID yalnızca yerel geliştirme içindir; gerçek ID girilmeden **remote migration veya deploy çalıştırmayın**. `database_name` değerini `istanbul-web-factory` olarak bırakın.

### 2. Cloudflare Worker sırlarını girin

Yerel Wrangler CLI'yi Cloudflare hesabıyla kimlik doğruladıktan sonra şu sırları etkileşimli olarak kaydedin; değerleri sohbete göndermeyin:

```bash
npx wrangler@latest secret put ADMIN_PASSWORD
npx wrangler@latest secret put SESSION_SECRET
npx wrangler@latest secret put HF_TOKEN
```

`ADMIN_PASSWORD` için benzersiz, en az 16 karakterlik bir parola; `SESSION_SECRET` için en az 32 rastgele bayt kullanın. Örneğin `openssl rand -hex 32` bir session secret üretebilir; bunu terminalde saklayın ve sohbet/repoya yapıştırmayın. AI kullanmayacaksanız `HF_TOKEN` eklemek zorunlu değildir. Gemini/Google Places isteğe bağlıdır; anahtarları da yalnızca `wrangler secret put GEMINI_API_KEY` ve `wrangler secret put GOOGLE_PLACES_API_KEY` ile Worker secret olarak ekleyin.

### 3. GitHub deposunu ve Worker deploy'u ayarlayın

GitHub'da `website_by_ai` organizasyonu altında `istanbul-web-factory` adlı boş depo oluşturun. İlk push çakışmalarını önlemek için GitHub'da README, license veya `.gitignore` şablonlarını seçmeyin. Bu proje için açık lisans kararı henüz verilmedi; uygun lisansı belirlemeden varsayılan lisans eklemeyin.

Cloudflare Worker/D1 deploy'u için GitHub deposunda **Settings → Secrets and variables → Actions → Secrets** altına şu repository secrets'ları ekleyin:

- `CLOUDFLARE_API_TOKEN` — yalnızca bu hesapta Worker deploy ve D1 migrations için gereken en dar yetkilerle oluşturulmuş token.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare hesap ID'si.

Sonra yerel dalı oluşturup commit/push edin:

```bash
git init -b main
git add .
git commit -m "Prepare Istanbul Web Factory deployment"
git remote add origin git@github.com:website_by_ai/istanbul-web-factory.git
git push -u origin main
```

Proje dizininde `.git` veya `origin` sonradan oluşmuşsa yeniden `git init`/`git remote add` çalıştırmadan önce `git status` ve `git remote -v` ile kontrol edin. `.github/workflows/deploy-worker.yml`, `main` dalına push edildiğinde sırasıyla D1 migration'larını remote'a uygular ve Worker'ı deploy eder.

### 4. GitHub Pages'i açın

GitHub deposunda **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin. Pages workflow, public frontend'i `_site` dizinine derler; Worker URL'si tanımlı değilse bilerek başarısız olur.

Önce Cloudflare Worker deploy edildikten sonra Actions **Variables** bölümünde `WORKER_BASE_URL` adlı repository variable oluşturun. Değer, Worker'ın gerçek HTTPS origin'i olmalı (ör. `https://<worker-subdomain>.workers.dev`); path veya secret eklemeyin. GitHub Pages adresini **Settings → Pages** ekranından aldıktan sonra bu tam origin'i (ör. `https://<organization>.github.io`) `wrangler.jsonc` içindeki `ALLOWED_ORIGINS` değerine yazıp Worker'ı tekrar deploy edin. Bu değer wildcard olmamalı. Pages uygulaması Worker API'ye bearer token ile bağlanır; önizleme bağlantıları da Worker'a yönlendirilir.

`deploy-pages.yml` her `main` push'ında statik frontend'i yayımlar. İlk push'ta `WORKER_BASE_URL` henüz yoksa Pages job'ı bilerek başarısız olur; değişkeni ekledikten sonra Actions ekranından **Deploy public frontend to GitHub Pages → Run workflow** ile yeniden çalıştırın (veya yeni bir commit push edin). Pages'in proje alt yolu için CSS/JS yolları göreli ayarlanmıştır; Worker API origin'i derleme sırasında `app-config.js` içine yazılır. Önizleme HTML'i yalnızca Worker'dan servis edilir.

## Erişim ve güvenlik sınırları

- Worker'da admin API'si login olmadan CRM verisi veya lead/site listesi döndürmez. Login parolası açık metin olarak depolanmaz; imzalı bearer oturumu tarayıcı `sessionStorage` içinde tutulur ve 12 saat sonra sona erer. Tek ortak admin parolası vardır; çok kullanıcılı rol/SSO sistemi değildir.
- D1 tabanlı istek limitleri login için 10 deneme/15 dakika, yazma API'leri için 300/saat, Google Places keşfi için 30/gün ve AI site taslağı için 25/gündür. İstemci IP'si ham olarak saklanmaz; limit için hash kullanılır. Sağlayıcı kotası/ücreti ayrıca takip edilmelidir.
- Paylaşılabilir önizleme URL'sini bilen herkes taslak içeriğini görebilir. Linkler noindex'tir ve yüksek rastgele slug kullanır; yine de gizli/kişisel veri eklemeyin, gerçek kullanımda erişim/süre sonu/silme akışı ekleyin.
- Local Node modu auth içermez; `server.mjs` production hosting hedefi değildir. Worker secrets yoksa korumalı Worker API login'i kapatır ve veriyi açmaz.
- Herkese açık dağıtımdan önce auth/rate-limit kodunu güvenlik incelemesinden geçirin; KVKK, ticari ileti/İYS, izin kanıtı, geri çekme/silme ve veri saklama sürelerini uzmanla değerlendirin.
- İşletme sahibi onayı olmadan taslak yayımlamayın. Model doğrulanmamış yorum, puan, fiyat, saat, lisans veya başarı iddiası eklememelidir.
- Google Places verisi için güncel atıf, gösterim, saklama ve yeniden kullanım koşullarını uygulayın. Bu prototip Places yanıtlarını otomatik CRM'ye kaydetmez ve CSV dışa aktarımını engeller.

Otomatik/soğuk toplu mesaj gönderimi yoktur. İletişim taslağı yalnızca gerçek kayıt, doğrulama, denetim ve kaydedilmiş izin koşulları sağlandığında hazırlanır; gönderim ve son insan onayı operatörde kalır.
