# models/health_data.py
"""
Data models for health information from Apple Watch
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
import json

class HeartRateData:
    """Heart rate measurement from Apple Watch"""
    def __init__(
        self,
        user_id: str,
        timestamp: str,
        bpm: int,
        source: str = "Apple Watch"
    ):
        self.user_id = user_id
        self.timestamp = timestamp
        self.bpm = bpm
        self.source = source
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "timestamp": self.timestamp,
            "bpm": self.bpm,
            "source": self.source
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'HeartRateData':
        return HeartRateData(
            user_id=data.get("user_id", ""),
            timestamp=data.get("timestamp", ""),
            bpm=data.get("bpm", 0),
            source=data.get("source", "Apple Watch")
        )


class ActivityData:
    """Activity session from Apple Watch"""
    def __init__(
        self,
        user_id: str,
        start: str,
        end: str,
        activity_type: str,
        calories_burned: int,
        duration_minutes: int,
        avg_heart_rate: Optional[int] = None,
        distance_meters: Optional[float] = None
    ):
        self.user_id = user_id
        self.start = start
        self.end = end
        self.activity_type = activity_type
        self.calories_burned = calories_burned
        self.duration_minutes = duration_minutes
        self.avg_heart_rate = avg_heart_rate
        self.distance_meters = distance_meters
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "start": self.start,
            "end": self.end,
            "activity_type": self.activity_type,
            "calories_burned": self.calories_burned,
            "duration_minutes": self.duration_minutes,
            "avg_heart_rate": self.avg_heart_rate,
            "distance_meters": self.distance_meters
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'ActivityData':
        return ActivityData(
            user_id=data.get("user_id", ""),
            start=data.get("start", ""),
            end=data.get("end", ""),
            activity_type=data.get("activity_type", "unknown"),
            calories_burned=data.get("calories_burned", 0),
            duration_minutes=data.get("duration_minutes", 0),
            avg_heart_rate=data.get("avg_heart_rate"),
            distance_meters=data.get("distance_meters")
        )


class StepsData:
    """Daily step count from Apple Watch"""
    def __init__(
        self,
        user_id: str,
        date: str,
        steps: int,
        distance_meters: float
    ):
        self.user_id = user_id
        self.date = date
        self.steps = steps
        self.distance_meters = distance_meters
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "date": self.date,
            "steps": self.steps,
            "distance_meters": self.distance_meters
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'StepsData':
        return StepsData(
            user_id=data.get("user_id", ""),
            date=data.get("date", ""),
            steps=data.get("steps", 0),
            distance_meters=data.get("distance_meters", 0.0)
        )


class HealthDataStore:
    """In-memory storage for health data (replace with database in production)"""
    
    def __init__(self):
        self.heart_rates: List[HeartRateData] = []
        self.activities: List[ActivityData] = []
        self.steps: List[StepsData] = []
        self.last_sync: Dict[str, str] = {}  # user_id -> timestamp
    
    def add_heart_rate(self, heart_rate: HeartRateData) -> None:
        """Add a heart rate measurement"""
        self.heart_rates.append(heart_rate)
        # Keep only last 1000 entries per user to prevent memory issues
        user_entries = [hr for hr in self.heart_rates if hr.user_id == heart_rate.user_id]
        if len(user_entries) > 1000:
            # Remove oldest entries
            oldest = sorted(user_entries, key=lambda x: x.timestamp)[0]
            self.heart_rates.remove(oldest)
    
    def add_activity(self, activity: ActivityData) -> None:
        """Add an activity session"""
        self.activities.append(activity)
    
    def add_steps(self, steps: StepsData) -> None:
        """Add step count data"""
        # Check if entry for this date already exists
        existing = next(
            (s for s in self.steps if s.user_id == steps.user_id and s.date == steps.date),
            None
        )
        if existing:
            # Update existing entry
            existing.steps = steps.steps
            existing.distance_meters = steps.distance_meters
        else:
            self.steps.append(steps)
    
    def get_heart_rates(
        self,
        user_id: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        limit: int = 100
    ) -> List[HeartRateData]:
        """Get heart rate data for a user"""
        results = [hr for hr in self.heart_rates if hr.user_id == user_id]
        
        if start_time:
            results = [hr for hr in results if hr.timestamp >= start_time]
        if end_time:
            results = [hr for hr in results if hr.timestamp <= end_time]
        
        # Sort by timestamp descending (newest first)
        results = sorted(results, key=lambda x: x.timestamp, reverse=True)
        
        return results[:limit]
    
    def get_activities(
        self,
        user_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[ActivityData]:
        """Get activity sessions for a user"""
        results = [act for act in self.activities if act.user_id == user_id]
        
        if start_date:
            results = [act for act in results if act.start >= start_date]
        if end_date:
            results = [act for act in results if act.end <= end_date]
        
        # Sort by start time descending (newest first)
        results = sorted(results, key=lambda x: x.start, reverse=True)
        
        return results
    
    def get_steps(self, user_id: str, date: Optional[str] = None) -> List[StepsData]:
        """Get step count data for a user"""
        results = [s for s in self.steps if s.user_id == user_id]
        
        if date:
            results = [s for s in results if s.date == date]
        
        # Sort by date descending (newest first)
        results = sorted(results, key=lambda x: x.date, reverse=True)
        
        return results
    
    def get_latest_heart_rate(self, user_id: str) -> Optional[HeartRateData]:
        """Get the most recent heart rate for a user"""
        user_rates = [hr for hr in self.heart_rates if hr.user_id == user_id]
        if not user_rates:
            return None
        return max(user_rates, key=lambda x: x.timestamp)
    
    def update_last_sync(self, user_id: str) -> None:
        """Update last sync timestamp for user"""
        self.last_sync[user_id] = datetime.utcnow().isoformat()
    
    def get_last_sync(self, user_id: str) -> Optional[str]:
        """Get last sync timestamp for user"""
        return self.last_sync.get(user_id)


# Global health data store instance
health_store = HealthDataStore()
