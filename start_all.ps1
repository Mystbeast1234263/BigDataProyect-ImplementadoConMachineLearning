Write-Host "Iniciando Backend y Frontend..." -ForegroundColor Cyan
Write-Host ""

# Iniciar Backend desde la raíz del proyecto
$backendCmd = "Set-Location '$PWD'; Write-Host 'BACKEND FASTAPI' -ForegroundColor Green; Write-Host 'Puerto: 8000' -ForegroundColor Cyan; Write-Host 'API: http://localhost:8000/api' -ForegroundColor White; Write-Host 'Docs: http://localhost:8000/api/docs' -ForegroundColor White; Write-Host ''; python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Esperar un poco antes de iniciar el frontend
Write-Host "Esperando 3 segundos antes de iniciar frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar Frontend
$frontendCmd = "Set-Location '$PWD\frontend'; Write-Host 'FRONTEND REACT' -ForegroundColor Green; Write-Host 'Puerto: 5173' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:5173' -ForegroundColor White; Write-Host ''; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

