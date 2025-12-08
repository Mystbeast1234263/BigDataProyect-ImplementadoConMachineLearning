# Script PowerShell para generar Word del Informe ML con formato APA

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Generador de Word - Informe ML con Formato APA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe el entorno virtual
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Advertencia: No se encontro el entorno virtual." -ForegroundColor Yellow
    Write-Host "Asegurate de tener las dependencias instaladas:" -ForegroundColor Yellow
    Write-Host "  pip install markdown python-docx" -ForegroundColor Yellow
    Write-Host ""
}

# Ejecutar el script Python
try {
    python generar_word_informe_ml.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "Documento Word generado exitosamente!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Red
        Write-Host "Error al generar el documento. Revisa los mensajes arriba." -ForegroundColor Red
        Write-Host "============================================================" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

