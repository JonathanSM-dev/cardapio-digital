/**
 * Servidor HTTP simples para testar PWA localmente
 * Serve arquivos estáticos com headers corretos para PWA
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types para diferentes arquivos
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Headers específicos para PWA
const pwaHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Headers para Service Worker
const swHeaders = {
    'Service-Worker-Allowed': '/',
    'Cache-Control': 'no-cache'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Rota raiz
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    console.log(`📡 ${req.method} ${pathname}`);
    
    // Verificar se arquivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`❌ Arquivo não encontrado: ${pathname}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - Não Encontrado</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                        h1 { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1>404 - Arquivo Não Encontrado</h1>
                    <p>O arquivo <strong>${pathname}</strong> não foi encontrado.</p>
                    <a href="/">← Voltar ao início</a>
                </body>
                </html>
            `);
            return;
        }
        
        // Ler e servir arquivo
        fs.readFile(filePath, (err, content) => {
            if (err) {
                console.log(`❌ Erro ao ler arquivo: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Erro do Servidor</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                            h1 { color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Erro do Servidor</h1>
                        <p>Erro ao carregar o arquivo: ${err.message}</p>
                        <a href="/">← Voltar ao início</a>
                    </body>
                    </html>
                `);
                return;
            }
            
            // Headers base
            const headers = {
                'Content-Type': mimeType,
                ...pwaHeaders
            };
            
            // Headers específicos para Service Worker
            if (pathname === '/sw.js') {
                Object.assign(headers, swHeaders);
                console.log('🔧 Servindo Service Worker com headers especiais');
            }
            
            // Headers específicos para Manifest
            if (pathname === '/manifest.json') {
                headers['Content-Type'] = 'application/manifest+json';
                console.log('📋 Servindo Manifest com headers corretos');
            }
            
            // Headers para cache de recursos estáticos
            if (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.svg') {
                headers['Cache-Control'] = 'public, max-age=31536000'; // 1 ano para recursos estáticos
            }
            
            res.writeHead(200, headers);
            res.end(content);
            
            console.log(`✅ Servido: ${pathname} (${content.length} bytes)`);
        });
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log('🚀 ===============================================');
    console.log('🍖 D\'Casa & Cia Assados - Servidor PWA');
    console.log('🚀 ===============================================');
    console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
    console.log('📱 PWA totalmente funcional neste endereço!');
    console.log('🔧 Service Worker ativo');
    console.log('📋 Manifest carregado');
    console.log('💾 Instalação disponível');
    console.log('🚀 ===============================================');
    console.log('');
    console.log('📋 Como usar:');
    console.log('1. Abra: http://localhost:3000');
    console.log('2. Aguarde o botão "Instalar App" aparecer');
    console.log('3. Clique para instalar como PWA');
    console.log('4. Teste modo offline desconectando internet');
    console.log('');
    console.log('⏹️  Para parar: Ctrl+C');
    console.log('🚀 ===============================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    server.close(() => {
        console.log('✅ Servidor parado com sucesso!');
        process.exit(0);
    });
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Porta ${PORT} já está em uso!`);
        console.log('💡 Tente uma das opções:');
        console.log(`   1. Mude a porta no arquivo server.js`);
        console.log(`   2. Pare o processo que usa a porta ${PORT}`);
        console.log(`   3. Use: npx kill-port ${PORT}`);
    } else {
        console.log('❌ Erro no servidor:', err.message);
    }
    process.exit(1);
});

module.exports = server; 