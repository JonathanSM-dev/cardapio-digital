/**
 * QZ Tray - Gerenciador de Impressão Térmica
 * Sistema profissional para impressão direta em impressoras térmicas
 */

class ThermalPrinter {
    constructor() {
        this.isQZReady = false;
        this.printerName = null;
        this.paperWidth = 80; // mm
        
        // Aguardar um pouco e então inicializar
        setTimeout(() => {
            this.init();
        }, 3000);
    }

    async init() {
        console.log('🖨️ Inicializando QZ Tray...');
        
        try {
            // Verificar se QZ está disponível
            if (typeof qz === 'undefined') {
                console.warn('❌ QZ Tray não está disponível');
                this.showQZStatus(false, 'QZ não encontrado');
                return;
            }

            console.log('✅ QZ Tray encontrado, tentando conectar...');
            
            // Tentar conectar
            await qz.websockets.connect();
            
            console.log('✅ QZ Tray conectado com sucesso!');
            this.isQZReady = true;
            
            // Buscar impressoras
            await this.findThermalPrinter();
            
            this.showQZStatus(true, 'Conectado');

        } catch (error) {
            console.error('❌ Erro ao conectar QZ Tray:', error);
            this.isQZReady = false;
            this.showQZStatus(false, 'Erro de conexão');
            // Removido showConnectionHelp() - apenas status no header
        }
    }

    async findThermalPrinter() {
        try {
            console.log('🔍 Buscando impressoras...');
            const printers = await qz.printers.find();
            console.log('🖨️ Impressoras encontradas:', printers);

            if (!printers || printers.length === 0) {
                console.warn('⚠️ Nenhuma impressora encontrada');
                this.updatePrinterStatus('Nenhuma impressora');
                return;
            }

            // Procurar por impressoras térmicas comuns
            const thermalKeywords = ['thermal', 'receipt', 'pos', 'tm-', 'rp-', 'tsc', 'zebra', 'bematech', 'elgin', 'mp-', 'dr-'];
            
            for (let printer of printers) {
                const printerLower = printer.toLowerCase();
                if (thermalKeywords.some(keyword => printerLower.includes(keyword))) {
                    this.printerName = printer;
                    console.log('✅ Impressora térmica encontrada:', printer);
                    break;
                }
            }

            // Se não encontrou térmica, usar a primeira disponível
            if (!this.printerName && printers.length > 0) {
                this.printerName = printers[0];
                console.log('📝 Usando impressora padrão:', this.printerName);
            }

            this.updatePrinterStatus(this.printerName);

        } catch (error) {
            console.error('❌ Erro ao buscar impressoras:', error);
            this.updatePrinterStatus('Erro ao buscar');
        }
    }

    showQZStatus(connected, message = '') {
        // Criar indicador de status do QZ Tray
        let statusIndicator = document.getElementById('qz-status');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'qz-status';
            statusIndicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${connected ? '#28a745' : '#dc3545'};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 11px;
                z-index: 1001;
                opacity: 0.9;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            document.body.appendChild(statusIndicator);
            
            // Adicionar evento de clique para reconectar
            statusIndicator.addEventListener('click', () => {
                if (!connected) {
                    this.reconnect();
                }
            });
        }

        const statusText = message || (connected ? 'Conectado' : 'Desconectado');
        statusIndicator.innerHTML = `
            ${connected ? '✅' : '❌'} QZ Tray: ${statusText}
            ${!connected ? '<br><small>(Clique para reconectar)</small>' : ''}
        `;
        statusIndicator.style.background = connected ? '#28a745' : '#dc3545';

        // Esconder após 8 segundos se conectado
        if (connected) {
            setTimeout(() => {
                if (statusIndicator) {
                    statusIndicator.style.opacity = '0.3';
                }
            }, 8000);
        }
    }

    showConnectionHelp() {
        const helpMessage = `
            ❌ Não foi possível conectar ao QZ Tray
            
            Possíveis soluções:
            • Verifique se o QZ Tray está instalado e executando
            • Reinicie o QZ Tray
            • Verifique se não há bloqueio de firewall
            • Tente recarregar a página
            
            Clique no status vermelho para tentar novamente.
        `;
        
        this.showMessage(helpMessage, '#dc3545', 8000);
    }

    async reconnect() {
        console.log('🔄 Tentando reconectar ao QZ Tray...');
        this.showQZStatus(false, 'Reconectando...');
        
        // Resetar estado
        this.isQZReady = false;
        
        // Tentar reconectar
        await this.init();
    }

    updatePrinterStatus(printerName = null) {
        let printerInfo = document.getElementById('printer-info');
        if (!printerInfo) {
            printerInfo = document.createElement('div');
            printerInfo.id = 'printer-info';
            printerInfo.style.cssText = `
                position: fixed;
                bottom: 120px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 10px;
                z-index: 998;
                opacity: 0.7;
                max-width: 200px;
                word-wrap: break-word;
                cursor: pointer;
            `;
            document.body.appendChild(printerInfo);
            
            // Adicionar evento de clique para configurar
            printerInfo.addEventListener('click', () => {
                this.selectPrinter();
            });
        }

        const displayName = printerName || 'Nenhuma impressora';
        printerInfo.innerHTML = `
            🖨️ ${displayName}<br>
            📏 ${this.paperWidth}mm<br>
            <small>(Clique para configurar)</small>
        `;
    }

    async printReceipt(orderData) {
        // Verificações de segurança
        if (!this.isQZReady) {
            console.log('⚠️ QZ Tray não está pronto, usando impressão padrão');
            return this.fallbackPrint(orderData);
        }

        if (!this.printerName) {
            console.log('⚠️ Nenhuma impressora configurada, usando impressão padrão');
            return this.fallbackPrint(orderData);
        }

        try {
            console.log('🖨️ Imprimindo via QZ Tray...');

            const escCommands = this.generateESCPOS(orderData);
            
            const config = qz.configs.create(this.printerName, {
                margins: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            });

            const data = [{
                type: 'raw',
                format: 'command',
                data: escCommands
            }];

            await qz.print(config, data);
            console.log('✅ Impressão térmica concluída!');
            
            this.showPrintSuccess();

        } catch (error) {
            console.error('❌ Erro na impressão térmica:', error);
            this.showPrintError(error.message);
            this.fallbackPrint(orderData);
        }
    }

    generateESCPOS(order) {
        const ESC = '\x1b';
        const GS = '\x1d';
        
        let commands = '';
        
        // Inicializar impressora
        commands += ESC + '@'; // Reset
        commands += ESC + 'a' + '\x01'; // Centralizar
        
        // Cabeçalho
        commands += ESC + '!' + '\x18'; // Fonte dupla altura e largura
        commands += 'D\'CASA & CIA ASSADOS\n';
        commands += ESC + '!' + '\x08'; // Fonte normal com negrito
        commands += 'COMANDA\n';
        commands += '========================\n';
        
        // Informações do pedido
        commands += ESC + 'a' + '\x00'; // Alinhar à esquerda
        commands += ESC + '!' + '\x08'; // Fonte com negrito para melhor legibilidade
        commands += `PEDIDO: #${order.id}\n`;
        
        const dateTime = `${order.timestamp.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit', 
            year: '2-digit'
        })} ${order.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        commands += `${dateTime}\n`;
        commands += '------------------------\n';
        
        // Dados do cliente - com quebra de linha inteligente
        commands += this.formatLineWithBreak('CLIENTE:', order.customer.name);
        commands += this.formatLineWithBreak('FONE:', order.customer.phone);
        commands += `PAGTO: ${order.payment.method.toUpperCase()}\n`;
        
        if (order.delivery.type === 'entrega') {
            commands += this.formatLineWithBreak('ENDERECO:', order.customer.address);
        } else {
            commands += 'RETIRADA NO LOCAL\n';
        }
        
        if (order.notes) {
            commands += this.formatLineWithBreak('OBS:', order.notes);
        }
        
        commands += '------------------------\n';
        
        // Itens do pedido - mesma fonte das informações do cliente
        commands += ESC + '!' + '\x18'; // Fonte dupla para título dos itens
        commands += 'ITENS DO PEDIDO:\n';
        commands += ESC + '!' + '\x08'; // Mesma fonte das informações do cliente
        
        order.items.forEach(item => {
            const itemName = item.name;
            const price = `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`;
            const quantity = `${item.quantity}x `;
            
            // Sempre quebrar em duas linhas para garantir que não haja reticências
            commands += `${quantity}${itemName}\n`;
            commands += `${' '.repeat(20)}${price}\n`;
        });
        
        commands += '------------------------\n';
        
        // Totais - mesma fonte das informações do cliente
        commands += ESC + '!' + '\x08'; // Mesma fonte das informações do cliente
        const subtotal = `R$ ${order.pricing.subtotal.toFixed(2).replace('.', ',')}`;
        commands += `SUBTOTAL: ${subtotal}\n`;
        
        if (order.pricing.discountValue > 0) {
            const discount = `R$ ${order.pricing.discountAmount.toFixed(2).replace('.', ',')}`;
            commands += `DESCONTO: -${discount}\n`;
        }
        
        if (order.delivery.type === 'entrega') {
            const delivery = `R$ ${order.pricing.deliveryFee.toFixed(2).replace('.', ',')}`;
            commands += `ENTREGA: ${delivery}\n`;
        }
        
        commands += '========================\n';
        
        // Total final - fonte bem grande
        commands += ESC + '!' + '\x38'; // Fonte tripla (altura dupla + largura dupla + negrito)
        const total = `R$ ${order.pricing.total.toFixed(2).replace('.', ',')}`;
        commands += `TOTAL: ${total}\n`;
        commands += ESC + '!' + '\x00'; // Fonte normal
        
        commands += '========================\n';
        
        // Rodapé
        commands += ESC + 'a' + '\x01'; // Centralizar
        commands += ESC + '!' + '\x08'; // Fonte com negrito
        commands += 'Obrigado pela preferencia!\n';
        commands += 'Volte sempre!\n\n';
        commands += ESC + '!' + '\x00'; // Fonte normal
        
        // Cortar papel
        commands += GS + 'V' + '\x41' + '\x03'; // Corte parcial
        
        return commands;
    }

    // Nova função para quebra de linha inteligente
    formatLineWithBreak(label, text, maxLineLength = 30) {
        if (!text) return '';
        
        const fullLine = `${label} ${text}`;
        
        if (fullLine.length <= maxLineLength) {
            return `${fullLine}\n`;
        } else {
            // Quebrar linha - label na primeira linha, texto continua na segunda
            if (text.length <= maxLineLength) {
                return `${label}\n${text}\n`;
            } else {
                // Texto muito longo - quebrar em múltiplas linhas
                let result = `${label}\n`;
                let remainingText = text;
                
                while (remainingText.length > maxLineLength) {
                    const breakPoint = remainingText.lastIndexOf(' ', maxLineLength);
                    if (breakPoint > 0) {
                        result += remainingText.substring(0, breakPoint) + '\n';
                        remainingText = remainingText.substring(breakPoint + 1);
                    } else {
                        // Forçar quebra se não houver espaço
                        result += remainingText.substring(0, maxLineLength) + '\n';
                        remainingText = remainingText.substring(maxLineLength);
                    }
                }
                
                if (remainingText.length > 0) {
                    result += remainingText + '\n';
                }
                
                return result;
            }
        }
    }

    truncateText(text, maxLength) {
        // Agora retorna o texto completo sem truncar
        return text || '';
    }

    fallbackPrint(orderData) {
        console.log('📄 Usando impressão padrão do navegador...');
        // Usar a função de impressão padrão existente
        if (typeof printOrder === 'function') {
            // Chamar a função original sem o QZ Tray
            const originalQZ = window.thermalPrinter;
            window.thermalPrinter = null;
            printOrder();
            window.thermalPrinter = originalQZ;
        }
    }

    showPrintSuccess() {
        // Removido - apenas log no console
        console.log('✅ Comanda impressa com sucesso!');
    }

    showPrintError(error) {
        // Removido - apenas log no console
        console.error('❌ Erro na impressão:', error);
    }

    // Função showMessage removida - não será mais usada

    // Função showConnectionHelp removida - não será mais usada

    // Método para configurar impressora manualmente
    async selectPrinter() {
        try {
            // Verificar se QZ está ativo
            if (!this.isQZReady) {
                console.warn('❌ QZ Tray não está conectado');
                return;
            }

            console.log('🔍 Listando impressoras disponíveis...');
            const printers = await qz.printers.find();
            
            if (!printers || printers.length === 0) {
                console.warn('❌ Nenhuma impressora encontrada');
                return;
            }
            
            // Criar modal de seleção
            const modal = this.createPrinterModal(printers);
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('❌ Erro ao listar impressoras:', error);
        }
    }

    createPrinterModal(printers) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        content.innerHTML = `
            <h3>🖨️ Selecionar Impressora Térmica</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Selecione a impressora que será usada para imprimir as comandas:
            </p>
            <div style="margin: 20px 0;">
                ${printers.map((printer, index) => `
                    <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="printer" value="${printer}" 
                                   ${index === 0 ? 'checked' : ''} 
                                   style="margin-right: 10px;">
                            <div>
                                <strong>${printer}</strong>
                                ${this.isProbablyThermal(printer) ? 
                                    '<br><small style="color: #28a745;">✅ Impressora térmica detectada</small>' : 
                                    '<br><small style="color: #6c757d;">ℹ️ Impressora comum</small>'
                                }
                            </div>
                        </label>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button id="cancel-printer" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Cancelar
                </button>
                <button id="select-printer" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Selecionar
                </button>
                <button id="test-printer" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Testar
                </button>
            </div>
        `;

        modal.appendChild(content);

        // Event listeners
        content.querySelector('#cancel-printer').onclick = () => {
            document.body.removeChild(modal);
        };

        content.querySelector('#select-printer').onclick = () => {
            const selected = content.querySelector('input[name="printer"]:checked');
            if (selected) {
                this.printerName = selected.value;
                this.updatePrinterStatus(this.printerName);
                console.log('✅ Impressora selecionada:', this.printerName);
            }
            document.body.removeChild(modal);
        };

        content.querySelector('#test-printer').onclick = () => {
            const selected = content.querySelector('input[name="printer"]:checked');
            if (selected) {
                this.testPrinter(selected.value);
            }
        };

        return modal;
    }

    isProbablyThermal(printerName) {
        const thermalKeywords = ['thermal', 'receipt', 'pos', 'tm-', 'rp-', 'tsc', 'zebra', 'bematech', 'elgin', 'mp-', 'dr-', 'daruma'];
        const printerLower = printerName.toLowerCase();
        return thermalKeywords.some(keyword => printerLower.includes(keyword));
    }

    async testPrinter(printerName) {
        try {
            console.log('🧪 Testando impressora:', printerName);
            
            const config = qz.configs.create(printerName);
            const testData = [{
                type: 'raw',
                format: 'command',
                data: '\x1b@\x1ba\x01\x1b!\x18TESTE DE IMPRESSORA\x1b!\x08\n========================\n\x1b!\x08Se voce esta lendo isto,\na impressora esta funcionando!\n\nCLIENTE: João da Silva Santos\nFONE: (11) 99999-9999\nENDERECO: Rua das Flores 123\nApartamento 45B Jardim Paulista\n\nITENS DO PEDIDO:\n2x Pizza Calabresa Grande Especial\n                    R$ 45,90\n\nSUBTOTAL: R$ 45,90\nENTREGA: R$ 5,00\n\x1b!\x38TOTAL: R$ 50,90\x1b!\x00\n\n\x1b!\x08Fonte padronizada!\nSem reticencias!\x1b!\x00\n\n\n\x1dV\x41\x03'
            }];

            await qz.print(config, testData);
            console.log('✅ Teste enviado para a impressora!');
            
        } catch (error) {
            console.error('❌ Erro no teste:', error);
        }
    }
}

// Aguardar o DOM e todos os scripts estarem prontos antes de instanciar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, criando ThermalPrinter...');
    window.thermalPrinter = new ThermalPrinter();
});

// CSS das animações removido - não é mais necessário 