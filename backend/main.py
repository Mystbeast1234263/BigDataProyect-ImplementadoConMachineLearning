from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

# Cargar .env desde la raíz del proyecto (2 niveles arriba)
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routes - funciona desde backend/ o desde raíz del proyecto
import sys
from pathlib import Path

# Asegurar que el directorio raíz esté en el path
backend_dir = Path(__file__).parent
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from routes import auth, sensors, predictions, ml_classification
except ImportError:
    from backend.routes import auth, sensors, predictions, ml_classification

# Import services
try:
    from services.mongodb_service import close_mongodb_service
    from services.auth_service import get_user_service
except ImportError:
    from backend.services.mongodb_service import close_mongodb_service
    from backend.services.auth_service import get_user_service

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# LIFESPAN EVENTS
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle (startup/shutdown)"""
    # Startup
    logger.info("FastAPI application starting...")

    # Initialize demo users
    try:
        user_service = get_user_service()
        user_service.init_demo_users()
        logger.info("Demo users initialized")
    except Exception as e:
        logger.warning(f"Error initializing demo users: {e}")

    yield

    # Shutdown
    logger.info("FastAPI application shutting down...")
    close_mongodb_service()
    logger.info("MongoDB connection closed")


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="GAMC Big Data Dashboard - FastAPI Backend",
    description="RESTful API for GAMC sensor data management and analytics",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

origins = [
    "http://localhost",
    "http://localhost:5173",      # Vite dev server
    "http://localhost:3000",      # Alternative React dev port
    "http://localhost:8050",      # Dash dashboard
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8050",
]

if os.getenv("ENVIRONMENT") == "production":
    origins = [
        "https://gamc-dashboard.example.com",  # Update with actual domain
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ============================================================================
# ADDITIONAL MIDDLEWARE (LoggingMiddleware removed - handled by Uvicorn)
# ============================================================================


# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

app.include_router(auth.router)
app.include_router(sensors.router)
app.include_router(predictions.router)
app.include_router(ml_classification.router)


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "GAMC Big Data Dashboard API",
        "version": "1.0.0",
        "description": "RESTful API for sensor data management",
        "docs": "/api/docs",
        "endpoints": {
            "authentication": "/api/auth",
            "sensors": "/api/sensors",
            "predictions": "/api/predictions"
        }
    }


@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "name": "GAMC Big Data Dashboard API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "authentication": "/api/auth",
            "sensors": "/api/sensors",
            "predictions": "/api/predictions"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint (no authentication required)"""
    try:
        from services.mongodb_service import get_mongodb_service
        from services.supabase_service import get_supabase_service
    except ImportError:
        from backend.services.mongodb_service import get_mongodb_service
        from backend.services.supabase_service import get_supabase_service
    
    mongodb_status = "unknown"
    supabase_status = "unknown"
    
    # Check MongoDB
    try:
        mongodb_service = get_mongodb_service()
        if mongodb_service.client is None:
            mongodb_status = "disconnected: service not initialized"
        else:
            mongodb_service.client.admin.command('ping')
            # Get collection count to verify access
            collections = mongodb_service.db.list_collection_names()
            mongodb_status = f"connected (collections: {len(collections)})"
    except Exception as e:
        mongodb_status = f"disconnected: {str(e)}"
    
    # Check Supabase
    try:
        supabase_service = get_supabase_service()
        if supabase_service.is_connected():
            supabase_status = "connected"
        else:
            supabase_status = "disconnected: credentials not configured"
    except Exception as e:
        supabase_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "GAMC Dashboard API",
        "version": "1.0.0",
        "mongodb": mongodb_status,
        "supabase": supabase_status
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }
    )


# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    reload = os.getenv("API_RELOAD", "True").lower() == "true"
    workers = int(os.getenv("API_WORKERS", "1"))

    logger.info(f"Starting FastAPI server on {host}:{port}")

    if reload:
        # Development mode with auto-reload
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )
    else:
        # Production mode with multiple workers
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=workers,
            log_level="info"
        )
