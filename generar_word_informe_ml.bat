@echo off
echo ============================================================
echo Generador de Word - Informe ML con Formato APA
echo ============================================================
echo.

REM Verificar si existe el entorno virtual
if exist venv\Scripts\activate.bat (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo Advertencia: No se encontro el entorno virtual.
    echo Asegurate de tener las dependencias instaladas:
    echo   pip install markdown python-docx
    echo.
)

REM Ejecutar el script Python
python generar_word_informe_ml.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo Documento Word generado exitosamente!
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo Error al generar el documento. Revisa los mensajes arriba.
    echo ============================================================
    pause
    exit /b 1
)

pause

