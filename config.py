# Configuración del proyecto GAMC Big Data Dashboard

# --- Configuración de Kafka ---
KAFKA_BROKER_URL = 'localhost:9092'
KAFKA_TOPIC = 'datos_sensores_gamc'
KAFKA_GROUP_ID = 'dashboard_group'

# --- Configuración de MongoDB Atlas ---
MONGO_URI = "mongodb+srv://gamc_user:womita14@bigdataproyect.nfdzitt.mongodb.net/GAMC_data?retryWrites=true&w=majority"
DB_NAME = "GAMC_data"

# Colecciones de sensores
COLLECTIONS = {
    'air_sensors': 'air_sensors',
    'sound_sensors': 'sound_sensors', 
    'underground_sensors': 'underground_sensors',
    'sensores': 'sensores'
}

# --- Configuración del Dashboard ---
DASHBOARD_HOST = '0.0.0.0'
DASHBOARD_PORT = 8050
AUTO_REFRESH_INTERVAL = 5000  # ms
SAMPLE_SIZE = 1000
MAX_RECORDS_MEMORY = 1000

# --- Configuración del Productor ---
PRODUCER_DELAY_SECONDS = 2
PRODUCER_LOOP_DATA = True
PRODUCER_MAX_RECORDS_PER_COLLECTION = 1000

# --- Filtros de Fechas por Defecto ---
DEFAULT_DATE_FILTER = {
    'habilitado': True,
    'dias_atras': 7,  # Días hacia atrás desde hoy
    'fecha_inicio': None,  # Si es None, usa dias_atras
    'fecha_fin': None      # Si es None, usa fecha actual
}

# --- Configuración de Logging ---
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
