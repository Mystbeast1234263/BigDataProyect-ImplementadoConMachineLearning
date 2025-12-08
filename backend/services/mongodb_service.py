from pymongo import MongoClient
from pymongo.errors import PyMongoError, DuplicateKeyError
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import random
import os
from dotenv import load_dotenv
import logging
import statistics
import pandas as pd
import pytz

# Cargar .env desde la raíz del proyecto
dotenv_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(dotenv_path)

logger = logging.getLogger(__name__)

# ============================================================================
# MONGODB SERVICE
# ============================================================================

class MongoDBService:
    """Service for MongoDB operations"""

    def __init__(self, connect_immediately=True):
        """Initialize MongoDB connection"""
        self.mongo_uri = os.getenv(
            "MONGO_URI",
            "mongodb+srv://gamc_user:womita14@bigdataproyect.nfdzitt.mongodb.net/GAMC_data?retryWrites=true&w=majority"
        )
        self.db_name = "GAMC_data"
        self.client = None
        self.db = None
        self._connection_retries = 0
        self._max_retries = 3
        if connect_immediately:
            try:
                self.connect()
            except Exception as e:
                logger.warning(f"MongoDB connection deferred: {e}")
                # Don't raise - allow service to be created without connection

    def connect(self):
        """Establish MongoDB connection with retry logic"""
        for attempt in range(self._max_retries):
            try:
                logger.info(f"Attempting to connect to MongoDB (attempt {attempt + 1}/{self._max_retries})...")
                logger.info(f"MongoDB URI: {self.mongo_uri.split('@')[1] if '@' in self.mongo_uri else 'hidden'}")
                
                # Create client with connection timeout
                self.client = MongoClient(
                    self.mongo_uri,
                    serverSelectionTimeoutMS=10000,  # 10 seconds timeout
                    connectTimeoutMS=10000,
                    socketTimeoutMS=10000,
                    retryWrites=True
                )
                
                # Test connection
                self.client.admin.command('ping')
                self.db = self.client[self.db_name]
                
                # Verify database access
                collections = self.db.list_collection_names()
                logger.info(f"✅ Connected to MongoDB successfully!")
                logger.info(f"Database: {self.db_name}")
                logger.info(f"Available collections: {collections}")
                self._connection_retries = 0
                return
                
            except PyMongoError as e:
                self._connection_retries += 1
                error_msg = str(e)
                logger.error(f"❌ MongoDB connection error (attempt {attempt + 1}/{self._max_retries}): {error_msg}")
                
                if attempt < self._max_retries - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                    logger.info(f"Retrying in {wait_time} seconds...")
                    import time
                    time.sleep(wait_time)
                else:
                    logger.error(f"❌ Failed to connect to MongoDB after {self._max_retries} attempts")
                    logger.error(f"Please check:")
                    logger.error(f"  1. MongoDB URI is correct: {self.mongo_uri.split('@')[1] if '@' in self.mongo_uri else 'check .env'}")
                    logger.error(f"  2. Internet connection is active")
                    logger.error(f"  3. MongoDB Atlas allows connections from your IP")
                    logger.error(f"  4. Credentials are correct")
                    # Don't raise - allow service to continue but mark as disconnected
                    self.client = None
                    self.db = None
                    raise ConnectionError(f"Unable to connect to MongoDB: {error_msg}")
            
            except Exception as e:
                logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
                self.client = None
                self.db = None
                raise

    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    def get_collection(self, collection_name: str):
        """Get a collection reference"""
        return self.db[collection_name]

    # ========================================================================
    # SENSOR DATA OPERATIONS
    # ========================================================================

    def _ensure_connection(self):
        """Ensure MongoDB connection is active, reconnect if needed"""
        if self.client is None or self.db is None:
            logger.warning("MongoDB connection lost, attempting to reconnect...")
            try:
                self.connect()
            except Exception as e:
                logger.error(f"Failed to reconnect to MongoDB: {e}")
                raise ConnectionError(f"MongoDB is not connected: {e}")
        
        # Test connection
        try:
            self.client.admin.command('ping')
        except Exception as e:
            logger.warning(f"MongoDB ping failed, reconnecting...: {e}")
            self.client = None
            self.db = None
            self.connect()

    def load_sensor_data(
        self,
        sensor_type: str,
        days_back: int = 30,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """Load sensor data from MongoDB - USES REAL DATA"""
        self._ensure_connection()
        try:
            from datetime import datetime as dt, timedelta
            import pytz
            
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            # Calculate date range based on days_back
            TZ_BOLIVIA = pytz.timezone('America/La_Paz')
            now = datetime.now(TZ_BOLIVIA)
            start_date = now - timedelta(days=days_back)
            
            # Ensure start_date is timezone-aware for MongoDB comparison
            if start_date.tzinfo is None:
                start_date = TZ_BOLIVIA.localize(start_date)
            
            # Query to filter by date range (days_back)
            query = {
                "$or": [
                    {
                        "$and": [
                            {"time": {"$exists": True}},
                            {"time": {"$gte": start_date}}
                        ]
                    },
                    {
                        "$and": [
                            {"timestamp": {"$exists": True}},
                            {"timestamp": {"$gte": start_date}}
                        ]
                    }
                ]
            }

            # Get total count
            total_count = collection.count_documents(query)
            logger.info(f"Collection {collection_name} has {total_count} documents from last {days_back} days")

            # Load documents filtered by date
            cursor = collection.find(query)

            # Try to sort by time field if it exists
            try:
                cursor = cursor.sort("time", -1)
            except:
                try:
                    cursor = cursor.sort("timestamp", -1)
                except:
                    # No sorting available
                    pass

            if limit:
                cursor = cursor.limit(limit)

            data = list(cursor)

            # Log information about what we found
            logger.info(f"Loaded {len(data)} documents from {collection_name} (last {days_back} days)")
            if data and len(data) > 0:
                logger.debug(f"First document structure: {list(data[0].keys())}")

            # Return data in wide format (all metrics in one record)
            return self._format_data_wide(data, sensor_type)

        except PyMongoError as e:
            logger.error(f"Error loading sensor data from {collection_name}: {e}")
            raise

    def load_sensor_data_by_date_range(
        self,
        sensor_type: str,
        date_from: str,  # Format: YYYY-MM-DD
        date_to: str,    # Format: YYYY-MM-DD
        limit: int = 400
    ) -> List[Dict]:
        """Load sensor data filtered by date range"""
        self._ensure_connection()
        try:
            from datetime import datetime as dt

            # Parse dates
            start_date = dt.strptime(date_from, "%Y-%m-%d")
            end_date = dt.strptime(date_to, "%Y-%m-%d")
            # Set end_date to end of day
            end_date = end_date.replace(hour=23, minute=59, second=59)

            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            # Query for documents within date range (no date restrictions)
            query = {
                "$or": [
                    {"time": {"$gte": start_date, "$lte": end_date}},
                    {"timestamp": {"$gte": start_date, "$lte": end_date}}
                ]
            }

            # Load data with limit
            data = list(collection.find(query).limit(limit))

            logger.info(
                f"Loaded {len(data)} documents from {collection_name} "
                f"between {date_from} and {date_to}"
            )

            # Return data in wide format (all metrics in one record)
            return self._format_data_wide(data, sensor_type)

        except PyMongoError as e:
            logger.error(f"Error loading sensor data by date range: {e}")
            raise

    def get_collection_schema(self, sensor_type: str) -> Dict:
        """Extract schema info from MongoDB collection"""
        try:
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            # Get first document to understand structure
            first_doc = collection.find_one()
            if not first_doc:
                return {}

            # Extract schema from first document
            schema = {
                "fields": list(first_doc.keys()),
                "sample_document": first_doc
            }

            logger.info(f"Schema for {sensor_type}: {list(first_doc.keys())}")
            return schema

        except PyMongoError as e:
            logger.error(f"Error getting collection schema: {e}")
            return {}

    def insert_sensor_data(self, collection_name: str, data: Dict) -> str:
        """Insert sensor data (upsert to avoid duplicates)"""
        try:
            collection = self.get_collection(collection_name)

            # Use upsert to avoid duplicates based on device_name + timestamp
            result = collection.update_one(
                {
                    "sensor_name": data.get("sensor_name"),
                    "timestamp": data.get("timestamp")
                },
                {"$set": data},
                upsert=True
            )

            if result.upserted_id:
                return str(result.upserted_id)
            return str(result.matched_count)

        except PyMongoError as e:
            logger.error(f"Error inserting sensor data: {e}")
            raise

    def get_sensor_stats(
        self,
        sensor_type: str,
        metric_name: Optional[str] = None,
        days_back: int = 30,
        sensor_name: Optional[str] = None  # Filter by specific sensor name
    ) -> Dict:
        """Get statistics for a sensor type - works with MongoDB flat document structure"""
        self._ensure_connection()
        try:
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            start_date = datetime.utcnow() - timedelta(days=days_back)

            # Build flexible query that handles both 'time' and 'timestamp' fields
            query = {
                "$or": [
                    {"time": {"$gte": start_date}},
                    {"timestamp": {"$gte": start_date}},
                    # Include documents that have the field but might be older
                    {"time": {"$exists": True}},
                    {"timestamp": {"$exists": True}}
                ]
            }
            
            # Add sensor_name filter if provided
            if sensor_name:
                query["$and"] = [
                    {
                        "$or": [
                            {"sensor_nombre": sensor_name},
                            {"sensor_name": sensor_name},
                            {"device_name": sensor_name}
                        ]
                    }
                ]

            # Get all documents matching the date range
            documents = list(collection.find(query))

            if not documents:
                return {}

            # Calculate stats based on sensor type
            stats = {}
            sensor_type_lower = sensor_type.lower()

            if sensor_type_lower in ["air", "air_quality"]:
                metrics = {
                    "co2_ppm": "CO2 (ppm)",
                    "temperatura_c": "Temperature (°C)",
                    "humedad_percent": "Humidity (%)",
                    "presion_hpa": "Pressure (hPa)"
                }
            elif sensor_type_lower in ["sound"]:
                metrics = {
                    "laeq_db": "LAeq (dB)",
                    "lai_db": "LAI (dB)",
                    "laimax_db": "LAImax (dB)",
                    "bateria_percent": "Battery (%)"
                }
            elif sensor_type_lower in ["underground", "underground_water"]:
                metrics = {
                    "distancia_mm": "Distance (mm)",
                    "bateria_percent": "Battery (%)"
                }
            else:
                return {}

            # Calculate statistics for each metric
            total_count = len(documents)  # Total document count
            for metric_field, metric_label in metrics.items():
                values = [float(doc[metric_field]) for doc in documents if metric_field in doc and doc[metric_field] is not None]

                if values:
                    stats[metric_label] = {
                        "count": len(values),
                        "average": sum(values) / len(values),
                        "min_value": min(values),
                        "max_value": max(values),
                        "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
                        "latest_timestamp": None
                    }

            # Add metadata separately (not as metrics)
            # These are metadata fields, not sensor metrics
            metadata = {
                "count": total_count
            }
            if documents:
                timestamps = []
                for doc in documents:
                    ts = doc.get("time") or doc.get("timestamp")
                    if ts:
                        timestamps.append(ts)
                if timestamps:
                    metadata["min_date"] = min(timestamps).isoformat() if hasattr(min(timestamps), 'isoformat') else str(min(timestamps))
                    metadata["max_date"] = max(timestamps).isoformat() if hasattr(max(timestamps), 'isoformat') else str(max(timestamps))
            
            # Return stats with metadata separated but also accessible directly for backward compatibility
            result = {**stats}  # Actual metrics
            result["_metadata"] = metadata  # Metadata in separate key
            # Also add directly for backward compatibility (but these will be filtered in frontend)
            result["count"] = metadata["count"]
            if "min_date" in metadata:
                result["min_date"] = metadata["min_date"]
            if "max_date" in metadata:
                result["max_date"] = metadata["max_date"]
            return result

        except PyMongoError as e:
            logger.error(f"Error getting sensor stats: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calculating stats: {e}")
            raise

    def get_sensor_stats_by_date_range(
        self,
        sensor_type: str,
        date_from: str,  # Format: YYYY-MM-DD
        date_to: str,    # Format: YYYY-MM-DD
        metric_name: Optional[str] = None,
        sensor_name: Optional[str] = None  # Filter by specific sensor name
    ) -> Dict:
        """Get statistics for a sensor type filtered by date range"""
        try:
            from datetime import datetime as dt

            # Parse dates
            start_date = dt.strptime(date_from, "%Y-%m-%d")
            end_date = dt.strptime(date_to, "%Y-%m-%d")
            # Set end_date to end of day
            end_date = end_date.replace(hour=23, minute=59, second=59)

            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            # Build query for date range
            query = {
                "$or": [
                    {"time": {"$gte": start_date, "$lte": end_date}},
                    {"timestamp": {"$gte": start_date, "$lte": end_date}},
                ]
            }
            
            # Add sensor_name filter if provided
            if sensor_name:
                query["$and"] = [
                    {
                        "$or": [
                            {"sensor_nombre": sensor_name},
                            {"sensor_name": sensor_name},
                            {"device_name": sensor_name}
                        ]
                    }
                ]

            # Get all documents matching the date range
            documents = list(collection.find(query))

            if not documents:
                return {}

            # Calculate stats based on sensor type (same logic as get_sensor_stats)
            stats = {}
            sensor_type_lower = sensor_type.lower()

            if sensor_type_lower in ["air", "air_quality"]:
                metrics = {
                    "co2_ppm": "CO2 (ppm)",
                    "temperatura_c": "Temperature (°C)",
                    "humedad_percent": "Humidity (%)"
                }
            elif sensor_type_lower == "sound":
                metrics = {
                    "laeq_db": "LAeq (dB)",
                    "lai_db": "LAI (dB)",
                    "laimax_db": "LAImax (dB)"
                }
            elif sensor_type_lower in ["underground", "soterrado"]:
                metrics = {
                    "distancia_mm": "Distance (mm)"
                }
            else:
                metrics = {}

            # Calculate statistics for each metric
            total_count = len(documents)  # Total document count
            for field_name, display_name in metrics.items():
                values = []
                for doc in documents:
                    try:
                        val = doc.get(field_name)
                        if val is not None and isinstance(val, (int, float)):
                            values.append(val)
                    except (ValueError, TypeError):
                        continue

                if values:
                    stats[display_name] = {
                        "count": len(values),
                        "average": sum(values) / len(values),
                        "min_value": min(values),
                        "max_value": max(values),
                        "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
                        "latest_timestamp": None
                    }

            # Add metadata separately (not as metrics)
            # These are metadata fields, not sensor metrics
            metadata = {
                "count": total_count
            }
            if documents:
                timestamps = []
                for doc in documents:
                    ts = doc.get("time") or doc.get("timestamp")
                    if ts:
                        timestamps.append(ts)
                if timestamps:
                    metadata["min_date"] = min(timestamps).isoformat() if hasattr(min(timestamps), 'isoformat') else str(min(timestamps))
                    metadata["max_date"] = max(timestamps).isoformat() if hasattr(max(timestamps), 'isoformat') else str(max(timestamps))
            
            # Return stats with metadata separated but also accessible directly for backward compatibility
            result = {**stats}  # Actual metrics
            result["_metadata"] = metadata  # Metadata in separate key
            # Also add directly for backward compatibility (but these will be filtered in frontend)
            result["count"] = metadata["count"]
            if "min_date" in metadata:
                result["min_date"] = metadata["min_date"]
            if "max_date" in metadata:
                result["max_date"] = metadata["max_date"]
            return result

        except PyMongoError as e:
            logger.error(f"Error getting sensor stats by date range: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calculating stats by date range: {e}")
            raise

    # ========================================================================
    # DATA GENERATION
    # ========================================================================

    def generate_random_data(
        self,
        sensor_type: str,
        count: int = 100,
        days_back: int = 14
    ) -> int:
        """Generate random sensor data"""
        try:
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            data_generator = RandomDataGenerator()
            generated_data = data_generator.generate(sensor_type, count, days_back)

            # Insert data
            if generated_data:
                result = collection.insert_many(generated_data, ordered=False)
                logger.info(f"Generated {len(result.inserted_ids)} random records")
                return len(result.inserted_ids)

            return 0

        except DuplicateKeyError:
            # Some duplicates might occur, that's ok
            logger.warning("Some duplicate records were skipped (expected)")
            return count
        except PyMongoError as e:
            logger.error(f"Error generating random data: {e}")
            raise

    def clear_collection(self, sensor_type: str) -> int:
        """Clear all data from a sensor type collection"""
        try:
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)

            result = collection.delete_many({})
            logger.info(f"Deleted {result.deleted_count} records from {collection_name}")
            return result.deleted_count

        except PyMongoError as e:
            logger.error(f"Error clearing collection: {e}")
            raise

    def check_new_data(self, sensor_type: str, last_check_timestamp: Optional[datetime] = None) -> Dict:
        """
        Check if there are new data records since last check timestamp
        
        Args:
            sensor_type: Type of sensor (air, sound, underground)
            last_check_timestamp: Optional datetime to check against. If None, checks last 1 hour
        
        Returns:
            Dict with has_new_data (bool), new_count (int), latest_timestamp (datetime)
        """
        self._ensure_connection()
        try:
            import pytz
            TZ_BOLIVIA = pytz.timezone('America/La_Paz')
            
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)
            
            # If no timestamp provided, check last hour
            if last_check_timestamp is None:
                last_check_timestamp = datetime.now(TZ_BOLIVIA) - timedelta(hours=1)
            elif last_check_timestamp.tzinfo is None:
                last_check_timestamp = TZ_BOLIVIA.localize(last_check_timestamp)
            
            # Query for documents newer than last_check_timestamp
            query = {
                "$or": [
                    {
                        "$and": [
                            {"time": {"$exists": True}},
                            {"time": {"$gt": last_check_timestamp}}
                        ]
                    },
                    {
                        "$and": [
                            {"timestamp": {"$exists": True}},
                            {"timestamp": {"$gt": last_check_timestamp}}
                        ]
                    }
                ]
            }
            
            # Count new documents
            new_count = collection.count_documents(query)
            
            # Get latest timestamp
            latest_doc = collection.find_one(
                {"$or": [{"time": {"$exists": True}}, {"timestamp": {"$exists": True}}]},
                sort=[("time", -1), ("timestamp", -1)]
            )
            
            latest_timestamp = None
            if latest_doc:
                latest_timestamp = latest_doc.get("time") or latest_doc.get("timestamp")
            
            return {
                "has_new_data": new_count > 0,
                "new_count": new_count,
                "latest_timestamp": latest_timestamp.isoformat() if latest_timestamp else None,
                "last_check_timestamp": last_check_timestamp.isoformat()
            }
            
        except PyMongoError as e:
            logger.error(f"Error checking new data for {sensor_type}: {e}")
            return {
                "has_new_data": False,
                "new_count": 0,
                "latest_timestamp": None,
                "error": str(e)
            }

    def get_available_dates(self, sensor_type: str) -> Dict:
        """Get min and max dates available for a sensor type (all dates allowed)"""
        try:
            from datetime import datetime as dt
            
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)
            
            # Use aggregation to find min and max dates more reliably
            # This handles both 'time' and 'timestamp' fields
            pipeline = [
                {
                    "$match": {
                        "$or": [
                            {"time": {"$exists": True, "$ne": None}},
                            {"timestamp": {"$exists": True, "$ne": None}}
                        ]
                    }
                },
                {
                    "$project": {
                        "date_field": {
                            "$ifNull": ["$time", "$timestamp"]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "min_date": {"$min": "$date_field"},
                        "max_date": {"$max": "$date_field"}
                    }
                }
            ]
            
            result_agg = list(collection.aggregate(pipeline))
            
            result = {
                "sensor_type": sensor_type,
                "collection_name": collection_name,
                "min_date": None,
                "max_date": None,
                "total_records": collection.count_documents({})  # Count all records
            }
            
            if result_agg and len(result_agg) > 0:
                agg_result = result_agg[0]
                min_date = agg_result.get("min_date")
                max_date = agg_result.get("max_date")
                
                # Format dates
                if min_date:
                    if isinstance(min_date, str):
                        result["min_date"] = min_date
                    else:
                        result["min_date"] = min_date.isoformat() if hasattr(min_date, 'isoformat') else str(min_date)
                
                if max_date:
                    if isinstance(max_date, str):
                        result["max_date"] = max_date
                    else:
                        result["max_date"] = max_date.isoformat() if hasattr(max_date, 'isoformat') else str(max_date)
            
            # Fallback: if aggregation didn't work, try find_one
            if not result["min_date"] or not result["max_date"]:
                logger.warning(f"Aggregation didn't find dates for {sensor_type}, trying find_one fallback")
                # Find oldest document
                oldest = collection.find_one(
                    {"$or": [{"time": {"$exists": True}}, {"timestamp": {"$exists": True}}]},
                    sort=[("time", 1)]
                )
                if not oldest:
                    oldest = collection.find_one(
                        {"$or": [{"time": {"$exists": True}}, {"timestamp": {"$exists": True}}]},
                        sort=[("timestamp", 1)]
                    )
                
                # Find newest document
                newest = collection.find_one(
                    {"$or": [{"time": {"$exists": True}}, {"timestamp": {"$exists": True}}]},
                    sort=[("time", -1)]
                )
                if not newest:
                    newest = collection.find_one(
                        {"$or": [{"time": {"$exists": True}}, {"timestamp": {"$exists": True}}]},
                        sort=[("timestamp", -1)]
                    )
                
                if oldest and not result["min_date"]:
                    min_date = oldest.get("time") or oldest.get("timestamp")
                    if min_date:
                        if isinstance(min_date, str):
                            result["min_date"] = min_date
                        else:
                            result["min_date"] = min_date.isoformat() if hasattr(min_date, 'isoformat') else str(min_date)
                
                if newest and not result["max_date"]:
                    max_date = newest.get("time") or newest.get("timestamp")
                    if max_date:
                        if isinstance(max_date, str):
                            result["max_date"] = max_date
                        else:
                            result["max_date"] = max_date.isoformat() if hasattr(max_date, 'isoformat') else str(max_date)
            
            logger.info(f"Available dates for {sensor_type}: {result['min_date']} to {result['max_date']} ({result['total_records']} total records)")
            return result

        except PyMongoError as e:
            logger.error(f"Error getting available dates for {sensor_type}: {e}")
            return {
                "sensor_type": sensor_type,
                "error": str(e)
            }

    def get_unique_sensor_names(self, sensor_type: str) -> List[str]:
        """Get list of unique sensor names for a sensor type"""
        self._ensure_connection()
        try:
            collection_name = self._get_collection_name(sensor_type)
            collection = self.get_collection(collection_name)
            
            # Get distinct sensor names (try both field names)
            sensor_names = set()
            
            # Try sensor_nombre first (most common)
            nombres = collection.distinct("sensor_nombre")
            sensor_names.update([n for n in nombres if n])
            
            # Also try sensor_name
            names = collection.distinct("sensor_name")
            sensor_names.update([n for n in names if n])
            
            # Also try device_name
            devices = collection.distinct("device_name")
            sensor_names.update([n for n in devices if n])
            
            result = sorted(list(sensor_names))
            logger.info(f"Found {len(result)} unique sensor names for {sensor_type}")
            return result
            
        except PyMongoError as e:
            logger.error(f"Error getting unique sensor names: {e}")
            return []

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    @staticmethod
    def _get_collection_name(sensor_type: str) -> str:
        """Get collection name for sensor type"""
        mapping = {
            "air": "air_sensors",
            "air_quality": "air_sensors",
            "sound": "sound_sensors",
            "underground": "underground_sensors",
            "underground_water": "underground_sensors"
        }
        return mapping.get(sensor_type.lower(), sensor_type.lower() + "_sensors")

    def _format_data_wide(self, data: List[Dict], sensor_type: str = None) -> List[Dict]:
        """Format MongoDB data to API format - keep all metrics in one record (wide format)"""
        formatted = []

        logger.info(f"🔧 _format_data_wide called with sensor_type: {sensor_type}")

        for doc in data:
            # Remove MongoDB _id field
            doc_id = str(doc.pop("_id", ""))

            # Standardize field names
            record = {
                "id": doc_id,
                "sensor_name": doc.get("sensor_nombre", doc.get("sensor_name", "Unknown")),
                "time": doc.get("time") or doc.get("timestamp"),
                "ubicacion": doc.get("ubicacion", ""),
                "direccion": doc.get("direccion", ""),
            }

            # Add all metric fields based on sensor type
            if sensor_type and sensor_type.lower() in ["air", "air_quality"]:
                record.update({
                    "co2_ppm": doc.get("co2_ppm"),
                    "temperatura_c": doc.get("temperatura_c"),
                    "humedad_percent": doc.get("humedad_percent"),
                    "presion_hpa": doc.get("presion_hpa"),
                })
            elif sensor_type and sensor_type.lower() == "sound":
                record.update({
                    "laeq_db": doc.get("laeq_db"),
                    "lai_db": doc.get("lai_db"),
                    "laimax_db": doc.get("laimax_db"),
                    "bateria_percent": doc.get("bateria_percent"),
                })
            elif sensor_type and sensor_type.lower() in ["underground", "soterrado"]:
                record.update({
                    "distancia_mm": doc.get("distancia_mm"),
                    "estado": doc.get("estado", ""),
                    "posicion": doc.get("position", ""),  # MongoDB field is 'position' (English)
                    "bateria_percent": doc.get("bateria_percent"),
                    "sensor_nombre": doc.get("sensor_nombre", ""),
                })
            else:
                # If type not specified, include all fields
                logger.warning(f"🔧 Unknown sensor_type '{sensor_type}', including all fields")
                record.update(doc)

            formatted.append(record)

        return formatted

    def _format_data(self, data: List[Dict], sensor_type: str = None) -> List[Dict]:
        """Transform MongoDB data to API format - flatten metric fields into separate records"""
        formatted = []

        # Define metric fields by sensor type
        metrics_by_type = {
            "air": {
                "fields": {
                    "co2_ppm": "CO2 (ppm)",
                    "temperatura_c": "Temperature (°C)",
                    "humedad_percent": "Humidity (%)",
                    "presion_hpa": "Pressure (hPa)"
                }
            },
            "sound": {
                "fields": {
                    "laeq_db": "LAeq (dB)",
                    "lai_db": "LAI (dB)",
                    "laimax_db": "LAImax (dB)",
                    "bateria_percent": "Battery (%)"
                }
            },
            "underground": {
                "fields": {
                    "distancia_mm": "Distance (mm)",
                    "bateria_percent": "Battery (%)"
                }
            }
        }

        for doc in data:
            doc_id = str(doc.pop("_id", ""))

            # Get common fields
            sensor_nombre = doc.get("sensor_nombre", "Unknown")
            time_field = doc.get("time") or doc.get("timestamp")
            ubicacion = doc.get("ubicacion", "")
            direccion = doc.get("direccion", "")

            # Auto-detect sensor type from document fields if not provided
            detected_type = sensor_type
            if not detected_type:
                if "laeq_db" in doc:
                    detected_type = "sound"
                elif "distancia_mm" in doc:
                    detected_type = "underground"
                else:
                    detected_type = "air"

            # Get metrics for this sensor type
            metrics = metrics_by_type.get(detected_type.lower(), {}).get("fields", {})

            # Create a record for each metric found in the document
            metrics_found = 0
            for metric_field, metric_label in metrics.items():
                if metric_field in doc and doc[metric_field] is not None:
                    try:
                        formatted.append({
                            "id": doc_id,
                            "sensor_name": sensor_nombre,
                            "metric_name": metric_label,
                            "metric_value": float(doc[metric_field]),
                            "timestamp": time_field,
                            "ubicacion": ubicacion,
                            "direccion": direccion
                        })
                        metrics_found += 1
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert {metric_field}={doc[metric_field]} to float")
                        continue

            # Only skip documents with no metrics (don't add "Raw Data")
            # This ensures we only return valid metric records
            if metrics_found == 0:
                logger.warning(f"Document {doc_id} has no valid metrics for type {detected_type}")

        return formatted

    @staticmethod
    def _format_stats(results: List[Dict]) -> Dict:
        """Format aggregation results for API response"""
        stats = {}
        for result in results:
            metric = result.get("_id")
            stats[metric] = {
                "count": result.get("count", 0),
                "average": result.get("average", 0),
                "min_value": result.get("min", 0),
                "max_value": result.get("max", 0),
                "std_dev": result.get("std_dev", 0),
                "latest_timestamp": result.get("latest")
            }
        return stats


# ============================================================================
# RANDOM DATA GENERATOR
# ============================================================================

class RandomDataGenerator:
    """Generate realistic random sensor data based on REAL MongoDB structure"""

    def __init__(self):
        """Initialize generator with realistic data ranges matching MongoDB structure"""
        # Real sensor names and locations from GAMC MongoDB (actualizados con datos reales)
        self.sensors_data = {
            "air": {
                "sensors": [
                    {"nombre": "EMS-6993", "ubicacion": "-17.3844962748556, -66.1353062672603", "direccion": "Cristo de la Concordia"},
                    {"nombre": "EMS-6954", "ubicacion": "-17.38, -66.13", "direccion": "Av. Melchor Urquidi"},
                    {"nombre": "EMS-6955", "ubicacion": "-17.37, -66.14", "direccion": "Parque Carmela Cerruto"},
                ],
                "metrics": {
                    "co2_ppm": (300, 700),
                    "temperatura_c": (5, 35),
                    "humedad_percent": (15, 95),
                    "presion_hpa": (700, 760)
                }
            },
            "sound": {
                "sensors": [
                    {"nombre": "SLS-8588", "ubicacion": "-17.375344862040876, -66.14936933868707", "direccion": "Av. Melchor Urquidi y Zenon Salinas (AWRA)"},
                    {"nombre": "SLS-6989", "ubicacion": "-17.37, -66.14", "direccion": "Plaza Colón"},
                    {"nombre": "SLS-6990", "ubicacion": "-17.36, -66.15", "direccion": "Parque Carmela Cerruto"},
                ],
                "metrics": {
                    "laeq_db": (30, 85),
                    "lai_db": (35, 105),
                    "laimax_db": (40, 110),
                    "bateria_percent": (50, 100)
                },
                "enums": {
                    "estado": ["Permitido en espacios abiertos", "Normal", "Alerta"]
                }
            },
            "underground": {
                "sensors": [
                    {"nombre": "UDS-8653", "ubicacion": "-17.36950153594541, -66.17336132411948", "direccion": "Parque Lincoln"},
                    {"nombre": "UDS-7898", "ubicacion": "-17.37, -66.17", "direccion": "Av. 9 de Abril"},
                    {"nombre": "UDS-7899", "ubicacion": "-17.36, -66.18", "direccion": "Plaza Julio León Prado"},
                ],
                "metrics": {
                    "distancia_mm": (30, 420),
                    "bateria_percent": (50, 100)
                },
                "enums": {
                    "position": ["normal", "tilt"],
                    "estado": ["Desconocido", "Lleno", "Medio lleno", "Vacio"]
                }
            }
        }

    def generate(
        self,
        sensor_type: str,
        count: int = 50,
        days_back: int = 30,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> List[Dict]:
        """Generate random sensor data respecting REAL MongoDB structure"""
        data = []
        TZ_BOLIVIA = pytz.timezone('America/La_Paz')
        
        # Determine date range
        if date_from and date_to:
            # Use provided date range
            try:
                start_date = pd.to_datetime(date_from).tz_localize(TZ_BOLIVIA)
                end_date = pd.to_datetime(date_to).tz_localize(TZ_BOLIVIA)
                # Add time to end_date to include the full day
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except Exception as e:
                logger.warning(f"Error parsing dates, using days_back: {e}")
                now = datetime.now(TZ_BOLIVIA)
                start_date = now - timedelta(days=days_back)
                end_date = now
        else:
            # Use days_back
            now = datetime.now(TZ_BOLIVIA)
            start_date = now - timedelta(days=days_back)
            end_date = now

        sensor_key = sensor_type.replace("_quality", "").lower()
        sensor_info = self.sensors_data.get(sensor_key)

        if not sensor_info:
            logger.warning(f"No schema for sensor type: {sensor_type}")
            return data

        sensors = sensor_info["sensors"]
        metrics = sensor_info["metrics"]
        enums = sensor_info.get("enums", {})

        # Calculate time span
        time_span = (end_date - start_date).total_seconds()
        
        for i in range(count):
            sensor = random.choice(sensors)
            # Generate random timestamp within the date range
            random_seconds = random.uniform(0, time_span)
            timestamp = start_date + timedelta(seconds=random_seconds)
            # Ensure timestamp is timezone-aware (start_date should already be, but double-check)
            if timestamp.tzinfo is None:
                timestamp = TZ_BOLIVIA.localize(timestamp)

            if sensor_key == "air":
                record = {
                    "time": timestamp,
                    "co2_ppm": round(random.uniform(metrics["co2_ppm"][0], metrics["co2_ppm"][1]), 0),  # Entero, no decimal
                    "temperatura_c": round(random.uniform(metrics["temperatura_c"][0], metrics["temperatura_c"][1]), 0),  # Entero
                    "humedad_percent": round(random.uniform(metrics["humedad_percent"][0], metrics["humedad_percent"][1]), 1),
                    "presion_hpa": round(random.uniform(metrics["presion_hpa"][0], metrics["presion_hpa"][1]), 0),  # Entero
                    "sensor_nombre": sensor["nombre"],
                    "ubicacion": sensor["ubicacion"],  # Coordenadas GPS como string
                    "direccion": sensor["direccion"]
                }

            elif sensor_key == "sound":
                record = {
                    "time": timestamp,
                    "laeq_db": round(random.uniform(metrics["laeq_db"][0], metrics["laeq_db"][1]), 0),  # Entero
                    "lai_db": round(random.uniform(metrics["lai_db"][0], metrics["lai_db"][1]), 1),
                    "laimax_db": round(random.uniform(metrics["laimax_db"][0], metrics["laimax_db"][1]), 1),
                    "bateria_percent": random.randint(metrics["bateria_percent"][0], metrics["bateria_percent"][1]),
                    "estado": random.choice(enums.get("estado", ["Permitido en espacios abiertos"])),
                    "sensor_nombre": sensor["nombre"],
                    "ubicacion": sensor["ubicacion"],  # Coordenadas GPS como string
                    "direccion": sensor["direccion"]
                }

            elif sensor_key == "underground":
                record = {
                    "time": timestamp,
                    "distancia_mm": round(random.uniform(metrics["distancia_mm"][0], metrics["distancia_mm"][1]), 1),
                    "position": random.choice(enums.get("position", ["normal"])),
                    "estado": random.choice(enums.get("estado", ["Lleno"])),
                    "bateria_percent": random.randint(metrics["bateria_percent"][0], metrics["bateria_percent"][1]),
                    "sensor_nombre": sensor["nombre"],
                    "ubicacion": sensor["ubicacion"],  # Coordenadas GPS como string
                    "direccion": sensor["direccion"]
                }
            else:
                continue

            data.append(record)

        return data


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_mongodb_service = None
_connection_error = None


def get_mongodb_service() -> MongoDBService:
    """Get singleton instance of MongoDB service with lazy initialization"""
    global _mongodb_service, _connection_error
    
    if _mongodb_service is None:
        try:
            logger.info("Initializing MongoDB service (lazy connection)...")
            # Initialize without connecting immediately to avoid blocking
            _mongodb_service = MongoDBService(connect_immediately=False)
            # Try to connect in background
            try:
                _mongodb_service.connect()
                _connection_error = None
                logger.info("MongoDB service connected successfully")
            except Exception as e:
                _connection_error = str(e)
                logger.warning(f"MongoDB connection deferred: {e}")
        except Exception as e:
            _connection_error = str(e)
            logger.error(f"Failed to initialize MongoDB service: {e}")
            # Create a minimal service instance
            _mongodb_service = MongoDBService.__new__(MongoDBService)
            _mongodb_service.client = None
            _mongodb_service.db = None
            _mongodb_service.mongo_uri = os.getenv(
                "MONGO_URI",
                "mongodb+srv://gamc_user:womita14@bigdataproyect.nfdzitt.mongodb.net/GAMC_data?retryWrites=true&w=majority"
            )
            _mongodb_service.db_name = "GAMC_data"
            _mongodb_service._connection_retries = 0
            _mongodb_service._max_retries = 3
    
    # Try to reconnect if service is disconnected (non-blocking)
    if _mongodb_service.client is None:
        try:
            _mongodb_service.connect()
            _connection_error = None
        except Exception as e:
            _connection_error = str(e)
            # Don't log as error - just warning, allow service to continue
    
    return _mongodb_service


def close_mongodb_service():
    """Close MongoDB service"""
    global _mongodb_service
    if _mongodb_service:
        _mongodb_service.disconnect()
        _mongodb_service = None
