/**
 * Service Worker para D'Casa & Cia Assados PWA
 * Funcionalidade offline completa e cache inteligente
 */

const CACHE_NAME = 'dcasa-pwa-v2.0.0';
const DATA_CACHE_NAME = 'dcasa-data-v2.0.0';

// Arquivos essenciais para funcionamento offline
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/indexedDB.js',
  '/backup.js',
  '/manifest.json',
  // CDN resources (cached separately)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// URLs de API externa (para cache de dados)
const DATA_URLS = [
  // Adicionar aqui URLs de APIs externas quando implementadas
];

/**
 * Evento de instalação do Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Fazendo cache dos arquivos...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker: Cache inicial criado');
        // Força a ativação imediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erro no cache inicial:', error);
      })
  );
});

/**
 * Evento de ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove caches antigos
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ativado e pronto');
        // Toma controle de todas as abas imediatamente
        return self.clients.claim();
      })
  );
});

/**
 * Intercepta todas as requisições de rede
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégias diferentes baseadas no tipo de recurso
  if (request.method === 'GET') {
    if (isDataRequest(request)) {
      // Dados: Cache First com Network Fallback
      event.respondWith(cacheFirstStrategy(request, DATA_CACHE_NAME));
    } else if (isStaticResource(request)) {
      // Recursos estáticos: Cache First
      event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    } else if (isHTMLRequest(request)) {
      // HTML: Network First com Cache Fallback
      event.respondWith(networkFirstStrategy(request));
    } else {
      // Outros: Network First
      event.respondWith(networkFirstStrategy(request));
    }
  }
});

/**
 * Estratégia Cache First - Prioriza cache, fallback para rede
 */
async function cacheFirstStrategy(request, cacheName = CACHE_NAME) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache hit:', request.url);
      
      // Atualiza cache em background (stale-while-revalidate)
      updateCacheInBackground(request, cache);
      
      return cachedResponse;
    }
    
    // Não está no cache, busca na rede
    console.log('🌐 Cache miss, buscando na rede:', request.url);
    const networkResponse = await fetch(request);
    
    // Salva no cache para próximas requisições
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Erro na estratégia Cache First:', error);
    
    // Fallback para página offline se disponível
    if (isHTMLRequest(request)) {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

/**
 * Estratégia Network First - Prioriza rede, fallback para cache
 */
async function networkFirstStrategy(request) {
  try {
    console.log('🌐 Network first:', request.url);
    
    const networkResponse = await fetch(request);
    
    // Salva no cache se a resposta for válida
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📦 Network failed, tentando cache:', request.url);
    
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se é HTML e não tem cache, retorna página principal
    if (isHTMLRequest(request)) {
      return cache.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

/**
 * Atualiza cache em background (stale-while-revalidate)
 */
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🔄 Cache atualizado em background:', request.url);
    }
  } catch (error) {
    // Silencioso - não afeta a resposta do usuário
    console.log('⚠️ Falha na atualização em background:', request.url);
  }
}

/**
 * Verifica se é uma requisição de dados
 */
function isDataRequest(request) {
  const url = new URL(request.url);
  return DATA_URLS.some(dataUrl => url.href.includes(dataUrl)) ||
         request.headers.get('Accept')?.includes('application/json');
}

/**
 * Verifica se é um recurso estático
 */
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i) ||
         url.hostname.includes('cdnjs.cloudflare.com') ||
         url.hostname.includes('cdn.jsdelivr.net');
}

/**
 * Verifica se é uma requisição HTML
 */
function isHTMLRequest(request) {
  return request.headers.get('Accept')?.includes('text/html');
}

/**
 * Evento de sincronização em background
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrdersInBackground());
  } else if (event.tag === 'background-sync-backup') {
    event.waitUntil(syncBackupInBackground());
  }
});

/**
 * Sincronização de pedidos em background
 */
async function syncOrdersInBackground() {
  try {
    console.log('📦 Sincronizando pedidos em background...');
    
    // Aqui você pode implementar sincronização com servidor
    // Por enquanto, apenas log
    console.log('✅ Sincronização de pedidos concluída');
    
    // Notificar o cliente sobre a sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { type: 'orders' }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização de pedidos:', error);
  }
}

/**
 * Sincronização de backup em background
 */
async function syncBackupInBackground() {
  try {
    console.log('💾 Sincronizando backup em background...');
    
    // Implementar sincronização de backup quando necessário
    console.log('✅ Sincronização de backup concluída');
    
  } catch (error) {
    console.error('❌ Erro na sincronização de backup:', error);
  }
}

/**
 * Evento de push notification (preparado para futuro)
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recebida:', event);
  
  let notificationData = {
    title: 'D\'Casa & Cia Assados',
    body: 'Nova notificação do restaurante',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'dcasa-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('❌ Erro ao processar dados do push:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

/**
 * Evento de clique em notificação
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Clique em notificação:', event);
  
  event.notification.close();
  
  const action = event.action;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Abrir ou focar na aplicação
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // Se já tem uma janela aberta, foca nela
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        
        // Senão, abre uma nova janela
        return self.clients.openWindow('/');
      })
  );
});

/**
 * Evento de mensagem do cliente
 */
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida do cliente:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    default:
      console.log('Tipo de mensagem desconhecido:', type);
  }
});

/**
 * Cache URLs específicas sob demanda
 */
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('✅ URLs cacheadas:', urls);
  } catch (error) {
    console.error('❌ Erro ao cachear URLs:', error);
  }
}

/**
 * Limpa todos os caches
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ Todos os caches foram limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar caches:', error);
  }
}

/**
 * Evento de erro não tratado
 */
self.addEventListener('error', (event) => {
  console.error('❌ Erro no Service Worker:', event.error);
});

/**
 * Evento de rejeição de Promise não tratada
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada no Service Worker:', event.reason);
});

console.log('🚀 Service Worker carregado - D\'Casa & Cia Assados PWA v2.0.0'); 