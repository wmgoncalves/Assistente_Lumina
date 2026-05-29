@echo off
title Emerald - Assistente de IA
color 0A
echo.
echo  ============================================
echo    EMERALD - Assistente de IA
echo  ============================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado!
  echo  Baixe e instale em: https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Instalando dependencias...
  call npm install
  echo.
)

echo  Iniciando Emerald...
echo  Abra o Chrome em: http://localhost:8080
echo  Pressione Ctrl+C para encerrar.
echo.

node server.js
pause
