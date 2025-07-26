/**
 * Sistema de Backup e Restore para D'Casa & Cia Assados
 * Exportação e importação completa de dados
 */

class BackupManager {
    constructor() {
        this.version = '1.0';
        this.supportedFormats = ['json'];
    }

    /**
     * Exporta todos os dados do restaurante
     */
    async exportFullBackup() {
        try {
            console.log('📦 Iniciando backup completo...');
            
            // Coletar todos os dados
            const data = await this.collectAllData();
            
            // Criar arquivo de backup
            const filename = this.generateBackupFilename();
            await this.downloadBackup(data, filename);
            
            console.log('✅ Backup criado com sucesso:', filename);
            return { success: true, filename, size: JSON.stringify(data).length };
            
        } catch (error) {
            console.error('❌ Erro ao criar backup:', error);
            throw error;
        }
    }

    /**
     * Coleta todos os dados do sistema
     */
    async collectAllData() {
        const data = {
            // Metadados do backup
            backup: {
                version: this.version,
                timestamp: new Date().toISOString(),
                restaurantName: 'D\'Casa & Cia Assados',
                systemVersion: '2.0'
            },
            
            // Dados principais
            orders: [],
            cart: [],
            settings: {},
            products: [],
            
            // Estatísticas
            stats: null
        };

        try {
            // Coletar pedidos (todos os períodos)
            if (storageManager.isUsingIndexedDB()) {
                // IndexedDB - buscar todos os pedidos
                data.orders = await window.restaurantDB.getOrders();
                data.cart = await window.restaurantDB.loadCart();
                data.stats = await window.restaurantDB.getStats();
                
                // Buscar configurações
                const migrationInfo = await window.restaurantDB.getSetting('migrationCompleted');
                if (migrationInfo) {
                    data.settings.migrationCompleted = migrationInfo;
                }
                
            } else {
                // localStorage fallback
                const savedHistory = localStorage.getItem('dcasa_order_history');
                if (savedHistory) {
                    data.orders = JSON.parse(savedHistory);
                }
                
                const savedCart = localStorage.getItem('dcasa_cart');
                if (savedCart) {
                    data.cart = JSON.parse(savedCart);
                }
            }

            // Adicionar dados do menu atual
            data.products = this.getMenuData();
            
            // Estatísticas calculadas
            if (!data.stats) {
                data.stats = this.calculateStats(data.orders);
            }

            console.log(`📊 Dados coletados: ${data.orders.length} pedidos, ${data.cart.length} itens no carrinho`);
            
            return data;
            
        } catch (error) {
            console.error('❌ Erro ao coletar dados:', error);
            throw error;
        }
    }

    /**
     * Obtém dados do menu atual
     */
    getMenuData() {
        // Dados do menu definidos no script principal
        return window.menuData || [
            { id: 1, name: 'Costela Miga', price: 90.00, category: 'pratos' },
            { id: 2, name: 'Costelinha Suína', price: 90.00, category: 'pratos' },
            { id: 3, name: 'Frango recheado mandioca com bacon', price: 58.00, category: 'pratos' },
            { id: 4, name: 'Frango recheado Farofa tradicional', price: 56.00, category: 'pratos' },
            { id: 5, name: 'Joelho Suino', price: 60.00, category: 'pratos' },
            { id: 6, name: 'Linguiçinha', price: 2.50, category: 'acompanhamentos' },
            { id: 7, name: 'Maionese', price: 12.00, category: 'acompanhamentos' },
            { id: 8, name: 'Coca cola 2lt', price: 15.00, category: 'bebidas' },
            { id: 9, name: 'Hambúrguer', price: 34.00, category: 'pratos' },
            { id: 10, name: 'Baguete', price: 34.00, category: 'pratos' }
        ];
    }

    /**
     * Calcula estatísticas dos pedidos
     */
    calculateStats(orders) {
        if (!orders || orders.length === 0) {
            return {
                totalOrders: 0,
                totalRevenue: 0,
                averageTicket: 0,
                firstOrder: null,
                lastOrder: null
            };
        }

        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.pricing?.total || 0);
        }, 0);

        const orderDates = orders.map(order => new Date(order.timestamp)).sort();

        return {
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            averageTicket: totalRevenue / orders.length,
            firstOrder: orderDates[0],
            lastOrder: orderDates[orderDates.length - 1],
            period: {
                start: orderDates[0],
                end: orderDates[orderDates.length - 1]
            }
        };
    }

    /**
     * Gera nome do arquivo de backup
     */
    generateBackupFilename() {
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        return `dcasa-backup-${date}-${time}.json`;
    }

    /**
     * Faz download do arquivo de backup
     */
    async downloadBackup(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpar URL após download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * Importa backup de arquivo
     */
    async importBackup(file) {
        try {
            console.log('📥 Iniciando importação de backup...');
            
            // Validar arquivo
            if (!file) {
                throw new Error('Nenhum arquivo selecionado');
            }
            
            if (!file.name.endsWith('.json')) {
                throw new Error('Formato de arquivo inválido. Use apenas arquivos .json');
            }

            // Ler conteúdo do arquivo
            const content = await this.readFileContent(file);
            const backupData = JSON.parse(content);
            
            // Validar estrutura do backup
            await this.validateBackup(backupData);
            
            // Confirmar importação
            const confirmed = await this.confirmImport(backupData);
            if (!confirmed) {
                return { success: false, message: 'Importação cancelada pelo usuário' };
            }
            
            // Fazer backup atual antes de importar
            await this.createPreImportBackup();
            
            // Importar dados
            const result = await this.restoreData(backupData);
            
            console.log('✅ Backup importado com sucesso');
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao importar backup:', error);
            throw error;
        }
    }

    /**
     * Lê conteúdo do arquivo
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            
            reader.readAsText(file);
        });
    }

    /**
     * Valida estrutura do backup
     */
    async validateBackup(data) {
        // Verificar estrutura básica
        if (!data.backup || !data.backup.version) {
            throw new Error('Arquivo de backup inválido: metadados ausentes');
        }
        
        if (!data.orders || !Array.isArray(data.orders)) {
            throw new Error('Arquivo de backup inválido: dados de pedidos corrompidos');
        }
        
        // Verificar compatibilidade de versão
        const backupVersion = parseFloat(data.backup.version);
        const currentVersion = parseFloat(this.version);
        
        if (backupVersion > currentVersion) {
            throw new Error(`Versão do backup (${backupVersion}) é mais recente que o sistema atual (${currentVersion})`);
        }
        
        console.log(`✅ Backup válido: versão ${backupVersion}, ${data.orders.length} pedidos`);
        return true;
    }

    /**
     * Confirma importação com o usuário
     */
    async confirmImport(backupData) {
        const stats = backupData.stats || this.calculateStats(backupData.orders);
        const backupDate = new Date(backupData.backup.timestamp).toLocaleString('pt-BR');
        
        const message = `
🔄 IMPORTAR BACKUP

📅 Data do backup: ${backupDate}
📦 Total de pedidos: ${stats.totalOrders}
💰 Faturamento total: R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}
🛒 Itens no carrinho: ${backupData.cart?.length || 0}

⚠️ ATENÇÃO: Esta ação irá:
• Substituir todos os dados atuais
• Criar backup automático dos dados atuais
• Não pode ser desfeita facilmente

Deseja continuar?`;

        return confirm(message);
    }

    /**
     * Cria backup antes da importação
     */
    async createPreImportBackup() {
        try {
            const preImportData = await this.collectAllData();
            const filename = `pre-import-backup-${Date.now()}.json`;
            
            // Salvar no localStorage como emergência
            localStorage.setItem('dcasa_pre_import_backup', JSON.stringify({
                data: preImportData,
                timestamp: new Date().toISOString(),
                filename: filename
            }));
            
            console.log('💾 Backup pré-importação criado');
            
        } catch (error) {
            console.warn('⚠️ Não foi possível criar backup pré-importação:', error);
        }
    }

    /**
     * Restaura dados do backup
     */
    async restoreData(backupData) {
        try {
            let importedOrders = 0;
            let importedCart = 0;
            let importedSettings = 0;

            // Limpar dados atuais
            if (storageManager.isUsingIndexedDB()) {
                await window.restaurantDB.clearAllData();
            } else {
                localStorage.removeItem('dcasa_order_history');
                localStorage.removeItem('dcasa_cart');
            }

            // Importar pedidos
            if (backupData.orders && backupData.orders.length > 0) {
                for (const order of backupData.orders) {
                    try {
                        // Garantir que timestamp é um Date object
                        const orderToImport = {
                            ...order,
                            timestamp: new Date(order.timestamp)
                        };
                        
                        if (storageManager.isUsingIndexedDB()) {
                            await window.restaurantDB.saveOrder(orderToImport);
                        } else {
                            // Fallback para localStorage
                            const existing = localStorage.getItem('dcasa_order_history');
                            const orders = existing ? JSON.parse(existing) : [];
                            orders.push(orderToImport);
                            localStorage.setItem('dcasa_order_history', JSON.stringify(orders));
                        }
                        
                        importedOrders++;
                        
                    } catch (error) {
                        console.warn('⚠️ Erro ao importar pedido:', order, error);
                    }
                }
            }

            // Importar carrinho
            if (backupData.cart && backupData.cart.length > 0) {
                if (storageManager.isUsingIndexedDB()) {
                    await window.restaurantDB.saveCart(backupData.cart);
                } else {
                    localStorage.setItem('dcasa_cart', JSON.stringify(backupData.cart));
                }
                importedCart = backupData.cart.length;
            }

            // Importar configurações
            if (backupData.settings) {
                for (const [key, value] of Object.entries(backupData.settings)) {
                    try {
                        if (storageManager.isUsingIndexedDB()) {
                            await window.restaurantDB.saveSetting(key, value);
                        }
                        importedSettings++;
                    } catch (error) {
                        console.warn('⚠️ Erro ao importar configuração:', key, error);
                    }
                }
            }

            // Recarregar dados na interface
            await this.reloadInterface();

            const result = {
                success: true,
                imported: {
                    orders: importedOrders,
                    cart: importedCart,
                    settings: importedSettings
                },
                backupInfo: backupData.backup
            };

            console.log('🎉 Dados restaurados:', result);
            return result;

        } catch (error) {
            console.error('❌ Erro ao restaurar dados:', error);
            throw error;
        }
    }

    /**
     * Recarrega interface após importação
     */
    async reloadInterface() {
        try {
            // Recarregar dados do sistema
            if (typeof loadStoredData === 'function') {
                await loadStoredData();
            }
            
            // Atualizar displays
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            }
            
            if (typeof updateHistoryStats === 'function') {
                updateHistoryStats();
            }
            
            // Se estiver na aba de histórico, recarregar
            if (typeof renderOrderHistory === 'function') {
                renderOrderHistory();
            }
            
            // Se estiver na aba de analytics, atualizar
            if (typeof updateAnalytics === 'function') {
                await updateAnalytics();
            }
            
            console.log('🔄 Interface recarregada');
            
        } catch (error) {
            console.warn('⚠️ Erro ao recarregar interface:', error);
        }
    }

    /**
     * Recupera backup pré-importação
     */
    async recoverPreImportBackup() {
        try {
            const preImportBackup = localStorage.getItem('dcasa_pre_import_backup');
            if (!preImportBackup) {
                throw new Error('Nenhum backup pré-importação encontrado');
            }

            const backupInfo = JSON.parse(preImportBackup);
            const confirmed = confirm(`
🔄 RECUPERAR BACKUP PRÉ-IMPORTAÇÃO

📅 Data: ${new Date(backupInfo.timestamp).toLocaleString('pt-BR')}

Deseja restaurar os dados anteriores à última importação?
`);

            if (!confirmed) return false;

            await this.restoreData(backupInfo.data);
            
            // Remover backup pré-importação após uso
            localStorage.removeItem('dcasa_pre_import_backup');
            
            alert('✅ Dados anteriores restaurados com sucesso!');
            return true;

        } catch (error) {
            console.error('❌ Erro ao recuperar backup pré-importação:', error);
            alert('❌ Erro ao recuperar backup: ' + error.message);
            return false;
        }
    }

    /**
     * Obtém informações de armazenamento
     */
    async getStorageInfo() {
        try {
            const info = {
                system: storageManager.isUsingIndexedDB() ? 'IndexedDB' : 'localStorage',
                stats: null,
                preImportBackup: !!localStorage.getItem('dcasa_pre_import_backup')
            };

            if (storageManager.isUsingIndexedDB()) {
                info.stats = await window.restaurantDB.getStats();
                
                if ('estimate' in navigator.storage) {
                    const estimate = await navigator.storage.estimate();
                    info.storage = {
                        used: estimate.usage,
                        available: estimate.quota,
                        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
                    };
                }
            }

            return info;

        } catch (error) {
            console.error('❌ Erro ao obter informações de armazenamento:', error);
            return null;
        }
    }
}

// Instância global
window.backupManager = new BackupManager();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupManager;
} 