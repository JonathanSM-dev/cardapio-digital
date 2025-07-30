/**
 * Sistema de Armazenamento IndexedDB para D'Casa & Cia Assados
 * Migração automática do localStorage com total compatibilidade
 */

class RestaurantDB {
    constructor() {
        this.db = null;
        this.dbName = 'DCasaRestaurantDB';
        this.dbVersion = 1;
        this.isReady = false;
    }

    /**
     * Inicializa o banco de dados IndexedDB
     */
    async init() {
        try {
            console.log('🗄️ Inicializando IndexedDB...');
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('❌ Erro ao abrir IndexedDB:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    this.isReady = true;
                    console.log('✅ IndexedDB inicializado com sucesso');
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    console.log('🔄 Criando estrutura do banco...');
                    const db = event.target.result;
                    this.createStores(db);
                };
            });
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    /**
     * Cria as stores (tabelas) do banco
     */
    createStores(db) {
        try {
            // Store para pedidos
            if (!db.objectStoreNames.contains('orders')) {
                const orderStore = db.createObjectStore('orders', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Índices para consultas otimizadas
                orderStore.createIndex('timestamp', 'timestamp');
                orderStore.createIndex('sequentialId', 'sequentialId');
                orderStore.createIndex('date', 'dateKey'); // Para filtros por data
                orderStore.createIndex('total', 'pricing.total');
                orderStore.createIndex('paymentMethod', 'payment.method');
                orderStore.createIndex('deliveryType', 'delivery.type');
                
                console.log('📦 Store "orders" criada');
            }

            // Store para carrinho (persistência)
            if (!db.objectStoreNames.contains('cart')) {
                const cartStore = db.createObjectStore('cart', { 
                    keyPath: 'id' 
                });
                cartStore.createIndex('timestamp', 'timestamp');
                
                console.log('🛒 Store "cart" criada');
            }

            // Store para configurações
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { 
                    keyPath: 'key' 
                });
                
                console.log('⚙️ Store "settings" criada');
            }

            // Store para produtos (cache do menu)
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { 
                    keyPath: 'id' 
                });
                productStore.createIndex('category', 'category');
                productStore.createIndex('price', 'price');
                
                console.log('🍽️ Store "products" criada');
            }

        } catch (error) {
            console.error('❌ Erro ao criar stores:', error);
            throw error;
        }
    }

    /**
     * Salva uma configuração no banco
     */
    async saveSetting(key, value) {
        if (!this.isReady) {
            console.warn('⚠️ IndexedDB não está pronto. Usando localStorage como fallback.');
            localStorage.setItem(`dcasa_${key}`, JSON.stringify(value));
            return;
        }

        try {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const setting = {
                key: key,
                value: value,
                timestamp: new Date().toISOString()
            };
            
            await store.put(setting);
            console.log(`⚙️ Configuração "${key}" salva no IndexedDB`);
        } catch (error) {
            console.error(`❌ Erro ao salvar configuração "${key}":`, error);
            // Fallback para localStorage
            localStorage.setItem(`dcasa_${key}`, JSON.stringify(value));
        }
    }

    /**
     * Carrega uma configuração do banco
     */
    async getSetting(key, defaultValue = null) {
        if (!this.isReady) {
            console.warn('⚠️ IndexedDB não está pronto. Usando localStorage como fallback.');
            const stored = localStorage.getItem(`dcasa_${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        }

        try {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            return new Promise((resolve) => {
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        resolve(result.value);
                    } else {
                        // Tentar fallback do localStorage
                        const stored = localStorage.getItem(`dcasa_${key}`);
                        resolve(stored ? JSON.parse(stored) : defaultValue);
                    }
                };
                
                request.onerror = () => {
                    console.error(`❌ Erro ao carregar configuração "${key}":`, request.error);
                    // Fallback para localStorage
                    const stored = localStorage.getItem(`dcasa_${key}`);
                    resolve(stored ? JSON.parse(stored) : defaultValue);
                };
            });
        } catch (error) {
            console.error(`❌ Erro ao acessar configuração "${key}":`, error);
            // Fallback para localStorage
            const stored = localStorage.getItem(`dcasa_${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        }
    }

    /**
     * Salva configurações do restaurante
     */
    async saveRestaurantSettings(settings) {
        await this.saveSetting('restaurant', settings);
    }

    /**
     * Carrega configurações do restaurante
     */
    async getRestaurantSettings() {
        return await this.getSetting('restaurant', {
            name: "D'Casa & Cia Assados",
            phone: "(11) 99999-9999",
            address: "Rua Exemplo, 123 - Centro - São Paulo - SP",
            defaultDeliveryFee: 9.00
        });
    }

    /**
     * Salva dados dos produtos (incluindo promoções)
     */
    async saveProducts(products) {
        if (!this.isReady) {
            console.warn('⚠️ IndexedDB não está pronto. Produtos não foram salvos.');
            return;
        }

        try {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            // Limpar produtos existentes
            await store.clear();
            
            // Salvar todos os produtos
            for (const product of products) {
                await store.put({
                    ...product,
                    lastUpdated: new Date().toISOString()
                });
            }
            
            console.log(`🍽️ ${products.length} produtos salvos no IndexedDB`);
        } catch (error) {
            console.error('❌ Erro ao salvar produtos:', error);
        }
    }

    /**
     * Carrega dados dos produtos
     */
    async getProducts() {
        if (!this.isReady) {
            console.warn('⚠️ IndexedDB não está pronto.');
            return [];
        }

        try {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            
            return new Promise((resolve) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    console.error('❌ Erro ao carregar produtos:', request.error);
                    resolve([]);
                };
            });
        } catch (error) {
            console.error('❌ Erro ao acessar produtos:', error);
            return [];
        }
    }

    /**
     * Verifica se o IndexedDB está disponível
     */
    static isSupported() {
        return 'indexedDB' in window && indexedDB !== null;
    }

    /**
     * Aguarda o banco estar pronto
     */
    async waitReady() {
        if (this.isReady) return;
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!this.isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.isReady) {
            throw new Error('Timeout aguardando IndexedDB');
        }
    }

    // ==================== OPERAÇÕES DE PEDIDOS ====================

    /**
     * Salva um pedido no IndexedDB
     */
    async saveOrder(order) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readwrite');
            const store = transaction.objectStore('orders');
            
            // Adicionar chave de data para filtros otimizados
            const orderWithDateKey = {
                ...order,
                dateKey: new Date(order.timestamp).toDateString()
            };
            
            const request = store.add(orderWithDateKey);
            
            request.onsuccess = () => {
                console.log('✅ Pedido salvo:', request.result);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao salvar pedido:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Busca pedidos com filtros
     */
    async getOrders(filters = {}) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            
            let request;
            
            if (filters.date) {
                // Filtro por data usando índice
                const dateKey = filters.date.toDateString();
                const index = store.index('date');
                request = index.getAll(dateKey);
            } else if (filters.dateRange) {
                // Filtro por período
                const index = store.index('timestamp');
                const range = IDBKeyRange.bound(filters.dateRange.start, filters.dateRange.end);
                request = index.getAll(range);
            } else {
                // Todos os pedidos
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                let orders = request.result;
                
                // Filtros adicionais em memória
                if (filters.paymentMethod) {
                    orders = orders.filter(order => 
                        order.payment.method === filters.paymentMethod
                    );
                }
                
                if (filters.deliveryType) {
                    orders = orders.filter(order => 
                        order.delivery.type === filters.deliveryType
                    );
                }
                
                // Ordenar por timestamp (mais recente primeiro)
                orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                resolve(orders);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao buscar pedidos:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Busca pedidos do dia atual
     */
    async getTodayOrders() {
        const today = new Date();
        return this.getOrders({ date: today });
    }

    /**
     * Busca pedidos por período
     */
    async getOrdersByPeriod(period) {
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        return this.getOrders({
            dateRange: {
                start: startDate,
                end: now
            }
        });
    }

    // ==================== OPERAÇÕES DE CARRINHO ====================

    /**
     * Salva o carrinho atual
     */
    async saveCart(cartItems) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cart'], 'readwrite');
            const store = transaction.objectStore('cart');
            
            const cartData = {
                id: 'current',
                items: cartItems,
                timestamp: new Date()
            };
            
            const request = store.put(cartData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao salvar carrinho:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Carrega o carrinho salvo
     */
    async loadCart() {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cart'], 'readonly');
            const store = transaction.objectStore('cart');
            const request = store.get('current');
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.items : []);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao carregar carrinho:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Limpa o carrinho
     */
    async clearCart() {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cart'], 'readwrite');
            const store = transaction.objectStore('cart');
            const request = store.delete('current');
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ==================== MIGRAÇÃO DO LOCALSTORAGE ====================

    /**
     * Migra dados do localStorage para IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            console.log('🔄 Iniciando migração do localStorage...');
            
            // Migrar histórico de pedidos
            const existingHistory = localStorage.getItem('orderHistory');
            if (existingHistory) {
                const orders = JSON.parse(existingHistory);
                console.log(`📦 Migrando ${orders.length} pedidos...`);
                
                for (const order of orders) {
                    try {
                        // Garantir que timestamp é um Date object
                        if (typeof order.timestamp === 'string') {
                            order.timestamp = new Date(order.timestamp);
                        }
                        
                        await this.saveOrder(order);
                    } catch (error) {
                        console.warn('⚠️ Erro ao migrar pedido:', order, error);
                    }
                }
                
                console.log('✅ Pedidos migrados com sucesso');
            }

            // Migrar carrinho
            const existingCart = localStorage.getItem('cartItems');
            if (existingCart) {
                const cartItems = JSON.parse(existingCart);
                await this.saveCart(cartItems);
                console.log('✅ Carrinho migrado com sucesso');
            }

            // Marcar migração como concluída
            await this.saveSetting('migrationCompleted', {
                completed: true,
                date: new Date(),
                version: this.dbVersion
            });

            console.log('🎉 Migração concluída com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na migração:', error);
            throw error;
        }
    }

    /**
     * Verifica se a migração já foi realizada
     */
    async isMigrationCompleted() {
        try {
            const migration = await this.getSetting('migrationCompleted');
            return migration && migration.completed;
        } catch (error) {
            return false;
        }
    }

    // ==================== CONFIGURAÇÕES ====================

    /**
     * Salva uma configuração
     */
    async saveSetting(key, value) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const setting = {
                key: key,
                value: value,
                timestamp: new Date()
            };
            
            const request = store.put(setting);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Busca uma configuração
     */
    async getSetting(key) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // ==================== UTILITÁRIOS ====================

    /**
     * Obtém estatísticas do banco
     */
    async getStats() {
        await this.waitReady();
        
        const orders = await this.getOrders();
        const todayOrders = await this.getTodayOrders();
        
        return {
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.total || order.pricing?.total || 0), 0),
            todayRevenue: todayOrders.reduce((sum, order) => sum + (order.total || order.pricing?.total || 0), 0),
            dbSize: await this.estimateSize()
        };
    }

    /**
     * Estima o tamanho do banco (aproximado)
     */
    async estimateSize() {
        if ('estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                available: estimate.quota,
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }

    /**
     * Remove um pedido específico
     */
    async deleteOrder(orderId) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readwrite');
            const store = transaction.objectStore('orders');
            
            // Primeiro buscar o pedido pelo ID
            const getRequest = store.get(orderId);
            
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    // Pedido encontrado, deletar
                    const deleteRequest = store.delete(orderId);
                    
                    deleteRequest.onsuccess = () => {
                        console.log('🗑️ Pedido deletado do IndexedDB:', orderId);
                        resolve(true);
                    };
                    
                    deleteRequest.onerror = () => {
                        console.error('❌ Erro ao deletar pedido:', deleteRequest.error);
                        reject(deleteRequest.error);
                    };
                } else {
                    console.warn('⚠️ Pedido não encontrado para deleção:', orderId);
                    resolve(false);
                }
            };
            
            getRequest.onerror = () => {
                console.error('❌ Erro ao buscar pedido para deleção:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }

    // ==================== OPERAÇÕES DE PRODUTOS ====================

    /**
     * Salva produtos no IndexedDB
     */
    async saveProducts(products) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            // Limpar produtos existentes primeiro
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                // Adicionar novos produtos
                let completed = 0;
                const total = products.length;
                
                if (total === 0) {
                    resolve();
                    return;
                }
                
                products.forEach(product => {
                    const addRequest = store.add({
                        ...product,
                        timestamp: new Date()
                    });
                    
                    addRequest.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            console.log('🍽️ Produtos salvos no IndexedDB:', total);
                            resolve();
                        }
                    };
                    
                    addRequest.onerror = () => {
                        console.error('❌ Erro ao salvar produto:', addRequest.error);
                        reject(addRequest.error);
                    };
                });
            };
            
            clearRequest.onerror = () => {
                console.error('❌ Erro ao limpar produtos:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * Carrega produtos do IndexedDB
     */
    async loadProducts() {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const products = request.result || [];
                console.log('🍽️ Produtos carregados do IndexedDB:', products.length);
                resolve(products);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao carregar produtos:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Salva um produto específico
     */
    async saveProduct(product) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            const productWithTimestamp = {
                ...product,
                timestamp: new Date()
            };
            
            const request = store.put(productWithTimestamp);
            
            request.onsuccess = () => {
                console.log('🍽️ Produto salvo no IndexedDB:', product.id);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao salvar produto:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Remove um produto específico
     */
    async deleteProduct(productId) {
        await this.waitReady();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            const request = store.delete(productId);
            
            request.onsuccess = () => {
                console.log('🗑️ Produto deletado do IndexedDB:', productId);
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('❌ Erro ao deletar produto:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Limpa todos os dados (para debug)
     */
    async clearAllData() {
        await this.waitReady();
        
        const stores = ['orders', 'cart', 'settings', 'products'];
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(stores, 'readwrite');
            
            let completed = 0;
            
            stores.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === stores.length) {
                        console.log('🗑️ Todos os dados foram limpos');
                        resolve();
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        });
    }
}

// Instância global
window.restaurantDB = new RestaurantDB();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestaurantDB;
} 