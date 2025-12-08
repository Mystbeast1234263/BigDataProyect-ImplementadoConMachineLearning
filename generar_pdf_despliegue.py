#!/usr/bin/env python3
"""
Script para generar PDF directamente desde el archivo DESPLIEGUE.md
"""

import os
import sys
from pathlib import Path

try:
    import markdown
    from xhtml2pdf import pisa
    from io import BytesIO
except ImportError as e:
    print(f"❌ Error: Faltan dependencias. Instala con:")
    print(f"   pip install markdown xhtml2pdf")
    print(f"\nError específico: {e}")
    sys.exit(1)


def generar_pdf_despliegue():
    """Genera un PDF directamente desde DESPLIEGUE.md"""
    
    # Rutas
    base_dir = Path(__file__).parent
    md_file = base_dir / "docs" / "DESPLIEGUE.md"
    output_pdf = base_dir / "docs" / "Guia_Despliegue_GAMC_BigData_Dashboard.pdf"
    
    # Verificar que existe el archivo Markdown
    if not md_file.exists():
        print(f"❌ Error: No se encontró el archivo {md_file}")
        sys.exit(1)
    
    print(f"📖 Leyendo archivo: {md_file}")
    
    # Leer contenido Markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    # Convertir Markdown a HTML
    print("🔄 Convirtiendo Markdown a HTML...")
    md = markdown.Markdown(extensions=['extra', 'codehilite', 'tables', 'fenced_code'])
    html_content = md.convert(markdown_content)
    
    # CSS para el PDF (compatible con xhtml2pdf)
    css_styles = """
    @page {
        size: A4;
        margin: 2cm;
    }
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.6;
        color: #333;
        font-size: 11pt;
    }
    
    h1 {
        color: #1e40af;
        font-size: 24pt;
        margin-top: 20pt;
        margin-bottom: 12pt;
        padding-bottom: 8pt;
        border-bottom: 3px solid #2563eb;
        page-break-after: avoid;
    }
    
    h2 {
        color: #1e40af;
        font-size: 18pt;
        margin-top: 18pt;
        margin-bottom: 10pt;
        padding-bottom: 6pt;
        border-bottom: 2px solid #e2e8f0;
        page-break-after: avoid;
    }
    
    h3 {
        color: #334155;
        font-size: 14pt;
        margin-top: 14pt;
        margin-bottom: 8pt;
        page-break-after: avoid;
    }
    
    h4 {
        color: #475569;
        font-size: 12pt;
        margin-top: 12pt;
        margin-bottom: 6pt;
        page-break-after: avoid;
    }
    
    p {
        margin-bottom: 10pt;
        text-align: justify;
    }
    
    ul, ol {
        margin-left: 20pt;
        margin-bottom: 10pt;
    }
    
    li {
        margin-bottom: 6pt;
    }
    
    code {
        background-color: #f1f5f9;
        padding: 2pt 4pt;
        font-family: 'Courier New', monospace;
        font-size: 9pt;
        color: #e11d48;
    }
    
    pre {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 12pt;
        margin: 12pt 0;
        page-break-inside: avoid;
        font-size: 9pt;
        line-height: 1.4;
        overflow-wrap: break-word;
    }
    
    pre code {
        background-color: transparent;
        padding: 0;
        color: #1e293b;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 12pt 0;
        page-break-inside: avoid;
    }
    
    th, td {
        border: 1px solid #e2e8f0;
        padding: 8pt;
        text-align: left;
    }
    
    th {
        background-color: #f1f5f9;
        font-weight: bold;
        color: #1e40af;
    }
    
    blockquote {
        border-left: 4px solid #2563eb;
        padding-left: 12pt;
        margin: 12pt 0;
        color: #64748b;
        font-style: italic;
    }
    
    hr {
        border: none;
        border-top: 2px solid #e2e8f0;
        margin: 20pt 0;
    }
    
    strong {
        color: #1e293b;
        font-weight: bold;
    }
    
    a {
        color: #2563eb;
        text-decoration: none;
    }
    
    /* Evitar saltos de página */
    h1, h2, h3, h4 {
        page-break-after: avoid;
    }
    """
    
    # Crear HTML completo
    html_document = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Guía de Despliegue - GAMC Big Data Dashboard</title>
        <style>
        {css_styles}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Generar PDF
    print("📄 Generando PDF...")
    try:
        with open(output_pdf, 'w+b') as pdf_file:
            pisa_status = pisa.CreatePDF(
                BytesIO(html_document.encode('utf-8')),
                dest=pdf_file,
                encoding='utf-8'
            )
        
        if pisa_status.err:
            print(f"❌ Error al generar PDF: {pisa_status.err}")
            return False
        
        print(f"✅ PDF generado exitosamente: {output_pdf}")
        print(f"   Tamaño del archivo: {output_pdf.stat().st_size / 1024:.2f} KB")
        return True
    except Exception as e:
        print(f"❌ Error al generar PDF: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Generador de PDF - Guía de Despliegue")
    print("=" * 60)
    print()
    
    success = generar_pdf_despliegue()
    
    print()
    if success:
        print("✨ ¡Proceso completado exitosamente!")
    else:
        print("⚠️  El proceso falló. Revisa los errores arriba.")
        sys.exit(1)

