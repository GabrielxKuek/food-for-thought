# routes/health.py
"""
Health data API endpoints for Apple Watch integration
"""
from flask import Blueprint, request, jsonify
from models.health_data import (
    HeartRateData,
    ActivityData,
    StepsData,
    health_store
)
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Create Blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api/health')


@health_bp.route('/sync', methods=['POST'])
def sync_health_data():
    """
    Receive health data from iOS app
    
    Expected JSON format:
    {
        "user_id": "user123",
        "heart_rates": [
            {"timestamp": "2025-11-22T10:30:00Z", "bpm": 75}
        ],
        "activities": [
            {
                "start": "2025-11-22T09:00:00Z",
                "end": "2025-11-22T09:30:00Z",
                "activity_type": "running",
                "calories_burned": 150,
                "duration_minutes": 30,
                "avg_heart_rate": 140
            }
        ],
        "steps": [
            {"date": "2025-11-22", "steps": 8543, "distance_meters": 6234.5}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        # Process heart rate data
        heart_rates = data.get('heart_rates', [])
        for hr_data in heart_rates:
            heart_rate = HeartRateData(
                user_id=user_id,
                timestamp=hr_data.get('timestamp'),
                bpm=hr_data.get('bpm'),
                source=hr_data.get('source', 'Apple Watch')
            )
            health_store.add_heart_rate(heart_rate)
        
        # Process activity data
        activities = data.get('activities', [])
        for act_data in activities:
            activity = ActivityData(
                user_id=user_id,
                start=act_data.get('start'),
                end=act_data.get('end'),
                activity_type=act_data.get('activity_type', 'unknown'),
                calories_burned=act_data.get('calories_burned', 0),
                duration_minutes=act_data.get('duration_minutes', 0),
                avg_heart_rate=act_data.get('avg_heart_rate'),
                distance_meters=act_data.get('distance_meters')
            )
            health_store.add_activity(activity)
        
        # Process steps data
        steps_data = data.get('steps', [])
        for step_data in steps_data:
            steps = StepsData(
                user_id=user_id,
                date=step_data.get('date'),
                steps=step_data.get('steps', 0),
                distance_meters=step_data.get('distance_meters', 0.0)
            )
            health_store.add_steps(steps)
        
        # Update last sync time
        health_store.update_last_sync(user_id)
        
        logger.info(f"Synced health data for user {user_id}: "
                   f"{len(heart_rates)} heart rates, "
                   f"{len(activities)} activities, "
                   f"{len(steps_data)} step entries")
        
        return jsonify({
            "success": True,
            "message": "Health data synced successfully",
            "synced": {
                "heart_rates": len(heart_rates),
                "activities": len(activities),
                "steps": len(steps_data)
            },
            "last_sync": health_store.get_last_sync(user_id)
        }), 200
        
    except Exception as e:
        logger.error(f"Error syncing health data: {str(e)}")
        return jsonify({"error": str(e)}), 500


@health_bp.route('/<user_id>', methods=['GET'])
def get_user_health_data(user_id: str):
    """
    Get all health data for a user
    
    Query parameters:
    - start_date: Filter data from this date (ISO format)
    - end_date: Filter data until this date (ISO format)
    - limit: Max number of heart rate readings (default: 100)
    """
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 100))
        
        # Get latest heart rate
        latest_heart_rate = health_store.get_latest_heart_rate(user_id)
        
        # Get heart rates
        heart_rates = health_store.get_heart_rates(
            user_id,
            start_time=start_date,
            end_time=end_date,
            limit=limit
        )
        
        # Get activities
        activities = health_store.get_activities(
            user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Get steps (default to today if no date specified)
        steps_date = request.args.get('steps_date')
        steps = health_store.get_steps(user_id, date=steps_date)
        
        # Calculate summary statistics
        total_calories = sum(act.calories_burned for act in activities)
        total_activities = len(activities)
        
        return jsonify({
            "user_id": user_id,
            "last_sync": health_store.get_last_sync(user_id),
            "current_heart_rate": latest_heart_rate.to_dict() if latest_heart_rate else None,
            "heart_rates": [hr.to_dict() for hr in heart_rates],
            "activities": [act.to_dict() for act in activities],
            "steps": [s.to_dict() for s in steps],
            "summary": {
                "total_calories_burned": total_calories,
                "total_activities": total_activities,
                "total_steps": sum(s.steps for s in steps)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching health data for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500


@health_bp.route('/heart-rate', methods=['POST'])
def add_heart_rate():
    """
    Add a single heart rate measurement
    
    Expected JSON:
    {
        "user_id": "user123",
        "timestamp": "2025-11-22T10:30:00Z",
        "bpm": 75
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        heart_rate = HeartRateData.from_dict(data)
        health_store.add_heart_rate(heart_rate)
        
        logger.info(f"Added heart rate for user {heart_rate.user_id}: {heart_rate.bpm} BPM")
        
        return jsonify({
            "success": True,
            "message": "Heart rate added successfully",
            "data": heart_rate.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding heart rate: {str(e)}")
        return jsonify({"error": str(e)}), 500


@health_bp.route('/activities/<user_id>', methods=['GET'])
def get_user_activities(user_id: str):
    """
    Get activity sessions for a user
    
    Query parameters:
    - start_date: Filter activities from this date
    - end_date: Filter activities until this date
    - days: Get activities from last N days (alternative to start_date)
    """
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # If 'days' parameter provided, calculate start_date
        days = request.args.get('days')
        if days:
            start_date = (datetime.utcnow() - timedelta(days=int(days))).isoformat()
        
        activities = health_store.get_activities(
            user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        total_calories = sum(act.calories_burned for act in activities)
        total_duration = sum(act.duration_minutes for act in activities)
        
        return jsonify({
            "user_id": user_id,
            "activities": [act.to_dict() for act in activities],
            "summary": {
                "total_activities": len(activities),
                "total_calories_burned": total_calories,
                "total_duration_minutes": total_duration
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching activities for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500


@health_bp.route('/watch-status/<user_id>', methods=['GET'])
def get_watch_status(user_id: str):
    """
    Get Apple Watch connection status and latest data
    Useful for checking if data is being synced
    """
    try:
        last_sync = health_store.get_last_sync(user_id)
        latest_hr = health_store.get_latest_heart_rate(user_id)
        
        # Check if synced recently (within last 5 minutes)
        is_connected = False
        if last_sync:
            sync_time = datetime.fromisoformat(last_sync)
            time_diff = datetime.utcnow() - sync_time
            is_connected = time_diff.total_seconds() < 300  # 5 minutes
        
        return jsonify({
            "user_id": user_id,
            "is_connected": is_connected,
            "last_sync": last_sync,
            "latest_heart_rate": latest_hr.to_dict() if latest_hr else None,
            "status": "connected" if is_connected else "disconnected"
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking watch status for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500


@health_bp.route('/health', methods=['GET'])
def test_health_endpoint():
    """Test endpoint to verify health routes are working"""
    return jsonify({
        "status": "OK",
        "message": "Health API is running",
        "endpoints": {
            "POST /api/health/sync": "Sync health data from iOS app",
            "GET /api/health/<user_id>": "Get all health data for user",
            "POST /api/health/heart-rate": "Add heart rate measurement",
            "GET /api/health/activities/<user_id>": "Get activity sessions",
            "GET /api/health/watch-status/<user_id>": "Check watch connection status"
        }
    }), 200
