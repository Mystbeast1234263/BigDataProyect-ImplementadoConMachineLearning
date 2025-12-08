import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

try:
    from services.mongodb_service import get_mongodb_service
except ImportError:
    from backend.services.mongodb_service import get_mongodb_service


logger = logging.getLogger(__name__)


class AlertService:
    """Service for detecting anomalies and generating alerts for sensors"""

    # Thresholds for different sensor types and metrics
    THRESHOLDS: Dict[str, Dict[str, Dict[str, float]]] = {
        "air": {
            "co2_ppm": {
                "warning": 800.0,  # ppm - indoor air quality concern
                "critical": 1000.0,  # ppm - unhealthy
                "min": 350.0,  # minimum expected
            },
            "temperatura_c": {
                "warning_low": 5.0,  # °C - too cold
                "warning_high": 35.0,  # °C - too hot
                "critical_low": 0.0,  # °C - freezing
                "critical_high": 40.0,  # °C - dangerous
            },
            "humedad_percent": {
                "warning_low": 30.0,  # % - too dry
                "warning_high": 70.0,  # % - too humid
                "critical_low": 20.0,  # % - very dry
                "critical_high": 80.0,  # % - very humid
            },
            "presion_hpa": {
                "warning_low": 980.0,  # hPa - low pressure
                "warning_high": 1050.0,  # hPa - high pressure
            },
        },
        "sound": {
            "laeq_db": {
                "warning": 65.0,  # dB - moderate noise
                "critical": 75.0,  # dB - loud, potential hearing damage
            },
            "lai_db": {
                "warning": 70.0,  # dB
                "critical": 80.0,  # dB
            },
            "laimax_db": {
                "warning": 85.0,  # dB
                "critical": 95.0,  # dB - very loud
            },
            "bateria_percent": {
                "warning": 20.0,  # % - low battery
                "critical": 10.0,  # % - critical battery
            },
        },
        "underground": {
            "distancia_mm": {
                "warning_low": 50.0,  # mm - water level rising
                "warning_high": 500.0,  # mm - water level very low
                "critical_low": 20.0,  # mm - flooding risk
                "critical_high": 1000.0,  # mm - very low water
            },
            "bateria_percent": {
                "warning": 20.0,  # % - low battery
                "critical": 10.0,  # % - critical battery
            },
        },
    }

    # Equipment degradation indicators
    DEGRADATION_INDICATORS = {
        "air": {
            "co2_ppm": {
                "trend_threshold": 50.0,  # Increasing trend over time
                "variance_threshold": 200.0,  # High variance indicates sensor issues
            },
            "temperatura_c": {
                "drift_threshold": 2.0,  # Temperature drift over time
            },
        },
        "sound": {
            "laeq_db": {
                "baseline_drift": 5.0,  # dB drift from baseline
            },
        },
        "underground": {
            "distancia_mm": {
                "stuck_threshold": 0.5,  # mm - sensor might be stuck
            },
        },
    }

    def __init__(self, mongodb_service=None):
        self.mongodb_service = mongodb_service or get_mongodb_service()

    def analyze_sensor_health(
        self,
        sensor_type: str,
        days_back: int = 7,
        limit: int = 1000,
    ) -> Dict:
        """Analyze sensor health and generate alerts"""
        sensor_key = self._normalize_sensor(sensor_type)
        metric_catalog = self.THRESHOLDS.get(sensor_key, {})
        
        if not metric_catalog:
            raise ValueError(f"Unsupported sensor type '{sensor_type}'")

        df = self._load_dataframe(sensor_key, days_back, limit)
        if df.empty:
            return {
                "sensor_type": sensor_key,
                "status": "no_data",
                "alerts": [],
                "warnings": [],
                "health_score": None,
            }

        alerts = []
        warnings = []
        health_scores = []

        for metric_name, thresholds in metric_catalog.items():
            if metric_name not in df.columns:
                continue

            metric_data = df[["time", metric_name]].dropna()
            if metric_data.empty:
                continue

            # Get latest value
            latest_value = float(metric_data[metric_name].iloc[-1])
            latest_time = metric_data["time"].iloc[-1]

            # Check thresholds
            alert = self._check_thresholds(
                metric_name, latest_value, thresholds, sensor_key
            )
            if alert:
                if alert["severity"] == "critical":
                    alerts.append(alert)
                else:
                    warnings.append(alert)

            # Check for degradation
            degradation = self._check_degradation(
                metric_data, metric_name, sensor_key
            )
            if degradation:
                if degradation["severity"] == "critical":
                    alerts.append(degradation)
                else:
                    warnings.append(degradation)

            # Calculate health score for this metric (0-100)
            health_score = self._calculate_health_score(
                metric_data, metric_name, thresholds, sensor_key
            )
            health_scores.append(health_score)

        # Overall health score (average of all metrics)
        overall_health = (
            sum(health_scores) / len(health_scores) if health_scores else None
        )

        # Determine overall status
        if overall_health is None:
            status = "unknown"
        elif overall_health >= 80:
            status = "healthy"
        elif overall_health >= 60:
            status = "warning"
        elif overall_health >= 40:
            status = "degraded"
        else:
            status = "critical"

        return {
            "sensor_type": sensor_key,
            "status": status,
            "health_score": overall_health,
            "alerts": alerts,
            "warnings": warnings,
            "total_alerts": len(alerts),
            "total_warnings": len(warnings),
            "last_updated": datetime.utcnow().isoformat(),
        }

    def _check_thresholds(
        self,
        metric_name: str,
        value: float,
        thresholds: Dict[str, float],
        sensor_key: str,
    ) -> Optional[Dict]:
        """Check if value exceeds thresholds"""
        # Check for single threshold (warning/critical)
        if "warning" in thresholds and value >= thresholds["warning"]:
            return {
                "metric": metric_name,
                "type": "threshold_exceeded",
                "severity": "critical" if value >= thresholds.get("critical", float("inf")) else "warning",
                "message": f"{metric_name} está en {value:.2f}, excede el umbral de {'crítico' if value >= thresholds.get('critical', float('inf')) else 'advertencia'}",
                "value": value,
                "threshold": thresholds.get("critical", thresholds.get("warning")),
            }

        if "critical" in thresholds and value >= thresholds["critical"]:
            return {
                "metric": metric_name,
                "type": "threshold_exceeded",
                "severity": "critical",
                "message": f"{metric_name} está en {value:.2f}, excede el umbral crítico",
                "value": value,
                "threshold": thresholds["critical"],
            }

        # Check for range thresholds (low/high)
        if "warning_low" in thresholds and value <= thresholds["warning_low"]:
            return {
                "metric": metric_name,
                "type": "threshold_exceeded",
                "severity": "critical" if value <= thresholds.get("critical_low", float("-inf")) else "warning",
                "message": f"{metric_name} está en {value:.2f}, por debajo del umbral mínimo",
                "value": value,
                "threshold": thresholds.get("critical_low", thresholds.get("warning_low")),
            }

        if "warning_high" in thresholds and value >= thresholds["warning_high"]:
            return {
                "metric": metric_name,
                "type": "threshold_exceeded",
                "severity": "critical" if value >= thresholds.get("critical_high", float("inf")) else "warning",
                "message": f"{metric_name} está en {value:.2f}, por encima del umbral máximo",
                "value": value,
                "threshold": thresholds.get("critical_high", thresholds.get("warning_high")),
            }

        return None

    def _check_degradation(
        self,
        metric_data: pd.DataFrame,
        metric_name: str,
        sensor_key: str,
    ) -> Optional[Dict]:
        """Check for sensor degradation patterns"""
        indicators = self.DEGRADATION_INDICATORS.get(sensor_key, {}).get(metric_name, {})
        
        if not indicators:
            return None

        values = metric_data[metric_name].astype(float).values
        if len(values) < 10:
            return None

        # Check for stuck sensor (low variance)
        if "stuck_threshold" in indicators:
            variance = np.var(values)
            if variance < indicators["stuck_threshold"]:
                return {
                    "metric": metric_name,
                    "type": "sensor_stuck",
                    "severity": "critical",
                    "message": f"El sensor {metric_name} podría estar atascado (varianza muy baja: {variance:.3f})",
                    "value": variance,
                }

        # Check for drift
        if "drift_threshold" in indicators or "baseline_drift" in indicators:
            threshold = indicators.get("drift_threshold") or indicators.get("baseline_drift")
            # Compare first half vs second half
            mid = len(values) // 2
            first_half_mean = np.mean(values[:mid])
            second_half_mean = np.mean(values[mid:])
            drift = abs(second_half_mean - first_half_mean)
            
            if drift > threshold:
                return {
                    "metric": metric_name,
                    "type": "sensor_drift",
                    "severity": "warning",
                    "message": f"El sensor {metric_name} muestra deriva significativa ({drift:.2f})",
                    "value": drift,
                }

        # Check for high variance (sensor instability)
        if "variance_threshold" in indicators:
            variance = np.var(values)
            if variance > indicators["variance_threshold"]:
                return {
                    "metric": metric_name,
                    "type": "high_variance",
                    "severity": "warning",
                    "message": f"El sensor {metric_name} muestra alta varianza ({variance:.2f}), posible inestabilidad",
                    "value": variance,
                }

        # Check for increasing trend (potential failure)
        if "trend_threshold" in indicators:
            # Simple linear trend
            x = np.arange(len(values))
            slope = np.polyfit(x, values, 1)[0]
            if slope > indicators["trend_threshold"]:
                return {
                    "metric": metric_name,
                    "type": "increasing_trend",
                    "severity": "warning",
                    "message": f"El sensor {metric_name} muestra una tendencia creciente preocupante",
                    "value": slope,
                }

        return None

    def _calculate_health_score(
        self,
        metric_data: pd.DataFrame,
        metric_name: str,
        thresholds: Dict[str, float],
        sensor_key: str,
    ) -> float:
        """Calculate health score (0-100) for a metric"""
        values = metric_data[metric_name].astype(float).values
        if len(values) == 0:
            return 0.0

        latest_value = float(values[-1])
        score = 100.0

        # Penalize based on threshold violations
        if "critical" in thresholds:
            if latest_value >= thresholds["critical"]:
                score -= 50
            elif latest_value >= thresholds.get("warning", 0):
                score -= 25

        if "critical_low" in thresholds:
            if latest_value <= thresholds["critical_low"]:
                score -= 50
            elif latest_value <= thresholds.get("warning_low", float("inf")):
                score -= 25

        # Penalize based on variance (instability)
        variance = np.var(values)
        if variance > 100:  # High variance indicates instability
            score -= 10

        # Penalize based on recent trend (if negative)
        if len(values) >= 5:
            recent_trend = np.mean(values[-5:]) - np.mean(values[-10:-5] if len(values) >= 10 else values[:5])
            if abs(recent_trend) > 10:  # Significant change
                score -= 5

        return max(0.0, min(100.0, score))

    def _load_dataframe(self, sensor_type: str, days_back: int, limit: int) -> pd.DataFrame:
        """Load sensor data as DataFrame"""
        data = self.mongodb_service.load_sensor_data(sensor_type, days_back=days_back, limit=limit)
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)
        if "time" not in df.columns:
            df["time"] = df.get("timestamp")

        df["time"] = pd.to_datetime(df["time"], errors="coerce")
        df = df.dropna(subset=["time"]).sort_values("time")

        return df

    @staticmethod
    def _normalize_sensor(sensor_type: str) -> str:
        """Normalize sensor type name"""
        if not sensor_type:
            return sensor_type
        sensor = sensor_type.lower()
        aliases = {
            "air_quality": "air",
            "underground_water": "underground",
            "soterrado": "underground",
        }
        return aliases.get(sensor, sensor)


_alert_service = None


def get_alert_service() -> AlertService:
    """Get singleton instance of AlertService"""
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service












