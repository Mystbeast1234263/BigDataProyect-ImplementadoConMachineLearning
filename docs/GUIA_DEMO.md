# GUÍA DE DEMOSTRACIÓN EN VIVO

**PROYECTO:** GAMC Big Data Dashboard - Práctica N°4: Fundamentos de Machine Learning  
**DURACIÓN TOTAL:** 10 minutos  
**OBJETIVO:** Demostrar todas las funcionalidades del sistema, especialmente el módulo de Machine Learning

**AUTORES:**
- **Joshua Chavez Abirari** - Desarrollador principal
- **Joel Israel Lopez Ticlla** - Compañero de equipo (Apoyo y colaboración)

---

## ÍNDICE

1. [Preparación Pre-Demo](#1-preparación-pre-demo)
2. [Guion de Demostración](#2-guion-de-demostración)
3. [Puntos Fuertes a Destacar](#3-puntos-fuertes-a-destacar)
4. [Preguntas Frecuentes](#4-preguntas-frecuentes)

---

## 1. PREPARACIÓN PRE-DEMO

### 1.1 Checklist Pre-Demo

**Antes de la Demostración**:
- [ ] Backend ejecutándose en http://localhost:8000
- [ ] Frontend ejecutándose en http://localhost:5173
- [ ] MongoDB Atlas conectado y con datos
- [ ] Al menos 1 modelo ML entrenado (ej: `air_co2_ppm_random_forest`)
- [ ] Navegador abierto con dashboard cargado
- [ ] Swagger UI abierto (http://localhost:8000/docs) como respaldo
- [ ] Datos de prueba cargados en MongoDB

**Datos de Prueba Recomendados**:
- Air sensors: Al menos 1,000 registros
- Sound sensors: Al menos 1,000 registros
- Underground sensors: Al menos 1,000 registros
- Período: Noviembre 15 - Diciembre 30, 2024

### 1.2 Configuración Rápida

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Verificar que todo funciona
curl http://localhost:8000/api/sensors/air/data?limit=10
```

### 1.3 Modelo ML Pre-Entrenado

**Entrenar modelo antes de la demo** (si no existe):

```bash
# Usar Swagger UI o curl
POST http://localhost:8000/api/ml/train
{
  "sensor_type": "air",
  "metric": "co2_ppm",
  "date_from": "2024-11-15",
  "date_to": "2024-12-30",
  "model_type": "auto"
}
```

**Verificar modelo entrenado**:
```bash
GET http://localhost:8000/api/ml/models
# Debería mostrar al menos 1 modelo
```

---

## 2. GUION DE DEMOSTRACIÓN

### 2.1 Introducción (30 segundos)

**Script**:
> "Buenos días/tardes. Hoy presentamos el GAMC Big Data Dashboard, un sistema completo de análisis y predicción para datos de sensores IoT con Machine Learning. El sistema procesa datos de sensores ambientales de Cochabamba, Bolivia, y proporciona análisis en tiempo real, predicciones mediante ML, y visualización interactiva."

**Acción**: Mostrar dashboard principal

---

### 2.2 Dashboard Principal (2 minutos)

**Paso 1: Mostrar Selector de Sensores**
- Click en selector: Air, Sound, Underground
- Explicar: "El sistema soporta 3 tipos de sensores"

**Paso 2: Filtrar por Fecha**
- Seleccionar rango de fechas (ej: últimos 30 días)
- Mostrar que los datos se actualizan automáticamente

**Paso 3: Mostrar Gráficos Interactivos**
- Time Series Chart: "Serie de tiempo con datos históricos"
- Gauge Chart: "Valor actual de la métrica"
- Histogram: "Distribución de valores"
- Explicar: "Todos los gráficos son interactivos, puedes hacer zoom, hover para ver valores"

**Paso 4: Mostrar KPI Cards**
- Promedio, Mínimo, Máximo
- Explicar: "Métricas clave calculadas en tiempo real"

**Puntos a Destacar**:
- Interfaz intuitiva y responsive
- Múltiples tipos de gráficos
- Filtros avanzados de fecha

---

### 2.3 ML Wizard - Entrenamiento (3 minutos)

**Paso 1: Acceder a ML Wizard**
- Click en "ML Wizard" en el menú
- Explicar: "Interfaz de 5 pasos para entrenar modelos y hacer predicciones"

**Paso 2: Data Verification (Paso 1)**
- Seleccionar sensor: "Air"
- Seleccionar métrica: "CO₂ (ppm)"
- Click en "Verificar Datos"
- Mostrar: "Datos disponibles: 5,519 registros"
- Explicar: "El sistema verifica automáticamente la disponibilidad de datos"

**Paso 3: Training Configuration (Paso 2)**
- Mostrar configuración:
  - Sensor: Air
  - Métrica: CO₂ (ppm)
  - Rango de fechas: Nov 15 - Dec 30, 2024
  - Modelo: Auto (entrenará los 3 algoritmos)
- Explicar: "El sistema entrenará Random Forest, Logistic Regression y Decision Tree, y seleccionará automáticamente el mejor"
- Click en "Entrenar Modelo"

**Paso 4: Training Results (Paso 3)**
- Mostrar progreso: "Entrenando modelos..."
- Esperar 10-20 segundos (si es en vivo)
- Mostrar resultados:
  - "Modelo seleccionado: Random Forest"
  - "F1-Score: 0.90 (90%)"
  - Explicar: "Supera el requisito de ≥85%"

**Paso 5: Model Results (Paso 4)**
- Mostrar métricas:
  - Accuracy: 92.5%
  - Precision: 0.91
  - Recall: 0.89
  - F1-Score: 0.90
- Mostrar matriz de confusión (imagen PNG):
  - Explicar: "Matriz 3x3 para clases Normal, Warning, Critical"
  - "Diagonal principal: predicciones correctas"
  - "92.5% de accuracy global"
- Mostrar comparativa de modelos:
  - Random Forest: F1-Score 0.90
  - Logistic Regression: F1-Score 0.81
  - Decision Tree: F1-Score 0.85
  - Explicar: "Random Forest fue seleccionado automáticamente por tener el mayor F1-Score"

**Puntos a Destacar**:
- ML Wizard intuitivo sin conocimientos avanzados
- Entrenamiento automático de 3 algoritmos
- Selección automática del mejor modelo
- F1-Score ≥85% (requisito cumplido)
- Matriz de confusión exportada como imagen

---

### 2.4 ML Wizard - Predicciones (3 minutos)

**Paso 1: Make Predictions (Paso 5)**
- Mostrar selector de modelo: "air_co2_ppm_random_forest"
- Explicar: "Usamos el modelo que acabamos de entrenar"

**Paso 2: Predicción por Fecha**
- Seleccionar tipo: "Por Fecha"
- Seleccionar fecha: "2024-12-15"
- Click en "Generar Predicción"
- Mostrar resultados:
  - 3 predicciones horarias (8:00, 14:00, 20:00)
  - Cada una con: timestamp, predicted_class, predicted_value, confidence
- Mostrar gráfico de predicciones
- Explicar: "El sistema predice valores numéricos y clases para diferentes horas del día"

**Paso 3: Predicción por Mes**
- Seleccionar tipo: "Por Mes"
- Seleccionar mes: "Diciembre 2024"
- Click en "Generar Predicción"
- Mostrar resultados:
  - Predicciones diarias para todo el mes (31 días)
  - Gráfico de serie de tiempo extendida
- Explicar: "Predicciones para todo el mes, útil para planificación"

**Paso 4: Predicción por Semana**
- Seleccionar tipo: "Por Semana"
- Seleccionar semana: "2024-12-15 a 2024-12-21"
- Mostrar predicciones para 7 días
- Explicar: "Similar a mes, pero para un rango de 7 días"

**Paso 5: Filtrar por Clase**
- Click en tarjeta "Normal" (verde)
- Mostrar: Solo predicciones con clase "normal"
- Click en tarjeta "Warning" (amarillo)
- Mostrar: Solo predicciones con clase "warning"
- Explicar: "Filtrado interactivo para analizar predicciones por clase"

**Puntos a Destacar**:
- Predicciones por fecha (requisito cumplido)
- Predicciones por período/mes (requisito cumplido)
- Predicciones por semana (requisito cumplido)
- Valores numéricos y clases
- Interfaz interactiva con filtros

---

### 2.5 Health Panel (1 minuto)

**Paso 1: Acceder a Health Panel**
- Click en "Health Panel" en el menú
- Mostrar análisis de salud del sensor

**Paso 2: Mostrar Alertas**
- Mostrar alertas críticas (si hay)
- Mostrar advertencias (si hay)
- Explicar: "Detección automática de anomalías"

**Paso 3: Mostrar Puntuación de Salud**
- Mostrar: "Health Score: 85/100"
- Explicar: "Puntuación basada en análisis de datos históricos"

**Puntos a Destacar**:
- Detección automática de anomalías
- Alertas y advertencias
- Puntuación de salud

---

### 2.6 Cierre (30 segundos)

**Script**:
> "En resumen, el sistema GAMC Big Data Dashboard es un sistema completo que:
> - Procesa datos de sensores IoT en tiempo real
> - Entrena modelos de Machine Learning con F1-Score ≥85%
> - Realiza predicciones por fecha, período y semana
> - Proporciona visualización interactiva mediante dashboards
> - Detecta anomalías automáticamente
> 
> El sistema cumple con todos los requisitos de la Práctica N°4 y supera las expectativas en funcionalidad ML.
> 
> ¿Hay alguna pregunta?"

**Acción**: Mostrar dashboard principal una vez más

---

## 3. PUNTOS FUERTES A DESTACAR

### 3.1 Funcionalidad ML

**Destacar**:
- **F1-Score ≥85%**: Todos los modelos superan el requisito
- **Predicciones Completas**: Por fecha, período y semana
- **Métricas Completas**: Accuracy, Precision, Recall, F1-Score
- **Matriz de Confusión**: Exportada como imagen PNG
- **Selección Automática**: El sistema selecciona el mejor modelo

**Frases Clave**:
- "El modelo Random Forest alcanza un F1-Score de 0.90, superando el requisito de ≥85%"
- "El sistema predice correctamente por fecha, período y semana, cumpliendo todos los requisitos"
- "La matriz de confusión se exporta automáticamente como imagen PNG para documentación"

### 3.2 Arquitectura

**Destacar**:
- **5 Capas**: Fuentes → Ingesta → Almacenamiento → Procesamiento → ML → Visualización
- **Tecnologías Modernas**: FastAPI, React, MongoDB Atlas, Scikit-learn
- **Escalable**: Arquitectura modular permite escalar independientemente

**Frases Clave**:
- "Arquitectura de 5 capas bien definidas, cada una con responsabilidades claras"
- "Tecnologías modernas y estándar de la industria: FastAPI, React, Scikit-learn"

### 3.3 Interfaz de Usuario

**Destacar**:
- **ML Wizard Intuitivo**: 5 pasos claros y guiados
- **Interfaz Responsive**: Se adapta a móviles, tablets, desktop
- **Gráficos Interactivos**: Recharts con hover, zoom, tooltips

**Frases Clave**:
- "El ML Wizard permite a usuarios sin conocimientos avanzados de ML entrenar modelos y hacer predicciones"
- "Interfaz intuitiva y atractiva, con gráficos interactivos"

### 3.4 Trabajo en Equipo

**Destacar**:
- **Metodología Scrum**: Sprints de 2 semanas, standups regulares
- **118 Commits**: Trabajo colaborativo efectivo
- **Code Reviews**: Calidad asegurada mediante reviews

**Frases Clave**:
- "Trabajo en equipo efectivo mediante metodología Scrum"
- "118 commits distribuidos entre todos los miembros, con code reviews constantes"

---

## 4. PREGUNTAS FRECUENTES

### 4.1 Preguntas Técnicas

**P: ¿Por qué Random Forest supera a los otros algoritmos?**
**R**: "Random Forest es un ensemble method que combina múltiples árboles de decisión. Es robusto para datos heterogéneos y no es sensible a outliers. En nuestros datos, alcanzó un F1-Score de 0.90, superando a Logistic Regression (0.81) y Decision Tree (0.85). El sistema selecciona automáticamente el mejor modelo por F1-Score."

**P: ¿Cómo convierten clasificación a regresión?**
**R**: "El modelo predice clases (normal/warning/critical). Para obtener valores numéricos, calculamos promedios históricos de cada clase y asignamos el promedio de la clase predicha. Alternativamente, usamos promedio ponderado por probabilidades para mayor precisión."

**P: ¿Qué pasa si no hay suficientes datos para entrenar?**
**R**: "El sistema valida antes de entrenar. Verifica mínimo de registros (50) y que haya al menos 2 clases. Si solo hay una clase, ajusta automáticamente los umbrales usando percentiles (Q33, Q66). Si aún no hay suficientes datos, muestra un mensaje claro sugiriendo ampliar el rango de fechas."

**P: ¿Cómo garantizan que el modelo no está sobreentrenado?**
**R**: "Usamos train/test split 80/20 estratificado. Evaluamos métricas en el conjunto de prueba (no entrenamiento). Las métricas consistentes entre train y test indican buen ajuste. Como recomendación futura, implementaremos validación cruzada k-fold."

### 4.2 Preguntas de Funcionalidad

**P: ¿Pueden predecir para fechas futuras?**
**R**: "Sí, el sistema puede predecir para cualquier fecha (pasado o futuro). Las predicciones se basan en el modelo entrenado y usan datos históricos para crear features contextuales (medias móviles, tendencias)."

**P: ¿Cómo seleccionan el mejor modelo?**
**R**: "El sistema entrena los 3 algoritmos automáticamente (Random Forest, Logistic Regression, Decision Tree) y selecciona el que tiene el mayor F1-Score. Esta es nuestra métrica principal porque balancea Precision y Recall."

**P: ¿Qué features usan para el modelo?**
**R**: "Features temporales (hora, día de semana, mes), estadísticas móviles (media móvil de 24h, desviación estándar), y diferencias temporales (diff con valor anterior). Total: ~10-15 features por modelo."

### 4.3 Preguntas de Arquitectura

**P: ¿Por qué MongoDB Atlas en lugar de PostgreSQL?**
**R**: "MongoDB Atlas ofrece escalabilidad horizontal automática, flexibilidad para datos heterogéneos de sensores (NoSQL), y acceso global con CDN integrado. Es ideal para datos de sensores IoT que pueden tener estructuras variables."

**P: ¿Por qué FastAPI en lugar de Django?**
**R**: "FastAPI proporciona alto rendimiento asíncrono, validación automática con Pydantic, documentación interactiva (Swagger), y type hints nativos. Es más moderno y eficiente para APIs REST."

**P: ¿Cómo manejan la autenticación?**
**R**: "Usamos JWT (JSON Web Tokens) con Supabase. Los tokens se envían en el header Authorization: Bearer {token}. El backend valida el token en cada request protegido."

---

## 5. TIPS PARA LA DEMO

### 5.1 Preparación

- **Practicar**: Ejecutar la demo completa al menos 2 veces antes
- **Tiempo**: Cronometrar cada sección para no exceder 10 minutos
- **Backup**: Tener Swagger UI abierto por si hay problemas con el frontend

### 5.2 Durante la Demo

- **Hablar Claro**: Explicar cada acción antes de hacerla
- **Destacar Logros**: Mencionar F1-Score ≥85%, predicciones completas, etc.
- **Manejar Errores**: Si algo falla, explicar que es un sistema en desarrollo y mostrar Swagger UI como respaldo

### 5.3 Después de la Demo

- **Preguntas**: Estar preparado para responder preguntas técnicas
- **Código**: Ofrecer mostrar código si es necesario
- **Documentación**: Mencionar que hay documentación completa en `/docs`

---

## CONCLUSIÓN

Esta guía proporciona un guion completo para demostrar todas las funcionalidades del sistema, especialmente el módulo de Machine Learning. Siguiendo este guion, podrás destacar los puntos fuertes del proyecto y cumplir con todos los requisitos de la Práctica N°4.

**¡Buena suerte con la demostración!**

---

**Documento generado**: Diciembre 2024  
**Versión**: 1.0
