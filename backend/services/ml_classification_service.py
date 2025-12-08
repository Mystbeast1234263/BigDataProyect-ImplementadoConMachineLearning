"""
Machine Learning Classification Service
Módulo completo de ML con entrenamiento, predicción y métricas
"""
import logging
import os
import pickle
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO

try:
    from services.mongodb_service import get_mongodb_service
except ImportError:
    from backend.services.mongodb_service import get_mongodb_service

logger = logging.getLogger(__name__)

# Directorio para guardar modelos
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


class MLClassificationService:
    """Servicio completo de Machine Learning para clasificación de estados de sensores"""
    
    def __init__(self, mongodb_service=None):
        self.mongodb_service = mongodb_service or get_mongodb_service()
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.models = {}
        self.model_metrics = {}
        
    def _create_target_variable(self, df: pd.DataFrame, metric: str) -> pd.Series:
        """
        Crea variable objetivo basada en umbrales de alerta
        Clases: 'normal', 'warning', 'critical'
        """
        metric_values = df[metric]
        
        if metric == 'co2_ppm':
            conditions = [
                metric_values <= 800,
                (metric_values > 800) & (metric_values <= 1000),
                metric_values > 1000
            ]
            values = ['normal', 'warning', 'critical']
        elif metric == 'temperatura_c':
            conditions = [
                (metric_values >= 5) & (metric_values <= 35),
                ((metric_values < 5) & (metric_values >= 0)) | ((metric_values > 35) & (metric_values <= 40)),
                (metric_values < 0) | (metric_values > 40)
            ]
            values = ['normal', 'warning', 'critical']
        elif metric == 'humedad_percent':
            conditions = [
                (metric_values >= 30) & (metric_values <= 70),
                ((metric_values >= 20) & (metric_values < 30)) | ((metric_values > 70) & (metric_values <= 80)),
                (metric_values < 20) | (metric_values > 80)
            ]
            values = ['normal', 'warning', 'critical']
        elif metric == 'laeq_db':
            conditions = [
                metric_values <= 65,
                (metric_values > 65) & (metric_values <= 75),
                metric_values > 75
            ]
            values = ['normal', 'warning', 'critical']
        elif metric == 'distancia_mm':
            conditions = [
                (metric_values >= 50) & (metric_values <= 500),
                ((metric_values >= 20) & (metric_values < 50)) | ((metric_values > 500) & (metric_values <= 1000)),
                (metric_values < 20) | (metric_values > 1000)
            ]
            values = ['normal', 'warning', 'critical']
        else:
            # Default: usar cuartiles
            q1 = metric_values.quantile(0.25)
            q3 = metric_values.quantile(0.75)
            conditions = [
                (metric_values >= q1) & (metric_values <= q3),
                ((metric_values < q1) | (metric_values > q3)) & ((metric_values >= q1 * 0.5) & (metric_values <= q3 * 1.5)),
                (metric_values < q1 * 0.5) | (metric_values > q3 * 1.5)
            ]
            values = ['normal', 'warning', 'critical']
        
        return pd.Series(np.select(conditions, values, default='normal'), index=df.index)
    
    def _create_target_variable_with_thresholds(self, df: pd.DataFrame, metric: str, threshold_low: float, threshold_high: float) -> pd.Series:
        """
        Crea variable objetivo usando umbrales personalizados (percentiles)
        """
        metric_values = df[metric]
        conditions = [
            metric_values <= threshold_low,
            (metric_values > threshold_low) & (metric_values <= threshold_high),
            metric_values > threshold_high
        ]
        values = ['normal', 'warning', 'critical']
        return pd.Series(np.select(conditions, values, default='normal'), index=df.index)
    
    def _load_and_prepare_data(
        self,
        sensor_type: str,
        metric: str,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        days_back: int = 30,
        limit: int = 5000
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """Carga y prepara datos para entrenamiento"""
        try:
            # Cargar datos - intentar con diferentes estrategias si no hay datos
            data = []
            
            if date_from and date_to:
                # Intentar con rango de fechas
                try:
                    data = self.mongodb_service.load_sensor_data_by_date_range(
                        sensor_type, date_from, date_to, limit
                    )
                    logger.info(f"Intentando cargar datos de {sensor_type} desde {date_from} hasta {date_to}: {len(data)} registros")
                except Exception as e:
                    logger.warning(f"Error cargando datos por rango de fechas: {e}")
            
            # Si no hay datos con rango de fechas, intentar con days_back
            if not data:
                # Aumentar days_back progresivamente si no hay datos
                for days in [days_back, 90, 180, 365]:
                    try:
                        data = self.mongodb_service.load_sensor_data(sensor_type, days, limit)
                        logger.info(f"Intentando cargar datos de {sensor_type} con {days} días atrás: {len(data)} registros")
                        if data:
                            break
                    except Exception as e:
                        logger.warning(f"Error cargando datos con {days} días: {e}")
                        continue
            
            # Si aún no hay datos, intentar sin filtro de fecha (todos los datos)
            if not data:
                logger.warning(f"No se encontraron datos con filtros. Intentando cargar todos los datos de {sensor_type}")
                try:
                    # Cargar todos los datos disponibles sin filtro de fecha
                    collection_name = self.mongodb_service._get_collection_name(sensor_type)
                    collection = self.mongodb_service.get_collection(collection_name)
                    all_docs = list(collection.find({}).limit(limit))
                    if all_docs:
                        data = self.mongodb_service._format_data_wide(all_docs, sensor_type)
                        logger.info(f"Cargados {len(data)} registros sin filtro de fecha")
                except Exception as e:
                    logger.error(f"Error cargando todos los datos: {e}")
            
            if not data:
                # Mensaje más descriptivo
                collection_name = self.mongodb_service._get_collection_name(sensor_type)
                total_docs = self.mongodb_service.get_collection(collection_name).count_documents({})
                raise ValueError(
                    f"No se encontraron datos para {sensor_type} (colección: {collection_name}). "
                    f"Total de documentos en la colección: {total_docs}. "
                    f"Verifica que haya datos con la métrica '{metric}' y que las fechas sean correctas."
                )
            
            df = pd.DataFrame(data)
            if df.empty:
                raise ValueError(f"DataFrame vacío para {sensor_type} después de cargar {len(data)} registros")
            
            # Procesar time
            if "time" not in df.columns and "timestamp" in df.columns:
                df["time"] = df["timestamp"]
            
            df["time"] = pd.to_datetime(df["time"], errors="coerce")
            df = df.dropna(subset=["time"]).sort_values("time")
            
            # Verificar que la métrica existe
            available_columns = list(df.columns)
            if metric not in df.columns:
                # Intentar variaciones del nombre de la métrica
                metric_variations = {
                    'presion_hpa': ['presion_hpa', 'presion', 'pressure_hpa', 'pressure'],
                    'co2_ppm': ['co2_ppm', 'co2', 'CO2_ppm'],
                    'temperatura_c': ['temperatura_c', 'temperatura', 'temperature_c', 'temperature'],
                    'humedad_percent': ['humedad_percent', 'humedad', 'humidity_percent', 'humidity']
                }
                
                if metric in metric_variations:
                    for var_metric in metric_variations[metric]:
                        if var_metric in df.columns:
                            logger.info(f"Usando variación de métrica: {var_metric} en lugar de {metric}")
                            df[metric] = df[var_metric]
                            break
                
                if metric not in df.columns:
                    raise ValueError(
                        f"Métrica '{metric}' no encontrada en los datos. "
                        f"Columnas disponibles: {', '.join(available_columns[:10])}..."
                    )
            
            # Eliminar valores nulos en la métrica
            df = df.dropna(subset=[metric])
            
            if len(df) < 50:
                raise ValueError(f"Datos insuficientes: solo {len(df)} registros válidos")
            
            # Crear características (features)
            df['hour'] = df['time'].dt.hour
            df['day_of_week'] = df['time'].dt.dayofweek
            df['day_of_month'] = df['time'].dt.day
            df['month'] = df['time'].dt.month
            
            # Agregar características estadísticas móviles
            window = min(24, len(df) // 10)
            if window > 1:
                df[f'{metric}_mean_24h'] = df[metric].rolling(window=window, min_periods=1).mean()
                df[f'{metric}_std_24h'] = df[metric].rolling(window=window, min_periods=1).std().fillna(0)
                df[f'{metric}_diff'] = df[metric].diff().fillna(0)
            
            # Seleccionar características
            feature_cols = [
                metric, 'hour', 'day_of_week', 'day_of_month', 'month'
            ]
            if window > 1:
                feature_cols.extend([
                    f'{metric}_mean_24h',
                    f'{metric}_std_24h',
                    f'{metric}_diff'
                ])
            
            # Agregar otras métricas si existen
            sensor_metrics = {
                'air': ['co2_ppm', 'temperatura_c', 'humedad_percent', 'presion_hpa'],
                'sound': ['laeq_db', 'lai_db', 'laimax_db', 'bateria_percent'],
                'underground': ['distancia_mm', 'bateria_percent']
            }
            
            sensor_key = sensor_type.lower().replace('_quality', '').replace('_water', '')
            available_metrics = sensor_metrics.get(sensor_key, [])
            
            for other_metric in available_metrics:
                if other_metric != metric and other_metric in df.columns:
                    df_clean = df[other_metric].dropna()
                    if len(df_clean) > 0:
                        feature_cols.append(other_metric)
            
            # Eliminar filas con NaN en características
            df_features = df[feature_cols].dropna()
            
            if len(df_features) < 50:
                raise ValueError(f"Datos insuficientes después de limpieza: {len(df_features)} registros")
            
            # Crear variable objetivo
            y = self._create_target_variable(df_features, metric)
            
            # Eliminar filas donde y es NaN
            valid_idx = ~y.isna()
            df_features = df_features[valid_idx]
            y = y[valid_idx]
            
            if len(df_features) < 50:
                raise ValueError(f"Datos insuficientes después de crear target: {len(df_features)} registros")
            
            logger.info(f"Datos preparados: {len(df_features)} registros, {len(feature_cols)} características")
            logger.info(f"Distribución de clases: {y.value_counts().to_dict()}")
            
            return df_features, y
            
        except Exception as e:
            logger.error(f"Error preparando datos: {e}")
            raise
    
    def train_model(
        self,
        sensor_type: str,
        metric: str,
        model_type: str = 'auto',
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        days_back: int = 90,
        limit: int = 5000,
        test_size: float = 0.3,  # 70/30 split (70% training, 30% test)
        random_state: int = 42
    ) -> Dict:
        """
        Entrena un modelo de clasificación
        
        Args:
            sensor_type: Tipo de sensor (air, sound, underground)
            metric: Métrica a predecir
            model_type: 'auto', 'random_forest', 'logistic_regression', 'decision_tree'
            date_from: Fecha inicio (YYYY-MM-DD)
            date_to: Fecha fin (YYYY-MM-DD)
            days_back: Días hacia atrás (si no hay fechas)
            limit: Límite de registros
            test_size: Proporción para test (default 0.2 = 80/20)
            random_state: Semilla aleatoria
        """
        try:
            logger.info(f"Iniciando entrenamiento: {sensor_type}/{metric} con modelo {model_type}")
            
            # Cargar y preparar datos
            X, y = self._load_and_prepare_data(
                sensor_type, metric, date_from, date_to, days_back, limit
            )
            
            # Codificar variable objetivo
            y_encoded = self.label_encoder.fit_transform(y)
            class_names = self.label_encoder.classes_.tolist()
            
            # Validar que hay al menos 2 clases
            unique_classes = np.unique(y_encoded)
            if len(unique_classes) < 2:
                # Si solo hay una clase, ajustar umbrales automáticamente usando percentiles
                logger.warning(f"Solo se encontró una clase ({class_names[0]}). Ajustando umbrales automáticamente usando percentiles...")
                
                # Obtener valores de la métrica desde X (ya está en el DataFrame de features)
                if metric in X.columns:
                    metric_values = X[metric].dropna()
                else:
                    # Si la métrica no está en X, necesitamos obtenerla de los datos originales
                    # Esto puede pasar si la métrica se usó para crear features pero no se incluyó
                    raise ValueError(f"Métrica {metric} no encontrada en las características. No se puede ajustar umbrales.")
                
                if len(metric_values) < 3:
                    raise ValueError(
                        f"No hay suficientes datos para crear múltiples clases. "
                        f"Solo se encontraron {len(metric_values)} valores válidos. "
                        f"Se necesitan al menos 3 valores para crear clases usando percentiles."
                    )
                
                # Usar percentiles para crear 3 clases
                q33 = metric_values.quantile(0.33)
                q66 = metric_values.quantile(0.66)
                
                logger.info(f"Umbrales ajustados automáticamente - Q33: {q33:.2f}, Q66: {q66:.2f}")
                
                # Recrear variable objetivo con umbrales ajustados basados en percentiles
                y_new = self._create_target_variable_with_thresholds(X, metric, q33, q66)
                
                # Codificar nuevamente
                y_encoded = self.label_encoder.fit_transform(y_new)
                class_names = self.label_encoder.classes_.tolist()
                
                logger.info(f"Umbrales ajustados - Distribución de clases: {pd.Series(y_new).value_counts().to_dict()}")
                
                # Validar nuevamente
                unique_classes = np.unique(y_encoded)
                if len(unique_classes) < 2:
                    raise ValueError(
                        f"No se pueden crear múltiples clases con los datos disponibles. "
                        f"Todos los valores están en el mismo rango. "
                        f"Intenta con un rango de fechas diferente o más datos."
                    )
                
                # Actualizar y para usar la nueva clasificación
                y = y_new
            
            logger.info(f"Clases encontradas: {class_names} (distribución: {pd.Series(y_encoded).value_counts().to_dict()})")
            
            # División train/test (80/20) - solo usar stratify si hay suficientes muestras por clase
            min_samples_per_class = min(pd.Series(y_encoded).value_counts())
            use_stratify = min_samples_per_class >= 2 and len(unique_classes) >= 2
            
            if use_stratify:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y_encoded, test_size=test_size, random_state=random_state, stratify=y_encoded
                )
            else:
                logger.warning("No se puede usar stratify (muestras insuficientes por clase). Usando división aleatoria.")
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y_encoded, test_size=test_size, random_state=random_state
                )
            
            logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
            
            # Normalización
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Entrenar modelos y seleccionar el mejor
            models_to_test = {}
            
            if model_type == 'auto' or model_type == 'random_forest':
                models_to_test['random_forest'] = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    min_samples_split=5,
                    random_state=random_state,
                    n_jobs=-1
                )
            
            if model_type == 'auto' or model_type == 'logistic_regression':
                models_to_test['logistic_regression'] = LogisticRegression(
                    max_iter=1000,
                    random_state=random_state,
                    multi_class='ovr'
                )
            
            if model_type == 'auto' or model_type == 'decision_tree':
                models_to_test['decision_tree'] = DecisionTreeClassifier(
                    max_depth=10,
                    min_samples_split=5,
                    random_state=random_state
                )
            
            best_model = None
            best_f1 = -1
            best_model_name = None
            all_metrics = {}
            
            # Entrenar y evaluar cada modelo
            for name, model in models_to_test.items():
                logger.info(f"Entrenando {name}...")
                model.fit(X_train_scaled, y_train)
                
                # Predicciones
                y_pred = model.predict(X_test_scaled)
                
                # Métricas
                accuracy = accuracy_score(y_test, y_pred)
                precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                
                metrics = {
                    'accuracy': float(accuracy),
                    'precision': float(precision),
                    'recall': float(recall),
                    'f1_score': float(f1),
                    'model_name': name
                }
                
                all_metrics[name] = metrics
                
                logger.info(f"{name} - F1: {f1:.4f}, Accuracy: {accuracy:.4f}")
                
                # Seleccionar mejor modelo por F1-score
                if f1 > best_f1:
                    best_f1 = f1
                    best_model = model
                    best_model_name = name
            
            if best_model is None:
                raise ValueError("No se pudo entrenar ningún modelo")
            
            # Guardar modelo
            model_key = f"{sensor_type}_{metric}_{best_model_name}"
            model_path = MODELS_DIR / f"{model_key}.pkl"
            
            model_data = {
                'model': best_model,
                'scaler': self.scaler,
                'label_encoder': self.label_encoder,
                'feature_names': X.columns.tolist(),
                'class_names': class_names,
                'sensor_type': sensor_type,
                'metric': metric,
                'model_type': best_model_name,
                'training_date': datetime.now().isoformat()
            }
            
            with open(model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            logger.info(f"Modelo guardado en {model_path}")
            
            # Calcular métricas finales con el mejor modelo
            y_pred_final = best_model.predict(X_test_scaled)
            cm = confusion_matrix(y_test, y_pred_final)
            
            final_metrics = all_metrics[best_model_name].copy()
            final_metrics['confusion_matrix'] = cm.tolist()
            final_metrics['confusion_matrix_labels'] = class_names
            final_metrics['model_path'] = str(model_path)
            final_metrics['training_samples'] = len(X_train)
            final_metrics['test_samples'] = len(X_test)
            
            # Guardar métricas
            self.model_metrics[model_key] = final_metrics
            metrics_path = MODELS_DIR / f"{model_key}_metrics.json"
            with open(metrics_path, 'w') as f:
                json.dump(final_metrics, f, indent=2)
            
            # Exportar matriz de confusión como imagen PNG
            try:
                confusion_matrix_path = MODELS_DIR / f"{model_key}_confusion_matrix.png"
                plt.figure(figsize=(10, 8))
                sns.heatmap(
                    cm, 
                    annot=True, 
                    fmt='d', 
                    cmap='Blues',
                    xticklabels=class_names,
                    yticklabels=class_names,
                    cbar_kws={'label': 'Cantidad de Predicciones'}
                )
                plt.title(f'Matriz de Confusión - {model_key.replace("_", " ").title()}', 
                         fontsize=16, fontweight='bold', pad=20)
                plt.ylabel('Clase Real', fontsize=12, fontweight='bold')
                plt.xlabel('Clase Predicha', fontsize=12, fontweight='bold')
                plt.tight_layout()
                plt.savefig(confusion_matrix_path, dpi=300, bbox_inches='tight')
                plt.close()
                logger.info(f"Matriz de confusión exportada: {confusion_matrix_path}")
                final_metrics['confusion_matrix_image'] = str(confusion_matrix_path)
            except Exception as e:
                logger.warning(f"No se pudo exportar matriz de confusión como imagen: {e}")
            
            return {
                'success': True,
                'model_key': model_key,
                'model_type': best_model_name,
                'metrics': final_metrics,
                'all_models_metrics': all_metrics,
                'model_path': str(model_path)
            }
            
        except Exception as e:
            logger.error(f"Error entrenando modelo: {e}", exc_info=True)
            raise
    
    def load_model(self, model_key: str) -> Optional[Dict]:
        """Carga un modelo entrenado"""
        try:
            model_path = MODELS_DIR / f"{model_key}.pkl"
            if not model_path.exists():
                return None
            
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            return model_data
        except Exception as e:
            logger.error(f"Error cargando modelo {model_key}: {e}")
            return None
    
    def predict(
        self,
        sensor_type: str,
        metric: str,
        prediction_date: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        model_key: Optional[str] = None
    ) -> Dict:
        """
        Realiza predicciones
        
        Args:
            sensor_type: Tipo de sensor
            metric: Métrica a predecir
            prediction_date: Fecha específica (YYYY-MM-DD) para predicción única
            date_from: Fecha inicio para predicción por periodo
            date_to: Fecha fin para predicción por periodo
            model_key: Clave del modelo (si None, busca automáticamente)
        """
        try:
            # Buscar o cargar modelo
            if model_key is None:
                model_key = f"{sensor_type}_{metric}_random_forest"
            
            model_data = self.load_model(model_key)
            if model_data is None:
                raise ValueError(f"Modelo {model_key} no encontrado. Debe entrenar primero.")
            
            model = model_data['model']
            scaler = model_data['scaler']
            label_encoder = model_data['label_encoder']
            feature_names = model_data['feature_names']
            class_names = model_data['class_names']
            
            # Cargar datos para predicción - usar TODOS los datos disponibles para contexto
            # Las predicciones se basan en el modelo entrenado, pero usan todos los datos para features
            if prediction_date:
                # Predicción por fecha específica - usar todos los datos disponibles para contexto
                # El modelo puede predecir para cualquier fecha (pasado o futuro)
                date_obj = pd.to_datetime(prediction_date)
                # Cargar todos los datos disponibles para crear features contextuales
                date_from = None  # No limitar - usar todos los datos disponibles
                date_to = None
                limit = 10000  # Límite alto para obtener más contexto histórico
                logger.info(f"Predicción para fecha específica: {prediction_date}. Usando todos los datos disponibles para contexto.")
            elif date_from and date_to:
                # Predicción por periodo - usar el rango especificado o todos los datos si es muy amplio
                limit = 10000  # Límite alto para usar todos los datos disponibles
                logger.info(f"Predicción para periodo: {date_from} a {date_to}")
            else:
                raise ValueError("Debe proporcionar prediction_date o date_from/date_to")
            
            # Preparar datos usando TODOS los datos disponibles para tener mejor contexto
            # El modelo usa estos datos para crear features (medias móviles, tendencias, etc.)
            # pero las predicciones se hacen basándose en el modelo entrenado
            X, _ = self._load_and_prepare_data(
                sensor_type, metric, date_from, date_to, days_back=365, limit=limit
            )
            
            if X.empty:
                raise ValueError(f"No se encontraron datos para crear predicciones. Verifica que haya datos disponibles.")
            
            # Seleccionar solo las características del modelo
            X_features = X[feature_names]
            X_scaled = scaler.transform(X_features)
            
            # Predicciones
            predictions = model.predict(X_scaled)
            probabilities = model.predict_proba(X_scaled)
            
            # Decodificar clases
            predicted_classes = label_encoder.inverse_transform(predictions)
            
            # Formatear resultados con información de timestamps
            results = []
            for idx, (pred_class, prob) in enumerate(zip(predicted_classes, probabilities)):
                result = {
                    'index': int(idx),
                    'predicted_class': str(pred_class),
                    'probabilities': {
                        class_name: float(prob[i])
                        for i, class_name in enumerate(class_names)
                    },
                    'confidence': float(max(prob))
                }
                
                # Agregar timestamp si está disponible
                if 'time' in X.columns and idx < len(X):
                    time_val = X.iloc[idx]['time']
                    if pd.notna(time_val):
                        if hasattr(time_val, 'isoformat'):
                            result['timestamp'] = time_val.isoformat()
                        else:
                            result['timestamp'] = str(time_val)
                
                # Si es predicción por fecha específica, agregar la fecha objetivo
                if prediction_date:
                    result['prediction_date'] = prediction_date
                
                results.append(result)
            
            return {
                'success': True,
                'model_key': model_key,
                'predictions': results,
                'total_predictions': len(results),
                'class_distribution': pd.Series(predicted_classes).value_counts().to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error en predicción: {e}", exc_info=True)
            raise
    
    def predict_regression(
        self,
        sensor_type: str,
        metric: str,
        prediction_date: Optional[str] = None,
        prediction_month: Optional[str] = None,  # Format: YYYY-MM
        model_key: Optional[str] = None
    ) -> Dict:
        """
        Realiza predicciones de regresión (valores numéricos) usando modelos de clasificación ML
        Convierte las clases predichas a valores numéricos basándose en los datos históricos
        
        Args:
            sensor_type: Tipo de sensor
            metric: Métrica a predecir
            prediction_date: Fecha específica (YYYY-MM-DD) para predicción única
            prediction_month: Mes específico (YYYY-MM) para predicción del mes completo
            model_key: Clave del modelo (si None, busca automáticamente)
        """
        try:
            # Validar que se proporcione fecha o mes
            if not prediction_date and not prediction_month:
                raise ValueError("Debe proporcionar prediction_date o prediction_month")
            
            # Convertir mes a rango de fechas si es necesario
            if prediction_month:
                from datetime import datetime as dt
                import calendar
                
                year, month = map(int, prediction_month.split('-'))
                date_from = f"{year}-{month:02d}-01"
                # Último día del mes
                last_day = calendar.monthrange(year, month)[1]
                date_to = f"{year}-{month:02d}-{last_day:02d}"
                
                # Generar predicciones para TODOS los días del mes
                # Cargar modelo
                if model_key is None:
                    model_key = f"{sensor_type}_{metric}_random_forest"
                
                model_data = self.load_model(model_key)
                if model_data is None:
                    raise ValueError(f"Modelo {model_key} no encontrado. Debe entrenar primero.")
                
                model = model_data['model']
                scaler = model_data['scaler']
                label_encoder = model_data['label_encoder']
                feature_names = model_data['feature_names']
                class_names = model_data['class_names']
                
                # Cargar datos históricos usando la misma lógica que el entrenamiento
                # Usar _load_and_prepare_data para obtener datos con features ya preparadas
                try:
                    # Intentar cargar datos históricos con la misma estrategia que el entrenamiento
                    # Esto asegura que usamos los mismos datos que se usaron para entrenar
                    X_historical, _ = self._load_and_prepare_data(
                        sensor_type=sensor_type,
                        metric=metric,
                        date_from=None,  # Sin filtro de fecha para obtener todos los datos disponibles
                        date_to=None,
                        days_back=365,   # Intentar con 365 días
                        limit=10000
                    )
                    
                    # X_historical ya tiene todas las features preparadas
                    df_historical = X_historical.copy()
                    
                    # Asegurar que tiene la columna 'time'
                    if 'time' not in df_historical.columns:
                        # Si no tiene time, intentar agregarlo desde los índices o crear uno
                        logger.warning("No se encontró columna 'time' en datos históricos. Intentando recuperarla...")
                        # Los datos ya deberían tener time, pero por si acaso
                        df_historical['time'] = pd.Timestamp.now()
                    
                    logger.info(f"Datos históricos cargados: {len(df_historical)} registros con {len(df_historical.columns)} features para crear predicciones")
                    
                except Exception as e:
                    logger.error(f"Error cargando datos históricos con _load_and_prepare_data: {e}")
                    # Si falla, intentar cargar datos directamente sin preparación
                    try:
                        data = []
                        # Intentar con diferentes estrategias
                        for days in [365, 180, 90, 30]:
                            try:
                                data = self.mongodb_service.load_sensor_data(sensor_type, days_back=days, limit=10000)
                                if data:
                                    break
                            except:
                                continue
                        
                        # Si aún no hay datos, intentar sin filtro
                        if not data:
                            collection_name = self.mongodb_service._get_collection_name(sensor_type)
                            collection = self.mongodb_service.get_collection(collection_name)
                            all_docs = list(collection.find({}).limit(10000))
                            if all_docs:
                                data = self.mongodb_service._format_data_wide(all_docs, sensor_type)
                        
                        if not data:
                            raise ValueError(
                                f"No se encontraron datos históricos para el sensor '{sensor_type}' y métrica '{metric}'. "
                                f"Necesitas cargar datos en la base de datos antes de hacer predicciones. "
                                f"Los datos deben estar en la colección correspondiente y contener la métrica '{metric}'."
                            )
                        
                        df_historical = pd.DataFrame(data)
                        if 'time' not in df_historical.columns and 'timestamp' in df_historical.columns:
                            df_historical['time'] = df_historical['timestamp']
                        df_historical['time'] = pd.to_datetime(df_historical['time'], errors='coerce')
                        df_historical = df_historical.dropna(subset=['time']).sort_values('time')
                        
                        if df_historical.empty:
                            raise ValueError(
                                f"No se encontraron registros válidos con timestamps para el sensor '{sensor_type}'. "
                                f"Verifica que los datos tengan campos 'time' o 'timestamp' válidos."
                            )
                        
                        # Verificar que la métrica existe
                        if metric not in df_historical.columns:
                            raise ValueError(
                                f"La métrica '{metric}' no se encuentra en los datos históricos. "
                                f"Columnas disponibles: {', '.join(df_historical.columns[:10])}..."
                            )
                        
                        logger.info(f"Datos históricos cargados directamente: {len(df_historical)} registros")
                        
                    except Exception as e2:
                        logger.error(f"Error en fallback de carga de datos: {e2}")
                        raise ValueError(
                            f"No se pudieron cargar datos históricos para crear predicciones. "
                            f"Error: {str(e2)}. "
                            f"Verifica que haya datos disponibles para el sensor '{sensor_type}' y la métrica '{metric}'."
                        )
                
                # Crear DataFrame con todos los días del mes
                start_date = pd.Timestamp(f"{year}-{month:02d}-01")
                end_date = pd.Timestamp(f"{year}-{month:02d}-{last_day:02d}")
                all_days = pd.date_range(start=start_date, end=end_date, freq='D')
                
                # Para predicciones por mes: solo 1 predicción por día (mediodía como referencia)
                # Esto reduce la cantidad de datos y el uso de memoria
                predictions_list = []
                for day in all_days:
                    # Solo una predicción por día (mediodía 12:00)
                    hour = 12
                    
                    # Crear features para este día usando datos históricos
                    # Usar los datos históricos reales de la base de datos (los mismos que se usaron para entrenar)
                    if len(df_historical) == 0:
                        raise ValueError(
                            f"No hay datos históricos disponibles para crear features. "
                            f"Necesitas datos en la base de datos para hacer predicciones."
                        )
                    
                    # Tomar el último registro histórico como base (representa el estado más reciente)
                    base_row = df_historical.iloc[-1].copy()
                    # Crear timestamp con la hora del mediodía
                    day_with_hour = day.replace(hour=hour, minute=0, second=0)
                    base_row['time'] = day_with_hour
                    
                    # Crear features temporales con la hora del mediodía
                    base_row['hour'] = hour  # Hora del mediodía (12:00)
                    base_row['day_of_week'] = day.dayofweek
                    base_row['day_of_month'] = day.day
                    base_row['month'] = day.month
                    
                    # Crear DataFrame con este día
                    day_df = pd.DataFrame([base_row])
                    
                    # Agregar características estadísticas móviles si es posible
                    if metric in df_historical.columns:
                        window = min(24, len(df_historical) // 10)
                        if window > 1:
                            metric_values = df_historical[metric].dropna()
                            if len(metric_values) > 0:
                                day_df[f'{metric}_mean_24h'] = metric_values.tail(window).mean()
                                day_df[f'{metric}_std_24h'] = metric_values.tail(window).std() if len(metric_values) > 1 else 0
                                day_df[f'{metric}_diff'] = metric_values.iloc[-1] - metric_values.iloc[-2] if len(metric_values) > 1 else 0
                            else:
                                day_df[f'{metric}_mean_24h'] = 0
                                day_df[f'{metric}_std_24h'] = 0
                                day_df[f'{metric}_diff'] = 0
                        else:
                            # Si no hay suficientes datos para ventana, usar valores por defecto
                            if metric in df_historical.columns:
                                metric_values = df_historical[metric].dropna()
                                if len(metric_values) > 0:
                                    day_df[f'{metric}_mean_24h'] = metric_values.mean()
                                    day_df[f'{metric}_std_24h'] = metric_values.std() if len(metric_values) > 1 else 0
                                    day_df[f'{metric}_diff'] = 0
                                else:
                                    day_df[f'{metric}_mean_24h'] = 0
                                    day_df[f'{metric}_std_24h'] = 0
                                    day_df[f'{metric}_diff'] = 0
                    
                    # Asegurar que todas las features estén presentes
                    for feat in feature_names:
                        if feat not in day_df.columns:
                            if feat in df_historical.columns:
                                # Usar el último valor disponible
                                last_val = df_historical[feat].dropna()
                                day_df[feat] = last_val.iloc[-1] if len(last_val) > 0 else 0
                            else:
                                day_df[feat] = 0
                    
                    # Asegurar que la métrica principal esté presente
                    if metric not in day_df.columns and metric in df_historical.columns:
                        metric_values = df_historical[metric].dropna()
                        day_df[metric] = metric_values.iloc[-1] if len(metric_values) > 0 else 0
                    
                    # Seleccionar solo las características del modelo
                    X_day = day_df[feature_names].fillna(0)
                    X_scaled = scaler.transform(X_day)
                    
                    # Predicción
                    pred_class_encoded = model.predict(X_scaled)[0]
                    probabilities = model.predict_proba(X_scaled)[0]
                    predicted_class = label_encoder.inverse_transform([pred_class_encoded])[0]
                    
                    predictions_list.append({
                        'index': len(predictions_list),
                        'predicted_class': str(predicted_class),
                        'probabilities': {
                            class_name: float(probabilities[i])
                            for i, class_name in enumerate(class_names)
                        },
                        'confidence': float(max(probabilities)),
                        'timestamp': day_with_hour.isoformat(),
                        'prediction_month': prediction_month
                    })
                
                # Crear resultado similar al de predict()
                prediction_result = {
                    'success': True,
                    'model_key': model_key,
                    'predictions': predictions_list,
                    'total_predictions': len(predictions_list),
                    'class_distribution': pd.Series([p['predicted_class'] for p in predictions_list]).value_counts().to_dict()
                }
            else:
                # Predicción por fecha específica - generar 3 predicciones (mañana, tarde, noche)
                if model_key is None:
                    model_key = f"{sensor_type}_{metric}_random_forest"
                
                model_data = self.load_model(model_key)
                if model_data is None:
                    raise ValueError(f"Modelo {model_key} no encontrado. Debe entrenar primero.")
                
                model = model_data['model']
                scaler = model_data['scaler']
                label_encoder = model_data['label_encoder']
                feature_names = model_data['feature_names']
                class_names = model_data['class_names']
                
                # Cargar datos históricos para contexto
                try:
                    X_historical, _ = self._load_and_prepare_data(
                        sensor_type=sensor_type,
                        metric=metric,
                        date_from=None,
                        date_to=None,
                        days_back=365,
                        limit=10000
                    )
                    df_historical = X_historical.copy()
                except Exception as e:
                    logger.error(f"Error cargando datos históricos: {e}")
                    # Fallback: cargar datos directamente
                    data = self.mongodb_service.load_sensor_data(sensor_type, days_back=365, limit=10000)
                    if not data:
                        raise ValueError(f"No se encontraron datos históricos para crear predicciones. Verifica que haya datos disponibles.")
                    df_historical = pd.DataFrame(data)
                    if 'time' not in df_historical.columns and 'timestamp' in df_historical.columns:
                        df_historical['time'] = df_historical['timestamp']
                    df_historical['time'] = pd.to_datetime(df_historical['time'], errors='coerce')
                    df_historical = df_historical.dropna(subset=['time']).sort_values('time')
                
                if len(df_historical) == 0:
                    raise ValueError(f"No hay datos históricos disponibles para crear features.")
                
                # Parsear fecha objetivo
                target_date = pd.to_datetime(prediction_date)
                
                # Horas del día: mañana (8:00), tarde (14:00), noche (20:00)
                prediction_hours = [8, 14, 20]
                
                predictions_list = []
                for hour in prediction_hours:
                    # Crear timestamp con la hora específica
                    day_with_hour = target_date.replace(hour=hour, minute=0, second=0)
                    
                    # Tomar el último registro histórico como base
                    base_row = df_historical.iloc[-1].copy()
                    base_row['time'] = day_with_hour
                    
                    # Crear features temporales
                    base_row['hour'] = hour
                    base_row['day_of_week'] = target_date.dayofweek
                    base_row['day_of_month'] = target_date.day
                    base_row['month'] = target_date.month
                    
                    # Crear DataFrame
                    day_df = pd.DataFrame([base_row])
                    
                    # Agregar características estadísticas móviles
                    if metric in df_historical.columns:
                        window = min(24, len(df_historical) // 10)
                        if window > 1:
                            metric_values = df_historical[metric].dropna()
                            if len(metric_values) > 0:
                                day_df[f'{metric}_mean_24h'] = metric_values.tail(window).mean()
                                day_df[f'{metric}_std_24h'] = metric_values.tail(window).std() if len(metric_values) > 1 else 0
                                day_df[f'{metric}_diff'] = metric_values.iloc[-1] - metric_values.iloc[-2] if len(metric_values) > 1 else 0
                            else:
                                day_df[f'{metric}_mean_24h'] = 0
                                day_df[f'{metric}_std_24h'] = 0
                                day_df[f'{metric}_diff'] = 0
                    
                    # Asegurar que todas las features estén presentes
                    for feat in feature_names:
                        if feat not in day_df.columns:
                            if feat in df_historical.columns:
                                last_val = df_historical[feat].dropna()
                                day_df[feat] = last_val.iloc[-1] if len(last_val) > 0 else 0
                            else:
                                day_df[feat] = 0
                    
                    # Asegurar que la métrica principal esté presente
                    if metric not in day_df.columns and metric in df_historical.columns:
                        metric_values = df_historical[metric].dropna()
                        day_df[metric] = metric_values.iloc[-1] if len(metric_values) > 0 else 0
                    
                    # Seleccionar solo las características del modelo
                    X_day = day_df[feature_names].fillna(0)
                    X_scaled = scaler.transform(X_day)
                    
                    # Predicción
                    pred_class_encoded = model.predict(X_scaled)[0]
                    probabilities = model.predict_proba(X_scaled)[0]
                    predicted_class = label_encoder.inverse_transform([pred_class_encoded])[0]
                    
                    predictions_list.append({
                        'index': len(predictions_list),
                        'predicted_class': str(predicted_class),
                        'probabilities': {
                            class_name: float(probabilities[i])
                            for i, class_name in enumerate(class_names)
                        },
                        'confidence': float(max(probabilities)),
                        'timestamp': day_with_hour.isoformat(),
                        'prediction_date': prediction_date
                    })
                
                # Crear resultado similar al de predict()
                prediction_result = {
                    'success': True,
                    'model_key': model_key,
                    'predictions': predictions_list,
                    'total_predictions': len(predictions_list),
                    'class_distribution': pd.Series([p['predicted_class'] for p in predictions_list]).value_counts().to_dict()
                }
            
            # Cargar datos históricos para calcular valores numéricos promedio por clase
            # Usar todos los datos disponibles para tener mejor contexto
            date_from = None
            date_to = None
            
            # Cargar datos históricos para obtener valores promedio por clase
            # Usar todos los datos disponibles (hasta 365 días atrás)
            historical_data = self.mongodb_service.load_sensor_data(
                sensor_type, days_back=365, limit=10000
            )
            
            if not historical_data:
                # Si no hay datos históricos, usar umbrales por defecto
                historical_data = []
            
            df_historical = pd.DataFrame(historical_data)
            
            # Calcular valores promedio por clase basándose en datos históricos
            class_value_map = {}
            if not df_historical.empty and metric in df_historical.columns:
                # Crear clases para datos históricos usando los mismos umbrales
                y_historical = self._create_target_variable(df_historical, metric)
                df_historical['class'] = y_historical
                
                # Calcular promedio por clase
                for class_name in ['normal', 'warning', 'critical']:
                    class_data = df_historical[df_historical['class'] == class_name][metric]
                    if len(class_data) > 0:
                        class_value_map[class_name] = float(class_data.mean())
                    else:
                        # Si no hay datos para esta clase, usar umbrales por defecto
                        if metric == 'co2_ppm':
                            class_value_map[class_name] = {'normal': 400, 'warning': 900, 'critical': 1100}.get(class_name, 500)
                        elif metric == 'temperatura_c':
                            class_value_map[class_name] = {'normal': 20, 'warning': 38, 'critical': 45}.get(class_name, 25)
                        elif metric == 'humedad_percent':
                            class_value_map[class_name] = {'normal': 50, 'warning': 75, 'critical': 85}.get(class_name, 50)
                        else:
                            # Usar percentiles de los datos disponibles
                            q33 = df_historical[metric].quantile(0.33)
                            q66 = df_historical[metric].quantile(0.66)
                            if class_name == 'normal':
                                class_value_map[class_name] = float(q33)
                            elif class_name == 'warning':
                                class_value_map[class_name] = float((q33 + q66) / 2)
                            else:
                                class_value_map[class_name] = float(q66)
            else:
                # Valores por defecto si no hay datos históricos
                defaults = {
                    'co2_ppm': {'normal': 400, 'warning': 900, 'critical': 1100},
                    'temperatura_c': {'normal': 20, 'warning': 38, 'critical': 45},
                    'humedad_percent': {'normal': 50, 'warning': 75, 'critical': 85},
                    'laeq_db': {'normal': 55, 'warning': 70, 'critical': 80},
                    'distancia_mm': {'normal': 250, 'warning': 750, 'critical': 1100}
                }
                class_value_map = defaults.get(metric, {'normal': 0, 'warning': 0, 'critical': 0})
            
            # Convertir predicciones de clases a valores numéricos
            regression_predictions = []
            for pred in prediction_result['predictions']:
                predicted_class = pred['predicted_class']
                predicted_value = class_value_map.get(predicted_class, 0)
                
                # Calcular valor esperado usando probabilidades (promedio ponderado)
                expected_value = 0
                total_prob = 0
                for class_name, prob in pred['probabilities'].items():
                    if class_name in class_value_map:
                        expected_value += class_value_map[class_name] * prob
                        total_prob += prob
                
                if total_prob > 0:
                    predicted_value = expected_value / total_prob
                
                regression_pred = {
                    'timestamp': pred.get('timestamp'),
                    'predicted_class': predicted_class,
                    'predicted_value': round(predicted_value, 2),
                    'confidence': pred.get('confidence', 0),
                    'probabilities': pred.get('probabilities', {})
                }
                
                if prediction_date:
                    regression_pred['prediction_date'] = prediction_date
                elif prediction_month:
                    regression_pred['prediction_month'] = prediction_month
                
                regression_predictions.append(regression_pred)
            
            return {
                'success': True,
                'model_key': prediction_result['model_key'],
                'metric': metric,
                'sensor_type': sensor_type,
                'predictions': regression_predictions,
                'total_predictions': len(regression_predictions),
                'prediction_date': prediction_date,
                'prediction_month': prediction_month,
                'class_value_mapping': class_value_map
            }
            
        except Exception as e:
            logger.error(f"Error en predicción de regresión: {e}", exc_info=True)
            raise
    
    def get_metrics(self, model_key: str) -> Optional[Dict]:
        """Obtiene métricas de un modelo"""
        try:
            # Intentar cargar desde archivo
            metrics_path = MODELS_DIR / f"{model_key}_metrics.json"
            if metrics_path.exists():
                with open(metrics_path, 'r') as f:
                    return json.load(f)
            
            # Si no existe, retornar desde memoria
            return self.model_metrics.get(model_key)
        except Exception as e:
            logger.error(f"Error obteniendo métricas: {e}")
            return None
    
    def generate_visualizations(self, model_key: str) -> Dict[str, str]:
        """
        Genera visualizaciones en base64
        
        Returns:
            Dict con 'confusion_matrix', 'class_distribution', 'roc_curve' (si aplica)
        """
        try:
            metrics = self.get_metrics(model_key)
            if not metrics:
                raise ValueError(f"Métricas no encontradas para {model_key}")
            
            visualizations = {}
            
            # 1. Matriz de confusión
            cm = np.array(metrics['confusion_matrix'])
            labels = metrics.get('confusion_matrix_labels', ['normal', 'warning', 'critical'])
            
            plt.figure(figsize=(8, 6))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
            plt.title('Matriz de Confusión')
            plt.ylabel('Verdadero')
            plt.xlabel('Predicho')
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
            buf.seek(0)
            visualizations['confusion_matrix'] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close()
            
            # 2. Distribución de clases
            if 'class_distribution' in metrics:
                dist = metrics['class_distribution']
            else:
                # Calcular desde matriz de confusión
                dist = {label: int(cm[i].sum()) for i, label in enumerate(labels)}
            
            plt.figure(figsize=(8, 6))
            plt.bar(dist.keys(), dist.values(), color=['green', 'orange', 'red'][:len(dist)])
            plt.title('Distribución de Clases')
            plt.xlabel('Clase')
            plt.ylabel('Frecuencia')
            plt.xticks(rotation=45)
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
            buf.seek(0)
            visualizations['class_distribution'] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close()
            
            # 3. Curva ROC (solo para modelos binarios o multi-clase)
            # Nota: Para multi-clase, se genera una curva por clase
            visualizations['roc_curve'] = None  # Se puede implementar si es necesario
            
            return visualizations
            
        except Exception as e:
            logger.error(f"Error generando visualizaciones: {e}", exc_info=True)
            return {}


# Singleton
_ml_service = None

def get_ml_classification_service() -> MLClassificationService:
    """Obtiene instancia singleton del servicio ML"""
    global _ml_service
    if _ml_service is None:
        _ml_service = MLClassificationService()
    return _ml_service

