// sw.js - Service Worker para Ferramentas DP (PWA Offline)
const CACHE_NAME = 'ferramentas-dp-v1.0.7';
const DYNAMIC_CACHE = 'ferramentas-dp-dynamic-v1.0.7';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/css/style.css',
  '/css/layout.css',
  '/css/sidebar.css',
  '/css/components.css',
  '/css/forms.css',
  '/css/simulador-calculos.css',
  '/css/simulador-custo.css',
  '/js/head-manager.js',
  '/js/loader.js',
  '/js/toast.js',
  '/js/theme-toggle.js',
  '/js/command-palette.js',
  '/js/keyboard-nav.js',
  '/js/file-uploader-helper.js',
  '/js/pwa-installer.js',
  '/js/simuladores/ferias.js',
  '/js/simuladores/rescisao.js',
  '/pages/simuladores/ferias.html',
  '/pages/simuladores/rescisao.html',
  '/pages/simuladores/hub.html',
  '/pages/simuladores/custo-funcionario.html',
  '/pages/consultas.html',
  '/pages/modelos.html',
  '/pages/jornada.html',
  '/pages/ajuda.html'
];

// Offline HTML Template Fallback
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modo Offline | Ferramentas DP</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .offline-card {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 40px 30px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .offline-icon {
            font-size: 3.5rem;
            margin-bottom: 15px;
        }
        h1 { font-size: 1.5rem; margin-bottom: 10px; color: #f8fafc; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px; }
        .btn-retry {
            background-color: #3b82f6;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.95rem;
            transition: all 0.2s;
        }
        .btn-retry:hover { background-color: #2563eb; transform: translateY(-1px); }
        .shortcuts {
            margin-top: 25px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .shortcut-link {
            background-color: #334155;
            color: #38bdf8;
            padding: 8px 14px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="offline-card">
        <div class="offline-icon">
<svg class="lucide lucide-radio" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M16.247 7.761a6 6 0 0 1 0 8.478" /> <path d="M19.075 4.933a10 10 0 0 1 0 14.134" /> <path d="M4.925 19.067a10 10 0 0 1 0-14.134" /> <path d="M7.753 16.239a6 6 0 0 1 0-8.478" /> <circle cx="12" cy="12" r="2" /> </svg> </div>
        <h1>Você está Sem Conexão</h1>
        <p>Esta página ainda não foi armazenada em cache, mas suas calculadoras de férias, rescisão e simuladores abertos anteriormente continuam funcionando perfeitamente em modo offline.</p>
        <button class="btn-retry" onclick="window.location.reload()">
<svg class="lucide lucide-refresh-cw" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" /> <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> <path d="M8 16H3v5" /> </svg> Tentar Novamente</button>
        
        <div class="shortcuts">
            <a href="/pages/simuladores/ferias.html" class="shortcut-link">
<svg class="lucide lucide-umbrella" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 13v7a2 2 0 0 0 4 0" /> <path d="M12 2v2" /> <path d="M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z" /> </svg> Férias</a>
            <a href="/pages/simuladores/rescisao.html" class="shortcut-link">
<svg class="lucide lucide-scroll" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M19 17V5a2 2 0 0 0-2-2H4" /> <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" /> </svg> Rescisão</a>
            <a href="/pages/simuladores/hub.html" class="shortcut-link">
<svg class="lucide lucide-zap" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /> </svg> Central DP</a>
        </div>
    </div>
</body>
</html>`;

// Instalação do Service Worker & Precache dos arquivos principais
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Armazenando aplicativo em cache offline...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Aviso no precache de alguns recursos:', err);
      });
    })
  );
});

// Ativação e Limpeza de Caches Antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições (Estratégias de Cache Inteligente)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Apenas intercepta requisições GET do mesmo protocolo ou CDNs
  if (req.method !== 'GET') return;

  // 1. Estratégia para Páginas de Navegação (HTML) -> Network First com Fallback para Cache
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
            if (cachedRes) return cachedRes;
            return caches.match('/index.html', { ignoreSearch: true }).then((indexRes) => {
              if (indexRes) return indexRes;
              return new Response(OFFLINE_HTML, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          });
        })
    );
    return;
  }

  // 2. Estratégia para Recursos Estáticos (CSS, JS, Imagens, Fontes, CDN) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch((err) => {
          console.log('[SW] Requisição offline:', req.url);
        });

      return cachedRes || fetchPromise;
    })
  );
});

// Mensagem para atualizar o SW imediatamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
