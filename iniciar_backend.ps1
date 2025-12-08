Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKEND FASTAPI - GAMC Dashboard" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio raíz del proyecto
Set-Location -Path $PSScriptRoot

Write-Host "Directorio raíz: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Verificar Python
Write-Host "Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host $pythonVersion -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python no encontrado" -ForegroundColor Red
    Write-Host "Instala Python desde https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:8000" -ForegroundColor White
Write-Host "  API: http://localhost:8000/api" -ForegroundColor White
Write-Host "  Docs: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  Health: http://localhost:8000/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar uvicorn desde la raíz, apuntando al módulo backend.main
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR al iniciar el servidor" -ForegroundColor Red
    Write-Host "Verifica que todas las dependencias esten instaladas:" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
}

