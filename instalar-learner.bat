@echo off
echo Registrando Lumina Learner no Agendador de Tarefas...

schtasks /create /tn "LuminaLearner" /tr "node \"C:\Users\Scapini\.gemini\antigravity-ide\scratch\aura-os\learner.js\"" /sc daily /st 00:15 /ru "%USERNAME%" /rl highest /f /it

if %errorlevel%==0 (
    echo.
    echo Lumina Learner registrado com sucesso!
    echo Vai rodar toda noite as 00h15 e salvar no Obsidian.
    echo.
    echo Para testar agora: schtasks /run /tn "LuminaLearner"
) else (
    echo.
    echo ERRO ao registrar. Tente rodar este arquivo como Administrador.
)
pause
