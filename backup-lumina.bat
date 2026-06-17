@echo off
cd /d "C:\Users\Scapini\.gemini\antigravity-ide\scratch\aura-os"

:: Verifica se tem algo para commitar
git status --porcelain > temp_status.txt 2>&1
for %%A in (temp_status.txt) do if %%~zA==0 (
  del temp_status.txt
  echo [%date% %time%] Nenhuma mudanca para commitar. >> backup-lumina.log
  exit /b 0
)
del temp_status.txt

:: Gera data no formato DD/MM/YYYY
for /f "tokens=1-3 delims=/" %%a in ("%date%") do (
  set DIA=%%a
  set MES=%%b
  set ANO=%%c
)

:: Commit e push
git add -A
git commit -m "Lumina — backup automatico 17:55 %DIA%/%MES%/%ANO%"
git push origin main

echo [%date% %time%] Backup concluido. >> backup-lumina.log
