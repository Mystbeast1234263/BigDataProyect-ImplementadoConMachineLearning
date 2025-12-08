# Script PowerShell para generar PDF de despliegue

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Generador de PDF - Guia de Despliegue" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe el entorno virtual
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Advertencia: No se encontro el entorno virtual." -ForegroundColor Yellow
    Write-Host "Asegurate de tener las dependencias instaladas:" -ForegroundColor Yellow
    Write-Host "  pip install markdown xhtml2pdf" -ForegroundColor Yellow
    Write-Host ""
}

# Ejecutar el script Python
try {
    python generar_pdf_despliegue.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "PDF generado exitosamente!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Red
        Write-Host "Error al generar el PDF. Revisa los mensajes arriba." -ForegroundColor Red
        Write-Host "============================================================" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

