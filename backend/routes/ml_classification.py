"""
Rutas para el módulo de Machine Learning - Clasificación
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
import logging
from typing import Optional

try:
    from models import MLTrainRequest, MLTrainResponse, MLPredictRequest, MLPredictResponse, MLMetricsResponse
    from routes.auth import get_current_user
    from services.ml_classification_service import get_ml_classification_service
except ImportError:
    from backend.models import MLTrainRequest, MLTrainResponse, MLPredictRequest, MLPredictResponse, MLMetricsResponse
    from backend.routes.auth import get_current_user
    from backend.services.ml_classification_service import get_ml_classification_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ml", tags=["machine-learning"])

ml_service = get_ml_classification_service()


@router.post("/train", response_model=MLTrainResponse)
async def train_ml_model(
    request: MLTrainRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Entrena un modelo de Machine Learning
    
    - Preprocesamiento automático
    - División train/test 80/20
    - Selección automática del mejor modelo (RandomForest, LogisticRegression, DecisionTree)
    - Guardado del modelo (.pkl)
    """
    try:
        logger.info(f"User {current_user['email']} entrenando modelo: {request.sensor_type}/{request.metric}")
        
        result = ml_service.train_model(
            sensor_type=request.sensor_type,
            metric=request.metric,
            model_type=request.model_type or 'auto',
            date_from=request.date_from,
            date_to=request.date_to,
            days_back=request.days_back or 90,
            limit=request.limit or 5000,
            test_size=request.test_size or 0.2,
            random_state=request.random_state or 42
        )
        
        return MLTrainResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Error entrenando modelo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error entrenando modelo: {str(e)}"
        )


@router.post("/predict", response_model=MLPredictResponse)
async def predict_ml(
    request: MLPredictRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Realiza predicciones usando un modelo entrenado
    
    Soporta:
    - Predicción por fecha específica
    - Predicción por periodo (rango de fechas)
    - Predicción por semana
    """
    try:
        logger.info(f"User {current_user['email']} haciendo predicción: {request.sensor_type}/{request.metric}")
        
        result = ml_service.predict(
            sensor_type=request.sensor_type,
            metric=request.metric,
            prediction_date=request.prediction_date,
            date_from=request.date_from,
            date_to=request.date_to,
            model_key=request.model_key
        )
        
        return MLPredictResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Error en predicción: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en predicción: {str(e)}"
        )


@router.get("/predict/date/{sensor_type}/{metric}")
async def predict_by_date(
    sensor_type: str,
    metric: str,
    date: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    model_key: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Predicción por fecha específica"""
    try:
        result = ml_service.predict(
            sensor_type=sensor_type,
            metric=metric,
            prediction_date=date,
            model_key=model_key
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Endpoints predict/period y predict/week removidos - no se usan
# Se usa predict/regression para predicciones de regresión


@router.post("/predict/regression")
async def predict_regression_ml(
    request: MLPredictRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Realiza predicciones de regresión (valores numéricos) usando modelos de clasificación ML
    
    Convierte las clases predichas a valores numéricos basándose en los datos históricos.
    Permite predicciones por fecha específica o por mes completo.
    """
    try:
        logger.info(f"User {current_user['email']} haciendo predicción de regresión: {request.sensor_type}/{request.metric}")
        
        result = ml_service.predict_regression(
            sensor_type=request.sensor_type,
            metric=request.metric,
            prediction_date=request.prediction_date,
            prediction_month=request.prediction_month,
            model_key=request.model_key
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Error en predicción de regresión: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en predicción de regresión: {str(e)}"
        )


@router.get("/metrics/{model_key}", response_model=MLMetricsResponse)
async def get_ml_metrics(
    model_key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todas las métricas de un modelo entrenado
    
    Incluye:
    - Accuracy
    - Precision
    - Recall
    - F1-score
    - Matriz de Confusión
    """
    try:
        metrics = ml_service.get_metrics(model_key)
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Métricas no encontradas para modelo {model_key}"
            )
        
        return MLMetricsResponse(
            model_key=model_key,
            metrics=metrics,
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error obteniendo métricas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo métricas: {str(e)}"
        )


@router.get("/visualizations/{model_key}")
async def get_ml_visualizations(
    model_key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera visualizaciones en base64 para el frontend
    
    Retorna:
    - Matriz de confusión (base64 PNG)
    - Distribución de clases (base64 PNG)
    - Curva ROC (si aplica)
    """
    try:
        visualizations = ml_service.generate_visualizations(model_key)
        if not visualizations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visualizaciones no disponibles para modelo {model_key}"
            )
        
        return {
            "success": True,
            "model_key": model_key,
            "visualizations": visualizations
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generando visualizaciones: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando visualizaciones: {str(e)}"
        )


@router.get("/models")
async def list_trained_models(
    current_user: dict = Depends(get_current_user)
):
    """Lista todos los modelos entrenados"""
    try:
        from pathlib import Path
        models_dir = Path(__file__).parent.parent / "models"
        models = []
        
        if models_dir.exists():
            for model_file in models_dir.glob("*.pkl"):
                model_key = model_file.stem
                metrics = ml_service.get_metrics(model_key)
                
                models.append({
                    "model_key": model_key,
                    "file_path": str(model_file),
                    "has_metrics": metrics is not None,
                    "metrics": metrics
                })
        
        return {
            "success": True,
            "total_models": len(models),
            "models": models
        }
    except Exception as e:
        logger.exception(f"Error listando modelos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listando modelos: {str(e)}"
        )





