@echo off
echo ========================================
echo Iniciando Backend FastAPI
echo ========================================
echo.
cd backend
echo Verificando Python...
python --version
echo.
echo Instalando dependencias si es necesario...
pip install -q -r requirements.txt
echo.
echo Iniciando servidor en http://localhost:8000
echo API Docs: http://localhost:8000/api/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause

