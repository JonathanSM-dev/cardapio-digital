// Dados do cardápio
const menuData = [
    // Pratos Principais
    {
        id: 1,
        name: "Costela Minga",
        description: "Costela bovina preparada especialmente",
        price: 90.00,
        category: "pratos"
    },
    {
        id: 2,
        name: "Costelinha Suína",
        description: "Costelinha suína saborosa",
        price: 90.00,
        category: "pratos"
    },
    {
        id: 3,
        name: "Frango Recheado Mandioca com Bacon",
        description: "Frango recheado com mandioca e bacon",
        price: 58.00,
        category: "pratos"
    },
    {
        id: 4,
        name: "Frango Recheado Farofa Tradicional",
        description: "Frango recheado com farofa tradicional",
        price: 58.00,
        category: "pratos"
    },
    {
        id: 5,
        name: "Joelho Suíno",
        description: "Joelho suíno bem temperado",
        price: 60.00,
        category: "pratos"
    },
    {
        id: 6,
        name: "Hambúrguer",
        description: "Hambúrguer artesanal",
        price: 34.00,
        category: "pratos"
    },
    {
        id: 7,
        name: "Baguete",
        description: "Baguete recheada",
        price: 34.00,
        category: "pratos"
    },
    
    // Acompanhamentos
    {
        id: 8,
        name: "Linguiçinha",
        description: "Linguiça artesanal (unidade)",
        price: 2.50,
        category: "acompanhamentos"
    },
    {
        id: 9,
        name: "Maionese",
        description: "Maionese caseira",
        price: 12.00,
        category: "acompanhamentos"
    },
    
    // Bebidas
    {
        id: 10,
        name: "Coca Cola 2L",
        description: "Refrigerante Coca-Cola 2 litros",
        price: 15.00,
        category: "bebidas"
    }
];

// Estado da aplicação
let cart = [];
let currentOrder = null;
let orderHistory = [];

// Chaves para armazenamento
const CART_STORAGE_KEY = 'dcasa_cart';
const HISTORY_STORAGE_KEY = 'dcasa_order_history';

// Sistema de armazenamento híbrido (IndexedDB + localStorage fallback)
class StorageManager {
    constructor() {
        this.useIndexedDB = false;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Verificar suporte ao IndexedDB
            if (RestaurantDB.isSupported()) {
                console.log('🗄️ Inicializando sistema de armazenamento avançado...');
                
                await window.restaurantDB.init();
                
                // Verificar se precisa migrar
                const migrationCompleted = await window.restaurantDB.isMigrationCompleted();
                if (!migrationCompleted) {
                    console.log('🔄 Realizando migração automática...');
                    await window.restaurantDB.migrateFromLocalStorage();
                    
                    // Manter localStorage como backup por segurança
                    console.log('✅ Migração concluída, localStorage mantido como backup');
                }
                
                this.useIndexedDB = true;
                console.log('✅ Sistema IndexedDB ativo');
                
                // Mostrar estatísticas
                const stats = await window.restaurantDB.getStats();
                console.log('📊 Estatísticas do banco:', stats);
                
            } else {
                console.warn('⚠️ IndexedDB não suportado, usando localStorage');
                this.useIndexedDB = false;
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização do armazenamento, usando localStorage:', error);
            this.useIndexedDB = false;
            this.isInitialized = true;
        }
    }

    // ==================== OPERAÇÕES DE CARRINHO ====================

    async saveCart(cartItems) {
        if (this.useIndexedDB) {
            try {
                await window.restaurantDB.saveCart(cartItems);
                return;
            } catch (error) {
                console.error('❌ Erro ao salvar carrinho no IndexedDB, usando localStorage:', error);
            }
        }
        
        // Fallback para localStorage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }

    async loadCart() {
        if (this.useIndexedDB) {
            try {
                return await window.restaurantDB.loadCart();
            } catch (error) {
                console.error('❌ Erro ao carregar carrinho do IndexedDB, usando localStorage:', error);
            }
        }
        
        // Fallback para localStorage
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    async clearCart() {
        if (this.useIndexedDB) {
            try {
                await window.restaurantDB.clearCart();
                return;
            } catch (error) {
                console.error('❌ Erro ao limpar carrinho no IndexedDB:', error);
            }
        }
        
        // Fallback para localStorage
        localStorage.removeItem(CART_STORAGE_KEY);
    }

    // ==================== OPERAÇÕES DE HISTÓRICO ====================

    async saveOrder(order) {
        if (this.useIndexedDB) {
            try {
                await window.restaurantDB.saveOrder(order);
                return;
            } catch (error) {
                console.error('❌ Erro ao salvar pedido no IndexedDB, usando localStorage:', error);
            }
        }
        
        // Fallback para localStorage
        const existing = localStorage.getItem(HISTORY_STORAGE_KEY);
        const orders = existing ? JSON.parse(existing) : [];
        orders.push(order);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orders));
    }

    async loadHistory() {
        if (this.useIndexedDB) {
            try {
                return await window.restaurantDB.getTodayOrders();
            } catch (error) {
                console.error('❌ Erro ao carregar histórico do IndexedDB, usando localStorage:', error);
            }
        }
        
        // Fallback para localStorage
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!saved) return [];
        
        try {
            const orders = JSON.parse(saved);
            const today = new Date().toDateString();
            
            return orders
                .filter(order => {
                    const orderDate = new Date(order.timestamp);
                    return orderDate.toDateString() === today;
                })
                .map(order => ({
                    ...order,
                    timestamp: new Date(order.timestamp)
                }));
        } catch (error) {
            console.error('❌ Erro ao processar histórico do localStorage:', error);
            return [];
        }
    }

    async loadHistoryByPeriod(period) {
        if (this.useIndexedDB) {
            try {
                return await window.restaurantDB.getOrdersByPeriod(period);
            } catch (error) {
                console.error('❌ Erro ao carregar histórico por período do IndexedDB:', error);
            }
        }
        
        // Fallback limitado para localStorage (apenas hoje)
        if (period === 'today') {
            return await this.loadHistory();
        }
        
        // Para períodos maiores, retornar dados limitados do localStorage
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!saved) return [];
        
        try {
            const orders = JSON.parse(saved);
            const now = new Date();
            let startDate;
            
            switch(period) {
                case 'week':
                    startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            
            return orders
                .filter(order => {
                    const orderDate = new Date(order.timestamp);
                    return orderDate >= startDate;
                })
                .map(order => ({
                    ...order,
                    timestamp: new Date(order.timestamp)
                }));
        } catch (error) {
            console.error('❌ Erro ao processar histórico por período:', error);
            return [];
        }
    }

    // ==================== UTILITÁRIOS ====================

    async getStorageInfo() {
        if (this.useIndexedDB) {
            try {
                return await window.restaurantDB.getStats();
            } catch (error) {
                console.error('❌ Erro ao obter estatísticas:', error);
            }
        }
        
        // Informações básicas do localStorage
        const cartSize = localStorage.getItem(CART_STORAGE_KEY)?.length || 0;
        const historySize = localStorage.getItem(HISTORY_STORAGE_KEY)?.length || 0;
        
        return {
            storage: 'localStorage',
            cartSize: cartSize,
            historySize: historySize,
            totalSize: cartSize + historySize
        };
    }

    isReady() {
        return this.isInitialized;
    }

    isUsingIndexedDB() {
        return this.useIndexedDB;
    }
}

// Instância global do gerenciador de armazenamento
const storageManager = new StorageManager();

// Elementos DOM
const menuGrid = document.getElementById('menu-grid');
const cartSection = document.getElementById('cart-section');
const checkoutSection = document.getElementById('checkout-section');
const orderConfirmed = document.getElementById('order-confirmed');
const floatingCart = document.getElementById('floating-cart');
const floatingCartText = document.getElementById('floating-cart-text');
const cartItems = document.getElementById('cart-items');
const finalTotal = document.getElementById('final-total');
const orderHistorySection = document.getElementById('order-history');
const historyList = document.getElementById('history-list');
const totalOrders = document.getElementById('total-orders');
const totalRevenue = document.getElementById('total-revenue');
const analyticsSection = document.getElementById('analytics-section');

// Chart instances
let hourlyChart = null;
let weekdayChart = null;
let productsChart = null;
let productTimeChart = null;
let paymentChart = null;
let deliveryChart = null;

// Função para limpar dados corrompidos (debug)
function clearAllStoredData() {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    cart = [];
    orderHistory = [];
    updateCartDisplay();
    updateHistoryStats();
    console.log('Todos os dados armazenados foram limpos');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Inicializar sistema de armazenamento
        await storageManager.init();
        
        // Carregar dados após inicialização
        await loadStoredData();
        
        // Carregar menu e configurar eventos
        loadMenu();
        setupEventListeners();
        
        // Log do sistema ativo
        const storageInfo = await storageManager.getStorageInfo();
        console.log('🎯 Sistema iniciado:', storageInfo);
        
        // Inicializar dashboard
        updateDashboard();
        
        // Mostrar informações do dispositivo na primeira carga
        setTimeout(() => {
            updateDeviceInfo();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        
        // Fallback para localStorage em caso de erro
        loadStoredDataFallback();
        loadMenu();
        setupEventListeners();
    }
});

// Configurar event listeners
function setupEventListeners() {
    // Botões de navegação principal
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Event listeners para sub-navegação
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sub-nav-btn') || e.target.closest('.sub-nav-btn')) {
            const btn = e.target.classList.contains('sub-nav-btn') ? e.target : e.target.closest('.sub-nav-btn');
            const sectionName = btn.getAttribute('data-section');
            if (sectionName) {
                switchSubSection(sectionName);
            }
        }
    });

    // Botões de categoria do menu
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.category-btn.active').classList.remove('active');
            this.classList.add('active');
            
            filterMenu(this.dataset.category);
        });
    });

    // Carrinho flutuante
    floatingCart.addEventListener('click', showCart);

    // Fechar carrinho
    document.getElementById('close-cart').addEventListener('click', hideCart);

    // Fechar carrinho clicando fora
    document.getElementById('cart-overlay').addEventListener('click', hideCart);

    // Botão de checkout
    document.getElementById('checkout-btn').addEventListener('click', showCheckout);

    // Voltar ao carrinho
    document.getElementById('back-to-cart').addEventListener('click', function() {
        hideCheckout();
        showCart();
    });

    // Fechar checkout clicando fora
    document.getElementById('checkout-overlay').addEventListener('click', function() {
        hideCheckout();
    });

    // Formulário de checkout
    document.getElementById('checkout-form').addEventListener('submit', handleOrderSubmit);

    // Campo taxa de entrega
    document.getElementById('delivery-fee').addEventListener('input', updateOrderSummary);

    // Campo desconto
    document.getElementById('discount-value').addEventListener('input', updateOrderSummary);
    document.getElementById('discount-type').addEventListener('change', function() {
        const discountInput = document.getElementById('discount-value');
        if (this.value === 'percent') {
            discountInput.max = '100';
            discountInput.placeholder = '0';
        } else {
            discountInput.removeAttribute('max');
            discountInput.placeholder = '0,00';
        }
        updateOrderSummary();
    });

    // Tipo de atendimento (entrega/retirada)
    document.getElementById('delivery-type').addEventListener('change', function() {
        const deliveryFeeGroup = document.getElementById('delivery-fee-group');
        const deliveryFeeRow = document.getElementById('delivery-fee-row');
        
        if (this.value === 'retirada') {
            deliveryFeeGroup.style.display = 'none';
            deliveryFeeRow.style.display = 'none';
            document.getElementById('delivery-fee').value = '0';
        } else {
            deliveryFeeGroup.style.display = 'block';
            deliveryFeeRow.style.display = 'flex';
            document.getElementById('delivery-fee').value = '9.00';
        }
        updateOrderSummary();
    });

    // Máscara para telefone
    document.getElementById('customer-phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    });

    // Botões da tela de confirmação
    document.getElementById('print-order').addEventListener('click', printOrder);
    document.getElementById('new-order').addEventListener('click', startNewOrder);

    // Seletor de período dos relatórios na aba "Mais Opções" (com verificação de existência)
    const analyticsPerioSelector = document.getElementById('analytics-period');
    if (analyticsPerioSelector) {
        analyticsPerioSelector.addEventListener('change', function() {
            const period = this.value;
            const dateRangeContainer = document.getElementById('date-range-container');
            
            console.log('📅 Período selecionado (Mais Opções):', period);
            
            if (dateRangeContainer) {
                if (period === 'custom') {
                    console.log('📅 Mostrando campos de data personalizada');
                    dateRangeContainer.style.display = 'flex';
                    // Definir datas padrão (última semana)
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
                    
                    const endDateEl = document.getElementById('end-date');
                    const startDateEl = document.getElementById('start-date');
                    
                    if (endDateEl) endDateEl.value = today.toISOString().split('T')[0];
                    if (startDateEl) startDateEl.value = weekAgo.toISOString().split('T')[0];
                } else {
                    dateRangeContainer.style.display = 'none';
                    // Recarregar analytics se estiver visível
                    if (typeof updateAnalytics === 'function') {
                        updateAnalytics();
                    }
                }
            }
        });
    } else {
        console.warn('⚠️ Elemento analytics-period não encontrado');
    }
    
    // Botão aplicar filtro de data (com verificação)
    const applyDateFilterBtn = document.getElementById('apply-date-filter');
    if (applyDateFilterBtn) {
        applyDateFilterBtn.addEventListener('click', async function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('A data inicial deve ser anterior à data final');
            return;
        }
        
            // Atualizar analytics com período personalizado
            if (typeof updateAnalyticsWithCustomDates === 'function') {
                await updateAnalyticsWithCustomDates(startDate, endDate);
            }
        });
    } else {
        console.warn('⚠️ Elemento apply-date-filter não encontrado');
    }

    // Event listeners para backup
    setupBackupEventListeners();

    // Fechar tela de pedido confirmado
    document.getElementById('close-order').addEventListener('click', function() {
        hideAllSections();
    });

    // Fechar clicando fora da tela de pedido
    document.getElementById('order-overlay').addEventListener('click', function() {
        hideAllSections();
    });

    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (cartSection.style.display === 'block') {
                hideCart();
            } else if (checkoutSection.style.display === 'block') {
                hideCheckout();
            } else if (orderConfirmed.style.display === 'block') {
                hideAllSections();
            }
        }
    });
}

// Carregar menu
function loadMenu() {
    renderMenu(menuData);
}

// Renderizar menu
function renderMenu(items) {
    menuGrid.innerHTML = '';
    items.forEach(item => {
        const menuItem = createMenuItemHTML(item);
        menuGrid.appendChild(menuItem);
    });
}

// Criar HTML do item do menu
function createMenuItemHTML(item) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
        <h3>${item.name}</h3>
        <p class="description">${item.description}</p>
        <div class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
        <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
            <i class="fas fa-plus"></i> Adicionar ao Carrinho
        </button>
    `;
    return div;
}

// Filtrar menu por categoria
function filterMenu(category) {
    const filteredItems = category === 'all' ? 
        menuData : 
        menuData.filter(item => item.category === category);
    renderMenu(filteredItems);
}

// Adicionar ao carrinho
function addToCart(itemId) {
    const item = menuData.find(item => item.id === itemId);
    const existingItem = cart.find(cartItem => cartItem.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }

    updateCartDisplay();
    saveCartToStorage();
    showToast(`${item.name} adicionado ao carrinho!`);
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Atualizar carrinho flutuante
    if (totalItems === 0) {
        floatingCart.className = 'floating-cart empty';
        floatingCartText.textContent = 'Carrinho Vazio';
    } else {
        floatingCart.className = 'floating-cart';
        floatingCartText.innerHTML = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} - R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    }

    finalTotal.textContent = totalPrice.toFixed(2).replace('.', ',');
    renderCartItems();
}

// Renderizar itens do carrinho
function renderCartItems() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Seu carrinho está vazio</p>';
        return;
    }

    cart.forEach(item => {
        const cartItem = createCartItemHTML(item);
        cartItems.appendChild(cartItem);
    });
}

// Criar HTML do item do carrinho
function createCartItemHTML(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
        <div class="item-info">
            <h4>${item.name}</h4>
            <div class="item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
        </div>
    `;
    return div;
}

// Atualizar quantidade
function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== itemId);
        }
        
        updateCartDisplay();
        saveCartToStorage();
    }
}

// Mostrar carrinho
function showCart() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio!');
        return;
    }
    
    hideAllSections();
    cartSection.style.display = 'block';
    updateCartDisplay();
}

// Esconder carrinho
function hideCart() {
    cartSection.style.display = 'none';
}

// Mostrar checkout
function showCheckout() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio!');
        return;
    }
    
    hideAllSections();
    checkoutSection.style.display = 'block';
    updateOrderSummary();
}

// Esconder checkout
function hideCheckout() {
    checkoutSection.style.display = 'none';
}

// Atualizar resumo do pedido
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountType = document.getElementById('discount-type').value;
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    
    let discountAmount = 0;
    let discountDisplay = '';
    
    if (discountValue > 0) {
        if (discountType === 'percent') {
            discountAmount = (subtotal * discountValue) / 100;
            discountDisplay = `${discountValue.toFixed(2)}%`;
        } else {
            discountAmount = Math.min(discountValue, subtotal); // Não pode descontar mais que o subtotal
            discountDisplay = `R$ ${discountValue.toFixed(2).replace('.', ',')}`;
        }
    }
    
    const subtotalWithDiscount = subtotal - discountAmount;
    const deliveryFee = parseFloat(document.getElementById('delivery-fee').value) || 0;
    const total = subtotalWithDiscount + deliveryFee;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2).replace('.', ',');
    
    // Mostrar/esconder linha de desconto
    const discountRow = document.getElementById('discount-row');
    if (discountValue > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount-percent-display').textContent = discountDisplay;
        document.getElementById('discount-amount').textContent = discountAmount.toFixed(2).replace('.', ',');
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('delivery-fee-display').textContent = deliveryFee.toFixed(2).replace('.', ',');
    document.getElementById('order-total').textContent = total.toFixed(2).replace('.', ',');
}

// Manipular envio do pedido
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountType = formData.get('discountType');
    const discountValue = parseFloat(formData.get('discountValue')) || 0;
    
    let discountAmount = 0;
    let discountDisplay = '';
    
    if (discountValue > 0) {
        if (discountType === 'percent') {
            discountAmount = (subtotal * discountValue) / 100;
            discountDisplay = `${discountValue.toFixed(2)}%`;
        } else {
            discountAmount = Math.min(discountValue, subtotal);
            discountDisplay = `R$ ${discountValue.toFixed(2).replace('.', ',')}`;
        }
    }
    
    const subtotalWithDiscount = subtotal - discountAmount;
    const deliveryFee = parseFloat(formData.get('deliveryFee')) || 0;
    const total = subtotalWithDiscount + deliveryFee;
    
    currentOrder = {
        id: Date.now(),
        items: [...cart],
        customer: {
            name: formData.get('customerName'),
            phone: formData.get('customerPhone'),
            address: formData.get('deliveryAddress'),
        },
        delivery: {
            type: formData.get('deliveryType'),
            fee: deliveryFee
        },
        payment: {
            method: formData.get('paymentMethod')
        },
        pricing: {
            subtotal: subtotal,
            discountType: discountType,
            discountValue: discountValue,
            discountAmount: discountAmount,
            discountDisplay: discountDisplay,
            subtotalWithDiscount: subtotalWithDiscount,
            deliveryFee: deliveryFee,
            total: total
        },
        notes: formData.get('orderNotes'),
        timestamp: new Date()
    };
    
    showOrderConfirmation();
            await saveOrderToHistory();
}

// Mostrar confirmação do pedido
function showOrderConfirmation() {
    hideAllSections();
    orderConfirmed.style.display = 'block';
    
    const orderDetails = document.getElementById('order-details');
    orderDetails.innerHTML = createOrderDetailsHTML();
    
    // Scroll para o topo da tela de pedido
    setTimeout(() => {
        const orderBody = document.querySelector('.order-body');
        if (orderBody) {
            orderBody.scrollTop = 0;
        }
    }, 100);
}

// Criar HTML dos detalhes do pedido
function createOrderDetailsHTML() {
    return `
        <h3>Detalhes do Pedido #${currentOrder.id}</h3>
        <div class="order-info">
            <div class="info-group">
                <h4>Cliente</h4>
                <p><strong>${currentOrder.customer.name}</strong></p>
                <p>${currentOrder.customer.phone}</p>
            </div>
            <div class="info-group">
                <h4>${currentOrder.delivery.type === 'entrega' ? 'Endereço de Entrega' : 'Retirada no Local'}</h4>
                <p>${currentOrder.delivery.type === 'entrega' ? currentOrder.customer.address : 'Cliente retirará no estabelecimento'}</p>
            </div>
            <div class="info-group">
                <h4>Pagamento</h4>
                <p><strong>${currentOrder.payment.method.toUpperCase()}</strong></p>
            </div>
            <div class="info-group">
                <h4>Data e Hora</h4>
                <p>${currentOrder.timestamp.toLocaleDateString('pt-BR')}</p>
                <p>${currentOrder.timestamp.toLocaleTimeString('pt-BR')}</p>
            </div>
        </div>
        
        <div class="order-items-list">
            <h4>Itens do Pedido</h4>
            ${currentOrder.items.map(item => `
                <div class="order-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="order-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>R$ ${currentOrder.pricing.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            ${currentOrder.pricing.discountValue > 0 ? `
                <div class="summary-row">
                    <span>Desconto (${currentOrder.pricing.discountDisplay}):</span>
                    <span style="color: #dc3545;">- R$ ${currentOrder.pricing.discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
            ` : ''}
            ${currentOrder.delivery.type === 'entrega' ? `
                <div class="summary-row">
                    <span>Taxa de Entrega:</span>
                    <span>R$ ${currentOrder.pricing.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
            ` : ''}
            <div class="summary-row total-row">
                <span>Total:</span>
                <span>R$ ${(currentOrder.pricing?.total || 0).toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
        
        ${currentOrder.notes ? `
            <div class="info-group">
                <h4>Observações</h4>
                <p>${currentOrder.notes}</p>
            </div>
        ` : ''}
    `;
}

// Função de impressão térmica inteligente
function printOrder() {
    // Verificar se QZ Tray está disponível
    if (window.thermalPrinter && window.thermalPrinter.isQZReady && currentOrder) {
        console.log('🖨️ Imprimindo via QZ Tray (impressão térmica profissional)');
        window.thermalPrinter.printReceipt(currentOrder);
        return;
    }
    
    // Fallback para impressão padrão do navegador
    console.log('📄 Usando impressão padrão do navegador');
    const printArea = document.getElementById('print-area');
    
    printArea.innerHTML = createThermalPrintHTML();
    printArea.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        printArea.style.display = 'none';
    }, 100);
}

// Função para criar HTML térmico compacto
function createThermalPrintHTML() {
    // Função para quebra de linha inteligente (igual ao QZ Tray)
    const formatLineWithBreak = (label, text, maxLineLength = 30) => {
        if (!text) return '';
        
        const fullLine = `${label} ${text}`;
        
        if (fullLine.length <= maxLineLength) {
            return `<p>${fullLine}</p>`;
        } else {
            // Quebrar linha - label na primeira linha, texto continua na segunda
            if (text.length <= maxLineLength) {
                return `<p>${label}</p><p>${text}</p>`;
            } else {
                // Texto muito longo - quebrar em múltiplas linhas
                let result = `<p>${label}</p>`;
                let remainingText = text;
                
                while (remainingText.length > maxLineLength) {
                    const breakPoint = remainingText.lastIndexOf(' ', maxLineLength);
                    if (breakPoint > 0) {
                        result += `<p>${remainingText.substring(0, breakPoint)}</p>`;
                        remainingText = remainingText.substring(breakPoint + 1);
                    } else {
                        // Forçar quebra se não houver espaço
                        result += `<p>${remainingText.substring(0, maxLineLength)}</p>`;
                        remainingText = remainingText.substring(maxLineLength);
                    }
                }
                
                if (remainingText.length > 0) {
                    result += `<p>${remainingText}</p>`;
                }
                
                return result;
            }
        }
    };
    
    // Data/hora compacta
    const dateTime = `${currentOrder.timestamp.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    })} ${currentOrder.timestamp.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    })}`;
    
    return `
        <div class="receipt">
            <div class="receipt-header">
                <h2>D'CASA & CIA ASSADOS</h2>
                <p>COMANDA</p>
                <p>========================</p>
            </div>
            
            <div class="receipt-info">
                <p><strong>PEDIDO: #${currentOrder.id}</strong></p>
                <p>${dateTime}</p>
                <p>------------------------</p>
                ${formatLineWithBreak('CLIENTE:', currentOrder.customer.name)}
                ${formatLineWithBreak('FONE:', currentOrder.customer.phone)}
                <p>PAGTO: ${currentOrder.payment.method.toUpperCase()}</p>
                ${currentOrder.delivery.type === 'entrega' ? 
                    formatLineWithBreak('ENDERECO:', currentOrder.customer.address) : 
                    '<p>RETIRADA NO LOCAL</p>'
                }
                ${currentOrder.notes ? formatLineWithBreak('OBS:', currentOrder.notes) : ''}
                <p>------------------------</p>
            </div>
            
            <div class="receipt-items">
                <p><strong>ITENS DO PEDIDO:</strong></p>
                ${currentOrder.items.map(item => {
                    const itemName = item.name; // Nome completo sem truncar
                    const price = `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`;
                    const quantity = `${item.quantity}x `;
                    
                    // Sempre quebrar em duas linhas para garantir que não haja reticências
                    return `
                        <div class="receipt-item">
                            <p>${quantity}${itemName}</p>
                            <p style="text-align: right; margin-top: 0;">${price}</p>
                        </div>
                    `;
                }).join('')}
                <p>------------------------</p>
            </div>
            
            <div class="receipt-total">
                <p>SUBTOTAL: R$ ${currentOrder.pricing.subtotal.toFixed(2).replace('.', ',')}</p>
                ${currentOrder.pricing.discountValue > 0 ? `
                    <p>DESCONTO: -R$ ${currentOrder.pricing.discountAmount.toFixed(2).replace('.', ',')}</p>
                ` : ''}
                ${currentOrder.delivery.type === 'entrega' ? `
                    <p>ENTREGA: R$ ${currentOrder.pricing.deliveryFee.toFixed(2).replace('.', ',')}</p>
                ` : ''}
                <p>========================</p>
                <p style="font-size: 14px; font-weight: bold;">TOTAL: R$ ${(currentOrder.pricing?.total || 0).toFixed(2).replace('.', ',')}</p>
                <p>========================</p>
            </div>
            
            <div style="text-align: center; margin-top: 2mm;">
                <p>Obrigado pela preferencia!</p>
                <p>Volte sempre!</p>
            </div>
        </div>
    `;
}

// Função para detectar tipo de dispositivo
function detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detectar tipo de dispositivo
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent);
    
    // Detectar tamanho da tela
    let deviceType = 'desktop';
    let printFormat = 'A4';
    
    if (width <= 480) {
        deviceType = 'thermal'; // Impressora térmica ou tela muito pequena
        printFormat = '80mm';
    } else if (width <= 768 || isMobile) {
        deviceType = 'mobile';
        printFormat = 'A5';
    } else if (width <= 1024 || isTablet) {
        deviceType = 'tablet';
        printFormat = 'A4-portrait';
    } else {
        deviceType = 'desktop';
        printFormat = 'A4';
    }
    
    return {
        type: deviceType,
        format: printFormat,
        width: width,
        height: height,
        isMobile: isMobile,
        isTablet: isTablet,
        isTouch: 'ontouchstart' in window
    };
}

// Função para ajustar conteúdo da impressão baseado no dispositivo
function createAdaptivePrintHTML() {
    const device = detectDevice();
    
    // Ajustar conteúdo baseado no dispositivo
    let titleSize = device.type === 'thermal' ? 'COMANDA' : 'COMANDA DE PEDIDO';
    let separator = device.type === 'thermal' ? '========================' : '================================';
    let itemSeparator = device.type === 'thermal' ? '------------------------' : '--------------------------------';
    
    // Formatação de data/hora baseada no espaço disponível
    let dateTime;
    if (device.type === 'thermal') {
        dateTime = `${currentOrder.timestamp.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        })} ${currentOrder.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    } else {
        dateTime = `${currentOrder.timestamp.toLocaleDateString('pt-BR')} ${currentOrder.timestamp.toLocaleTimeString('pt-BR')}`;
    }
    
    // Truncar texto longo em dispositivos pequenos
    const truncateText = (text, maxLength) => {
        if (device.type === 'thermal' && text.length > maxLength) {
            return text.substring(0, maxLength - 3) + '...';
        }
        return text;
    };
    
    return `
        <div class="receipt" data-device="${device.type}" data-format="${device.format}">
            <div class="receipt-header">
                <h2>D'CASA & CIA ASSADOS</h2>
                <p>${titleSize}</p>
                <p>${separator}</p>
            </div>
            
            <div class="receipt-info">
                <p><strong>PEDIDO: #${currentOrder.id}</strong></p>
                <p>${dateTime}</p>
                <p>${itemSeparator}</p>
                <p>CLIENTE: ${truncateText(currentOrder.customer.name, 25)}</p>
                <p>FONE: ${currentOrder.customer.phone}</p>
                <p>PAGTO: ${currentOrder.payment.method.toUpperCase()}</p>
                ${currentOrder.delivery.type === 'entrega' ? 
                    `<p>ENDERECO: ${truncateText(currentOrder.customer.address, device.type === 'thermal' ? 30 : 50)}</p>` : 
                    '<p>RETIRADA NO LOCAL</p>'
                }
                ${currentOrder.notes ? `<p>OBS: ${truncateText(currentOrder.notes, device.type === 'thermal' ? 25 : 40)}</p>` : ''}
                <p>${itemSeparator}</p>
            </div>
            
            <div class="receipt-items">
                <p><strong>ITENS DO PEDIDO:</strong></p>
                ${currentOrder.items.map(item => {
                    const itemName = truncateText(item.name, device.type === 'thermal' ? 15 : 25);
                    return `
                        <div class="receipt-item">
                            <span>${item.quantity}x ${itemName}</span>
                            <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        </div>
                    `;
                }).join('')}
                <p>${itemSeparator}</p>
            </div>
            
            <div class="receipt-total">
                <div class="receipt-item">
                    <span>SUBTOTAL:</span>
                    <span>R$ ${currentOrder.pricing.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                ${currentOrder.pricing.discountValue > 0 ? `
                    <div class="receipt-item">
                        <span>DESCONTO (${currentOrder.pricing.discountDisplay}):</span>
                        <span>-R$ ${currentOrder.pricing.discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                ` : ''}
                ${currentOrder.delivery.type === 'entrega' ? `
                    <div class="receipt-item">
                        <span>TAXA ENTREGA:</span>
                        <span>R$ ${currentOrder.pricing.deliveryFee.toFixed(2).replace('.', ',')}</span>
                    </div>
                ` : ''}
                <p>${separator}</p>
                <div class="receipt-item" style="font-weight: bold; font-size: ${device.type === 'thermal' ? '8px' : '14px'};">
                    <span>TOTAL:</span>
                    <span>R$ ${(currentOrder.pricing?.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <p>${separator}</p>
            </div>
            
            <div style="text-align: center; margin-top: ${device.type === 'thermal' ? '10px' : '15px'};">
                <p>Obrigado pela preferencia!</p>
                <p>Volte sempre!</p>
                ${device.type !== 'thermal' ? '<p>📱 WhatsApp: (11) 99999-9999</p>' : ''}
            </div>
        </div>
    `;
}



// Iniciar novo pedido
function startNewOrder() {
    cart = [];
    currentOrder = null;
    
    // Limpar formulário
    document.getElementById('checkout-form').reset();
    document.getElementById('delivery-fee').value = '9.00';
    document.getElementById('discount-value').value = '0';
    document.getElementById('discount-type').value = 'percent';
    document.getElementById('delivery-type').value = 'entrega';
    
    // Mostrar campos de entrega por padrão
    document.getElementById('delivery-fee-group').style.display = 'block';
    document.getElementById('delivery-fee-row').style.display = 'flex';
    
    // Voltar para o menu
    hideAllSections();
    switchTab('menu');
    
    // Reativar categoria "Todos"
    document.querySelector('.category-btn.active').classList.remove('active');
    document.querySelector('[data-category="all"]').classList.add('active');
    
    updateCartDisplay();
    saveCartToStorage();
    
    showToast('Novo pedido iniciado!');
}

// Esconder todas as seções
function hideAllSections() {
    cartSection.style.display = 'none';
    checkoutSection.style.display = 'none';
    orderConfirmed.style.display = 'none';
}

// Funções de armazenamento local
async function saveCartToStorage() {
    try {
        await storageManager.saveCart(cart);
    } catch (error) {
        console.error('❌ Erro ao salvar carrinho:', error);
    }
}

async function loadCartFromStorage() {
    try {
        cart = await storageManager.loadCart();
        updateCartDisplay();
    } catch (error) {
        console.error('❌ Erro ao carregar carrinho:', error);
        cart = [];
    }
}

async function saveOrderToHistory() {
    if (!currentOrder) return;
    
    // Adicionar timestamp único para o ID
    const orderWithId = {
        ...currentOrder,
        id: Date.now(),
        sequentialId: getNextSequentialId()
    };
    
    try {
        await storageManager.saveOrder(orderWithId);
        orderHistory.unshift(orderWithId); // Adiciona no início (mais recente primeiro)
        
        // Manter apenas pedidos do dia atual na memória
        const today = new Date().toDateString();
        orderHistory = orderHistory.filter(order => {
            const orderDate = order.timestamp instanceof Date ? 
                order.timestamp : new Date(order.timestamp);
            return orderDate.toDateString() === today;
        });
        
        updateHistoryStats();
        
        // Atualizar dashboard da aba "Hoje" imediatamente
        // Forçar atualização incluindo o pedido recém-criado
        updateDashboardWithNewOrder(orderWithId);
        
        // Atualizar analytics se estiver sendo visualizado
        if (document.getElementById('analytics-main-section') && 
            document.getElementById('analytics-main-section').style.display !== 'none') {
            updateMainAnalytics();
        }
        
        // Atualizar analytics da sub-seção se estiver sendo visualizada
        if (document.getElementById('analytics-section') && 
            document.getElementById('analytics-section').style.display !== 'none') {
            updateAnalytics();
        }
        
        // Atualizar histórico principal se estiver sendo visualizado
        if (document.getElementById('history-tab') && 
            document.getElementById('history-tab').classList.contains('active')) {
            updateMainHistoryStats();
            renderOrderHistory();
        }
        
        // Limpar carrinho após salvar o pedido
        cart = [];
        updateCartDisplay();
        saveCartToStorage();
        
        console.log('✅ Pedido salvo e carrinho limpo');
        
    } catch (error) {
        console.error('❌ Erro ao salvar pedido no histórico:', error);
    }
}

async function loadHistoryFromStorage() {
    try {
        orderHistory = await storageManager.loadHistory();
        updateHistoryStats();
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        orderHistory = [];
        updateHistoryStats();
    }
}

function getNextSequentialId() {
    const today = new Date().toDateString();
    const todayOrders = orderHistory.filter(order => {
        const orderDate = order.timestamp instanceof Date ? 
            order.timestamp : new Date(order.timestamp);
        return orderDate.toDateString() === today;
    });
    return todayOrders.length + 1;
}

async function loadStoredData() {
    await loadCartFromStorage();
    await loadHistoryFromStorage();
}

// Função de fallback para localStorage (caso IndexedDB falhe)
function loadStoredDataFallback() {
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
    
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            orderHistory = parsedHistory
                .filter(order => order && order.timestamp && order.items)
                .map(order => ({
                    ...order,
                    timestamp: new Date(order.timestamp),
                    sequentialId: order.sequentialId || 1
                }));
            
            // REMOVIDO: Filtro incorreto que limitava apenas pedidos de hoje
            // Agora carrega TODOS os pedidos, deixando o filtro para as funções específicas
            
            updateHistoryStats();
        } catch (error) {
            console.error('❌ Erro no fallback do histórico:', error);
            orderHistory = [];
        }
    }
}

// Funções de histórico

// Função para a aba principal de histórico
async function showMainHistoryTab() {
    console.log('📋 Carregando aba principal de histórico...');
    
    try {
        await loadHistoryFromStorage();
        await renderMainHistoryTab();
        await updateMainHistoryStats();
        console.log('✅ Aba principal de histórico carregada');
        
    } catch (error) {
        console.error('❌ Erro ao carregar aba principal de histórico:', error);
        orderHistory = [];
        await renderMainHistoryTab();
    }
}

// Função para a sub-seção de histórico na aba "Mais Opções"
async function showOrderHistory() {
    console.log('📋 Carregando histórico de pedidos (sub-seção)...');
    
    try {
        // Usar a função padrão de carregamento para manter consistência
        await loadHistoryFromStorage();
        
        await renderOrderHistory();
        await updateHistoryStatsFromBackupLogic();
        console.log('✅ Histórico carregado e estatísticas atualizadas');
        
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        orderHistory = [];
        await renderOrderHistory();
    }
}

function hideOrderHistory() {
    menuGrid.style.display = 'grid';
    orderHistorySection.style.display = 'none';
}

// Funções de gerenciamento de abas
function switchTab(tabName) {
    // Remover active de todas as abas
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Ocultar todo o conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Ativar a aba clicada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Mostrar o conteúdo da aba correspondente
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
        
        // Executar ações específicas da aba
        if (tabName === 'dashboard') {
            updateDashboard();
        } else if (tabName === 'more') {
            // Default to history subsection
            switchSubSection('history');
        } else if (tabName === 'history') {
            showMainHistoryTab();
        } else if (tabName === 'analytics') {
            showMainAnalytics();
        } else if (tabName === 'backup') {
            showBackup();
        }
    }
}

// Dashboard functionality
async function updateDashboard() {
    try {
        // Buscar pedidos de hoje de forma mais direta
        let todayOrders = [];
        
        try {
            // Tentar usar o storageManager primeiro
            const allOrders = await storageManager.loadHistory();
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            todayOrders = allOrders.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= startOfDay && orderDate <= endOfDay;
            });
        } catch (storageError) {
            console.warn('Erro no storage, usando dados em memória:', storageError);
            // Fallback para dados em memória
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            todayOrders = orderHistory.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= startOfDay && orderDate <= endOfDay;
            });
        }
        
        // Calcular estatísticas
        const totalRevenue = todayOrders.reduce((sum, order) => {
            const orderTotal = order.pricing?.total || 0;
            console.log('📊 Pedido:', order.id, 'Total:', orderTotal);
            return sum + orderTotal;
        }, 0);
        const totalOrders = todayOrders.length;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Atualizar cards de estatísticas
        const revenueEl = document.getElementById('today-revenue');
        const ordersEl = document.getElementById('today-orders');
        const avgEl = document.getElementById('today-avg');
        
        if (revenueEl) revenueEl.textContent = `R$ ${totalRevenue.toFixed(2)}`;
        if (ordersEl) ordersEl.textContent = totalOrders;
        if (avgEl) avgEl.textContent = `R$ ${avgTicket.toFixed(2)}`;
        
        // Atualizar preview dos pedidos
        updateTodayOrdersPreview(todayOrders.slice(-5)); // Últimos 5 pedidos
        
        console.log('✅ Dashboard atualizado:', { totalOrders, totalRevenue, avgTicket });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
        
        // Fallback com valores zerados
        const revenueEl = document.getElementById('today-revenue');
        const ordersEl = document.getElementById('today-orders');
        const avgEl = document.getElementById('today-avg');
        
        if (revenueEl) revenueEl.textContent = 'R$ 0,00';
        if (ordersEl) ordersEl.textContent = '0';
        if (avgEl) avgEl.textContent = 'R$ 0,00';
        
        updateTodayOrdersPreview([]);
    }
}

// Atualizar dashboard incluindo pedido recém-criado
async function updateDashboardWithNewOrder(newOrder) {
    try {
        // Buscar pedidos de hoje
        let todayOrders = [];
        
        try {
            const allOrders = await storageManager.loadHistory();
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            todayOrders = allOrders.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= startOfDay && orderDate <= endOfDay;
            });
        } catch (storageError) {
            console.warn('Erro no storage, usando dados em memória:', storageError);
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            todayOrders = orderHistory.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= startOfDay && orderDate <= endOfDay;
            });
        }
        
        // Garantir que o pedido recém-criado esteja incluído
        if (newOrder && !todayOrders.find(order => order.id === newOrder.id)) {
            todayOrders.unshift(newOrder);
        }
        
        // Calcular estatísticas
        const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
        const totalOrders = todayOrders.length;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Atualizar cards de estatísticas
        const revenueEl = document.getElementById('today-revenue');
        const ordersEl = document.getElementById('today-orders');
        const avgEl = document.getElementById('today-avg');
        
        if (revenueEl) revenueEl.textContent = `R$ ${totalRevenue.toFixed(2)}`;
        if (ordersEl) ordersEl.textContent = totalOrders;
        if (avgEl) avgEl.textContent = `R$ ${avgTicket.toFixed(2)}`;
        
        // Atualizar preview dos pedidos (últimos 5, com o mais recente primeiro)
        const sortedOrders = todayOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        updateTodayOrdersPreview(sortedOrders.slice(0, 5));
        
        console.log('✅ Dashboard atualizado com pedido recém-criado:', { totalOrders, totalRevenue, avgTicket });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard com novo pedido:', error);
        // Fallback para função normal
        updateDashboard();
    }
}

// Atualizar preview dos pedidos de hoje
function updateTodayOrdersPreview(orders) {
    const container = document.getElementById('today-orders-preview');
    
    if (!container) {
        console.warn('Container today-orders-preview não encontrado');
        return;
    }
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum pedido hoje ainda</p>
                <button class="action-btn primary" onclick="switchTab('menu')" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Criar Primeiro Pedido
                </button>
            </div>
        `;
        return;
    }
    
    try {
        container.innerHTML = orders.map(order => {
            // Validar dados do pedido
            const orderId = order.id ? order.id.toString().slice(-4) : 'N/A';
            const orderTime = order.timestamp ? 
                new Date(order.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                'N/A';
            const orderTotal = (order.pricing?.total || 0).toFixed(2);
            const deliveryType = (order.delivery?.type === 'entrega') ? '🏍️ Entrega' : '🏪 Retirada';
            const customerName = order.customer?.name || 'Cliente';
            
            // Criar lista resumida de itens (máximo 3 itens)
            const itemsSummary = order.items ? order.items.slice(0, 3).map(item => 
                `${item.quantity}x ${item.name}`
            ).join(', ') + (order.items.length > 3 ? '...' : '') : 'Sem itens';
            
            return `
                <div class="dashboard-order-item" style="
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <strong style="color: #2c3e50; font-size: 0.95rem;">#${orderId}</strong>
                                <span style="color: #6c757d; font-size: 0.85rem;">${orderTime}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                                <i class="fas fa-user" style="color: #6c757d; font-size: 0.8rem;"></i>
                                <span style="color: #495057;">${customerName}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #28a745; font-size: 1rem;">R$ ${orderTotal}</div>
                            <div style="font-size: 0.8rem; color: #6c757d;">${deliveryType}</div>
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8f9fa;
                        border-radius: 4px;
                        padding: 0.5rem;
                        font-size: 0.85rem;
                        color: #495057;
                        border-left: 3px solid #dc3545;
                    ">
                        <strong>Itens:</strong> ${itemsSummary}
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Preview de pedidos atualizado:', orders.length + ' pedidos');
        
    } catch (error) {
        console.error('❌ Erro ao renderizar preview de pedidos:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Erro ao carregar pedidos</p>
            </div>
        `;
    }
}

// Funções de ação rápida
function showTodayOrders() {
    switchTab('more');
    switchSubSection('history');
}

function showQuickStats() {
    switchTab('more');
    switchSubSection('analytics');
}

// Sub-navigation functionality for "More" section
function switchSubSection(sectionName) {
    // Remove active class from all sub-nav buttons and sub-sections
    document.querySelectorAll('.sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sub-section').forEach(section => section.classList.remove('active'));
    
    // Add active class to selected sub-nav button and sub-section
    const selectedBtn = document.querySelector(`[data-section="${sectionName}"]`);
    const selectedSection = document.getElementById(`${sectionName}-subsection`);
    
    if (selectedBtn && selectedSection) {
        selectedBtn.classList.add('active');
        selectedSection.classList.add('active');
        
        // Load specific content based on sub-section
        if (sectionName === 'analytics') {
            showAnalytics();
        } else if (sectionName === 'backup') {
            showBackup();
        } else if (sectionName === 'history') {
            showOrderHistory();
        }
    }
}

// Funções de analytics

// Função para a aba principal de Analytics
async function showMainAnalytics() {
    console.log('📊 Carregando aba principal de analytics...');
    await updateMainAnalytics();
    console.log('✅ Aba principal de analytics carregada');
}

// Função para a sub-seção de Analytics na aba "Mais Opções"
async function showAnalytics() {
    console.log('📊 Carregando relatórios e análises (sub-seção)...');
    await updateAnalytics();
    console.log('✅ Relatórios carregados com sucesso');
}

function hideAnalytics() {
    // Função mantida para compatibilidade, mas não é mais necessária
}

// Funções de backup
async function showBackup() {
    await updateBackupInterface();
}

async function updateBackupInterface() {
    try {
        // Atualizar estatísticas de exportação
        const storageInfo = await storageManager.getStorageInfo();
        
        if (storageInfo) {
            // Sistema de armazenamento
            document.getElementById('storage-system').textContent = 
                storageManager.isUsingIndexedDB() ? 'IndexedDB' : 'localStorage';
            
            // Estatísticas básicas
            const orders = await storageManager.loadHistory();
            const cart = await storageManager.loadCart();
            const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
            
            document.getElementById('total-orders-backup').textContent = orders.length;
            document.getElementById('total-revenue-backup').textContent = 
                `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
            document.getElementById('cart-items-backup').textContent = `${cart.length} itens`;
            
            // Informações detalhadas
            document.getElementById('detail-system').textContent = 
                storageManager.isUsingIndexedDB() ? 'IndexedDB' : 'localStorage';
            document.getElementById('detail-orders').textContent = orders.length;
            
            // Uso de armazenamento
            if (storageInfo.storage) {
                const usedMB = (storageInfo.storage.used / 1024 / 1024).toFixed(2);
                document.getElementById('storage-usage').textContent = `${usedMB} MB`;
                document.getElementById('detail-space').textContent = 
                    `${usedMB} MB (${storageInfo.storage.percentage}%)`;
            } else {
                document.getElementById('storage-usage').textContent = 'N/A';
                document.getElementById('detail-space').textContent = 'Não disponível';
            }
        }
        
        // Verificar backup de emergência
        const hasPreImportBackup = localStorage.getItem('dcasa_pre_import_backup');
        const recoveryBtn = document.getElementById('recovery-backup-btn');
        const recoveryStatus = document.getElementById('recovery-status');
        
        if (hasPreImportBackup) {
            recoveryBtn.disabled = false;
            recoveryStatus.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Backup de emergência disponível</span>
            `;
        } else {
            recoveryBtn.disabled = true;
            recoveryStatus.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Nenhum backup de emergência encontrado</span>
            `;
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar interface de backup:', error);
    }
}

function setupBackupEventListeners() {
    // Botão de exportar backup
    document.getElementById('export-backup-btn').addEventListener('click', async function() {
        try {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando backup...';
            
            const result = await window.backupManager.exportFullBackup();
            
            if (result.success) {
                alert(`✅ Backup criado com sucesso!\n\nArquivo: ${result.filename}\nTamanho: ${(result.size / 1024).toFixed(2)} KB`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao exportar backup:', error);
            alert('❌ Erro ao criar backup: ' + error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-download"></i> Criar Backup Completo';
        }
    });

    // Área de upload de arquivo
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('backup-file-input');
    const importBtn = document.getElementById('import-backup-btn');

    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Seleção de arquivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (!file.name.endsWith('.json')) {
            alert('❌ Formato inválido. Selecione apenas arquivos .json');
            return;
        }

        // Atualizar interface
        fileUploadArea.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <p>Arquivo selecionado:</p>
            <span><strong>${file.name}</strong></span>
            <br><small>${(file.size / 1024).toFixed(2)} KB</small>
        `;

        importBtn.disabled = false;
        
        // Armazenar arquivo para importação
        importBtn.selectedFile = file;
    }

    // Botão de importar backup
    importBtn.addEventListener('click', async function() {
        if (!this.selectedFile) {
            alert('❌ Nenhum arquivo selecionado');
            return;
        }

        try {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando backup...';
            
            const result = await window.backupManager.importBackup(this.selectedFile);
            
            if (result.success) {
                alert(`✅ Backup importado com sucesso!\n\nPedidos: ${result.imported.orders}\nCarrinho: ${result.imported.cart} itens\nConfigurações: ${result.imported.settings}`);
                
                // Atualizar interface
                await updateBackupInterface();
                
                // Se estiver em outra aba, atualizar também
                if (typeof updateHistoryStats === 'function') {
                    updateHistoryStats();
                }
            } else {
                alert('ℹ️ ' + result.message);
            }
            
        } catch (error) {
            console.error('❌ Erro ao importar backup:', error);
            alert('❌ Erro ao importar backup: ' + error.message);
        } finally {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-upload"></i> Importar Backup';
            this.selectedFile = null;
            
            // Resetar área de upload
            fileUploadArea.innerHTML = `
                <div class="upload-placeholder">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Clique para selecionar arquivo de backup</p>
                    <span>Apenas arquivos .json</span>
                </div>
            `;
        }
    });

    // Botão de recuperação de emergência
    document.getElementById('recovery-backup-btn').addEventListener('click', async function() {
        try {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recuperando...';
            
            const success = await window.backupManager.recoverPreImportBackup();
            
            if (success) {
                // Atualizar interface
                await updateBackupInterface();
                
                // Atualizar outras interfaces
                if (typeof updateHistoryStats === 'function') {
                    updateHistoryStats();
                }
            }
            
        } catch (error) {
            console.error('❌ Erro na recuperação:', error);
        } finally {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-undo"></i> Recuperar Dados Anteriores';
        }
    });

    // Botão de atualizar informações
    document.getElementById('refresh-info-btn').addEventListener('click', async function() {
        try {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
            
            await updateBackupInterface();
            
        } catch (error) {
            console.error('❌ Erro ao atualizar informações:', error);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar Informações';
        }
    });
}

// Função para atualizar analytics da aba principal
async function updateMainAnalytics() {
    try {
        const periodSelector = document.getElementById('analytics-main-period');
        const period = periodSelector ? periodSelector.value : 'today';
        
        console.log(`📊 Carregando analytics principal para período: ${period}`);
        
        const filteredOrders = await getFilteredOrders(period);
        console.log(`📊 Pedidos filtrados (aba principal):`, filteredOrders.length, filteredOrders);
        
        updateMainKPIs(filteredOrders);
        updateMainCharts(filteredOrders);
        
        console.log('✅ Analytics principal atualizado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao atualizar analytics principal:', error);
    }
}

// Função para atualizar analytics da sub-seção "Mais Opções"
async function updateAnalytics() {
    try {
        const periodSelector = document.getElementById('analytics-period');
        const period = periodSelector ? periodSelector.value : 'today';
        
        console.log(`📊 Carregando analytics (sub-seção) para período: ${period}`);
        
        const filteredOrders = await getFilteredOrders(period);
        console.log(`📊 Pedidos filtrados (sub-seção):`, filteredOrders.length, filteredOrders);
        
        updateKPIs(filteredOrders);
        updateCharts(filteredOrders);
        
        console.log('✅ Analytics da sub-seção atualizado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao atualizar analytics da sub-seção:', error);
        // Debug: verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não está carregado!');
        }
    }
}

async function updateAnalyticsWithCustomDates(startDate, endDate) {
    console.log(`📊 Atualizando analytics para período: ${startDate} até ${endDate}`);
    
    const filteredOrders = await getCustomFilteredOrders(startDate, endDate);
    
    // Atualizar título do header
    const header = document.querySelector('.analytics-header h3');
    const start = new Date(startDate).toLocaleDateString('pt-BR');
    const end = new Date(endDate).toLocaleDateString('pt-BR');
    header.innerHTML = `<i class="fas fa-chart-bar"></i> Relatórios e Análises - ${start} até ${end}`;
    
    updateKPIs(filteredOrders);
    updateCharts(filteredOrders);
    
    console.log(`✅ Analytics atualizado com ${filteredOrders.length} pedidos`);
}

async function getFilteredOrders(period) {
    try {
        let allOrders = [];
        
        // Usar exatamente a mesma lógica que o backup para buscar pedidos
        if (storageManager.isUsingIndexedDB()) {
            // IndexedDB - buscar todos os pedidos (como o backup faz)
            allOrders = await window.restaurantDB.getOrders();
            console.log(`📊 Pedidos carregados do IndexedDB: ${allOrders.length}`);
        } else {
            // localStorage fallback (como o backup faz)
            const savedHistory = localStorage.getItem('dcasa_order_history');
            if (savedHistory) {
                allOrders = JSON.parse(savedHistory);
                console.log(`📊 Pedidos carregados do localStorage: ${allOrders.length}`);
            } else {
                allOrders = [];
            }
        }
        
        console.log(`📊 Filtrando ${allOrders.length} pedidos para período: ${period}`);
        console.log(`📊 Dados dos pedidos:`, allOrders.slice(0, 2)); // Mostrar primeiros 2 pedidos para debug
        
        // Filtrar por período
        if (period === 'today') {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            console.log(`📊 Filtrando para hoje: ${startOfDay.toISOString()} até ${endOfDay.toISOString()}`);
            
            const filtered = allOrders.filter(order => {
                const orderDate = new Date(order.timestamp);
                const isToday = orderDate >= startOfDay && orderDate <= endOfDay;
                if (allOrders.length <= 5) { // Debug apenas se poucos pedidos
                    console.log(`📊 Pedido ${order.id}: ${orderDate.toISOString()} - É hoje? ${isToday}`);
                }
                return isToday;
            });
            console.log(`📊 Pedidos de hoje encontrados:`, filtered.length, filtered);
            return filtered;
        }
        
        if (period === 'all') {
            console.log(`📊 Todos os pedidos:`, allOrders.length);
            return allOrders;
        }
        
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'week':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        const filtered = allOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= startDate;
        });
        
        console.log(`📊 Pedidos filtrados (${period}):`, filtered.length);
        return filtered;
        
    } catch (error) {
        console.error('❌ Erro ao filtrar pedidos:', error);
        return [];
    }
}

// Função para filtrar pedidos por período personalizado
async function getCustomFilteredOrders(startDate, endDate) {
    try {
        let allOrders = [];
        
        // Usar exatamente a mesma lógica que o backup para buscar pedidos
        if (storageManager.isUsingIndexedDB()) {
            // IndexedDB - buscar todos os pedidos (como o backup faz)
            allOrders = await window.restaurantDB.getOrders();
        } else {
            // localStorage fallback (como o backup faz)
            const savedHistory = localStorage.getItem('dcasa_order_history');
            if (savedHistory) {
                allOrders = JSON.parse(savedHistory);
            } else {
                allOrders = [];
            }
        }
        
        if (allOrders.length === 0) return [];
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Incluir todo o dia final
        
        const filtered = allOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= start && orderDate <= end;
        });
        
        console.log(`📊 Pedidos período personalizado (${startDate} até ${endDate}):`, filtered.length);
        return filtered;
    } catch (error) {
        console.error('❌ Erro ao filtrar pedidos por período personalizado:', error);
        return [];
    }
}

// Função para obter dados de vendas por dia da semana
function getWeekdayData(orders) {
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayData = new Array(7).fill(0);
    const weekdayRevenue = new Array(7).fill(0);
    
    orders.forEach(order => {
        const orderDate = new Date(order.timestamp);
        const weekday = orderDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        weekdayData[weekday]++;
        weekdayRevenue[weekday] += order.totalValue;
    });
    
    return {
        labels: weekdays,
        orders: weekdayData,
        revenue: weekdayRevenue
    };
}

// Função para obter horários de pico por produto
function getProductTimeData(orders) {
    const productTimeData = {};
    
    orders.forEach(order => {
        const orderHour = new Date(order.timestamp).getHours();
        
        order.items.forEach(item => {
            if (!productTimeData[item.name]) {
                productTimeData[item.name] = new Array(24).fill(0);
            }
            productTimeData[item.name][orderHour] += item.quantity;
        });
    });
    
    // Pegar os 5 produtos mais vendidos
    const productTotals = {};
    Object.keys(productTimeData).forEach(product => {
        productTotals[product] = productTimeData[product].reduce((sum, qty) => sum + qty, 0);
    });
    
    const topProducts = Object.entries(productTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([product]) => product);
    
    return {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        products: topProducts,
        data: topProducts.map(product => productTimeData[product] || new Array(24).fill(0))
    };
}

// Função para atualizar KPIs da sub-seção "Mais Opções"
function updateKPIs(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Elementos da sub-seção "Mais Opções"
    const kpiOrdersEl = document.getElementById('sub-kpi-orders');
    const kpiRevenueEl = document.getElementById('sub-kpi-revenue');
    const kpiAverageEl = document.getElementById('kpi-avg-ticket');
    const kpiTopProductEl = document.getElementById('kpi-top-product');
    
    if (kpiOrdersEl) kpiOrdersEl.textContent = totalOrders;
    if (kpiRevenueEl) kpiRevenueEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
    if (kpiAverageEl) kpiAverageEl.textContent = `R$ ${averageTicket.toFixed(2).replace('.', ',')}`;
    
    // Calcular produto mais vendido
    if (kpiTopProductEl && orders.length > 0) {
        const productCounts = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
            });
        });
        
        const topProduct = Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        kpiTopProductEl.textContent = topProduct ? topProduct[0] : '-';
    } else if (kpiTopProductEl) {
        kpiTopProductEl.textContent = '-';
    }
    
    console.log('📊 KPIs da sub-seção atualizados:', { totalOrders, totalRevenue, averageTicket });
}

// Função para atualizar KPIs da aba principal de Analytics
function updateMainKPIs(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveryOrders = orders.filter(order => order.delivery?.type === 'entrega').length;
    const deliveryPercentage = totalOrders > 0 ? (deliveryOrders / totalOrders) * 100 : 0;
    
    // Elementos da aba principal de Analytics
    const kpiOrdersEl = document.getElementById('main-kpi-orders');
    const kpiRevenueEl = document.getElementById('main-kpi-revenue');
    const kpiAverageEl = document.getElementById('main-kpi-average');
    const kpiDeliveryEl = document.getElementById('main-kpi-delivery');
    
    if (kpiOrdersEl) kpiOrdersEl.textContent = totalOrders;
    if (kpiRevenueEl) kpiRevenueEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
    if (kpiAverageEl) kpiAverageEl.textContent = `R$ ${averageTicket.toFixed(2).replace('.', ',')}`;
    if (kpiDeliveryEl) kpiDeliveryEl.textContent = `${deliveryPercentage.toFixed(1)}%`;
    
    console.log('📊 KPIs da aba principal atualizados:', { totalOrders, totalRevenue, averageTicket, deliveryPercentage });
}

// Função para atualizar gráficos da aba principal
function updateMainCharts(orders) {
    console.log('📈 Atualizando gráficos principais com', orders.length, 'pedidos');
    updateMainHourlyChart(orders);
    updateMainWeekdayChart(orders);
    updateMainProductsChart(orders);
    updateMainProductTimeChart(orders);
    updateMainPaymentChart(orders);
    updateMainDeliveryChart(orders);
    console.log('✅ Todos os gráficos principais atualizados');
}

// Função para atualizar gráficos da sub-seção "Mais Opções"
function updateCharts(orders) {
    console.log('📈 Atualizando gráficos da sub-seção com', orders.length, 'pedidos');
    updateHourlyChart(orders);
    updateWeekdayChart(orders);
    updateProductsChart(orders);
    updateProductTimeChart(orders);
    updatePaymentChart(orders);
    updateDeliveryChart(orders);
    console.log('✅ Todos os gráficos da sub-seção atualizados');
}

// Função para gráfico da aba principal
function updateMainHourlyChart(orders) {
    const hourlyData = {};
    
    // Inicializar todas as horas
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
    }
    
    // Contar pedidos por hora
    orders.forEach(order => {
        const orderDate = order.timestamp instanceof Date ? 
            order.timestamp : new Date(order.timestamp);
        const hour = orderDate.getHours();
        hourlyData[hour] += (order.pricing?.total || 0);
    });
    
    const canvas = document.getElementById('main-hourlyChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-hourlyChart não encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (window.mainHourlyChart) {
        window.mainHourlyChart.destroy();
    }
    
    window.mainHourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(hourlyData).map(h => `${h}:00`),
            datasets: [{
                label: 'Faturamento por Hora',
                data: Object.values(hourlyData),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Função para gráfico da sub-seção "Mais Opções"
function updateHourlyChart(orders) {
    console.log('📈 updateHourlyChart chamada com', orders.length, 'pedidos');
    
    const hourlyData = {};
    
    // Inicializar todas as horas
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
    }
    
    // Contar pedidos por hora
    orders.forEach(order => {
        const orderDate = order.timestamp instanceof Date ? 
            order.timestamp : new Date(order.timestamp);
        const hour = orderDate.getHours();
        hourlyData[hour] += (order.pricing?.total || 0);
    });
    
    console.log('📈 Dados do gráfico por hora:', hourlyData);
    
    const canvas = document.getElementById('hourlyChart');
    if (!canvas) {
        console.warn('⚠️ Canvas hourlyChart não encontrado');
        return;
    }
    
    console.log('📈 Canvas encontrado, criando gráfico...');
    const ctx = canvas.getContext('2d');
    
    if (hourlyChart) {
        hourlyChart.destroy();
    }
    
    hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(hourlyData).map(h => `${h}:00`),
            datasets: [{
                label: 'Faturamento por Hora',
                data: Object.values(hourlyData),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfico hourlyChart criado com sucesso');
}

// Funções simplificadas para os outros gráficos principais
function updateMainWeekdayChart(orders) {
    const weekdayData = getWeekdayData(orders);
    const canvas = document.getElementById('main-weekdayChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-weekdayChart não encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    if (window.mainWeekdayChart) {
        window.mainWeekdayChart.destroy();
    }
    
    window.mainWeekdayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekdayData.labels,
            datasets: [{
                label: 'Faturamento por Dia',
                data: weekdayData.data,
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: '#dc3545',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateMainProductsChart(orders) {
    const productsData = getProductsData(orders);
    const canvas = document.getElementById('main-productsChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-productsChart não encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    if (window.mainProductsChart) {
        window.mainProductsChart.destroy();
    }
    
    window.mainProductsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: productsData.labels,
            datasets: [{
                data: productsData.data,
                backgroundColor: ['#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6f42c1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateMainProductTimeChart(orders) {
    const productTimeData = getProductTimeData(orders);
    const canvas = document.getElementById('main-productTimeChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-productTimeChart não encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    if (window.mainProductTimeChart) {
        window.mainProductTimeChart.destroy();
    }
    
    window.mainProductTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: productTimeData.labels,
            datasets: productTimeData.products.map((product, index) => ({
                label: product,
                data: productTimeData.data[index],
                borderColor: ['#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6f42c1'][index],
                tension: 0.4
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateMainPaymentChart(orders) {
    const paymentData = getPaymentData(orders);
    const canvas = document.getElementById('main-paymentChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-paymentChart não encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    if (window.mainPaymentChart) {
        window.mainPaymentChart.destroy();
    }
    
    window.mainPaymentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: paymentData.labels,
            datasets: [{
                data: paymentData.data,
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateMainDeliveryChart(orders) {
    const deliveryData = getDeliveryData(orders);
    const canvas = document.getElementById('main-deliveryChart');
    if (!canvas) {
        console.warn('⚠️ Canvas main-deliveryChart não encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    
    if (window.mainDeliveryChart) {
        window.mainDeliveryChart.destroy();
    }
    
    window.mainDeliveryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: deliveryData.labels,
            datasets: [{
                data: deliveryData.data,
                backgroundColor: ['#dc3545', '#28a745']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateWeekdayChart(orders) {
    const weekdayData = getWeekdayData(orders);
    const ctx = document.getElementById('weekdayChart').getContext('2d');
    
    if (weekdayChart) {
        weekdayChart.destroy();
    }
    
    weekdayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekdayData.labels,
            datasets: [{
                label: 'Pedidos',
                data: weekdayData.orders,
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: '#dc3545',
                borderWidth: 1,
                yAxisID: 'y'
            }, {
                label: 'Faturamento',
                data: weekdayData.revenue,
                type: 'line',
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Pedidos'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Faturamento (R$)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function updateProductTimeChart(orders) {
    const productTimeData = getProductTimeData(orders);
    const ctx = document.getElementById('productTimeChart').getContext('2d');
    
    if (productTimeChart) {
        productTimeChart.destroy();
    }
    
    const colors = [
        'rgba(220, 53, 69, 0.8)',   // Vermelho
        'rgba(40, 167, 69, 0.8)',   // Verde  
        'rgba(0, 123, 255, 0.8)',   // Azul
        'rgba(255, 193, 7, 0.8)',   // Amarelo
        'rgba(111, 66, 193, 0.8)'   // Roxo
    ];
    
    const datasets = productTimeData.products.map((product, index) => ({
        label: product,
        data: productTimeData.data[index],
        borderColor: colors[index],
        backgroundColor: colors[index].replace('0.8', '0.2'),
        tension: 0.4,
        fill: false
    }));
    
    productTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: productTimeData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade Vendida'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Horário'
                    }
                }
            }
        }
    });
}

function updateProductsChart(orders) {
    const productData = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (productData[item.name]) {
                productData[item.name] += item.quantity;
            } else {
                productData[item.name] = item.quantity;
            }
        });
    });
    
    // Pegar top 5 produtos
    const sortedProducts = Object.entries(productData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const ctx = document.getElementById('productsChart').getContext('2d');
    
    if (productsChart) {
        productsChart.destroy();
    }
    
    productsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedProducts.map(([name]) => name),
            datasets: [{
                data: sortedProducts.map(([, quantity]) => quantity),
                backgroundColor: [
                    '#dc3545',
                    '#8b0000',
                    '#ff6b6b',
                    '#c92a2a',
                    '#a61e1e'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updatePaymentChart(orders) {
    const paymentData = {};
    
    orders.forEach(order => {
        const method = order.payment.method;
        if (paymentData[method]) {
            paymentData[method]++;
        } else {
            paymentData[method] = 1;
        }
    });
    
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    paymentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(paymentData).map(method => method.toUpperCase()),
            datasets: [{
                data: Object.values(paymentData),
                backgroundColor: [
                    '#6f42c1',
                    '#5a2d91',
                    '#9c6ae0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateDeliveryChart(orders) {
    const deliveryData = {
        'Entrega': 0,
        'Retirada': 0
    };
    
    orders.forEach(order => {
        if (order.delivery.type === 'entrega') {
            deliveryData['Entrega']++;
        } else {
            deliveryData['Retirada']++;
        }
    });
    
    const ctx = document.getElementById('deliveryChart').getContext('2d');
    
    if (deliveryChart) {
        deliveryChart.destroy();
    }
    
    deliveryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(deliveryData),
            datasets: [{
                label: 'Número de Pedidos',
                data: Object.values(deliveryData),
                backgroundColor: [
                    '#dc3545',
                    '#333'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Função para renderizar a aba principal de histórico (todos os pedidos)
async function renderMainHistoryTab() {
    const historyListEl = document.getElementById('history-tab-list');
    
    if (!historyListEl) {
        console.warn('⚠️ Elemento history-tab-list não encontrado');
        return;
    }
    
    // Carregar dados se orderHistory estiver vazio
    if (orderHistory.length === 0) {
        try {
            await loadHistoryFromStorage();
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
        }
    }
    
    if (orderHistory.length === 0) {
        historyListEl.innerHTML = `
            <div class="empty-history" style="text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-clipboard-list" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Nenhum pedido registrado</h3>
                <p>Os pedidos realizados aparecerão aqui</p>
                <button class="action-btn primary" onclick="switchTab('menu')" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Criar Primeiro Pedido
                </button>
            </div>
        `;
        return;
    }
    
    historyListEl.innerHTML = orderHistory.map(order => createHistoryItemHTML(order)).join('');
    console.log('📋 Aba principal de histórico renderizada:', orderHistory.length + ' pedidos');
}

// Função para renderizar a sub-seção de histórico (apenas pedidos de hoje)
async function renderOrderHistory() {
    const historyListEl = document.getElementById('history-list');
    
    if (!historyListEl) {
        console.warn('⚠️ Elemento history-list não encontrado');
        return;
    }
    
    // Carregar dados se orderHistory estiver vazio
    if (orderHistory.length === 0) {
        try {
            await loadHistoryFromStorage();
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
        }
    }
    
    // Filtrar pedidos de hoje para a aba "Mais Opções"
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayOrders = orderHistory.filter(order => {
        const orderDate = order.timestamp instanceof Date ? 
            order.timestamp : new Date(order.timestamp);
        return orderDate >= startOfDay && orderDate <= endOfDay;
    });
    
    console.log(`📋 Pedidos de hoje: ${todayOrders.length} de ${orderHistory.length} total`);
    
    if (todayOrders.length === 0) {
        historyListEl.innerHTML = `
            <div class="empty-history" style="text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-clipboard-list" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Nenhum pedido hoje</h3>
                <p>Os pedidos de hoje aparecerão aqui</p>
                <button class="action-btn primary" onclick="switchTab('menu')" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Fazer Pedido
                </button>
            </div>
        `;
        return;
    }
    
    historyListEl.innerHTML = todayOrders.map(order => createHistoryItemHTML(order)).join('');
    console.log('📋 Histórico renderizado:', todayOrders.length + ' pedidos de hoje');
}

function createHistoryItemHTML(order) {
    try {
        // Criar lista detalhada de itens com preços
        const itemsList = order.items.map(item => 
            `<li>
                <span class="item-quantity">${item.quantity}x</span> 
                ${item.name}
                <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </li>`
        ).join('');
        
        // Garantir que timestamp é um objeto Date válido
        let orderDate;
        try {
            orderDate = order.timestamp instanceof Date ? 
                order.timestamp : new Date(order.timestamp);
            
            // Verificar se a data é válida
            if (isNaN(orderDate.getTime())) {
                throw new Error('Data inválida');
            }
        } catch (e) {
            console.warn('Timestamp inválido, usando data atual:', order.timestamp);
            orderDate = new Date(); // Fallback para data atual
        }
        
        // Ícone de entrega - moto em vez de caminhão
        const deliveryIcon = order.delivery?.type === 'entrega' ? 
            '<i class="fas fa-motorcycle delivery-icon"></i>' : 
            '<i class="fas fa-store delivery-icon"></i>';
        
        return `
        <div class="history-item">
            <div class="history-item-header">
                <div>
                    <div class="order-number">Pedido #${order.sequentialId.toString().padStart(3, '0')}</div>
                    <div class="customer-name">
                        <i class="fas fa-user"></i> ${order.customer?.name || 'Cliente'}
                    </div>
                    <div class="order-time">${orderDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div class="delivery-info">
                        ${deliveryIcon}
                        <span>${order.delivery?.type === 'entrega' ? 'Delivery' : 'Retirada'}</span>
                    </div>
                </div>
                <div class="order-total">R$ ${(order.pricing?.total || 0).toFixed(2).replace('.', ',')}</div>
            </div>
            
            <div class="order-items-detail">
                <strong>Itens do Pedido:</strong>
                <ul class="items-list">
                    ${itemsList}
                </ul>
            </div>
            
            <div class="history-item-details">
                <div class="detail-group">
                    <h5>Cliente</h5>
                    <p>${order.customer?.phone || 'Telefone não informado'}</p>
                </div>
                
                <div class="detail-group">
                    <h5>Entrega</h5>
                    ${order.delivery?.type === 'entrega' ? `<p>${order.customer?.address || 'Endereço não informado'}</p>` : '<p>Retirada no local</p>'}
                </div>
                
                <div class="detail-group">
                    <h5>Pagamento</h5>
                    <p>${(order.payment?.method || 'Não informado').toUpperCase()}</p>
                    ${(order.pricing?.discountValue || 0) > 0 ? `<p>Desconto: ${order.pricing?.discountDisplay || 'N/A'}</p>` : ''}
                </div>
            </div>
            
            <div class="history-actions">
                <button class="history-action-btn" onclick="reprintOrder(${order.id})">
                    <i class="fas fa-print"></i> Reimprimir
                </button>
                <button class="history-action-btn" onclick="repeatOrder(${order.id})">
                    <i class="fas fa-redo"></i> Repetir Pedido
                </button>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Erro ao criar HTML do histórico:', error, order);
        return `
            <div class="history-item" style="border-color: #dc3545; background: #fff5f5;">
                <div class="history-item-header">
                    <div class="order-number" style="color: #dc3545;">Pedido com erro</div>
                    <div class="order-total">R$ 0,00</div>
                </div>
                <p style="color: #666; font-size: 0.9rem;">Este pedido contém dados inválidos e será removido automaticamente.</p>
            </div>
        `;
    }
}

// Função original (mantida para compatibilidade)
function updateHistoryStats() {
    const todayRevenue = orderHistory.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    
    const totalOrdersEl = document.getElementById('total-orders');
    const totalRevenueEl = document.getElementById('total-revenue');
    
    if (totalOrdersEl) totalOrdersEl.textContent = orderHistory.length;
    if (totalRevenueEl) totalRevenueEl.textContent = todayRevenue.toFixed(2).replace('.', ',');
    
    console.log('📊 Stats atualizados:', { orders: orderHistory.length, revenue: todayRevenue });
}

// Função para atualizar stats da aba principal de histórico
async function updateMainHistoryStats() {
    try {
        let stats;
        
        if (storageManager.isUsingIndexedDB()) {
            stats = await window.restaurantDB.getStats();
            console.log('📊 Stats da aba principal (IndexedDB):', stats);
        } else {
            stats = calculateStatsLikeBackup(orderHistory);
            console.log('📊 Stats da aba principal (calculados):', stats);
        }
        
        // Atualizar elementos DOM da aba principal de histórico
        const totalOrdersEl = document.getElementById('history-total-orders');
        const totalRevenueEl = document.getElementById('history-total-revenue');
        
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = (stats.totalRevenue || 0).toFixed(2).replace('.', ',');
        
        console.log('✅ Stats da aba principal atualizados:', stats);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar stats da aba principal:', error);
    }
}

// Nova função usando exatamente a lógica do backup
async function updateHistoryStatsFromBackupLogic() {
    try {
        let stats;
        
        // Usar exatamente a mesma lógica que o backup
        if (storageManager.isUsingIndexedDB()) {
            // Buscar stats do IndexedDB (como o backup faz)
            stats = await window.restaurantDB.getStats();
            console.log('📊 Stats do IndexedDB:', stats);
        } else {
            // Calcular stats manualmente (como o backup faz)
            stats = calculateStatsLikeBackup(orderHistory);
            console.log('📊 Stats calculados:', stats);
        }
        
        // Atualizar elementos DOM da aba "Mais Opções" (sub-seção histórico)
        const totalOrdersEl = document.getElementById('total-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = (stats.totalRevenue || 0).toFixed(2).replace('.', ',');
        
        console.log('✅ Stats atualizados com lógica do backup:', stats);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar stats:', error);
        // Fallback para função original
        updateHistoryStats();
    }
}

// Função para calcular stats igual ao backup
function calculateStatsLikeBackup(orders) {
    if (!orders || orders.length === 0) {
        return {
            totalOrders: 0,
            totalRevenue: 0,
            averageTicket: 0
        };
    }

    const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.pricing?.total || 0);
    }, 0);

    return {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        averageTicket: totalRevenue / orders.length
    };
}

function reprintOrder(orderId) {
    const order = orderHistory.find(o => o.id === orderId);
    if (order) {
        currentOrder = order;
        printOrder();
    }
}

function repeatOrder(orderId) {
    const order = orderHistory.find(o => o.id === orderId);
    if (order) {
        // Limpar carrinho atual
        cart = [];
        
        // Adicionar itens do pedido anterior
        order.items.forEach(item => {
            cart.push({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                quantity: item.quantity
            });
        });
        
        // Voltar para o menu
        switchTab('menu');
        document.querySelector('.category-btn.active').classList.remove('active');
        document.querySelector('[data-category="all"]').classList.add('active');
        
        updateCartDisplay();
        saveCartToStorage();
        showToast('Pedido adicionado ao carrinho!');
    }
}

// Mostrar toast de notificação
function showToast(message) {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Função de teste de impressão
function testPrint() {
    const testOrder = {
        id: 'TESTE',
        timestamp: new Date(),
        customer: {
            name: 'Cliente Teste da Silva',
            phone: '(11) 99999-9999',
            address: 'Rua das Flores, 123 - Centro - CEP 12345-678'
        },
        delivery: {
            type: 'entrega'
        },
        payment: {
            method: 'dinheiro'
        },
        items: [
            {
                name: 'Costela Minga Especial',
                quantity: 2,
                price: 90.00
            },
            {
                name: 'Coca Cola 2L',
                quantity: 1,
                price: 15.00
            },
            {
                name: 'Frango Recheado',
                quantity: 1,
                price: 58.00
            }
        ],
        pricing: {
            subtotal: 253.00,
            discountValue: 10,
            discountAmount: 25.30,
            discountDisplay: '10%',
            deliveryFee: 9.00,
            total: 236.70
        },
        notes: 'Teste de impressão térmica compacta'
    };
    
    // Temporariamente definir como pedido atual
    const originalOrder = currentOrder;
    currentOrder = testOrder;
    
    // Imprimir
    printOrder();
    
    // Restaurar pedido original
    currentOrder = originalOrder;
    
    console.log('✅ Teste de impressão térmica executado');
}

// Imprimir pedido

// Função para mostrar informações do dispositivo no dashboard
function updateDeviceInfo() {
    const device = detectDevice();
    
    // Criar ou atualizar elemento de informação do dispositivo
    let deviceInfo = document.getElementById('device-info');
    if (!deviceInfo) {
        deviceInfo = document.createElement('div');
        deviceInfo.id = 'device-info';
        deviceInfo.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            z-index: 998;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(deviceInfo);
    }
    
    // Definir ícone baseado no tipo de dispositivo
    let icon = '🖥️';
    switch(device.type) {
        case 'thermal': icon = '🧾'; break;
        case 'mobile': icon = '📱'; break;
        case 'tablet': icon = '📱'; break;
        case 'desktop': icon = '🖥️'; break;
    }
    
    deviceInfo.innerHTML = `
        ${icon} ${device.type.toUpperCase()}<br>
        📄 ${device.format}<br>
        📐 ${device.width}x${device.height}
    `;
    
    // Esconder após 5 segundos
    setTimeout(() => {
        if (deviceInfo) {
            deviceInfo.style.opacity = '0';
            setTimeout(() => {
                if (deviceInfo && deviceInfo.parentNode) {
                    deviceInfo.parentNode.removeChild(deviceInfo);
                }
            }, 300);
        }
    }, 5000);
}

// Função de teste de impressão melhorada