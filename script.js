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

// Elementos DOM
const menuGrid = document.getElementById('menu-grid');
const cartSection = document.getElementById('cart-section');
const checkoutSection = document.getElementById('checkout-section');
const orderConfirmed = document.getElementById('order-confirmed');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const finalTotal = document.getElementById('final-total');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
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
            filterMenu(this.dataset.category);
        });
    });

    // Botão do carrinho
    cartBtn.addEventListener('click', showCart);

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

    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (cartSection.style.display === 'block') {
                hideCart();
            } else if (checkoutSection.style.display === 'block') {
                hideCheckout();
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
    showToast(`${item.name} adicionado ao carrinho!`);
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2).replace('.', ',');
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
}

// Mostrar confirmação do pedido
function showOrderConfirmation() {
    hideAllSections();
    orderConfirmed.style.display = 'block';
    
    const orderDetails = document.getElementById('order-details');
    orderDetails.innerHTML = createOrderDetailsHTML();
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
                    <span style="color: #28a745;">- R$ ${currentOrder.pricing.discountAmount.toFixed(2).replace('.', ',')}</span>
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
            <h1>CARDAPIO DIGITAL</h1>
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
    updateCartDisplay();
    
    showToast('Novo pedido iniciado!');
}

// Esconder todas as seções
function hideAllSections() {
    cartSection.style.display = 'none';
    checkoutSection.style.display = 'none';
    orderConfirmed.style.display = 'none';
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
        background: #28a745;
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