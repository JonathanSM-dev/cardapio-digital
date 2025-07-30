# 🚀 Roadmap de Melhorias - D'Casa Restaurante

## 📋 Status Atual
- ✅ **Correções Críticas Implementadas** (Dez 2024)
  - Histórico de pedidos funcionando corretamente
  - Gráficos Chart.js implementados e funcionais
  - KPIs atualizados com dados corretos
  - Separação correta entre abas principais e sub-seções

---

## 🎯 Próximas Melhorias Prioritárias

### 1. 🖨️ **MELHORIA DE IMPRESSÃO** 
**Prioridade: ALTA**
- **Problema**: Impressão gerando várias páginas desnecessárias
- **Solução**: Otimizar CSS de impressão e dimensionamento
- **Arquivos afetados**: `style.css`, `script.js`
- **Estimativa**: 2-3 horas

**Tarefas:**
- [ ] Criar CSS específico para impressão (`@media print`)
- [ ] Ajustar dimensões de página e margens
- [ ] Otimizar quebras de página
- [ ] Testar impressão em diferentes navegadores

### 2. 📱 **MELHORIA TELA ÚLTIMOS PEDIDOS**
**Prioridade: ALTA**
- **Problema**: Falta informações importantes na visualização
- **Melhorias solicitadas**:
  - Mostrar **Nome do cliente** nos pedidos
  - Mostrar **Itens do pedido** detalhados
  - Trocar ícone de caminhão 🚛 por moto 🏍️

**Tarefas:**
- [ ] Adicionar campo Nome nos pedidos
- [ ] Expandir visualização de itens
- [ ] Atualizar ícones (truck → motorcycle)
- [ ] Melhorar layout da lista de pedidos

### 3. 🎨 **REDESIGN VISUAL BASEADO EM TENDÊNCIAS**
**Prioridade: MÉDIA-ALTA**
- **Objetivo**: Modernizar interface seguindo tendências 2024/2025
- **Inspirações**: Design systems modernos, UI clean, microinterações

**Elementos a redesenhar:**
- [ ] **Color Palette**: Cores mais modernas e acessíveis
- [ ] **Typography**: Fontes mais legíveis e hierarquia visual
- [ ] **Components**: Botões, cards, inputs com design system
- [ ] **Layout**: Grid system responsivo melhorado
- [ ] **Icons**: Conjunto de ícones consistente (Feather, Lucide, etc.)
- [ ] **Animations**: Microinterações suaves
- [ ] **Dark Mode**: Implementar tema escuro

---

## 🏗️ Estrutura de Implementação

### **Fase 1: Correções Urgentes** (1-2 semanas)
1. ✅ Correção de gráficos e histórico (CONCLUÍDO)
2. 🖨️ Melhoria de impressão
3. 📱 Informações nos últimos pedidos

### **Fase 2: Melhorias UX** (2-3 semanas)
1. 🎨 Redesign visual parcial
2. 🔄 Melhorias de performance
3. 📊 Dashboard mais intuitivo

### **Fase 3: Redesign Completo** (3-4 semanas)
1. 🎨 Design system completo
2. 🌙 Dark mode
3. 📱 Responsividade aprimorada
4. ⚡ Otimizações avançadas

---

## 📐 Especificações Técnicas

### **Melhoria de Impressão**
```css
@media print {
  * { 
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  .receipt {
    width: 80mm;
    max-width: 80mm;
    font-size: 12px;
    line-height: 1.2;
    page-break-inside: avoid;
  }
  
  .no-print { display: none !important; }
}
```

### **Campos Adicionais para Pedidos**
```javascript
// Estrutura expandida do pedido
const order = {
  id: string,
  sequentialId: number,
  customerName: string,        // NOVO
  customerPhone: string,       // NOVO
  items: [
    {
      id: number,
      name: string,
      quantity: number,
      price: number,
      notes: string            // NOVO
    }
  ],
  delivery: {
    type: 'entrega' | 'retirada',
    icon: 'motorcycle',        // ALTERADO
    address: string
  }
}
```

### **Design System Base**
```css
:root {
  /* Cores Modernas 2024 */
  --primary: #6366f1;          /* Indigo moderno */
  --secondary: #8b5cf6;        /* Purple */
  --success: #10b981;          /* Emerald */
  --warning: #f59e0b;          /* Amber */
  --error: #ef4444;            /* Red */
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  
  /* Sombras modernas */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 🎯 Métricas de Sucesso

### **Impressão**
- [ ] Redução de páginas impressas em 70%
- [ ] Tempo de impressão < 5 segundos
- [ ] Qualidade visual mantida

### **UX Últimos Pedidos**
- [ ] Informações completas visíveis
- [ ] Navegação mais intuitiva
- [ ] Feedback visual melhorado

### **Redesign**
- [ ] Lighthouse Score > 90
- [ ] Tempo de carregamento < 2s
- [ ] Responsividade 100% mobile

---

## 📅 Timeline Estimado

| Semana | Foco | Entregas |
|--------|------|----------|
| **S1** | 🖨️ Impressão | CSS print otimizado |
| **S2** | 📱 Últimos Pedidos | Campos nome/itens, ícone moto |
| **S3-S4** | 🎨 Design Base | Color palette, typography |
| **S5-S6** | 🎨 Components | Botões, cards, inputs redesenhados |
| **S7-S8** | 🌙 Dark Mode | Tema escuro completo |

---

## 🔧 Próximos Passos Imediatos

1. **Fazer push das correções atuais** para GitHub
2. **Implementar melhoria de impressão** (mais urgente)
3. **Expandir informações dos pedidos**
4. **Iniciar redesign gradual**

---

*Documento criado em: Dezembro 2024*  
*Última atualização: Aguardando implementação* 