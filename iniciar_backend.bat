@echo off
title Backend FastAPI - GAMC Dashboard
color 0A
echo ========================================
echo   BACKEND FASTAPI - GAMC Dashboard
echo ========================================
echo.
cd /d "%~dp0"
echo Directorio raiz: %CD%
echo.
echo Verificando Python...
python --version
if errorlevel 1 (
    echo ERROR: Python no encontrado
    pause
    exit /b 1
)
echo.
echo Iniciando servidor...
echo.
echo ========================================
echo   URL: http://localhost:8000
echo   API: http://localhost:8000/api
echo   Docs: http://localhost:8000/api/docs
echo ========================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
if errorlevel 1 (
    echo.
    echo ERROR al iniciar el servidor
    echo Verifica que todas las dependencias esten instaladas:
    echo   pip install -r requirements.txt
    echo.
    pause
)

