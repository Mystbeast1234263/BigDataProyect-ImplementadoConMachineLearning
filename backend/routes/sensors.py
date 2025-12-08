from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import Optional, List
import logging
import pandas as pd
import io
from datetime import datetime
import pytz

# Import with fallback for different execution contexts
try:
    from models import (
        SensorData,
        GenerateDataRequest,
        GenerateDataPreviewRequest,
        GenerateDataResponse,
        ClearDataRequest,
        ClearDataResponse,
        SensorListResponse,
        SensorTypeStats
    )
    from services.mongodb_service import get_mongodb_service
    from routes.auth import get_current_user
except ImportError:
    from backend.models import (
        SensorData,
        GenerateDataRequest,
        GenerateDataPreviewRequest,
        GenerateDataResponse,
        ClearDataRequest,
        ClearDataResponse,
        SensorListResponse,
        SensorTypeStats
    )
    from backend.services.mongodb_service import get_mongodb_service
    from backend.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

mongodb_service = get_mongodb_service()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_admin_role(current_user: dict):
    """Check if user has admin role"""
    if current_user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can perform this action"
        )


def check_admin_or_operator_role(current_user: dict):
    """Check if user has admin or operator role"""
    if current_user.get("rol") not in ["admin", "operador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and operator users can perform this action"
        )


# ============================================================================
# ENDPOINTS - LIST & GET
# ============================================================================

@router.get("/{sensor_type}/sensor-names")
async def get_sensor_names(
    sensor_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of unique sensor names for a sensor type
    
    Returns list of sensor names (e.g., ["EMS-6993", "EMS-6962"])
    """
    try:
        sensor_names = mongodb_service.get_unique_sensor_names(sensor_type)
        return {
            "sensor_type": sensor_type,
            "sensor_names": sensor_names,
            "count": len(sensor_names)
        }
    except Exception as e:
        logger.error(f"Error getting sensor names: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting sensor names: {str(e)}"
        )


@router.get("/")
async def list_available_sensors(current_user: dict = Depends(get_current_user)):
    """
    List all available sensor types

    Returns list of sensor types with basic info
    """
    sensor_types = ["air", "sound", "underground"]

    sensors_info = []
    for sensor_type in sensor_types:
        try:
            data = mongodb_service.load_sensor_data(sensor_type, days_back=30, limit=1)
            sensors_info.append({
                "type": sensor_type,
                "display_name": {
                    "air": "Air Quality Sensors",
                    "sound": "Sound Sensors",
                    "underground": "Underground Water Level"
                }.get(sensor_type),
                "has_data": len(data) > 0
            })
        except Exception as e:
            logger.warning(f"Error checking sensor type {sensor_type}: {e}")
            sensors_info.append({
                "type": sensor_type,
                "display_name": {
                    "air": "Air Quality Sensors",
                    "sound": "Sound Sensors",
                    "underground": "Underground Water Level"
                }.get(sensor_type),
                "has_data": False
            })

    return SensorListResponse(
        total=len(sensors_info),
        sensors=sensors_info
    )


@router.get("/{sensor_type}/data")
async def get_sensor_data(
    sensor_type: str,
    days_back: int = Query(30, ge=1, le=365),
    date_from: Optional[str] = Query(None),  # Format: YYYY-MM-DD
    date_to: Optional[str] = Query(None),    # Format: YYYY-MM-DD
    limit: Optional[int] = Query(400, ge=1, le=10000),
    current_user: dict = Depends(get_current_user)
):
    """
    Load sensor data by type

    - **sensor_type**: air, sound, or underground
    - **days_back**: Number of days of historical data (default 30, ignored if date_from/date_to provided)
    - **date_from**: Start date in YYYY-MM-DD format (optional, overrides days_back)
    - **date_to**: End date in YYYY-MM-DD format (optional, overrides days_back)
    - **limit**: Maximum records to return (default 400)

    Returns list of sensor data records
    """
    try:
        # If date range provided, use it; otherwise use days_back
        if date_from and date_to:
            data = mongodb_service.load_sensor_data_by_date_range(
                sensor_type=sensor_type,
                date_from=date_from,
                date_to=date_to,
                limit=limit
            )
            date_range_info = f"{date_from} to {date_to}"
        else:
            data = mongodb_service.load_sensor_data(
                sensor_type=sensor_type,
                days_back=days_back,
                limit=limit
            )
            date_range_info = f"{days_back} days"

        logger.info(
            f"User {current_user['email']} loaded {len(data)} records "
            f"from {sensor_type} sensors ({date_range_info})"
        )

        return {
            "sensor_type": sensor_type,
            "total_records": len(data),
            "date_range": date_range_info,
            "limit": limit,
            "data": data
        }

    except Exception as e:
        logger.error(f"Error loading sensor data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading sensor data: {str(e)}"
        )


@router.get("/{sensor_type}/stats")
async def get_sensor_stats(
    sensor_type: str,
    days_back: int = Query(30, ge=1, le=365),
    date_from: Optional[str] = Query(None),  # Format: YYYY-MM-DD
    date_to: Optional[str] = Query(None),    # Format: YYYY-MM-DD
    metric_name: Optional[str] = None,
    sensor_name: Optional[str] = Query(None),  # Filter by specific sensor name
    current_user: dict = Depends(get_current_user)
):
    """
    Get statistics for a sensor type

    - **sensor_type**: air, sound, or underground
    - **days_back**: Number of days to include (default 30, ignored if date_from/date_to provided)
    - **date_from**: Start date in YYYY-MM-DD format (optional, overrides days_back)
    - **date_to**: End date in YYYY-MM-DD format (optional, overrides days_back)
    - **metric_name**: Optional specific metric to filter

    Returns count, average, min, max, std deviation per metric
    """
    try:
        # If date range provided, use it; otherwise use days_back
        if date_from and date_to:
            stats = mongodb_service.get_sensor_stats_by_date_range(
                sensor_type=sensor_type,
                date_from=date_from,
                date_to=date_to,
                metric_name=metric_name,
                sensor_name=sensor_name
            )
            date_range_info = f"{date_from} to {date_to}"
        else:
            stats = mongodb_service.get_sensor_stats(
                sensor_type=sensor_type,
                metric_name=metric_name,
                days_back=days_back,
                sensor_name=sensor_name
            )
            date_range_info = f"{days_back} days"

        logger.info(
            f"User {current_user['email']} retrieved stats for {sensor_type} sensors ({date_range_info})"
        )

        return {
            "sensor_type": sensor_type,
            "date_range": date_range_info,
            "metrics": stats
        }

    except Exception as e:
        logger.error(f"Error getting sensor stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting sensor stats: {str(e)}"
        )


# ============================================================================
# ENDPOINTS - DATA GENERATION & MANAGEMENT
# ============================================================================

@router.post("/{sensor_type}/generate-preview")
async def generate_data_preview(
    sensor_type: str,
    request: GenerateDataPreviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate random sensor data PREVIEW (NOT saved to DB)

    Returns generated data for user review before saving

    - **sensor_type**: air, sound, or underground
    - **count**: Number of records to generate (default 50)
    - **days_back**: Days to spread data across (default 30)
    """
    check_admin_or_operator_role(current_user)

    try:
        try:
            from services.mongodb_service import RandomDataGenerator
        except ImportError:
            from backend.services.mongodb_service import RandomDataGenerator

        generator = RandomDataGenerator()
        generated_data = generator.generate(
            sensor_type=sensor_type,
            count=request.count,
            days_back=request.days_back,
            date_from=request.date_from,
            date_to=request.date_to
        )

        logger.info(
            f"User {current_user['email']} generated preview for {len(generated_data)} "
            f"{sensor_type} records"
        )

        return {
            "success": True,
            "sensor_type": sensor_type,
            "count": len(generated_data),
            "message": f"Generated {len(generated_data)} records (not saved yet)",
            "data": generated_data
        }

    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )


@router.post("/{sensor_type}/save-generated")
async def save_generated_data(
    sensor_type: str,
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Save previously generated data to MongoDB

    Takes the data array from generate-preview and saves it

    - **sensor_type**: air, sound, or underground
    - **data**: List of records to save
    """
    check_admin_or_operator_role(current_user)

    try:
        data_to_save = request.get("data", [])

        if not data_to_save:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided to save"
            )

        collection_name = mongodb_service._get_collection_name(sensor_type)
        collection = mongodb_service.get_collection(collection_name)

        # Direct bulk insert to ensure new records are added
        inserted_count = 0
        errors = []

        # Ensure timestamps are datetime objects (not strings)
        import pytz
        TZ_BOLIVIA = pytz.timezone('America/La_Paz')
        
        for record in data_to_save:
            # Convert time field to datetime if it's a string or ensure it's timezone-aware
            if "time" in record:
                time_value = record["time"]
                if isinstance(time_value, str):
                    try:
                        # Parse ISO format string
                        record["time"] = pd.to_datetime(time_value).tz_localize(TZ_BOLIVIA) if pd.to_datetime(time_value).tz is None else pd.to_datetime(time_value).tz_convert(TZ_BOLIVIA)
                    except:
                        logger.warning(f"Could not parse time string: {time_value}")
                elif hasattr(time_value, 'tzinfo') and time_value.tzinfo is None:
                    # Make timezone-aware if it's naive
                    record["time"] = TZ_BOLIVIA.localize(time_value)
        
        try:
            # Try bulk insert first (faster)
            result = collection.insert_many(data_to_save, ordered=False)
            inserted_count = len(result.inserted_ids)
            logger.info(f"Successfully bulk inserted {inserted_count} {sensor_type} records")
        except Exception as bulk_error:
            # If bulk fails, try one by one
            logger.warning(f"Bulk insert failed: {bulk_error}, trying individual inserts")
            for idx, record in enumerate(data_to_save):
                try:
                    result = collection.insert_one(record)
                    if result.inserted_id:
                        inserted_count += 1
                except Exception as e:
                    error_msg = f"Record {idx}: {str(e)[:100]}"
                    errors.append(error_msg)
                    logger.error(f"Error inserting {sensor_type} record {idx}: {e}")

        # Log any errors encountered
        if errors:
            logger.warning(f"Encountered {len(errors)} errors: {errors[:3]}")

        logger.warning(
            f"User {current_user['email']} saved {inserted_count} "
            f"{sensor_type} records to MongoDB"
        )

        return {
            "success": True,
            "message": f"Saved {inserted_count} records to MongoDB",
            "records_saved": inserted_count,
            "sensor_type": sensor_type
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving generated data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving data: {str(e)}"
        )


@router.delete("/{sensor_type}/clear", response_model=ClearDataResponse)
async def clear_sensor_data(
    sensor_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Clear all data from a sensor type collection

    Requires admin role only

    - **sensor_type**: air, sound, or underground
    """
    check_admin_role(current_user)

    try:
        records_deleted = mongodb_service.clear_collection(sensor_type)

        logger.warning(
            f"User {current_user['email']} cleared {records_deleted} records "
            f"from {sensor_type} collection"
        )

        return ClearDataResponse(
            success=True,
            message=f"Deleted {records_deleted} records from {sensor_type}",
            records_deleted=records_deleted
        )

    except Exception as e:
        logger.error(f"Error clearing collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing collection: {str(e)}"
        )


@router.delete("/{sensor_type}/clear-2025")
async def clear_2025_data(
    sensor_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Clear all data from 2025 (invalid future dates) from a sensor type collection

    Requires admin or operator role

    - **sensor_type**: air, sound, or underground
    """
    check_admin_or_operator_role(current_user)

    try:
        from datetime import datetime as dt
        
        collection_name = mongodb_service._get_collection_name(sensor_type)
        collection = mongodb_service.get_collection(collection_name)
        
        # Delete all documents with dates >= 2025-01-01
        max_valid_date = dt(2024, 12, 31, 23, 59, 59)
        
        query = {
            "$or": [
                {"time": {"$gte": dt(2025, 1, 1)}},
                {"timestamp": {"$gte": dt(2025, 1, 1)}}
            ]
        }
        
        result = collection.delete_many(query)
        records_deleted = result.deleted_count

        logger.warning(
            f"User {current_user['email']} deleted {records_deleted} records from 2025 "
            f"from {sensor_type} collection"
        )

        return {
            "success": True,
            "message": f"Deleted {records_deleted} records from 2025",
            "records_deleted": records_deleted,
            "sensor_type": sensor_type
        }

    except Exception as e:
        logger.error(f"Error clearing 2025 data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing 2025 data: {str(e)}"
        )


# ============================================================================
# TEST ENDPOINTS
# ============================================================================

@router.get("/available-dates")
async def get_available_dates_for_all(current_user: dict = Depends(get_current_user)):
    """
    Get available date ranges for all sensor types

    Returns min_date and max_date for each sensor type to enable proper date filtering
    """
    try:
        sensor_types = ["air", "sound", "underground"]
        date_ranges = {}

        for sensor_type in sensor_types:
            date_info = mongodb_service.get_available_dates(sensor_type)
            date_ranges[sensor_type] = date_info

        logger.info(f"User {current_user['email']} requested available date ranges")

        return {
            "success": True,
            "date_ranges": date_ranges
        }

    except Exception as e:
        logger.error(f"Error getting available dates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting available dates: {str(e)}"
        )


@router.get("/{sensor_type}/check-new-data")
async def check_new_data(
    sensor_type: str,
    last_check: Optional[str] = Query(None, description="ISO format timestamp of last check"),
    current_user: dict = Depends(get_current_user)
):
    """
    Check if there are new data records since last check
    
    - **sensor_type**: air, sound, or underground
    - **last_check**: Optional ISO timestamp. If not provided, checks last hour
    
    Returns: has_new_data (bool), new_count (int), latest_timestamp (str)
    """
    try:
        from datetime import datetime
        import pytz
        
        last_check_timestamp = None
        if last_check:
            try:
                last_check_timestamp = datetime.fromisoformat(last_check.replace('Z', '+00:00'))
            except Exception as e:
                logger.warning(f"Could not parse last_check timestamp: {e}")
        
        result = mongodb_service.check_new_data(sensor_type, last_check_timestamp)
        
        logger.info(
            f"User {current_user['email']} checked for new data in {sensor_type}: "
            f"{result.get('new_count', 0)} new records"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error checking new data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking new data: {str(e)}"
        )


@router.get("/health/check")
async def health_check():
    """Health check endpoint (no auth required)"""
    try:
        mongodb_service.connect()
        return {
            "status": "healthy",
            "service": "Sensors API",
            "mongodb": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Sensors API",
            "mongodb": f"disconnected: {str(e)}"
        }


@router.get("/debug/collections")
async def debug_collections(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to inspect all collections and their data"""
    try:
        result = {}

        for sensor_type in ["air", "sound", "underground"]:
            collection_name = mongodb_service._get_collection_name(sensor_type)
            collection = mongodb_service.get_collection(collection_name)

            try:
                # Count documents
                count = collection.count_documents({})

                # Get first document
                first_doc = collection.find_one({})

                # Get field names from first document
                fields = list(first_doc.keys()) if first_doc else []

                result[sensor_type] = {
                    "collection_name": collection_name,
                    "count": count,
                    "fields": fields,
                    "sample_has_data": first_doc is not None,
                    "error": None
                }
            except Exception as e:
                result[sensor_type] = {
                    "collection_name": collection_name,
                    "count": 0,
                    "fields": [],
                    "sample_has_data": False,
                    "error": str(e)
                }

        return result
    except Exception as e:
        return {
            "error": f"Debug endpoint failed: {str(e)}"
        }


@router.get("/debug/date-ranges")
async def debug_date_ranges(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to inspect date ranges in all collections"""
    try:
        result = {}

        for sensor_type in ["air", "sound", "underground"]:
            collection_name = mongodb_service._get_collection_name(sensor_type)
            collection = mongodb_service.get_collection(collection_name)

            try:
                # Find oldest and newest documents by time field
                oldest = collection.find_one(sort=[("time", 1)])
                newest = collection.find_one(sort=[("time", -1)])

                result[sensor_type] = {
                    "collection_name": collection_name,
                    "oldest_date": oldest.get("time") if oldest else None,
                    "newest_date": newest.get("time") if newest else None,
                    "error": None
                }
            except Exception as e:
                result[sensor_type] = {
                    "collection_name": collection_name,
                    "oldest_date": None,
                    "newest_date": None,
                    "error": str(e)
                }

        return result
    except Exception as e:
        return {
            "error": f"Debug date-ranges endpoint failed: {str(e)}"
        }


@router.post("/{sensor_type}/upload-csv")
async def upload_csv_file(
    sensor_type: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and import CSV file to MongoDB
    
    Requires admin or operator role
    
    - **sensor_type**: air, sound, or underground
    - **file**: CSV file to upload
    """
    check_admin_or_operator_role(current_user)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )
    
    try:
        # Read file content
        contents = await file.read()
        
        # Parse CSV with pandas
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing CSV: {str(e)}"
            )
        
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty"
            )
        
        # Convert time column if exists
        TZ_BOLIVIA = pytz.timezone('America/La_Paz')
        if 'time' in df.columns:
            try:
                df['time'] = pd.to_datetime(df['time'], format='ISO8601', utc=True, errors='coerce')
                df['time'] = df['time'].dt.tz_convert(TZ_BOLIVIA)
            except Exception as e:
                logger.warning(f"Could not convert time column: {e}")
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        # Get collection
        collection_name = mongodb_service._get_collection_name(sensor_type)
        collection = mongodb_service.get_collection(collection_name)
        
        # Insert records
        inserted_count = 0
        errors = []
        
        try:
            # Try bulk insert first
            result = collection.insert_many(records, ordered=False)
            inserted_count = len(result.inserted_ids)
            logger.info(f"Successfully bulk inserted {inserted_count} records from CSV")
        except Exception as bulk_error:
            # If bulk fails, try one by one
            logger.warning(f"Bulk insert failed: {bulk_error}, trying individual inserts")
            for idx, record in enumerate(records):
                try:
                    result = collection.insert_one(record)
                    if result.inserted_id:
                        inserted_count += 1
                except Exception as e:
                    error_msg = f"Record {idx}: {str(e)[:100]}"
                    errors.append(error_msg)
                    logger.error(f"Error inserting record {idx}: {e}")
        
        logger.info(
            f"User {current_user['email']} uploaded CSV with {inserted_count} records "
            f"to {sensor_type} collection"
        )
        
        return {
            "success": True,
            "message": f"Uploaded {inserted_count} records from CSV",
            "records_inserted": inserted_count,
            "total_records": len(records),
            "errors_count": len(errors),
            "sensor_type": sensor_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading CSV: {str(e)}"
        )
