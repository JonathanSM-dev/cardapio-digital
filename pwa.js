/**
 * Gerenciador PWA para D'Casa & Cia Assados
 * Instalação, Service Worker e funcionalidades offline
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.serviceWorker = null;
        
        this.init();
    }

    /**
     * Inicializa o gerenciador PWA
     */
    async init() {
        try {
            // Registrar Service Worker
            await this.registerServiceWorker();
            
            // Configurar eventos PWA
            this.setupPWAEvents();
            
            // Configurar detecção de conectividade
            this.setupConnectivityDetection();
            
            // Verificar se já está instalado
            this.checkInstallationStatus();
            
            // Configurar atalhos de URL
            this.handleURLShortcuts();
            
            console.log('🚀 PWA Manager inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar PWA Manager:', error);
        }
    }

    /**
     * Registra o Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                this.serviceWorker = registration;
                
                console.log('✅ Service Worker registrado:', registration.scope);
                
                // Escutar atualizações
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
                // Escutar mensagens do Service Worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event);
                });
                
            } catch (error) {
                console.error('❌ Erro ao registrar Service Worker:', error);
            }
        } else {
            console.warn('⚠️ Service Worker não suportado neste navegador');
        }
    }

    /**
     * Verifica critérios PWA e mostra status detalhado
     */
    checkPWACriteria() {
        console.log('🔍 ===============================================');
        console.log('🔍 VERIFICAÇÃO DE CRITÉRIOS PWA');
        console.log('🔍 ===============================================');
        
        const criteria = {
            protocol: false,
            serviceWorker: false,
            manifest: false,
            beforeInstallPrompt: false,
            notInstalled: false,
            supportedBrowser: false
        };
        
        // 1. Verificar protocolo
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
        criteria.protocol = isSecure;
        console.log(`1️⃣ Protocolo seguro: ${isSecure ? '✅' : '❌'} (${location.protocol})`);
        
        // 2. Verificar Service Worker
        const hasServiceWorker = 'serviceWorker' in navigator;
        criteria.serviceWorker = hasServiceWorker;
        console.log(`2️⃣ Service Worker suportado: ${hasServiceWorker ? '✅' : '❌'}`);
        
        // 3. Verificar Manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        criteria.manifest = !!manifestLink;
        console.log(`3️⃣ Manifest presente: ${manifestLink ? '✅' : '❌'} (${manifestLink?.href || 'não encontrado'})`);
        
        // 4. Verificar beforeinstallprompt
        criteria.beforeInstallPrompt = !!this.deferredPrompt;
        console.log(`4️⃣ Prompt de instalação: ${this.deferredPrompt ? '✅' : '❌'} (${this.deferredPrompt ? 'disponível' : 'aguardando...'})`);
        
        // 5. Verificar se não está instalado
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        criteria.notInstalled = !isInstalled;
        console.log(`5️⃣ App não instalado: ${!isInstalled ? '✅' : '❌'} (${isInstalled ? 'já instalado' : 'pode instalar'})`);
        
        // 6. Verificar navegador suportado
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(navigator.userAgent);
        const supportedBrowser = isChrome || isEdge;
        criteria.supportedBrowser = supportedBrowser;
        console.log(`6️⃣ Navegador suportado: ${supportedBrowser ? '✅' : '❌'} (${navigator.userAgent.match(/Chrome|Edg|Firefox|Safari/)?.[0] || 'desconhecido'})`);
        
        // Resumo
        const allCriteriaMet = Object.values(criteria).every(c => c);
        console.log('🔍 ===============================================');
        console.log(`📊 RESULTADO: ${allCriteriaMet ? '✅ TODOS CRITÉRIOS ATENDIDOS' : '❌ CRITÉRIOS FALTANTES'}`);
        
        if (!allCriteriaMet) {
            console.log('❌ Critérios não atendidos:');
            Object.entries(criteria).forEach(([key, value]) => {
                if (!value) {
                    const messages = {
                        protocol: '   • Use https:// ou localhost (não file://)',
                        serviceWorker: '   • Navegador não suporta Service Worker',
                        manifest: '   • Arquivo manifest.json não encontrado',
                        beforeInstallPrompt: '   • Aguardando evento do navegador...',
                        notInstalled: '   • App já está instalado',
                        supportedBrowser: '   • Use Chrome, Edge ou Opera'
                    };
                    console.log(messages[key]);
                }
            });
        }
        
        console.log('🔍 ===============================================');
        return criteria;
    }

    /**
     * Configura gatilhos para tentar forçar o prompt de instalação
     */
    setupInstallTriggers() {
        let userInteracted = false;
        let timeOnSite = 0;
        
        // Detectar interação do usuário
        const markUserInteraction = () => {
            if (!userInteracted) {
                userInteracted = true;
                console.log('👆 Interação do usuário detectada');
                this.checkForInstallPrompt();
            }
        };
        
        // Eventos de interação
        ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
            document.addEventListener(event, markUserInteraction, { once: true });
        });
        
        // Contador de tempo na página
        setInterval(() => {
            timeOnSite += 1;
            if (timeOnSite === 5) {
                console.log('⏱️ Usuário na página por 5 segundos');
                this.checkForInstallPrompt();
            }
            if (timeOnSite === 10) {
                console.log('⏱️ Usuário na página por 10 segundos');
                this.checkForInstallPrompt();
            }
            if (timeOnSite === 30) {
                console.log('⏱️ Usuário na página por 30 segundos - forçando verificação');
                this.forceInstallCheck();
            }
        }, 1000);
    }

    /**
     * Verifica se o prompt pode ser mostrado
     */
    checkForInstallPrompt() {
        if (this.deferredPrompt) {
            console.log('✅ Prompt já disponível, mostrando botão');
            this.showInstallButton();
        } else {
            console.log('⏳ Prompt ainda não disponível, aguardando...');
            // Verifica critérios novamente
            this.checkPWACriteria();
        }
    }

    /**
     * Força verificação mais agressiva
     */
    forceInstallCheck() {
        console.log('🔧 ===============================================');
        console.log('🔧 VERIFICAÇÃO FORÇADA DO PWA');
        console.log('🔧 ===============================================');
        
        // Verifica se todos os critérios estão OK
        const criteria = this.checkPWACriteria();
        
        if (!this.deferredPrompt) {
            console.log('⚠️ Prompt não disparou automaticamente');
            console.log('💡 Possíveis causas:');
            console.log('   • Chrome precisa de mais interação do usuário');
            console.log('   • Manifest ou Service Worker com problema');
            console.log('   • Navegador já determinou que não é "instalável"');
            console.log('   • App já foi rejeitado pelo usuário recentemente');
            
            // Mostrar botão manual mesmo sem prompt
            console.log('🔧 Criando botão manual de instalação...');
            this.showManualInstallButton();
        }
        
        console.log('🔧 ===============================================');
    }

    /**
     * Mostra botão manual de instalação (mesmo sem prompt automático)
     */
    showManualInstallButton() {
        // Remover botão existente se houver
        const existingBtn = document.getElementById('pwa-install-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Criar botão manual
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-btn manual';
        installBtn.innerHTML = `
            <i class="fas fa-mobile-alt"></i>
            <span>Instalar PWA</span>
        `;
        
        // Adicionar ao header-actions
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(installBtn);
            console.log('✅ Botão manual adicionado ao header-actions');
        }
        
        installBtn.style.display = 'flex';
        installBtn.addEventListener('click', () => {
            if (this.deferredPrompt) {
                this.installPWA();
            } else {
                this.showManualInstallInstructions();
            }
        });
        
        console.log('✅ Botão manual de instalação criado');
    }

    /**
     * Mostra instruções manuais de instalação
     */
    showManualInstallInstructions() {
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isEdge = /Edg/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isChrome) {
            instructions = `
                <h3>📱 Como Instalar no Chrome:</h3>
                <ol>
                    <li>Clique nos <strong>3 pontos</strong> (⋮) no canto superior direito</li>
                    <li>Selecione <strong>"Instalar D'Casa Assados..."</strong></li>
                    <li>Confirme clicando em <strong>"Instalar"</strong></li>
                </ol>
                <p><em>Ou pressione <strong>Ctrl+Shift+A</strong> (Windows) ou <strong>Cmd+Shift+A</strong> (Mac)</em></p>
            `;
        } else if (isEdge) {
            instructions = `
                <h3>📱 Como Instalar no Edge:</h3>
                <ol>
                    <li>Clique nos <strong>3 pontos</strong> (...) no canto superior direito</li>
                    <li>Selecione <strong>"Aplicativos"</strong> → <strong>"Instalar este site como um aplicativo"</strong></li>
                    <li>Confirme clicando em <strong>"Instalar"</strong></li>
                </ol>
            `;
        } else {
            instructions = `
                <h3>📱 Instalação Manual:</h3>
                <p>Para instalar este PWA, use um navegador compatível:</p>
                <ul>
                    <li><strong>Google Chrome</strong> (recomendado)</li>
                    <li><strong>Microsoft Edge</strong></li>
                    <li><strong>Opera</strong></li>
                </ul>
            `;
        }
        
        const modal = document.createElement('div');
        modal.className = 'pwa-install-modal';
        modal.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-header">
                    <h2>🍖 Instalar D'Casa & Cia Assados</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
                </div>
                <div class="pwa-install-body">
                    ${instructions}
                    <div class="pwa-benefits">
                        <h4>✨ Vantagens do App:</h4>
                        <ul>
                            <li>🚀 Carregamento mais rápido</li>
                            <li>📱 Funciona offline</li>
                            <li>🔔 Notificações (futuro)</li>
                            <li>🎯 Acesso direto da área de trabalho</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        console.log('📱 Instruções manuais de instalação mostradas');
    }

    /**
     * Configura eventos PWA
     */
    setupPWAEvents() {
        // Verificar critérios iniciais
        setTimeout(() => {
            this.checkPWACriteria();
        }, 1000);
        
        // Tentar forçar prompt após interação do usuário
        this.setupInstallTriggers();
        
        // Evento de instalação
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('💾 ===============================================');
            console.log('💾 EVENTO beforeinstallprompt DISPARADO!');
            console.log('💾 ===============================================');
            
            // Previne o prompt automático
            event.preventDefault();
            
            // Salva o evento para uso posterior
            this.deferredPrompt = event;
            
            // Verifica critérios novamente
            this.checkPWACriteria();
            
            // Mostra botão de instalação
            this.showInstallButton();
        });

        // Evento pós-instalação
        window.addEventListener('appinstalled', (event) => {
            console.log('🎉 PWA instalado com sucesso');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledNotification();
        });

        // Evento de mudança de modo de exibição
        window.addEventListener('resize', () => {
            this.updateDisplayMode();
        });
    }

    /**
     * Configura detecção de conectividade
     */
    setupConnectivityDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Conectado à internet');
            this.isOnline = true;
            this.hideOfflineNotification();
            this.syncWhenOnline();
        });

        window.addEventListener('offline', () => {
            console.log('📱 Modo offline ativado');
            this.isOnline = false;
            this.showOfflineNotification();
        });
    }

    /**
     * Verifica status de instalação
     */
    checkInstallationStatus() {
        // Verifica se está rodando como PWA
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 Rodando como PWA instalado');
        }
    }

    /**
     * Lida com atalhos de URL
     */
    handleURLShortcuts() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Atalho para nova ordem
        if (urlParams.get('action') === 'new-order') {
            // Limpar carrinho e focar no menu
            if (typeof cart !== 'undefined') {
                cart.length = 0;
                if (typeof updateCartDisplay === 'function') {
                    updateCartDisplay();
                }
            }
        }
        
        // Atalho para abas específicas
        const tab = urlParams.get('tab');
        if (tab && typeof switchTab === 'function') {
            setTimeout(() => switchTab(tab), 500);
        }
    }

    /**
     * Mostra botão de instalação
     */
    showInstallButton() {
        console.log('🔧 Tentando mostrar botão de instalação...');
        
        // Criar botão se não existir
        let installBtn = document.getElementById('pwa-install-btn');
        
        if (!installBtn) {
            console.log('📝 Criando novo botão de instalação...');
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-btn';
            installBtn.innerHTML = `
                <i class="fas fa-download"></i>
                <span>Instalar App</span>
            `;
            
            // Adicionar ao header-actions
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                headerActions.appendChild(installBtn);
                console.log('✅ Botão adicionado ao header-actions');
            } else {
                console.error('❌ Container .header-actions não encontrado!');
                // Fallback: adicionar ao header
                const header = document.querySelector('.header .container');
                if (header) {
                    header.appendChild(installBtn);
                    console.log('⚠️ Botão adicionado ao header como fallback');
                } else {
                    console.error('❌ Header não encontrado!');
                }
            }
        } else {
            console.log('♻️ Botão já existe, apenas mostrando...');
        }
        
        installBtn.style.display = 'flex';
        installBtn.addEventListener('click', () => this.installPWA());
        
        console.log('✅ Botão de instalação configurado e visível');
    }

    /**
     * Esconde botão de instalação
     */
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    /**
     * Instala o PWA
     */
    async installPWA() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ Prompt de instalação não disponível');
            return;
        }

        try {
            // Mostra o prompt de instalação
            this.deferredPrompt.prompt();
            
            // Aguarda a escolha do usuário
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`📱 Resultado da instalação: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ Usuário aceitou instalar o PWA');
            } else {
                console.log('❌ Usuário recusou instalar o PWA');
            }
            
            // Limpa o prompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Erro na instalação do PWA:', error);
        }
    }

    /**
     * Mostra notificação de atualização disponível
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-sync-alt"></i>
                <span>Nova versão disponível!</span>
                <button class="update-btn" onclick="pwaManager.updateApp()">
                    Atualizar
                </button>
                <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove automaticamente após 10 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Atualiza o app
     */
    async updateApp() {
        if (this.serviceWorker && this.serviceWorker.waiting) {
            // Envia mensagem para o Service Worker ativar
            this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Recarrega a página
            window.location.reload();
        }
    }

    /**
     * Mostra notificação de instalação bem-sucedida
     */
    showInstalledNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>App instalado com sucesso!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Mostra notificação offline
     */
    showOfflineNotification() {
        let notification = document.getElementById('offline-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'offline-notification';
            notification.className = 'pwa-offline-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-wifi"></i>
                    <span>Modo offline - Funcionalidades limitadas</span>
                </div>
            `;
            
            document.body.appendChild(notification);
        }
        
        notification.style.display = 'block';
    }

    /**
     * Esconde notificação offline
     */
    hideOfflineNotification() {
        const notification = document.getElementById('offline-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }

    /**
     * Sincroniza dados quando volta online
     */
    async syncWhenOnline() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync-orders');
                console.log('🔄 Sincronização em background agendada');
            } catch (error) {
                console.error('❌ Erro ao agendar sincronização:', error);
            }
        }
    }

    /**
     * Lida com mensagens do Service Worker
     */
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SYNC_COMPLETE':
                console.log('✅ Sincronização completa:', data);
                this.showSyncCompleteNotification();
                break;
                
            case 'CACHE_UPDATED':
                console.log('📦 Cache atualizado:', data);
                break;
                
            default:
                console.log('💬 Mensagem do SW:', type, data);
        }
    }

    /**
     * Mostra notificação de sincronização completa
     */
    showSyncCompleteNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-sync-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-sync-alt"></i>
                <span>Dados sincronizados!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    /**
     * Atualiza modo de exibição
     */
    updateDisplayMode() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isStandalone) {
            document.body.classList.add('pwa-standalone');
        } else {
            document.body.classList.remove('pwa-standalone');
        }
    }

    /**
     * Solicita permissão para notificações
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('✅ Permissão para notificações concedida');
                return true;
            } else {
                console.log('❌ Permissão para notificações negada');
                return false;
            }
        }
        
        return false;
    }

    /**
     * Envia notificação local
     */
    showLocalNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                ...options
            });
            
            // Auto-close após 5 segundos
            setTimeout(() => notification.close(), 5000);
            
            return notification;
        }
        
        return null;
    }

    /**
     * Obtém informações do PWA
     */
    getPWAInfo() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            hasServiceWorker: !!this.serviceWorker,
            canInstall: !!this.deferredPrompt,
            notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
        };
    }

    /**
     * Força atualização do cache
     */
    async forceUpdateCache() {
        if (this.serviceWorker) {
            this.serviceWorker.active?.postMessage({ type: 'CLEAR_CACHE' });
            console.log('🗑️ Limpeza de cache solicitada');
        }
    }
}

// Instância global
window.pwaManager = new PWAManager();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
} 