@echo off
:: ─────────────────────────────────────────────────────────────
:: rotina.bat — Abre o Rotina Dashboard com um duplo clique
:: Coloque um atalho deste arquivo no Desktop
:: ─────────────────────────────────────────────────────────────

title Rotina — Organização Pessoal

:: Vai para a pasta do projeto (relativo ao local do .bat)
cd /d "%~dp0"

:: Verifica se o dist já existe, senão faz o build primeiro
if not exist "dist\index.html" (
    echo Primeira execucao — gerando build...
    cd apps\web
    call pnpm build
    cd ..\..
)

:: Sobe o servidor de preview em background e abre o Chrome
echo Iniciando servidor...
start "" /b cmd /c "cd apps\web && pnpm preview --port 4173"

:: Aguarda 2 segundos para o servidor subir
timeout /t 2 /nobreak >nul

:: Abre no Chrome (tenta caminhos comuns de instalação)
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set CHROME_X86="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

if exist %CHROME% (
    start "" %CHROME% "http://localhost:4173"
) else if exist %CHROME_X86% (
    start "" %CHROME_X86% "http://localhost:4173"
) else (
    :: Fallback: abre no browser padrão do sistema
    start "" "http://localhost:4173"
)

:: Mantém o servidor vivo em segundo plano (feche esta janela para encerrar)
echo.
echo ✓ Rotina rodando em http://localhost:4173
echo   Feche esta janela para encerrar o servidor.
echo.
cd apps\web && pnpm preview --port 4173
