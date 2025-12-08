Write-Host "Iniciando Backend..." -ForegroundColor Green
Set-Location backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

