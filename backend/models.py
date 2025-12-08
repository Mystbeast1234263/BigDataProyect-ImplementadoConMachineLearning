from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# ============================================================================
# AUTHENTICATION MODELS
# ============================================================================

class LoginRequest(BaseModel):
    """Request model for user login"""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Response model for successful login"""
    access_token: str
    token_type: str
    user_id: str
    email: str
    rol: str


class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None
    user_id: Optional[str] = None


# ============================================================================
# USER MODELS
# ============================================================================

class UserBase(BaseModel):
    """Base user model"""
    email: str
    rol: str  # admin, operador, viewer


class UserCreate(UserBase):
    """User creation model"""
    password: str


class User(UserBase):
    """User model for API responses"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# SENSOR DATA MODELS
# ============================================================================

class SensorDataBase(BaseModel):
    """Base sensor data model"""
    sensor_name: str
    sensor_type: str  # air_quality, sound, underground
    metric_name: str  # co2, temperature, humidity, sound_level, etc.
    metric_value: float
    timestamp: datetime
    ubicacion: Optional[str] = None


class SensorDataCreate(SensorDataBase):
    """Sensor data creation model"""
    pass


class SensorData(SensorDataBase):
    """Sensor data model for API responses"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# SENSOR MODELS
# ============================================================================

class SensorBase(BaseModel):
    """Base sensor model"""
    device_name: str
    sensor_type: str  # air_quality, sound, underground
    ubicacion: Optional[str] = None
    direccion: Optional[str] = None


class SensorCreate(SensorBase):
    """Sensor creation model"""
    pass


class Sensor(SensorBase):
    """Sensor model for API responses"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# STATISTICS MODELS
# ============================================================================

class SensorStats(BaseModel):
    """Sensor statistics model"""
    count: int
    average: float
    min_value: float
    max_value: float
    std_dev: float
    latest_timestamp: Optional[datetime] = None


class SensorTypeStats(BaseModel):
    """Statistics for a sensor type"""
    sensor_type: str
    total_records: int
    unique_sensors: int
    metrics: dict  # metric_name -> SensorStats
    date_range: dict  # {"start": datetime, "end": datetime}


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class GenerateDataRequest(BaseModel):
    """Request for generating random sensor data"""
    sensor_type: str
    count: int = 100
    days_back: int = 14


class GenerateDataPreviewRequest(BaseModel):
    """Request for generating random sensor data preview (sensor_type in URL)"""
    count: int = 50
    days_back: int = 30
    date_from: Optional[str] = None  # Format: YYYY-MM-DD
    date_to: Optional[str] = None    # Format: YYYY-MM-DD


class GenerateDataResponse(BaseModel):
    """Response for data generation"""
    success: bool
    message: str
    records_created: int


class ClearDataRequest(BaseModel):
    """Request for clearing sensor data"""
    sensor_type: str


class ClearDataResponse(BaseModel):
    """Response for data clearing"""
    success: bool
    message: str
    records_deleted: int


class SensorListResponse(BaseModel):
    """Response listing available sensors"""
    total: int
    sensors: List[dict]


class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str
    error_code: Optional[str] = None


# ============================================================================
# PREDICTION MODELS
# ============================================================================

class PredictionPoint(BaseModel):
    """Predicted or historical datapoint"""
    timestamp: str  # ISO format string
    value: float


class PredictionResult(BaseModel):
    """Prediction output for a metric"""
    metric_name: str
    label: Optional[str] = None
    unit: Optional[str] = None
    model_type: str
    model_type_code: Optional[str] = None
    training_points: int
    r2_score: Optional[float] = None
    last_observation: Optional[PredictionPoint] = None
    historical_points: List[PredictionPoint]
    predictions: List[PredictionPoint]


class PredictionResponse(BaseModel):
    """Prediction response per sensor type"""
    sensor_type: str
    horizon_hours: int
    interval_minutes: int
    days_back: int
    model_type: Optional[str] = "linear"
    metrics: List[PredictionResult]


# ============================================================================
# ALERT MODELS
# ============================================================================

class Alert(BaseModel):
    """Alert model"""
    metric: str
    type: str  # threshold_exceeded, sensor_stuck, sensor_drift, etc.
    severity: str  # warning, critical
    message: str
    value: float
    threshold: Optional[float] = None


class SensorHealthResponse(BaseModel):
    """Sensor health and alerts response"""
    sensor_type: str
    status: str  # healthy, warning, degraded, critical, unknown, no_data
    health_score: Optional[float] = None
    alerts: List[Alert]
    warnings: List[Alert]
    total_alerts: int
    total_warnings: int
    last_updated: str


# ============================================================================
# MACHINE LEARNING MODELS
# ============================================================================

class MLTrainRequest(BaseModel):
    """Request for training ML model"""
    sensor_type: str  # air, sound, underground
    metric: str  # co2_ppm, temperatura_c, etc.
    model_type: Optional[str] = "auto"  # auto, random_forest, logistic_regression, decision_tree
    date_from: Optional[str] = None  # YYYY-MM-DD
    date_to: Optional[str] = None    # YYYY-MM-DD
    days_back: Optional[int] = 90
    limit: Optional[int] = 5000
    test_size: Optional[float] = 0.2  # 80/20 split
    random_state: Optional[int] = 42


class MLModelMetrics(BaseModel):
    """ML model metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    model_name: str
    confusion_matrix: List[List[int]]
    confusion_matrix_labels: List[str]
    training_samples: int
    test_samples: int
    model_path: Optional[str] = None


class MLTrainResponse(BaseModel):
    """Response for ML training"""
    success: bool
    model_key: str
    model_type: str
    metrics: MLModelMetrics
    all_models_metrics: Optional[Dict[str, Any]] = None
    model_path: str


class MLPredictRequest(BaseModel):
    """Request for ML prediction"""
    sensor_type: str
    metric: str
    prediction_date: Optional[str] = None  # YYYY-MM-DD for single date
    prediction_month: Optional[str] = None  # YYYY-MM for month prediction
    date_from: Optional[str] = None  # YYYY-MM-DD for period
    date_to: Optional[str] = None    # YYYY-MM-DD for period
    model_key: Optional[str] = None


class MLPredictionResult(BaseModel):
    """Single prediction result"""
    index: int
    predicted_class: str
    probabilities: Dict[str, float]
    confidence: float
    timestamp: Optional[str] = None


class MLPredictResponse(BaseModel):
    """Response for ML prediction"""
    success: bool
    model_key: str
    predictions: List[MLPredictionResult]
    total_predictions: int
    class_distribution: Optional[Dict[str, int]] = None


class MLRegressionPredictionResult(BaseModel):
    """Single regression prediction result (numeric value)"""
    timestamp: Optional[str] = None
    predicted_class: str
    predicted_value: float
    confidence: float
    probabilities: Dict[str, float]
    prediction_date: Optional[str] = None
    prediction_month: Optional[str] = None


class MLRegressionPredictResponse(BaseModel):
    """Response for ML regression prediction (numeric values)"""
    success: bool
    model_key: str
    metric: str
    sensor_type: str
    predictions: List[MLRegressionPredictionResult]
    total_predictions: int
    prediction_date: Optional[str] = None
    prediction_month: Optional[str] = None
    class_value_mapping: Dict[str, float]


class MLMetricsResponse(BaseModel):
    """Response for ML metrics"""
    success: bool
    model_key: str
    metrics: Dict[str, Any]
