//
//  HealthDataModel.swift
//  FoodForThoughtHealth
//
//  Data models for health information
//

import Foundation
import HealthKit

// MARK: - Heart Rate Data
struct HeartRateData: Codable {
    let timestamp: String
    let bpm: Int
    let source: String
    
    init(timestamp: Date, bpm: Int, source: String = "Apple Watch") {
        self.timestamp = ISO8601DateFormatter().string(from: timestamp)
        self.bpm = bpm
        self.source = source
    }
}

// MARK: - Activity/Workout Data
struct ActivityData: Codable {
    let start: String
    let end: String
    let activityType: String
    let caloriesBurned: Int
    let durationMinutes: Int
    let avgHeartRate: Int?
    let distanceMeters: Double?
    
    enum CodingKeys: String, CodingKey {
        case start
        case end
        case activityType = "activity_type"
        case caloriesBurned = "calories_burned"
        case durationMinutes = "duration_minutes"
        case avgHeartRate = "avg_heart_rate"
        case distanceMeters = "distance_meters"
    }
    
    init(workout: HKWorkout, avgHeartRate: Int?) {
        let formatter = ISO8601DateFormatter()
        self.start = formatter.string(from: workout.startDate)
        self.end = formatter.string(from: workout.endDate)
        
        // Map HKWorkoutActivityType to readable string
        self.activityType = ActivityData.mapActivityType(workout.workoutActivityType)
        
        // Get calories burned
        let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
        self.caloriesBurned = Int(calories)
        
        // Calculate duration in minutes
        let duration = workout.duration / 60 // Convert seconds to minutes
        self.durationMinutes = Int(duration)
        
        self.avgHeartRate = avgHeartRate
        
        // Get distance if available
        if let distance = workout.totalDistance?.doubleValue(for: .meter()) {
            self.distanceMeters = distance
        } else {
            self.distanceMeters = nil
        }
    }
    
    /// Map HKWorkoutActivityType to human-readable string
    static func mapActivityType(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:
            return "running"
        case .walking:
            return "walking"
        case .cycling:
            return "cycling"
        case .swimming:
            return "swimming"
        case .yoga:
            return "yoga"
        case .functionalStrengthTraining:
            return "strength_training"
        case .traditionalStrengthTraining:
            return "strength_training"
        case .crossTraining:
            return "cross_training"
        case .hiking:
            return "hiking"
        case .dance:
            return "dance"
        case .elliptical:
            return "elliptical"
        case .stairClimbing:
            return "stairs"
        case .rowing:
            return "rowing"
        default:
            return "other"
        }
    }
}

// MARK: - Steps Data
struct StepsData: Codable {
    let date: String
    let steps: Int
    let distanceMeters: Double
    
    enum CodingKeys: String, CodingKey {
        case date
        case steps
        case distanceMeters = "distance_meters"
    }
    
    init(date: Date, steps: Int, distance: Double) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        self.date = formatter.string(from: date)
        self.steps = steps
        self.distanceMeters = distance
    }
}

// MARK: - Health Sync Request
struct HealthSyncRequest: Codable {
    let userId: String
    let heartRates: [HeartRateData]
    let activities: [ActivityData]
    let steps: [StepsData]
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case heartRates = "heart_rates"
        case activities
        case steps
    }
}

// MARK: - API Response Models
struct SyncResponse: Codable {
    let success: Bool
    let message: String
    let synced: SyncedData?
    let lastSync: String?
    
    enum CodingKeys: String, CodingKey {
        case success
        case message
        case synced
        case lastSync = "last_sync"
    }
}

struct SyncedData: Codable {
    let heartRates: Int
    let activities: Int
    let steps: Int
    
    enum CodingKeys: String, CodingKey {
        case heartRates = "heart_rates"
        case activities
        case steps
    }
}

// MARK: - User Health Summary
struct HealthSummary {
    var latestHeartRate: Int?
    var todaySteps: Int = 0
    var todayCalories: Int = 0
    var todayActivities: Int = 0
    var lastSyncDate: Date?
    
    var lastSyncDescription: String {
        guard let date = lastSyncDate else {
            return "Never"
        }
        
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Error Types
enum HealthKitError: Error, LocalizedError {
    case notAvailable
    case notAuthorized
    case dataNotAvailable
    case syncFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "HealthKit is not available on this device"
        case .notAuthorized:
            return "HealthKit access not authorized. Please enable in Settings"
        case .dataNotAvailable:
            return "No health data available"
        case .syncFailed(let message):
            return "Sync failed: \(message)"
        }
    }
}
