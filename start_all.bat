@echo off
echo Iniciando Backend y Frontend...
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

