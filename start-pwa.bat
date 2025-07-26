@echo off
echo.
echo ===============================================
echo 🍖 D'Casa ^& Cia Assados - PWA Server
echo ===============================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo 💡 Para instalar Node.js:
    echo    1. Vá para: https://nodejs.org
    echo    2. Baixe a versão LTS
    echo    3. Instale e reinicie o terminal
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo 🚀 Iniciando servidor PWA...
echo.

REM Iniciar servidor
node server.js

echo.
echo ⏹️ Servidor parado.
pause 