# GAMC Big Data Dashboard

## Descripción
Este proyecto implementa un **sistema completo de Big Data** para análisis de sensores IoT, con una arquitectura moderna separada en backend (FastAPI) y frontend (React + Vite).

El sistema integra **MongoDB Atlas** y un **dashboard web interactivo** desarrollado con React para el análisis exhaustivo de datos de sensores de calidad del aire, sonido y subterráneos.

### Características principales:
- **Arquitectura separada** Backend (FastAPI) y Frontend (React)
- **API RESTful** completa con autenticación JWT
- **Visualización completa** con múltiples gráficos interactivos
- **Filtros avanzados** de fecha/hora en tiempo real
- **Integración MongoDB Atlas** con guardado sin duplicados
- **Soporte multi-formato** para análisis de datos históricos

---

## Arquitectura del Sistema

```
Frontend (React) ←→ Backend (FastAPI) ←→ MongoDB Atlas
     ↑                      ↓
  Vite Dev Server      REST API
```

### Componentes:
1. **Backend** (`backend/`): API REST con FastAPI, autenticación y gestión de sensores
2. **Frontend** (`frontend/`): Dashboard web interactivo con React y Vite
3. **Configuración** (`config.py`): Configuraciones centralizadas del sistema

---

## Tecnologías utilizadas

### Backend:
- **Python 3.8+**: Lenguaje principal
- **FastAPI**: Framework web moderno y rápido
- **MongoDB Atlas**: Base de datos en la nube
- **pymongo**: Cliente de MongoDB para Python
- **JWT**: Autenticación con tokens

### Frontend:
- **React 18**: Biblioteca de UI
- **Vite**: Build tool y dev server
- **React Router**: Navegación
- **Plotly.js**: Visualizaciones interactivas
- **Tailwind CSS**: Estilos modernos
- **Zustand**: Gestión de estado

### Análisis de Datos:
- **pandas**: Manipulación de datos
- **pytz**: Manejo de zonas horarias

---

## Estructura del proyecto

```
BigDataProyect2/
│
├─ backend/                           # Backend FastAPI
│   ├─ main.py                        # Aplicación principal
│   ├─ models.py                      # Modelos de datos
│   ├─ requirements.txt               # Dependencias Python
│   ├─ routes/                        # Rutas de la API
│   │   ├─ auth.py                   # Autenticación
│   │   └─ sensors.py                # Endpoints de sensores
│   └─ services/                      # Servicios
│       ├─ mongodb_service.py        # Servicio MongoDB
│       ├─ auth_service.py           # Servicio de autenticación
│       └─ supabase_service.py       # Servicio Supabase (opcional)
│
├─ frontend/                          # Frontend React
│   ├─ src/
│   │   ├─ components/               # Componentes React
│   │   ├─ services/                 # Servicios API
│   │   └─ store/                    # Estado global
│   ├─ package.json                  # Dependencias Node.js
│   └─ vite.config.js                # Configuración Vite
│
├─ config.py                         # Configuraciones
├─ requirements.txt                  # Dependencias Python (raíz)
├─ .env.example                      # Ejemplo de variables de entorno
│
└─ Documentación/
    ├─ README.md                     # Este archivo
    ├─ ARQUITECTURA.md               # Documentación de arquitectura
    ├─ DESPLIEGUE.md                 # Guía de despliegue
    ├─ INFORME_FINAL.md              # Informe con conclusiones
    └─ CRONOGRAMA.md                 # Cronograma y trabajo en equipo
```

---

## Instalación Rápida

### Prerrequisitos
- Python 3.8 o superior
- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd BigDataProyect2-Joel
```

2. **Configurar Backend**
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r backend/requirements.txt
```

3. **Configurar Frontend**
```bash
cd frontend
npm install
cd ..
```

4. **Configurar variables de entorno**
```bash
# Copiar el archivo de ejemplo
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Editar .env y configurar:
# - MONGO_URI: Cadena de conexión de MongoDB Atlas
# - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (opcional)
```

---

## Uso Rápido

### Opción 1: Iniciar todo automáticamente (Recomendado)

**Windows:**
```bash
start_all.bat
```

**PowerShell:**
```powershell
.\start_all.ps1
```

### Opción 2: Iniciar por separado

**Terminal 1 - Backend:**
```bash
# Windows
start_backend.bat

# O manualmente:
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
# Windows
start_frontend.bat

# O manualmente:
cd frontend
npm run dev
```

### Acceder a la aplicación

- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Frontend:** http://localhost:5173

### Credenciales de Demo

El sistema incluye usuarios de demostración que se crean automáticamente. Consulta la documentación de la API para más detalles.

---

## Funcionalidades del Dashboard

### 1. Fuentes de Datos
- **MongoDB Atlas**: Datos históricos desde la nube
- **Generate Random**: Generación de datos aleatorios con fechas distribuidas
- **Upload File**: Carga de CSV, Excel, JSON, Parquet con normalización automática

### 2. Normalización Automática
- **Limpieza de encabezados**: Maneja espacios, caracteres especiales
- **Detección de timestamps**: Identifica columnas de fecha/hora automáticamente
- **Conversión de tipos**: Convierte valores numéricos con comas, porcentajes
- **Filtrado inteligente**: Extrae solo columnas relevantes para visualización

### 3. Visualización Completa
Al seleccionar una métrica, se muestran **6 gráficos simultáneos**:
- **Serie de Tiempo** (Línea)
- **Distribución** (Histograma)
- **Área**
- **Dispersión** (Scatter)
- **Caja** (Box Plot)
- **Violín** (Violin Plot)

Cada gráfico incluye un **reporte automático** debajo con:
- Registros totales
- Promedio
- Desviación estándar
- Mínimo
- Máximo
- Rango temporal

### 4. Filtros Avanzados
- **Filtro de fechas**: Seleccionar rango de fechas
- **Filtro de horas**: Seleccionar rango de horas
- **Tipo de sensor**: 
  - Calidad del Aire (CO2, temperatura, humedad, presión)
  - Sonido (nivel de decibeles)
  - Subterráneo (nivel subterráneo)
  - Otros (Uploads) - Archivos subidos

### 5. KPIs Visuales
- **Promedio**: Valor promedio de la métrica
- **Mínimo**: Valor mínimo registrado
- **Máximo**: Valor máximo registrado

### 6. Guardado Inteligente
- **Sin duplicados**: Índices únicos previenen registros duplicados
- **Acumulación**: Múltiples generaciones se acumulan sin sobrescritura
- **Colecciones dinámicas**: Archivos subidos se organizan por fecha

---

## Configuración Avanzada

### Filtros de Fecha en el Productor
Editar `config.py`:
```python
DEFAULT_DATE_FILTER = {
    'habilitado': True,
    'dias_atras': 7,  # Días hacia atrás desde hoy
    'fecha_inicio': None,  # Fecha específica de inicio
    'fecha_fin': None      # Fecha específica de fin
}
```

### Configuración de Kafka
```python
KAFKA_BROKER_URL = 'localhost:9092'
KAFKA_TOPIC = 'datos_sensores_gamc'
```

### Configuración del Dashboard
```python
AUTO_REFRESH_INTERVAL = 5000  # ms
SAMPLE_SIZE = 1000
```

---

## Solución de Problemas

### Kafka no conecta
- Verificar que Kafka esté ejecutándose
- Comprobar que el puerto 9092 esté disponible
- Revisar la configuración en `config.py`

### MongoDB no conecta
- Verificar la cadena de conexión en `config.py`
- Comprobar que la IP esté en la whitelist de MongoDB Atlas
- Verificar las credenciales

### Dashboard no muestra datos
- Verificar que el consumidor de Kafka esté ejecutándose
- Comprobar los logs del dashboard
- Verificar que hay datos en las colecciones de MongoDB

---

## Datos de Ejemplo

El proyecto incluye datos de ejemplo de sensores IoT de Cochabamba, Bolivia:
- **Sensores de Calidad del Aire**: CO2, temperatura, humedad, presión
- **Sensores de Sonido**: Niveles de decibeles
- **Sensores Subterráneos**: Niveles subterráneos

---

## Documentación Completa

- **[ARQUITECTURA.md](ARQUITECTURA.md)**: Arquitectura detallada del sistema con diagramas
- **[DESPLIEGUE.md](DESPLIEGUE.md)**: Guía completa de instalación y despliegue
- **[INFORME_FINAL.md](INFORME_FINAL.md)**: Conclusiones y recomendaciones del proyecto
- **[CRONOGRAMA.md](CRONOGRAMA.md)**: Cronograma y trabajo en equipo

## Tecnologías Implementadas

### Backend
- **Python 3.8+**: Lenguaje principal
- **FastAPI**: Framework web moderno
- **MongoDB Atlas**: Base de datos en la nube
- **Pandas**: Procesamiento de datos
- **JWT**: Autenticación con tokens

### Frontend
- **React 18**: Biblioteca de UI moderna
- **Vite**: Build tool y dev server rápido
- **React Router**: Navegación SPA
- **Plotly.js**: Visualizaciones interactivas
- **Tailwind CSS**: Framework CSS utility-first
- **Zustand**: Gestión de estado ligera

### Integraciones
- **pymongo**: Cliente MongoDB
- **axios**: Cliente HTTP para el frontend
- **python-jose**: Manejo de JWT

## Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Hacer commit de los cambios: `git commit -m "feat: descripción"`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.
