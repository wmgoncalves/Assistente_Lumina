@echo off
title Sky - Assistente de IA Scapini
color 0A
echo.
echo  ============================================
echo    SKY - Assistente de IA Scapini
echo  ============================================
echo.

:: Verifica Node.js
node --version >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado!
  echo  Baixe e instale em: https://nodejs.org
  echo.
  pause
  exit /b 1
)

:: Instala dependencias se necessario
if not exist node_modules (
  echo  Instalando dependencias...
  call npm install
  echo.
)

:: ─── Ollama: reinicia com GPU desativada (evita crash de CUDA) ───────────────
echo  Configurando Ollama (modo CPU)...
taskkill /F /IM "ollama app.exe" >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1
timeout /T 2 /NOBREAK >nul

:: Garante variavel de ambiente no nivel de usuario
reg add "HKCU\Environment" /v OLLAMA_NUM_GPU /t REG_SZ /d "0" /f >nul 2>&1

:: Inicia Ollama em background com GPU=0
set OLLAMA_NUM_GPU=0
set CUDA_VISIBLE_DEVICES=-1
start /B "" ollama serve >nul 2>&1
timeout /T 5 /NOBREAK >nul
echo  Ollama iniciado em modo CPU.
echo.

:: ─── Sky ─────────────────────────────────────────────────────────────────────
echo  Iniciando Sky...
echo  Abra o Chrome em: http://localhost:8080
echo  Pressione Ctrl+C para encerrar.
echo.

node server.js
pause
