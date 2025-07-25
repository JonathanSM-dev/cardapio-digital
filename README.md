# 🍔 Cardápio Digital

Um web app simples e moderno para criação de cardápio digital com sistema de pedidos e impressão de comanda.

## ✨ Funcionalidades

- **Cardápio Digital**: Visualização de itens organizados por categoria (Lanches, Bebidas, Sobremesas)
- **Carrinho de Compras**: Adicionar/remover itens e controlar quantidades
- **Sistema de Pedidos**: Formulário completo para dados do cliente e entrega
- **Cálculo Automático**: Subtotal, taxa de entrega e total final
- **Impressão de Comanda**: Geração de comanda formatada para impressão
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Interface Moderna**: Design limpo e intuitivo com boa UX

## 🚀 Como Usar

### 1. Navegação no Cardápio
- Visualize todos os itens ou filtre por categoria usando os botões no topo
- Clique em "Adicionar ao Carrinho" para incluir itens no pedido
- O contador do carrinho mostra quantidade de itens e valor total

### 2. Gerenciamento do Carrinho
- Clique no botão do carrinho para visualizar itens selecionados
- Use os botões + e - para ajustar quantidades
- Clique em "Finalizar Pedido" quando estiver pronto

### 3. Finalização do Pedido
- Preencha os dados obrigatórios: Nome, Celular e Endereço
- Ajuste a taxa de entrega se necessário (padrão: R$ 5,00)
- Adicione observações especiais se desejar
- Confirme o pedido clicando em "Confirmar Pedido"

### 4. Comanda e Impressão
- Após confirmar, visualize o resumo completo do pedido
- Clique em "Imprimir Comanda" para gerar a versão para impressão
- Use "Novo Pedido" para começar um novo atendimento

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design moderno com gradientes, transições e responsividade
- **JavaScript Vanilla**: Funcionalidades interativas sem dependências
- **Font Awesome**: Ícones elegantes e consistentes

## 📁 Estrutura do Projeto

```
cardapio-digital/
├── index.html          # Página principal
├── style.css           # Estilos e design responsivo
├── script.js           # Lógica da aplicação
└── README.md           # Documentação
```

## 🌐 Deploy no GitHub Pages

### Passo a Passo:

1. **Criar Repositório no GitHub**
   ```bash
   # Clone ou faça upload dos arquivos para um repositório
   git init
   git add .
   git commit -m "Cardápio digital inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/cardapio-digital.git
   git push -u origin main
   ```

2. **Ativar GitHub Pages**
   - Vá para as configurações do repositório
   - Role até a seção "Pages"
   - Em "Source", selecione "Deploy from a branch"
   - Escolha "main" como branch e "/ (root)" como pasta
   - Clique em "Save"

3. **Acessar o Site**
   - Aguarde alguns minutos para o deploy
   - Acesse: `https://SEU_USUARIO.github.io/cardapio-digital/`

### Domínio Personalizado (Opcional)
- Nas configurações do GitHub Pages, adicione seu domínio personalizado
- Configure os registros DNS conforme as instruções do GitHub

## 🎨 Personalização

### Modificar o Cardápio
Edite o array `menuData` no arquivo `script.js`:

```javascript
const menuData = [
    {
        id: 1,
        name: "Nome do Item",
        description: "Descrição detalhada",
        price: 25.90,
        category: "lanches" // ou "bebidas", "sobremesas"
    }
    // Adicione mais itens...
];
```

### Personalizar Cores
Modifique as variáveis CSS no arquivo `style.css`:

```css
/* Exemplo de gradientes principais */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Ajustar Taxa de Entrega Padrão
No arquivo `script.js`, procure por:

```javascript
document.getElementById('delivery-fee').value = '5.00';
```

## 📱 Compatibilidade

- ✅ Chrome/Edge/Safari (versões modernas)
- ✅ Firefox
- ✅ Dispositivos móveis (iOS/Android)
- ✅ Tablets
- ✅ Impressão (formatação otimizada)

## 🔧 Desenvolvimento Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/SEU_USUARIO/cardapio-digital.git
   cd cardapio-digital
   ```

2. **Abra localmente**
   - Simplesmente abra o `index.html` no navegador
   - Ou use um servidor local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (se tiver o live-server instalado)
   live-server
   ```

## 📋 Funcionalidades Futuras (Ideias)

- [ ] Integração com WhatsApp para envio automático
- [ ] Sistema de cupons de desconto
- [ ] Histórico de pedidos
- [ ] Painel administrativo
- [ ] Integração com sistemas de pagamento
- [ ] Notificações push

## 📄 Licença

Este projeto é open source e está disponível sob a [Licença MIT](LICENSE).

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📞 Suporte

Para dúvidas ou sugestões, abra uma [issue](https://github.com/SEU_USUARIO/cardapio-digital/issues) no repositório.

---

**Desenvolvido com ❤️ para facilitar o atendimento de restaurantes e lanchonetes** 