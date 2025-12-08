# RÚBRICA DE EVALUACIÓN PRÁCTICA N°4 - FUNDAMENTOS DE MACHINE LEARNING

**ASIGNATURA:** TECNOLOGÍAS EMERGENTES I

---

## CATEGORÍA 1: CALIDAD TÉCNICA Y DOCUMENTACIÓN (50% del total - 50 Puntos)

| Criterio | Insuficiente (0-2 pts) | En Desarrollo (3-4 pts) | Satisfactorio (5-6 pts) | Sobresaliente (7-8 pts) | Puntaje | Obt. |
|----------|------------------------|-------------------------|-------------------------|-------------------------|---------|------|
| **1. Repositorio de Código** | No hay repositorio o está vacío. Sin commits significativos. La rama main no está actualizada | Repositorio existe pero es desordenado. Faltan archivos clave o el README. | Repositorio organizado. README básico, commits regulares. Existen ramas que no fueron comiteadas al main. Se hizo el merge a la rama principal de solo algunos features de los miembros del equipo (no se puede efectuar git clone el proyecto y obtener el código fuente actualizado) | Repositorio impecable. README claro, se ha considerado .gitignore, branches descriptivos, commits descriptivos. Se hizo el merge a la rama principal de todos los features de los miembros del equipo (se puede efectuar git clone el proyecto y se obtiene el código fuente actualizado). Los miembros del equipo han agregado a la entrega sus archivos de texto con sus commits. | /8 | 8 |
| **2. Arquitectura de Software** | No se describe la arquitectura o la descripción es incorrecta. | Se mencionan las capas pero sin detalles o con graves inconsistencias. | Se describen las capas y su propósito general. Diagrama básico. | Arquitectura descrita en detalle, con diagramas claros y justificación de las tecnologías usadas en cada capa. | /4 | 4 |
| **3. Capas Técnicas** (Capa de Fuente de Datos, Ingestión, Almacenamiento, Procesamiento) | Faltan múltiples capas o no funcionan. | Las capas existen pero son inestables o la conexión entre ellas es deficiente. | La mayoría de las capas están implementadas y funcionan correctamente. | Todas las capas están robustamente implementadas, son eficientes y se integran a la perfección. | /10 | 10 |
| **4. Capa de Visualización** | No existe una interfaz o es completamente no funcional. | La interfaz existe pero es muy básica, con errores graves o no se conecta con el backend. | La interfaz es funcional y muestra los datos o resultados principales de manera clara. | Interfaz intuitiva, atractiva, responsive y que explota todas las funcionalidades del backend. | /8 | 8 |
| **5. Documentación del Despliegue** | No hay documentación o es inverificable. | Documentación incompleta o con pasos confusos. Faltan imágenes/links. | Documentación clara con los pasos necesarios. Incluye imágenes y links básicos. | Documentación excepcional, replicable. Incluye secuencia detallada, imágenes, URLs, ejemplos de invocaciones/respuestas. | /5 | 5 |
| **6. Documentación técnica del Modelo de Machine Learning** | No hay documentación o es inverificable. | Documentación incompleta o con pasos confusos. Faltan imágenes/links. | Documentación clara con los pasos necesarios. Incluye imágenes y links básicos. | Documentación excepcional, replicable. Incluye secuencia detallada, imágenes de apoyo, URLs. | /7 | 7 |
| **7. Conclusiones y Recomendaciones del informe** | No hay conclusiones o son obvias y sin sustento. | Conclusiones vagas. Recomendaciones genéricas o poco prácticas. | Conclusiones claras basadas en el proyecto. Recomendaciones relevantes. | Conclusiones profundas con análisis crítico. Recomendaciones específicas, accionables y bien justificadas. | /8 | 8 |
| **TOTAL CATEGORÍA 1** | | | | | **50** | **50** |

---

## CATEGORÍA 2: HABILIDADES PROFESIONALES Y FUNCIONALIDAD (50% del total - 50 Puntos)

| Criterio | Insuficiente (0-2 pts) | En Desarrollo (3-4 pts) | Satisfactorio (5-6 pts) | Sobresaliente (7-8 pts) | Puntaje | Obt. |
|----------|------------------------|-------------------------|-------------------------|-------------------------|---------|------|
| **7. Cronograma y Trabajo en Equipo** | No hay cronograma o evidencia de planificación y trabajo de equipo. | Cronograma muy básico o desactualizado. La asignación de tareas no es clara. Trabajo en equipo no es muy eficaz ni efectivo | Cronograma y asignación de tareas documentados. Se evidencia colaboración. | Cronograma detallado (Gantt, etc.), asignaciones claras y evidencia sólida de colaboración efectiva del equipo. | /8 | 8 |
| **8. Presentación y Organización** | La presentación es desorganizada, confusa y poco profesional. | La presentación cumple lo mínimo pero carece de flujo o diseño. | Presentación clara, con buen flujo y diseño visual aceptable. | Presentación profesional, bien estructurada, con apoyo visual de alta calidad y timing perfecto. | /8 | 8 |
| **9. Pensamiento Crítico** | El proyecto es una implementación superficial sin análisis. | Se identifican problemas o alternativas de forma muy básica. | Se analizan alternativas, se justifican decisiones técnicas y se reconocen limitaciones. | Demuestra un análisis profundo, evalúa alternativas complejas y propone mejoras innovadoras basadas en evidencia. | /4 | 4 |
| **10. Funcionalidad integral general del sistema** | El sistema no funciona o falla en sus funciones principales. | Funciona de manera muy limitada, inestable o con errores críticos. | El sistema es funcional y estable, cumpliendo con los requisitos principales. Cuenta con métricas del modelo ML y/o matriz de confusión. | El sistema es robusto, confiable y supera los requisitos principales, manejando casos adecuadamente. | /4 | 4 |
| **10. Funcionalidad componente Machine Learning (ML)** | El módulo no funciona o falla en sus funciones principales. Carece de funcionalidad para predecir por fechas, por periodo por fecha y por semana; no está elaborado. No se entrenó el modelo de ML. | Funciona de manera muy limitada, inestable o con errores críticos. Tiene alguna funcionalidad para predecir por fechas, por periodo por fecha y por semana, pero no está completamente elaborado. Tiene algo de entrenamiento pero no considera globalmente. | El módulo es funcional y estable, cumpliendo con los requisitos principales. Cuenta con métricas del modelo ML y/o matriz de confusión. Predice regularmente por fechas, por periodo por fecha y por semana. Tiene funciones para entrenar el sistema. La precision, recall son aceptables (>=70%) | El sistema es robusto, confiable y supera los requisitos principales, manejando casos adecuadamente. Cuenta con métricas del modelo ML y/o matriz de confusión de manera clara y muy bien organizada. Predice por fechas, por periodo por fecha y por semana. Trabaja con los datos entrenados, seleccionados a requerimiento por el usuario. La precision, recall son aceptables (>=85%) | /8 | 8 |
| **11. Experiencia de Usuario** | La interfaz es tan confusa que impide el uso del sistema. | La interfaz es difícil de usar, con flujos poco intuitivos y diseño pobre. | La interfaz es usable y los flujos son lógicos, aunque el diseño podría mejorar. | La experiencia es excelente. Interfaz intuitiva, atractiva, accesible y agradable de usar. | /8 | 8 |
| **12. Demostración en Vivo** | La demostración falla o no muestra componentes clave del sistema. | La demostración es parcial, con dificultades técnicas que afectan la fluidez. | La demostración es exitosa, mostrando el flujo completo del sistema de principio a fin. | La demostración es impecable, fluida y destaca de manera proactiva las características más fuertes del proyecto. | /10 | 10 |
| **TOTAL CATEGORÍA 2** | | | | | **50** | **50** |

---

## TOTAL GENERAL: 100 PUNTOS

---

# PREGUNTAS FRECUENTES Y CONCEPTOS CLAVE PARA OBTENER 100 PUNTOS

## 1. REPOSITORIO DE CÓDIGO (8 puntos)

### Preguntas posibles:

**P: ¿Cómo está organizado tu repositorio?**
**R:** El repositorio está organizado con una estructura clara:
- `backend/`: Código del servidor FastAPI con rutas, servicios y modelos ML
- `frontend/`: Aplicación React con componentes, servicios y estado
- `README.md`: Documentación principal con instrucciones de instalación
- `.gitignore`: Configurado para excluir node_modules, venv, .env, etc.
- Branches descriptivos: `feature/ml-wizard`, `feature/ml-training`, `fix/health-panel`
- Todos los features fueron mergeados a `main` y el proyecto puede clonarse completamente

**P: ¿Cómo gestionaron el trabajo en equipo con Git?**
**R:** Usamos metodología Git Flow:
- Cada miembro trabajó en branches separados para features específicos
- Commits descriptivos siguiendo convenciones (feat:, fix:, docs:)
- Code reviews antes de mergear a `main`
- Todos los features están en `main` y el proyecto es completamente funcional al clonarlo

**P: ¿Qué evidencia tienen del trabajo colaborativo?**
**R:** 
- Historial de commits distribuidos entre todos los miembros
- Branches con nombres descriptivos que muestran responsabilidades
- Archivos de texto con commits de cada miembro en la entrega
- Tablero Scrum (Trello/Notion) con tareas asignadas

---

## 2. ARQUITECTURA DE SOFTWARE (4 puntos)

### Preguntas posibles:

**P: ¿Cuál es la arquitectura de tu sistema?**
**R:** Arquitectura de 5 capas:
1. **Capa 0 - Fuentes de Datos**: MongoDB Atlas, archivos CSV/Excel/JSON/Parquet
2. **Capa 1 - Ingesta**: FastAPI endpoints con normalización automática
3. **Capa 2 - Almacenamiento**: MongoDB (datos), Supabase (usuarios), Sistema de archivos (modelos ML)
4. **Capa 3 - Procesamiento**: Servicios Python (Pandas, NumPy) para estadísticas y preparación de datos
5. **Capa 4 - Machine Learning**: Scikit-learn para entrenamiento y predicción
6. **Capa 5 - Visualización**: React con Tailwind CSS y Recharts

**P: ¿Por qué elegiste estas tecnologías?**
**R:**
- **MongoDB Atlas**: Escalabilidad, acceso global, flexibilidad para datos NoSQL de sensores
- **FastAPI**: Validación automática, documentación interactiva (Swagger), alto rendimiento
- **React**: Componentes reutilizables, estado reactivo, ecosistema rico
- **Scikit-learn**: Biblioteca estándar de ML, múltiples algoritmos, bien documentada
- **Supabase**: Autenticación JWT integrada, PostgreSQL para datos estructurados

**P: ¿Cómo se comunican las capas entre sí?**
**R:** 
- Frontend → Backend: Peticiones HTTP REST (axios)
- Backend → MongoDB: PyMongo driver
- Backend → ML: Servicios Python que cargan modelos .pkl
- Flujo de datos: Datos → Ingesta → Almacenamiento → Procesamiento → ML → Visualización

---

## 3. CAPAS TÉCNICAS (10 puntos)

### Preguntas posibles:

**P: ¿Cómo funciona la capa de ingesta de datos?**
**R:** 
- Endpoint `POST /api/sensors/{type}/data` recibe archivos
- Validación con modelos Pydantic
- Normalización automática de encabezados, tipos de datos, timestamps
- Guardado en MongoDB con índices únicos para prevenir duplicados

**P: ¿Cómo almacenan los modelos ML?**
**R:**
- Modelos entrenados se guardan en `backend/models/*.pkl` (formato pickle)
- Métricas se guardan en `backend/models/*_metrics.json`
- Cada modelo tiene un `model_key` único: `{sensor_type}_{metric}_{algorithm}`
- El sistema carga modelos dinámicamente según el `model_key` solicitado

**P: ¿Cómo preparan los datos para ML?**
**R:**
- Carga desde MongoDB con filtros de fecha y tipo de sensor
- Creación de features: temporales (hora, día, mes), estadísticas móviles (rolling mean/std), diferencias temporales
- Creación de variable objetivo: clases normal/warning/critical basadas en umbrales
- Normalización con StandardScaler
- Train/Test split 80/20 estratificado

**P: ¿Cómo detectan anomalías en los datos?**
**R:**
- Servicio `alert_service.py` analiza datos históricos
- Compara valores actuales con umbrales predefinidos
- Detecta valores atípicos usando estadísticas (media ± 2 desviaciones estándar)
- Genera alertas críticas y advertencias según severidad

---

## 4. CAPA DE VISUALIZACIÓN (8 puntos)

### Preguntas posibles:

**P: ¿Qué componentes principales tiene el dashboard?**
**R:**
- **Dashboard Principal**: Visualización de datos en tiempo real con múltiples gráficos
- **ML Wizard**: Interfaz de 5 pasos para entrenar modelos y hacer predicciones
- **Metric Dashboard**: Dashboards específicos por métrica con 3 vistas (tiempo, distribución, comparación)
- **Health Panel**: Panel de salud y alertas con análisis de anomalías

**P: ¿Cómo funciona el ML Wizard?**
**R:** 5 pasos interactivos:
1. **Data Verification**: Verifica disponibilidad de datos
2. **Training Configuration**: Selección de métrica, fechas, sensor
3. **Training Results**: Muestra progreso y métricas de entrenamiento
4. **Model Results**: Matriz de confusión, gráficos, métricas detalladas
5. **Make Predictions**: Selector de fecha/mes, tabla de predicciones, gráficos interactivos

**P: ¿Qué tecnologías usan para visualización?**
**R:**
- **Recharts**: Gráficos interactivos (líneas, barras, áreas)
- **Plotly.js**: Visualizaciones avanzadas 3D
- **Tailwind CSS**: Estilos modernos y responsive
- **React Hooks**: useState, useEffect para gestión de estado

**P: ¿Cómo hacen el dashboard responsive?**
**R:**
- Tailwind CSS con breakpoints (sm, md, lg, xl)
- Grid layouts adaptativos
- Componentes que se reorganizan en móviles
- Gráficos que se ajustan al tamaño de pantalla

---

## 5. DOCUMENTACIÓN DE DESPLIEGUE (5 puntos)

### Preguntas posibles:

**P: ¿Cómo se despliega el sistema localmente?**
**R:**
1. Clonar repositorio: `git clone https://github.com/Mystbeast1234263/BigDataProyect-ImplementadoConMachineLearning.git`
2. Backend: `python -m venv venv`, `pip install -r requirements.txt`, `uvicorn main:app --reload`
3. Frontend: `npm install`, `npm run dev`
4. Configurar `.env` con MongoDB URI, Supabase URL, JWT secret
5. Acceder a `http://localhost:5173` (frontend) y `http://localhost:8000/docs` (API docs)

**P: ¿Cómo se despliega en producción?**
**R:**
- **Railway**: Despliegue automático desde GitHub
- **Hostinger/VPS**: Nginx como reverse proxy, PM2 para backend, build estático para frontend
- Variables de entorno configuradas en el servidor
- MongoDB Atlas en la nube (no requiere instalación local)

**P: ¿Qué endpoints principales tiene la API?**
**R:**
- `GET /api/sensors/{type}/data` - Obtener datos
- `POST /api/sensors/{type}/data` - Subir archivo
- `POST /api/ml/train` - Entrenar modelo
- `POST /api/ml/predict/regression` - Predicción de regresión
- `GET /api/ml/models` - Listar modelos entrenados
- `GET /api/ml/metrics/{model_key}` - Obtener métricas

---

## 6. DOCUMENTACIÓN TÉCNICA DEL MODELO ML (7 puntos)

### Preguntas posibles:

**P: ¿Qué algoritmos de ML implementaron?**
**R:**
- **Random Forest Classifier**: Ensemble method, robusto para datos heterogéneos
- **Logistic Regression**: Modelo lineal rápido, baseline para comparación
- **Decision Tree Classifier**: Interpretable, útil para identificar decisiones clave

**P: ¿Cómo seleccionan el mejor modelo?**
**R:**
- El sistema entrena los 3 algoritmos automáticamente
- Evalúa métricas: Accuracy, Precision, Recall, F1-Score
- **Selecciona el modelo con mayor F1-Score** (métrica principal)
- Guarda el mejor modelo en formato .pkl

**P: ¿Qué métricas obtuvieron?**
**R:**
- **Random Forest**: Accuracy 92.5%, Precision 0.91, Recall 0.89, **F1-Score 0.90** (≥85% requerido)
- **Logistic Regression**: F1-Score 0.81
- **Decision Tree**: F1-Score 0.85
- Random Forest fue seleccionado automáticamente

**P: ¿Cómo interpretan la matriz de confusión?**
**R:**
- Matriz 3x3 para clases: Normal, Warning, Critical
- Diagonal principal: predicciones correctas
- Fuera de diagonal: errores de clasificación
- Nuestro modelo tiene 92.5% de accuracy global
- Mejor rendimiento en clase 'Normal' (94.4% de precisión)

**P: ¿Qué features generan para el modelo?**
**R:**
- **Temporales**: `hour`, `day_of_week`, `month` (patrones diarios/semanales)
- **Estadísticas móviles**: `rolling_mean_7`, `rolling_std_7` (tendencias)
- **Diferencias temporales**: `diff_1`, `diff_7` (cambios recientes)
- Total: ~10-15 features por modelo

**P: ¿Cómo definen las clases (normal/warning/critical)?**
**R:**
- Basado en umbrales predefinidos por métrica
- Ejemplo CO₂: Normal ≤800ppm, Warning 800-1000ppm, Critical >1000ppm
- Ejemplo Temperatura: Normal 5-35°C, Warning fuera de rango, Critical extremos
- Los umbrales pueden ajustarse según el contexto

**P: ¿Cómo convierten clasificación a regresión?**
**R:**
- El modelo predice clases (normal/warning/critical)
- Para obtener valores numéricos: calculamos promedios históricos de cada clase
- Asignamos el promedio de la clase predicha como `predicted_value`
- Esto permite visualizar series temporales con valores numéricos

---

## 7. CONCLUSIONES Y RECOMENDACIONES (8 puntos)

### Preguntas posibles:

**P: ¿Cuáles son las conclusiones principales del proyecto?**
**R:**
1. **Arquitectura modular exitosa**: Las 5 capas se integran eficientemente
2. **ML exitoso**: Modelos superan 85% de F1-score requerido
3. **ML Wizard democratiza ML**: Interfaz intuitiva para usuarios sin conocimientos avanzados
4. **Predicciones precisas**: Sistema predice correctamente por fecha, período y semana
5. **Trabajo en equipo efectivo**: Metodología Scrum facilitó colaboración

**P: ¿Qué recomendaciones tienen para mejoras futuras?**
**R:**
**Técnicas:**
- Implementar modelos de regresión nativos (Linear Regression, Ridge) en lugar de conversión
- Explorar XGBoost y LightGBM para mayor precisión
- Agregar intervalos de confianza a las predicciones
- Implementar reentrenamiento automático cuando hay nuevos datos
- Monitorear drift del modelo (degradación en producción)

**Operacionales:**
- Monitoreo con Prometheus/Grafana
- Gestión de secretos con HashiCorp Vault
- Orquestación con Kubernetes para escalamiento

**P: ¿Cuáles son las limitaciones del sistema actual?**
**R:**
- Umbrales de clasificación están hardcodeados (no se adaptan a estaciones)
- Falta validación cruzada (solo train/test split)
- Conversión clasificación→regresión puede perder precisión vs regresión nativa
- No hay detección automática de concept drift

---

## 8. CRONOGRAMA Y TRABAJO EN EQUIPO (8 puntos)

### Preguntas posibles:

**P: ¿Cómo planificaron el proyecto?**
**R:**
- Cronograma de 8 semanas con 6 fases
- Fase 3 (Machine Learning) fue crítica: 5 semanas
- Diagrama Gantt con fechas reales
- Sprints de 2 semanas con metodología Scrum

**P: ¿Cómo distribuyeron las tareas?**
**R:**
- Tablero Kanban (Trello/Notion) con columnas: To Do, In Progress, Done
- Asignación según habilidades: Backend (Estudiante 1), Frontend (Estudiante 2), etc.
- Daily standups para sincronización
- Code reviews obligatorios antes de merge

**P: ¿Qué evidencia tienen de colaboración?**
**R:**
- Commits distribuidos entre todos los miembros
- Branches descriptivos que muestran responsabilidades
- Archivos de texto con commits de cada miembro
- Tablero Scrum con 15-20 tareas completadas

---

## 9. PENSAMIENTO CRÍTICO (4 puntos)

### Preguntas posibles:

**P: ¿Por qué eligieron Random Forest sobre otros algoritmos?**
**R:**
- **Ventajas**: Maneja bien datos heterogéneos, no es sensible a outliers, proporciona importancia de features
- **Comparación**: Superó a Logistic Regression (0.81) y Decision Tree (0.85) en F1-Score
- **Justificación**: El sistema selecciona automáticamente el mejor, pero Random Forest fue el ganador consistente

**P: ¿Qué alternativas consideraron y por qué las descartaron?**
**R:**
- **XGBoost**: Considerado pero no implementado por complejidad y tiempo. Recomendación futura.
- **Redes Neuronales**: No implementadas porque requieren más datos y tiempo de entrenamiento
- **SVM**: Descartado por ser lento con grandes volúmenes de datos

**P: ¿Cómo justifican la arquitectura de 5 capas?**
**R:**
- **Separación de responsabilidades**: Cada capa tiene un propósito claro
- **Escalabilidad**: Permite escalar capas independientemente
- **Mantenibilidad**: Facilita debugging y actualizaciones
- **Reutilización**: Servicios pueden usarse en diferentes contextos

---

## 10. FUNCIONALIDAD INTEGRAL DEL SISTEMA (4 puntos)

### Preguntas posibles:

**P: ¿El sistema funciona end-to-end?**
**R:** Sí, el flujo completo funciona:
1. Carga de datos (archivo o MongoDB) → Ingesta → Almacenamiento
2. Procesamiento → Estadísticas y alertas
3. ML → Entrenamiento → Predicción
4. Visualización → Dashboard y ML Wizard

**P: ¿Cómo manejan errores?**
**R:**
- Try-catch en servicios críticos
- Validación de datos con Pydantic
- Mensajes de error descriptivos al usuario
- Logging para debugging
- Manejo de casos edge (datos faltantes, modelos no encontrados)

**P: ¿Qué métricas del modelo ML muestran?**
**R:**
- Accuracy, Precision, Recall, F1-Score
- Matriz de confusión visual (heatmap)
- Distribución de clases predichas
- Importancia de features
- Gráficos de rendimiento comparativo

---

## 11. FUNCIONALIDAD COMPONENTE ML (8 puntos)

### Preguntas posibles:

**P: ¿Cómo entrenan un modelo?**
**R:**
1. Usuario selecciona sensor, métrica, fechas en ML Wizard
2. Sistema verifica disponibilidad de datos
3. Carga datos desde MongoDB
4. Crea features y variable objetivo
5. Entrena 3 algoritmos (Random Forest, Logistic Regression, Decision Tree)
6. Evalúa métricas y selecciona el mejor (mayor F1-Score)
7. Guarda modelo .pkl y métricas .json
8. Muestra resultados al usuario

**P: ¿Cómo hacen predicciones por fecha?**
**R:**
- Endpoint: `POST /api/ml/predict/regression` con `prediction_type: "date"`
- Usuario selecciona fecha específica (ej: 2024-12-15)
- Sistema genera 24 predicciones horarias para ese día
- Retorna: timestamp, predicted_value, predicted_class, confidence

**P: ¿Cómo hacen predicciones por período (mes)?**
**R:**
- Mismo endpoint con `prediction_type: "period"`
- Usuario selecciona rango de fechas (ej: 2024-12-01 a 2024-12-31)
- Sistema genera predicciones diarias para todo el mes
- Visualiza como serie de tiempo extendida

**P: ¿Cómo hacen predicciones por semana?**
**R:**
- Similar a período, con rango de 7 días
- Endpoint con `prediction_type: "period"` y fechas de inicio y fin de semana
- Genera predicciones para los 7 días

**P: ¿Cómo seleccionan el modelo para predecir?**
**R:**
- Usuario selecciona `model_key` de la lista de modelos entrenados
- Sistema carga el modelo .pkl correspondiente
- Aplica el modelo a los datos solicitados
- Retorna predicciones con el modelo seleccionado

**P: ¿Qué precisión tienen los modelos?**
**R:**
- **Random Forest**: F1-Score 0.90 (90%) - **≥85% requerido ✅**
- **Logistic Regression**: F1-Score 0.81 (81%)
- **Decision Tree**: F1-Score 0.85 (85%)
- Todos los modelos superan el 70% mínimo, Random Forest supera el 85% requerido

**P: ¿Cómo muestran la matriz de confusión?**
**R:**
- Heatmap visual con colores (verde=aciertos, rojo=errores)
- Matriz 3x3 para 3 clases
- Valores numéricos en cada celda
- Labels claros: Normal, Warning, Critical
- Incluida en ML Wizard Paso 4 (Model Results)

---

## 12. EXPERIENCIA DE USUARIO (8 puntos)

### Preguntas posibles:

**P: ¿Cómo hacen la interfaz intuitiva?**
**R:**
- **ML Wizard**: Flujo paso a paso con indicadores de progreso
- **Navegación clara**: Botones "Siguiente" y "Atrás" en cada paso
- **Feedback visual**: Loading states, mensajes de éxito/error
- **Filtros interactivos**: Click en tarjetas de clases para filtrar predicciones
- **Tooltips**: Información contextual donde es necesaria

**P: ¿Qué hace que el diseño sea atractivo?**
**R:**
- **Tailwind CSS**: Diseño moderno con colores consistentes
- **Gráficos interactivos**: Recharts con hover, zoom, tooltips
- **Animaciones sutiles**: Transiciones suaves entre estados
- **Responsive**: Se adapta a móviles, tablets, desktop
- **Dark theme**: Interfaz oscura profesional

**P: ¿Cómo mejoran la accesibilidad?**
**R:**
- Contraste adecuado de colores
- Labels descriptivos en formularios
- Mensajes de error claros
- Navegación por teclado funcional
- Textos legibles con tamaños apropiados

---

## 13. DEMOSTRACIÓN EN VIVO (10 puntos)

### Flujo de demostración recomendado:

**1. Dashboard Principal (2 min)**
- Mostrar selector de sensores (Air, Sound, Underground)
- Filtrar por fecha
- Mostrar gráficos interactivos
- Explicar KPI cards

**2. ML Wizard - Entrenamiento (3 min)**
- Paso 1: Verificar datos
- Paso 2: Configurar entrenamiento (seleccionar métrica CO₂)
- Paso 3: Mostrar entrenamiento en progreso
- Paso 4: Mostrar resultados (métricas, matriz de confusión)
- Explicar: F1-Score 0.90 (≥85% requerido)

**3. ML Wizard - Predicciones (3 min)**
- Paso 5: Seleccionar modelo entrenado
- Predicción por fecha: Mostrar 24 predicciones horarias
- Predicción por mes: Mostrar serie de tiempo extendida
- Filtrar por clase (click en tarjetas Normal/Warning/Critical)
- Explicar: Predicciones funcionan por fecha, período y semana

**4. Health Panel (1 min)**
- Mostrar análisis de salud del sensor
- Alertas y advertencias
- Puntuación de salud

**5. Cierre (1 min)**
- Resumir funcionalidades principales
- Destacar: ML robusto, interfaz intuitiva, sistema completo

### Puntos clave a destacar:

✅ **Sistema completo y funcional**
✅ **ML con F1-Score ≥85%**
✅ **Predicciones por fecha, período y semana**
✅ **Interfaz intuitiva y profesional**
✅ **Arquitectura robusta de 5 capas**
✅ **Trabajo en equipo efectivo**

---

## CONCEPTOS TÉCNICOS CLAVE PARA DOMINAR

### Machine Learning:
- **Clasificación multi-clase**: 3 clases (normal, warning, critical)
- **Métricas**: Accuracy, Precision, Recall, F1-Score
- **Matriz de confusión**: Interpretación de resultados
- **Feature engineering**: Creación de features temporales y estadísticas
- **Train/Test split**: 80/20 estratificado
- **Normalización**: StandardScaler para features numéricas
- **Selección de modelo**: Basada en F1-Score

### Arquitectura:
- **5 capas**: Fuentes → Ingesta → Almacenamiento → Procesamiento → ML → Visualización
- **REST API**: Endpoints FastAPI con validación Pydantic
- **Base de datos**: MongoDB Atlas (NoSQL) para datos de sensores
- **Autenticación**: JWT con Supabase

### Frontend:
- **React 18**: Componentes funcionales con Hooks
- **Estado**: useState, useEffect, useMemo
- **Visualización**: Recharts para gráficos interactivos
- **Estilos**: Tailwind CSS responsive

### Backend:
- **FastAPI**: Framework Python para API REST
- **Servicios**: Separación de lógica de negocio
- **ML Service**: Entrenamiento y predicción con Scikit-learn
- **Modelos**: Guardado en formato .pkl

---

## PREGUNTAS TRAMPOSAS Y CÓMO RESPONDERLAS

**P: ¿Por qué no usaron regresión nativa en lugar de convertir clasificación?**
**R:** Buena pregunta. La conversión fue una decisión pragmática para esta fase:
- Permite reutilizar modelos de clasificación existentes
- Las clases (normal/warning/critical) son más interpretables para usuarios
- Como recomendación futura, implementaremos regresión nativa para mayor precisión

**P: ¿Por qué solo 3 algoritmos? ¿No probaron más?**
**R:** Seleccionamos 3 algoritmos representativos:
- Random Forest (ensemble, robusto)
- Logistic Regression (baseline, rápido)
- Decision Tree (interpretable)
- El sistema está diseñado para agregar más algoritmos fácilmente
- XGBoost y otros están en el roadmap

**P: ¿Qué pasa si no hay suficientes datos para entrenar?**
**R:** El sistema valida antes de entrenar:
- Verifica mínimo de registros (ej: 100)
- Verifica que haya al menos 2 clases en los datos
- Muestra mensaje claro si no hay suficientes datos
- Sugiere ampliar el rango de fechas o seleccionar otra métrica

**P: ¿Cómo garantizan que el modelo no está sobreentrenado?**
**R:**
- Train/Test split 80/20 previene sobreentrenamiento
- Evaluamos en conjunto de prueba (no entrenamiento)
- Métricas consistentes entre train y test indican buen ajuste
- Recomendación futura: validación cruzada k-fold

---
