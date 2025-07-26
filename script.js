// Dados do cardápio
const menuData = [
    // Pratos Principais
    {
        id: 1,
        name: "Costela Miga",
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
        price: 56.00,
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

// Chaves para localStorage
const CART_STORAGE_KEY = 'dcasa_cart';
const HISTORY_STORAGE_KEY = 'dcasa_order_history';

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
document.addEventListener('DOMContentLoaded', function() {
    // Se houver erro persistente, descomente a linha abaixo para limpar dados:
    // clearAllStoredData();
    
    loadStoredData();
    loadMenu();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botões de categoria
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.category-btn.active').classList.remove('active');
            this.classList.add('active');
            
            if (this.dataset.category === 'history') {
                showOrderHistory();
            } else {
                hideOrderHistory();
                filterMenu(this.dataset.category);
            }
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
            document.getElementById('delivery-fee').value = '5.00';
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
function handleOrderSubmit(e) {
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
    saveOrderToHistory();
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
                <span>R$ ${currentOrder.pricing.total.toFixed(2).replace('.', ',')}</span>
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

// Imprimir pedido
function printOrder() {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = createPrintHTML();
    printArea.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        printArea.style.display = 'none';
    }, 100);
}

// Criar HTML para impressão
function createPrintHTML() {
    return `
        <div class="print-header">
            <h1>D'CASA & CIA ASSADOS</h1>
            <p>COMANDA DE PEDIDO</p>
            <p>================================</p>
        </div>
        
        <div class="print-info">
            <div><strong>PEDIDO: #${currentOrder.id}</strong></div>
            <div>${currentOrder.timestamp.toLocaleDateString('pt-BR')} ${currentOrder.timestamp.toLocaleTimeString('pt-BR')}</div>
            <div>--------------------------------</div>
            <div>CLIENTE: ${currentOrder.customer.name}</div>
            <div>FONE: ${currentOrder.customer.phone}</div>
            <div>PAGTO: ${currentOrder.payment.method.toUpperCase()}</div>
            ${currentOrder.delivery.type === 'entrega' ? 
                `<div>ENDERECO: ${currentOrder.customer.address}</div>` : 
                '<div>RETIRADA NO LOCAL</div>'
            }
            ${currentOrder.notes ? `<div>OBS: ${currentOrder.notes}</div>` : ''}
            <div>--------------------------------</div>
        </div>
        
        <div class="print-items">
            <div><strong>ITENS DO PEDIDO:</strong></div>
            ${currentOrder.items.map(item => `
                <div class="print-item">
                    <div>${item.quantity}x ${item.name}</div>
                    <div style="text-align: right;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</div>
                </div>
            `).join('')}
            <div>--------------------------------</div>
        </div>
        
        <div class="print-total">
            <div style="display: flex; justify-content: space-between;">
                <span>SUBTOTAL:</span>
                <span>R$ ${currentOrder.pricing.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            ${currentOrder.pricing.discountValue > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>DESCONTO (${currentOrder.pricing.discountDisplay}):</span>
                    <span>-R$ ${currentOrder.pricing.discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
            ` : ''}
            ${currentOrder.delivery.type === 'entrega' ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>TAXA ENTREGA:</span>
                    <span>R$ ${currentOrder.pricing.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
            ` : ''}
            <div>================================</div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                <span>TOTAL:</span>
                <span>R$ ${currentOrder.pricing.total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div>================================</div>
        </div>
        
        <div style="text-align: center; margin-top: 15px; font-size: 11px;">
            <div>Obrigado pela preferencia!</div>
            <div>Volte sempre!</div>
        </div>
    `;
}

// Iniciar novo pedido
function startNewOrder() {
    cart = [];
    currentOrder = null;
    
    // Limpar formulário
    document.getElementById('checkout-form').reset();
    document.getElementById('delivery-fee').value = '5.00';
    document.getElementById('discount-value').value = '0';
    document.getElementById('discount-type').value = 'percent';
    document.getElementById('delivery-type').value = 'entrega';
    
    // Mostrar campos de entrega por padrão
    document.getElementById('delivery-fee-group').style.display = 'block';
    document.getElementById('delivery-fee-row').style.display = 'flex';
    
    // Voltar para o menu
    hideAllSections();
    hideOrderHistory();
    
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
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function saveOrderToHistory() {
    if (!currentOrder) return;
    
    // Adicionar timestamp único para o ID
    const orderWithId = {
        ...currentOrder,
        id: Date.now(),
        sequentialId: getNextSequentialId()
    };
    
    orderHistory.unshift(orderWithId); // Adiciona no início (mais recente primeiro)
    
    // Manter apenas pedidos do dia atual
    const today = new Date().toDateString();
    orderHistory = orderHistory.filter(order => {
        const orderDate = order.timestamp instanceof Date ? 
            order.timestamp : new Date(order.timestamp);
        return orderDate.toDateString() === today;
    });
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orderHistory));
    updateHistoryStats();
}

function loadHistoryFromStorage() {
    try {
        const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (savedHistory) {
            let parsedHistory = JSON.parse(savedHistory);
            
            // Validar e converter dados
            orderHistory = parsedHistory
                .filter(order => order && order.timestamp && order.items) // Filtrar dados válidos
                .map(order => {
                    try {
                        return {
                            ...order,
                            timestamp: new Date(order.timestamp), // Converter para Date
                            sequentialId: order.sequentialId || 1 // Garantir sequentialId
                        };
                    } catch (e) {
                        console.warn('Pedido inválido removido:', order);
                        return null;
                    }
                })
                .filter(order => order !== null); // Remover pedidos inválidos
            
            // Filtrar apenas pedidos de hoje
            const today = new Date().toDateString();
            orderHistory = orderHistory.filter(order => {
                try {
                    return order.timestamp.toDateString() === today;
                } catch (e) {
                    console.warn('Timestamp inválido, removendo pedido:', order);
                    return false;
                }
            });
            
            // Salvar dados limpos
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orderHistory));
            updateHistoryStats();
        }
    } catch (error) {
        console.error('Erro ao carregar histórico, limpando dados:', error);
        // Se houver erro, limpar dados corrompidos
        localStorage.removeItem(HISTORY_STORAGE_KEY);
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

function loadStoredData() {
    loadCartFromStorage();
    loadHistoryFromStorage();
}

// Funções de histórico
function showOrderHistory() {
    menuGrid.style.display = 'none';
    orderHistorySection.style.display = 'block';
    renderOrderHistory();
}

function hideOrderHistory() {
    menuGrid.style.display = 'grid';
    orderHistorySection.style.display = 'none';
}

function renderOrderHistory() {
    if (orderHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clipboard-list"></i>
                <h3>Nenhum pedido hoje</h3>
                <p>Os pedidos realizados aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = orderHistory.map(order => createHistoryItemHTML(order)).join('');
}

function createHistoryItemHTML(order) {
    try {
        const itemsList = order.items.map(item => 
            `${item.quantity}x ${item.name}`
        ).join(', ');
        
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
        
        return `
        <div class="history-item">
            <div class="history-item-header">
                <div>
                    <div class="order-number">Pedido #${order.sequentialId.toString().padStart(3, '0')}</div>
                    <div class="order-time">${orderDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div class="order-total">R$ ${order.pricing.total.toFixed(2).replace('.', ',')}</div>
            </div>
            
            <div class="history-item-details">
                <div class="detail-group">
                    <h5>Cliente</h5>
                    <p>${order.customer.name}</p>
                    <p>${order.customer.phone}</p>
                </div>
                
                <div class="detail-group">
                    <h5>Entrega</h5>
                    <p>${order.delivery.type === 'entrega' ? 'Delivery' : 'Retirada'}</p>
                    ${order.delivery.type === 'entrega' ? `<p>${order.customer.address}</p>` : ''}
                </div>
                
                <div class="detail-group">
                    <h5>Pagamento</h5>
                    <p>${order.payment.method.toUpperCase()}</p>
                    ${order.pricing.discountValue > 0 ? `<p>Desconto: ${order.pricing.discountDisplay}</p>` : ''}
                </div>
            </div>
            
            <div class="order-items-summary">
                <h5>Itens do Pedido</h5>
                <div class="items-list">${itemsList}</div>
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

function updateHistoryStats() {
    const todayRevenue = orderHistory.reduce((sum, order) => sum + order.pricing.total, 0);
    totalOrders.textContent = orderHistory.length;
    totalRevenue.textContent = todayRevenue.toFixed(2).replace('.', ',');
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
        document.querySelector('.category-btn.active').classList.remove('active');
        document.querySelector('[data-category="all"]').classList.add('active');
        hideOrderHistory();
        
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