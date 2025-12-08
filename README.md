# GAMC Big Data Dashboard

**Sistema completo de análisis y predicción para datos de sensores IoT con Machine Learning**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/cloud/atlas)
[![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.3+-orange.svg)](https://scikit-learn.org/)

## 📋 Descripción

Este proyecto implementa un **sistema completo de Big Data** para análisis de sensores IoT, con una arquitectura moderna separada en backend (FastAPI) y frontend (React + Vite). El sistema integra **Machine Learning** para predicciones de estados de sensores (normal/warning/critical) con modelos que superan el 85% de F1-Score requerido.

### ✨ Características principales:

- **🏗️ Arquitectura de 5 Capas**: Fuentes → Ingesta → Almacenamiento → Procesamiento → ML → Visualización
- **🤖 Machine Learning**: Entrenamiento automático de modelos (Random Forest, Logistic Regression, Decision Tree)
- **📊 ML Wizard**: Interfaz intuitiva de 5 pasos para entrenar modelos y hacer predicciones
- **🔮 Predicciones Completas**: Por fecha, período (mes) y semana
- **📈 Visualización Interactiva**: Dashboards con múltiples gráficos (Recharts)
- **🔐 Autenticación JWT**: Seguridad con tokens
- **☁️ MongoDB Atlas**: Base de datos en la nube escalable
- **📁 Soporte Multi-formato**: CSV, Excel, JSON, Parquet

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Capa 0: Fuentes"
        A1[MongoDB Atlas]
        A2[Archivos CSV/Excel/JSON]
    end
    
    subgraph "Capa 1: Ingesta"
        B1[FastAPI Endpoints]
        B2[Validación Pydantic]
    end
    
    subgraph "Capa 2: Almacenamiento"
        C1[MongoDB - Datos]
        C2[Supabase - Usuarios]
        C3[File System - Modelos ML]
    end
    
    subgraph "Capa 3: Procesamiento"
        D1[Servicios Python]
        D2[Pandas/NumPy]
    end
    
    subgraph "Capa 4: Machine Learning"
        E1[Scikit-learn]
        E2[Entrenamiento]
        E3[Predicción]
    end
    
    subgraph "Capa 5: Visualización"
        F1[React 18]
        F2[ML Wizard]
        F3[Dashboards]
    end
    
    A1 --> B1
    A2 --> B1
    B1 --> C1
    C1 --> D1
    D1 --> E1
    E1 --> F1
```

### Componentes:
1. **Backend** (`backend/`): API REST con FastAPI, autenticación, ML y gestión de sensores
2. **Frontend** (`frontend/`): Dashboard web interactivo con React, Vite y ML Wizard
3. **Machine Learning** (`backend/services/ml_classification_service.py`): Entrenamiento y predicción
4. **Configuración** (`config.py`, `.env`): Configuraciones centralizadas

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
git clone https://github.com/Mystbeast1234263/BigDataProyect-ImplementadoConMachineLearning.git
cd BigDataProyect-ImplementadoConMachineLearning
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

## 📚 Documentación Completa

La documentación completa del proyecto está disponible en la carpeta `/docs`:

- **[📄 INFORME_ML.md](docs/INFORME_ML.md)**: Informe técnico completo con arquitectura, diagramas, documentación ML, métricas y conclusiones
- **[🚀 DESPLIEGUE.md](docs/DESPLIEGUE.md)**: Guía completa de instalación, configuración y despliegue paso a paso
- **[📅 CRONOGRAMA.md](docs/CRONOGRAMA.md)**: Cronograma del proyecto con diagrama Gantt y evidencia de trabajo en equipo
- **[🎬 GUIA_DEMO.md](docs/GUIA_DEMO.md)**: Guía de demostración en vivo con guion paso a paso

## 🤖 Machine Learning

### Modelos Implementados

- **Random Forest Classifier**: Ensemble method robusto (F1-Score: 0.90)
- **Logistic Regression**: Modelo lineal rápido (F1-Score: 0.81)
- **Decision Tree Classifier**: Interpretable (F1-Score: 0.85)

**Selección Automática**: El sistema entrena los 3 modelos y selecciona el mejor por F1-Score.

### Métricas

- ✅ **Accuracy**: 92.5%
- ✅ **Precision**: 0.91
- ✅ **Recall**: 0.89
- ✅ **F1-Score**: 0.90 (≥85% requerido ✅)

### Predicciones

- **Por Fecha**: Predicciones horarias para una fecha específica
- **Por Período**: Predicciones diarias para un mes completo
- **Por Semana**: Predicciones para un rango de 7 días

### ML Wizard

Interfaz intuitiva de 5 pasos:
1. **Data Verification**: Verifica disponibilidad de datos
2. **Training Configuration**: Configura entrenamiento
3. **Training Results**: Muestra progreso y métricas
4. **Model Results**: Matriz de confusión y gráficos
5. **Make Predictions**: Realiza predicciones interactivas

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

## 📊 Datos de Ejemplo

El proyecto incluye datos de ejemplo de sensores IoT de Cochabamba, Bolivia:
- **Sensores de Calidad del Aire**: CO₂, temperatura, humedad, presión
- **Sensores de Sonido**: Niveles de decibeles (LAeq, LAI, LAImax)
- **Sensores Subterráneos**: Niveles de distancia

**Volumen**: ~69,139 registros (Noviembre 15 - Diciembre 30, 2024)

## 🧪 Testing

### Probar Endpoints

```bash
# Obtener datos
curl http://localhost:8000/api/sensors/air/data?limit=10

# Entrenar modelo (requiere autenticación)
curl -X POST http://localhost:8000/api/ml/train \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sensor_type": "air", "metric": "co2_ppm"}'
```

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛠️ Tecnologías Implementadas

### Backend
- **Python 3.8+**: Lenguaje principal
- **FastAPI**: Framework web moderno y rápido
- **MongoDB Atlas**: Base de datos en la nube
- **Scikit-learn**: Machine Learning
- **Pandas/NumPy**: Procesamiento de datos
- **Matplotlib/Seaborn**: Visualizaciones ML

### Frontend
- **React 18**: Biblioteca de UI moderna
- **Vite**: Build tool y dev server rápido
- **React Router**: Navegación SPA
- **Recharts**: Gráficos interactivos
- **Tailwind CSS**: Framework CSS utility-first
- **Axios**: Cliente HTTP

### Machine Learning
- **Scikit-learn**: Algoritmos de ML
- **Random Forest**: Ensemble method
- **Logistic Regression**: Modelo lineal
- **Decision Tree**: Árbol de decisión

## 📈 Estado del Proyecto

- ✅ Backend completo y funcional
- ✅ Frontend completo y responsive
- ✅ Machine Learning implementado
- ✅ ML Wizard funcional
- ✅ Predicciones por fecha, período y semana
- ✅ Métricas ≥85% (F1-Score)
- ✅ Documentación completa

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: descripción"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

## 👥 Autores

- **Joshua Chavez Abirari**: Desarrollador principal - Backend, Frontend, ML Services, API REST, ML Wizard, Dashboards, ML Algorithms, Feature Engineering, UI/UX, Visualizaciones, Documentación, Testing
- **Joel Israel Lopez Ticlla**: Compañero de equipo - Apoyo y colaboración

---

**Proyecto**: GAMC Big Data Dashboard - Práctica N°4: Fundamentos de Machine Learning  
**Universidad**: Universidad del Valle  
**Asignatura**: Tecnologías Emergentes I  
**Año**: 2024
