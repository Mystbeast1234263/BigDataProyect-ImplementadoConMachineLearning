from fastapi import APIRouter, Depends, HTTPException, Query, status
import logging
from typing import Optional

try:
    from models import PredictionResponse, SensorHealthResponse
    from routes.auth import get_current_user
    from services.prediction_service import get_prediction_service
    from services.alert_service import get_alert_service
except ImportError:
    from backend.models import PredictionResponse, SensorHealthResponse
    from backend.routes.auth import get_current_user
    from backend.services.prediction_service import get_prediction_service
    from backend.services.alert_service import get_alert_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/predictions", tags=["predictions"])
prediction_service = get_prediction_service()
alert_service = get_alert_service()


@router.get("/{sensor_type}", response_model=PredictionResponse)
async def get_predictions(
    sensor_type: str,
    metric_name: Optional[str] = Query(default=None, description="Nombre del campo a predecir"),
    horizon_hours: int = Query(default=24, ge=1, le=168),
    interval_minutes: int = Query(default=60, ge=5, le=1440),
    days_back: int = Query(default=30, ge=7, le=365),
    limit: int = Query(default=2000, ge=100, le=10000),
    model_type: str = Query(
        default="linear",
        description="Tipo de modelo: linear, ols, ridge, lasso, decision_tree, svm"
    ),
    date_from: Optional[str] = Query(default=None, description="Fecha inicio YYYY-MM-DD"),
    date_to: Optional[str] = Query(default=None, description="Fecha fin YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
) -> PredictionResponse:
    """
    Genera predicciones de serie de tiempo por tipo de sensor usando modelos simples
    de regresión. Requiere autenticación.
    """
    try:
        # Validate model type
        valid_models = ["linear", "ols", "ridge", "lasso", "decision_tree", "svm"]
        if model_type not in valid_models:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Modelo inválido. Opciones válidas: {', '.join(valid_models)}"
            )
        
        predictions = prediction_service.generate_predictions(
            sensor_type=sensor_type,
            metric_name=metric_name,
            horizon_hours=horizon_hours,
            interval_minutes=interval_minutes,
            days_back=days_back,
            limit=limit,
            model_type=model_type,
            date_from=date_from,
            date_to=date_to,
        )

        if not predictions.get("metrics"):
            # Si se solicitó una métrica específica, dar mensaje más específico
            if metric_name:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se pudieron generar predicciones para la métrica '{metric_name}'. Verifica que haya suficientes datos en el rango seleccionado."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se pudieron generar predicciones. Verifica que haya suficientes datos en el rango seleccionado."
                )

        logger.info(
            "User %s generated predictions for %s (%s metrics)",
            current_user.get("email"),
            sensor_type,
            len(predictions["metrics"])
        )
        return predictions
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        logger.exception("Error generating predictions: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno generando predicciones"
        ) from exc


@router.get("/{sensor_type}/health", response_model=SensorHealthResponse)
async def get_sensor_health(
    sensor_type: str,
    days_back: int = Query(default=7, ge=1, le=30),
    limit: int = Query(default=1000, ge=100, le=5000),
    current_user: dict = Depends(get_current_user)
) -> SensorHealthResponse:
    """
    Analiza la salud del sensor y genera alertas sobre posibles problemas,
    degradación o valores fuera de rango. Requiere autenticación.
    """
    try:
        health_data = alert_service.analyze_sensor_health(
            sensor_type=sensor_type,
            days_back=days_back,
            limit=limit,
        )

        logger.info(
            "User %s checked health for %s (status: %s, alerts: %s, warnings: %s)",
            current_user.get("email"),
            sensor_type,
            health_data.get("status"),
            health_data.get("total_alerts", 0),
            health_data.get("total_warnings", 0)
        )
        return health_data
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        logger.exception("Error analyzing sensor health: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno analizando salud del sensor"
        ) from exc

