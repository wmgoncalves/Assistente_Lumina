@echo off
setlocal enabledelayedexpansion
title Sky - Instalacao
color 0A
echo.
echo  ============================================
echo    SKY - Assistente de IA Scapini
echo    Instalacao / Primeiro Uso
echo  ============================================
echo.

:: ── 1. Verifica Node.js ───────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado!
  echo.
  echo  Acesse https://nodejs.org e instale a versao LTS.
  echo  Depois execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)
echo  [OK] Node.js encontrado.

:: ── 2. Instala dependencias ───────────────────────────────────────────────────
echo  Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 (
  echo.
  echo  [ERRO] Falha ao instalar dependencias.
  echo  Verifique sua conexao com a internet e tente novamente.
  pause
  exit /b 1
)
echo  [OK] Dependencias instaladas.
echo.

:: ── 3. Cria config.json se nao existir ───────────────────────────────────────
if not exist config.json (
  echo  Configurando Sky pela primeira vez...
  echo.
  echo  Voce precisara da chave da API Gemini.
  echo  Obtenha em: https://aistudio.google.com/app/apikey
  echo.
  set /p GEMINI_KEY="  Cole sua chave Gemini API aqui: "
  echo.

  (
    echo {
    echo   "geminiKey": "!GEMINI_KEY!",
    echo   "elevenLabsKey": "",
    echo   "elevenVoiceFemaleId": "",
    echo   "elevenVoiceMaleId": "",
    echo   "username": "",
    echo   "ollamaModel": "gemma3:1b",
    echo   "piperVoiceFemale": "",
    echo   "piperVoiceMale": "pt_BR-cadu-medium"
    echo }
  ) > config.json

  echo  [OK] config.json criado com sua chave.
) else (
  echo  [OK] config.json ja existe.
)

echo.
echo  ============================================
echo    Instalacao concluida!
echo.
echo    Para iniciar a Sky, execute: start.bat
echo  ============================================
echo.
pause
