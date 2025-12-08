@echo off
echo ============================================================
echo Generador de PDF - Guia de Despliegue
echo ============================================================
echo.

REM Verificar si existe el entorno virtual
if exist venv\Scripts\activate.bat (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo Advertencia: No se encontro el entorno virtual.
    echo Asegurate de tener las dependencias instaladas:
    echo   pip install markdown xhtml2pdf
    echo.
)

REM Ejecutar el script Python
python generar_pdf_despliegue.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo PDF generado exitosamente!
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo Error al generar el PDF. Revisa los mensajes arriba.
    echo ============================================================
    pause
    exit /b 1
)

pause

