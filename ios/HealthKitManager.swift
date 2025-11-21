//
//  HealthKitManager.swift
//  FoodForThoughtHealth
//
//  Manager class for all HealthKit operations
//

import Foundation
import HealthKit

class HealthKitManager: ObservableObject {
    
    // Singleton instance
    static let shared = HealthKitManager()
    
    // HealthKit store
    private let healthStore = HKHealthStore()
    
    // Published properties for UI updates
    @Published var isAuthorized = false
    @Published var healthSummary = HealthSummary()
    
    // Health data types we want to read
    private let typesToRead: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
        HKObjectType.workoutType()
    ]
    
    private init() {}
    
    // MARK: - Authorization
    
    /// Check if HealthKit is available on this device
    func isHealthKitAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }
    
    /// Request authorization to access HealthKit data
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        guard isHealthKitAvailable() else {
            completion(false, HealthKitError.notAvailable)
            return
        }
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { [weak self] success, error in
            DispatchQueue.main.async {
                self?.isAuthorized = success
                completion(success, error)
            }
        }
    }
    
    // MARK: - Fetch Heart Rate
    
    /// Fetch heart rate samples from the last N hours
    func fetchHeartRate(hoursBack: Int = 24, completion: @escaping ([HeartRateData], Error?) -> Void) {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            completion([], HealthKitError.dataNotAvailable)
            return
        }
        
        let now = Date()
        let startDate = Calendar.current.date(byAdding: .hour, value: -hoursBack, to: now)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            
            guard let samples = samples as? [HKQuantitySample], error == nil else {
                DispatchQueue.main.async {
                    completion([], error)
                }
                return
            }
            
            let heartRates = samples.map { sample -> HeartRateData in
                let bpm = Int(sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())))
                return HeartRateData(
                    timestamp: sample.startDate,
                    bpm: bpm,
                    source: sample.sourceRevision.source.name
                )
            }
            
            // Update latest heart rate
            if let latest = heartRates.first {
                DispatchQueue.main.async {
                    self.healthSummary.latestHeartRate = latest.bpm
                }
            }
            
            DispatchQueue.main.async {
                completion(heartRates, nil)
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Fetch Workouts/Activities
    
    /// Fetch workout sessions from the last N days
    func fetchWorkouts(daysBack: Int = 7, completion: @escaping ([ActivityData], Error?) -> Void) {
        let workoutType = HKWorkoutType.workoutType()
        
        let now = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -daysBack, to: now)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(
            sampleType: workoutType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] _, samples, error in
            
            guard let workouts = samples as? [HKWorkout], error == nil else {
                DispatchQueue.main.async {
                    completion([], error)
                }
                return
            }
            
            // Fetch average heart rate for each workout
            let group = DispatchGroup()
            var activities: [ActivityData] = []
            
            for workout in workouts {
                group.enter()
                self?.fetchAverageHeartRate(for: workout) { avgHR in
                    let activity = ActivityData(workout: workout, avgHeartRate: avgHR)
                    activities.append(activity)
                    group.leave()
                }
            }
            
            group.notify(queue: .main) {
                // Update summary
                let todayActivities = activities.filter { activity in
                    let formatter = ISO8601DateFormatter()
                    if let date = formatter.date(from: activity.start) {
                        return Calendar.current.isDateInToday(date)
                    }
                    return false
                }
                
                self?.healthSummary.todayActivities = todayActivities.count
                self?.healthSummary.todayCalories = todayActivities.reduce(0) { $0 + $1.caloriesBurned }
                
                completion(activities, nil)
            }
        }
        
        healthStore.execute(query)
    }
    
    /// Fetch average heart rate during a workout
    private func fetchAverageHeartRate(for workout: HKWorkout, completion: @escaping (Int?) -> Void) {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            completion(nil)
            return
        }
        
        let predicate = HKQuery.predicateForSamples(
            withStart: workout.startDate,
            end: workout.endDate,
            options: .strictStartDate
        )
        
        let query = HKStatisticsQuery(
            quantityType: heartRateType,
            quantitySamplePredicate: predicate,
            options: .discreteAverage
        ) { _, statistics, error in
            
            guard let statistics = statistics, error == nil else {
                completion(nil)
                return
            }
            
            if let avgQuantity = statistics.averageQuantity() {
                let avgHR = Int(avgQuantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())))
                completion(avgHR)
            } else {
                completion(nil)
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Fetch Steps
    
    /// Fetch step count for a specific date
    func fetchSteps(for date: Date, completion: @escaping (StepsData?, Error?) -> Void) {
        guard let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount),
              let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            completion(nil, HealthKitError.dataNotAvailable)
            return
        }
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )
        
        let group = DispatchGroup()
        var steps = 0
        var distance = 0.0
        
        // Fetch steps
        group.enter()
        let stepsQuery = HKStatisticsQuery(
            quantityType: stepsType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, statistics, error in
            if let sum = statistics?.sumQuantity() {
                steps = Int(sum.doubleValue(for: .count()))
            }
            group.leave()
        }
        
        // Fetch distance
        group.enter()
        let distanceQuery = HKStatisticsQuery(
            quantityType: distanceType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, statistics, error in
            if let sum = statistics?.sumQuantity() {
                distance = sum.doubleValue(for: .meter())
            }
            group.leave()
        }
        
        healthStore.execute(stepsQuery)
        healthStore.execute(distanceQuery)
        
        group.notify(queue: .main) {
            // Update summary if it's today
            if calendar.isDateInToday(date) {
                self.healthSummary.todaySteps = steps
            }
            
            let stepsData = StepsData(date: date, steps: steps, distance: distance)
            completion(stepsData, nil)
        }
    }
    
    /// Fetch steps for the last N days
    func fetchStepsForLastDays(days: Int, completion: @escaping ([StepsData], Error?) -> Void) {
        let calendar = Calendar.current
        let today = Date()
        
        let group = DispatchGroup()
        var allSteps: [StepsData] = []
        
        for dayOffset in 0..<days {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) else { continue }
            
            group.enter()
            fetchSteps(for: date) { stepsData, error in
                if let stepsData = stepsData {
                    allSteps.append(stepsData)
                }
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            completion(allSteps, nil)
        }
    }
    
    // MARK: - Background Delivery
    
    /// Enable background delivery for real-time updates
    func enableBackgroundDelivery(completion: @escaping (Bool, Error?) -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            completion(false, HealthKitError.dataNotAvailable)
            return
        }
        
        healthStore.enableBackgroundDelivery(
            for: heartRateType,
            frequency: .immediate
        ) { success, error in
            DispatchQueue.main.async {
                completion(success, error)
            }
        }
    }
    
    /// Set up observer query for real-time heart rate updates
    func observeHeartRate(updateHandler: @escaping () -> Void) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return
        }
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { _, _, error in
            if error == nil {
                DispatchQueue.main.async {
                    updateHandler()
                }
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Sync All Data
    
    /// Fetch all health data for syncing to backend
    func fetchAllDataForSync(completion: @escaping (HealthSyncRequest?, Error?) -> Void) {
        let group = DispatchGroup()
        
        var heartRates: [HeartRateData] = []
        var activities: [ActivityData] = []
        var steps: [StepsData] = []
        var fetchError: Error?
        
        // Fetch heart rates from last 24 hours
        group.enter()
        fetchHeartRate(hoursBack: 24) { data, error in
            if let error = error {
                fetchError = error
            } else {
                heartRates = data
            }
            group.leave()
        }
        
        // Fetch workouts from last 7 days
        group.enter()
        fetchWorkouts(daysBack: 7) { data, error in
            if let error = error {
                fetchError = error
            } else {
                activities = data
            }
            group.leave()
        }
        
        // Fetch steps from last 7 days
        group.enter()
        fetchStepsForLastDays(days: 7) { data, error in
            if let error = error {
                fetchError = error
            } else {
                steps = data
            }
            group.leave()
        }
        
        group.notify(queue: .main) {
            if let error = fetchError {
                completion(nil, error)
            } else {
                let syncRequest = HealthSyncRequest(
                    userId: "user123",  // TODO: Replace with actual user ID
                    heartRates: heartRates,
                    activities: activities,
                    steps: steps
                )
                
                self.healthSummary.lastSyncDate = Date()
                completion(syncRequest, nil)
            }
        }
    }
}
