import logging
from datetime import timedelta
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error

try:
    from services.mongodb_service import get_mongodb_service
except ImportError:
    from backend.services.mongodb_service import get_mongodb_service


logger = logging.getLogger(__name__)


class PredictionService:
    """Service encapulating the ML workflow for sensor forecasts."""

    METRICS_BY_SENSOR: Dict[str, Dict[str, Dict[str, str]]] = {
        "air": {
            "co2_ppm": {"label": "CO₂ (ppm)", "unit": "ppm"},
            "temperatura_c": {"label": "Temperatura (°C)", "unit": "°C"},
            "humedad_percent": {"label": "Humedad (%)", "unit": "%"},
            "presion_hpa": {"label": "Presión (hPa)", "unit": "hPa"},
        },
        "sound": {
            "laeq_db": {"label": "LAeq (dB)", "unit": "dB"},
            "lai_db": {"label": "LAI (dB)", "unit": "dB"},
            "laimax_db": {"label": "LAI Máx (dB)", "unit": "dB"},
            "bateria_percent": {"label": "Batería (%)", "unit": "%"},
        },
        "underground": {
            "distancia_mm": {"label": "Distancia (mm)", "unit": "mm"},
            "bateria_percent": {"label": "Batería (%)", "unit": "%"},
        },
    }

    def __init__(self, mongodb_service=None):
        self.mongodb_service = mongodb_service or get_mongodb_service()

    def generate_predictions(
        self,
        sensor_type: str,
        metric_name: Optional[str] = None,
        horizon_hours: int = 24,
        interval_minutes: int = 60,
        days_back: int = 30,
        limit: int = 2000,
        model_type: str = "linear",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> Dict:
        sensor_key = self._normalize_sensor(sensor_type)
        metric_catalog = self.METRICS_BY_SENSOR.get(sensor_key)
        if not metric_catalog:
            raise ValueError(f"Unsupported sensor type '{sensor_type}'")

        metric_names = (
            [metric_name]
            if metric_name
            else list(metric_catalog.keys())
        )

        # Usar rango de fechas si está disponible, sino usar days_back
        df = self._load_dataframe(sensor_key, days_back, limit, date_from, date_to)
        if df.empty:
            date_info = f" (rango: {date_from} a {date_to})" if date_from and date_to else f" (últimos {days_back} días)"
            raise ValueError(f"No hay datos suficientes para generar predicciones{date_info}. Verifica que haya datos en el rango seleccionado.")

        # Verificar que al menos una métrica tenga datos
        metrics_with_data = []
        for metric in metric_names:
            if metric not in metric_catalog:
                logger.warning(f"Métrica '{metric}' no existe para sensor '{sensor_type}', omitiendo")
                continue
            
            if metric not in df.columns:
                logger.warning(f"Métrica '{metric}' no encontrada en los datos, omitiendo")
                continue
            
            # Verificar que la métrica tenga valores válidos
            metric_values = df[metric].dropna()
            if len(metric_values) < 10:
                logger.warning(f"Métrica '{metric}' tiene solo {len(metric_values)} valores válidos (mínimo 10 requeridos), omitiendo")
                continue
            
            metrics_with_data.append(metric)
        
        if not metrics_with_data:
            available_metrics = [col for col in df.columns if col not in ['time', 'timestamp', 'sensor_name', 'ubicacion', 'direccion', 'id']]
            raise ValueError(
                f"No hay métricas con suficientes datos para generar predicciones. "
                f"Métricas disponibles en datos: {', '.join(available_metrics[:5])}"
            )

        results = []
        for metric in metrics_with_data:
            try:
                metric_result = self._predict_metric(
                    df,
                    metric_field=metric,
                    sensor_key=sensor_key,
                    horizon_hours=horizon_hours,
                    interval_minutes=interval_minutes,
                    model_type=model_type,
                )

                if metric_result:
                    metric_result.update(metric_catalog[metric])
                    results.append(metric_result)
                else:
                    logger.warning(f"No se pudo generar predicción para métrica '{metric}'")
            except Exception as e:
                logger.error(f"Error generando predicción para métrica '{metric}': {e}")
                continue

        return {
            "sensor_type": sensor_key,
            "horizon_hours": horizon_hours,
            "interval_minutes": interval_minutes,
            "days_back": days_back,
            "model_type": model_type,
            "metrics": results,
        }

    # --------------------------------------------------------------------- #
    # Helpers
    # --------------------------------------------------------------------- #

    def _load_dataframe(self, sensor_type: str, days_back: int, limit: int, date_from: Optional[str] = None, date_to: Optional[str] = None) -> pd.DataFrame:
        try:
            # Ensure MongoDB connection
            if self.mongodb_service.client is None:
                logger.warning("MongoDB not connected, attempting to connect...")
                self.mongodb_service.connect()
            
            # Usar rango de fechas si está disponible
            if date_from and date_to:
                data = self.mongodb_service.load_sensor_data_by_date_range(
                    sensor_type, date_from, date_to, limit
                )
            else:
                data = self.mongodb_service.load_sensor_data(sensor_type, days_back=days_back, limit=limit)
            if not data:
                logger.warning(f"No data found for sensor type: {sensor_type}")
                return pd.DataFrame()

            df = pd.DataFrame(data)
            if df.empty:
                logger.warning(f"DataFrame is empty for sensor type: {sensor_type}")
                return pd.DataFrame()
            
            # Handle time column
            if "time" not in df.columns:
                if "timestamp" in df.columns:
                    df["time"] = df["timestamp"]
                else:
                    logger.error(f"No time or timestamp column found in data")
                    return pd.DataFrame()

            df["time"] = pd.to_datetime(df["time"], errors="coerce")
            df = df.dropna(subset=["time"]).sort_values("time")
            
            if df.empty:
                logger.warning(f"DataFrame is empty after processing time column")
            
            logger.info(f"Loaded {len(df)} records for {sensor_type}")
            return df
            
        except Exception as e:
            logger.error(f"Error loading dataframe for {sensor_type}: {e}")
            raise ValueError(f"Error cargando datos de MongoDB: {str(e)}")

    def _predict_metric(
        self,
        df: pd.DataFrame,
        metric_field: str,
        sensor_key: str,
        horizon_hours: int,
        interval_minutes: int,
        model_type: str = "linear",
    ) -> Optional[Dict]:
        try:
            if df.empty:
                logger.warning(f"DataFrame is empty for metric {metric_field}")
                return None
                
            if metric_field not in df.columns:
                logger.warning(f"Metric {metric_field} not present in dataframe for {sensor_key}")
                return None

            series = df[["time", metric_field]].dropna()
            if series.empty:
                logger.warning(f"Series is empty after dropna for {metric_field}")
                return None
                
            if series[metric_field].nunique() == 0:
                logger.warning(f"Metric {metric_field} has no variability (all values are the same)")
                return None

            # Keep recent history (limit to avoid memory issues)
            series = series.tail(1500).copy()
            
            if len(series) < 10:
                logger.warning(f"Metric {metric_field} has insufficient data points: {len(series)}")
                return None

            # Handle timezone-aware timestamps
            time_col = series["time"]
            if pd.api.types.is_datetime64tz_dtype(time_col.dtype):
                time_col = time_col.dt.tz_convert("UTC")
            elif time_col.dt.tz is not None:
                time_col = time_col.dt.tz_localize(None)
            
            # Convert to Unix timestamps
            timestamps = (time_col - pd.Timestamp("1970-01-01")) // pd.Timedelta('1s')
            timestamps = timestamps.values.reshape(-1, 1)

            X = timestamps.astype(np.float64)
            y = series[metric_field].astype(float).values

            # Remove any NaN or Inf values
            valid_mask = np.isfinite(X.flatten()) & np.isfinite(y)
            X = X[valid_mask]
            y = y[valid_mask]

            if len(X) < 10:
                logger.warning(f"Metric {metric_field} does not have enough valid samples: {len(X)}")
                return None

            # Split data for training and testing
            split_idx = max(int(len(X) * 0.8), len(X) - 5)
            if split_idx >= len(X):
                split_idx = len(X) - 1
            if split_idx < 5:
                split_idx = len(X) - 1

            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            # Train model
            try:
                model = self._train_model(X_train, y_train, model_type=model_type)
            except Exception as e:
                logger.error(f"Error training model for {metric_field}: {e}")
                return None

            # Calculate regression metrics: R2, RMSE, MAE
            r2_score = None
            rmse = None
            mae = None
            if len(X_test) > 1:
                try:
                    # R2 Score (Coeficiente de Determinación)
                    r2_score = float(model.score(X_test, y_test))
                    
                    # Predictions for test set to calculate RMSE and MAE
                    y_test_pred = model.predict(X_test)
                    
                    # RMSE (Root Mean Squared Error)
                    mse = mean_squared_error(y_test, y_test_pred)
                    rmse = float(np.sqrt(mse))
                    
                    # MAE (Mean Absolute Error)
                    mae = float(mean_absolute_error(y_test, y_test_pred))
                    
                    logger.info(f"Metrics for {metric_field}: R2={r2_score:.4f}, RMSE={rmse:.4f}, MAE={mae:.4f}")
                except Exception as exc:
                    logger.debug(f"Unable to compute regression metrics for {metric_field}: {exc}")

            # Generate future timestamps
            num_points = max(1, int(horizon_hours * 60 / interval_minutes))
            last_time = series["time"].iloc[-1]
            
            # Ensure last_time is timezone-naive for calculations
            if pd.api.types.is_datetime64tz_dtype(type(last_time)):
                last_time = last_time.tz_localize(None) if last_time.tz is None else last_time.tz_localize(None)
            elif hasattr(last_time, 'tzinfo') and last_time.tzinfo is not None:
                last_time = last_time.replace(tzinfo=None)
            
            # Usar el año de los datos históricos, no el año actual
            # Esto asegura que las predicciones continúen desde donde terminan los datos
            step = timedelta(minutes=interval_minutes)
            future_times = []
            current_time = last_time
            for i in range(num_points):
                current_time = current_time + step
                future_times.append(current_time)
            
            # Convert future times to Unix timestamps
            future_ts = np.array([
                int((pd.Timestamp(ts) - pd.Timestamp("1970-01-01")).total_seconds())
                for ts in future_times
            ]).reshape(-1, 1).astype(np.float64)

            # Generate predictions
            try:
                predictions = model.predict(future_ts)
                # Ensure predictions are finite
                predictions = np.nan_to_num(predictions, nan=0.0, posinf=0.0, neginf=0.0)
            except Exception as e:
                logger.error(f"Error generating predictions for {metric_field}: {e}")
                return None

            prediction_points = [
                {"timestamp": pd.Timestamp(ts).isoformat(), "value": float(pred)}
                for idx, (ts, pred) in enumerate(zip(future_times, predictions))
            ]

            historical_points = [
                {"timestamp": pd.Timestamp(row.time).isoformat(), "value": float(row[metric_field])}
                for row in series.tail(200).itertuples()
            ]

            # Map model type to display name
            model_display_names = {
                "linear": "Linear Regression (OLS)",
                "ols": "Linear Regression (OLS)",
                "ridge": "Ridge Regression",
                "lasso": "Lasso Regression",
                "decision_tree": "Decision Tree",
                "svm": "Support Vector Machine (SVM)",
            }
            
            return {
                "metric_name": metric_field,
                "model_type": model_display_names.get(model_type, model_type),
                "model_type_code": model_type,
                "training_points": len(series),
                "r2_score": r2_score,
                "rmse": rmse,
                "mae": mae,
                "last_observation": {
                    "timestamp": pd.Timestamp(series["time"].iloc[-1]).isoformat(),
                    "value": float(series[metric_field].iloc[-1]),
                },
                "historical_points": historical_points,
                "predictions": prediction_points,
            }
        except Exception as e:
            logger.error(f"Error in _predict_metric for {metric_field}: {e}", exc_info=True)
            return None

    @staticmethod
    def _train_model(X_train: np.ndarray, y_train: np.ndarray, model_type: str = "linear"):
        """Train a machine learning model based on the specified type"""
        if model_type == "linear" or model_type == "ols":
            from sklearn.linear_model import LinearRegression
            model = LinearRegression()
        elif model_type == "ridge":
            from sklearn.linear_model import Ridge
            model = Ridge(alpha=1.0)
        elif model_type == "lasso":
            from sklearn.linear_model import Lasso
            model = Lasso(alpha=0.1)
        elif model_type == "decision_tree":
            from sklearn.tree import DecisionTreeRegressor
            model = DecisionTreeRegressor(max_depth=10, min_samples_split=5)
        elif model_type == "svm":
            from sklearn.svm import SVR
            model = SVR(kernel='rbf', C=100, gamma='scale', epsilon=0.1)
        else:
            # Default to linear regression
            from sklearn.linear_model import LinearRegression
            model = LinearRegression()
        
        model.fit(X_train, y_train)
        return model

    @staticmethod
    def _normalize_sensor(sensor_type: str) -> str:
        if not sensor_type:
            return sensor_type
        sensor = sensor_type.lower()
        aliases = {
            "air_quality": "air",
            "underground_water": "underground",
            "soterrado": "underground",
        }
        return aliases.get(sensor, sensor)


_prediction_service = None


def get_prediction_service() -> PredictionService:
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
    return _prediction_service

