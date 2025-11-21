# 🍎 Apple Watch Connection - Complete Setup Guide

## 🎯 Current Implementation

Your app now supports **3 connection methods**:

### 1. 🎮 Demo Mode (Default - Works Now!)
- **Status**: ✅ Working out of the box
- **Purpose**: Testing and demonstration
- **Features**:
  - Simulated heart rate (65-85 BPM)
  - Mock activity sessions
  - No real device needed

### 2. 🔗 Bluetooth Heart Rate Monitor
- **Status**: ✅ Ready (needs compatible device)
- **Purpose**: Connect to Bluetooth heart rate monitors
- **Requirements**:
  - Chrome/Edge browser (Web Bluetooth support)
  - Bluetooth heart rate monitor device
  - HTTPS connection (required for Web Bluetooth)

### 3. 📡 Backend API (Native iOS App)
- **Status**: 🔄 Requires native app development
- **Purpose**: Full Apple Watch integration
- **Requirements**:
  - Native iOS app with HealthKit
  - Backend API endpoints
  - Your friend's backend implementation

---

## 🚀 Quick Start (Try It Now!)

### Option 1: Demo Mode (Instant!)
1. Open your app: http://localhost:3000
2. Go to **Activity Tracker** page
3. Select **🎮 Demo Mode (Simulated)**
4. Click **🔄 Sync Now**
5. Watch the heart rate animate!

### Option 2: Bluetooth Heart Rate Monitor
1. Get a Bluetooth heart rate monitor (chest strap or armband)
2. Open app in **Chrome or Edge** (Web Bluetooth support)
3. Select **🔗 Bluetooth Heart Rate Monitor**
4. Click **🔗 Connect Bluetooth**
5. Select your device from the popup
6. Real-time heart rate will appear!

**Compatible Devices**:
- Polar H10
- Wahoo TICKR
- Garmin HRM-Dual
- Most Bluetooth LE heart rate monitors

---

## 📱 Full Apple Watch Integration (Long-term Solution)

### Step 1: Create iOS Companion App

You need to build a native iOS app using Xcode:

#### Project Setup
```bash
# In Xcode:
# 1. Create new iOS App project
# 2. Add HealthKit capability
# 3. Add Watch App target (optional)
```

#### Info.plist Requirements
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to track your fitness goals</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need to update your health data</string>
```

#### HealthKit Manager (Swift)
Create `HealthKitManager.swift`:

```swift
import HealthKit
import Foundation

class HealthKitManager: ObservableObject {
    let healthStore = HKHealthStore()
    @Published var heartRate: Double = 0
    @Published var activities: [Activity] = []
    
    let apiURL = "YOUR_BACKEND_URL/sync-watch"
    
    func requestAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            return
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.workoutType()
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                print("✅ HealthKit authorized")
                self.startObservingHealthData()
            } else {
                print("❌ HealthKit authorization failed: \\(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
    
    func startObservingHealthData() {
        observeHeartRate()
        observeWorkouts()
    }
    
    private func observeHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            return
        }
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { query, completionHandler, error in
            self.fetchLatestHeartRate()
            completionHandler()
        }
        
        healthStore.execute(query)
        
        // Also fetch immediately
        fetchLatestHeartRate()
        
        // Set up periodic fetch (every 10 seconds)
        Timer.scheduledTimer(withTimeInterval: 10, repeats: true) { _ in
            self.fetchLatestHeartRate()
        }
    }
    
    private func fetchLatestHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            return
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { query, results, error in
            
            guard let sample = results?.first as? HKQuantitySample else {
                return
            }
            
            let heartRateUnit = HKUnit.count().unitDivided(by: .minute())
            let heartRate = sample.quantity.doubleValue(for: heartRateUnit)
            
            DispatchQueue.main.async {
                self.heartRate = heartRate
                self.syncToBackend(heartRate: heartRate)
            }
        }
        
        healthStore.execute(query)
    }
    
    private func observeWorkouts() {
        let workoutType = HKObjectType.workoutType()
        
        let query = HKObserverQuery(sampleType: workoutType, predicate: nil) { query, completionHandler, error in
            self.fetchRecentWorkouts()
            completionHandler()
        }
        
        healthStore.execute(query)
        fetchRecentWorkouts()
    }
    
    private func fetchRecentWorkouts() {
        let workoutType = HKObjectType.workoutType()
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: today, end: Date(), options: .strictStartDate)
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { query, results, error in
            
            guard let workouts = results as? [HKWorkout] else {
                return
            }
            
            let activities = workouts.map { workout in
                Activity(
                    start: workout.startDate,
                    end: workout.endDate,
                    type: self.getActivityLevel(workout: workout),
                    caloriesBurned: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
                )
            }
            
            DispatchQueue.main.async {
                self.activities = activities
                self.syncActivitiesToBackend(activities)
            }
        }
        
        healthStore.execute(query)
    }
    
    private func getActivityLevel(workout: HKWorkout) -> String {
        let intensity = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
        let duration = workout.duration / 60 // minutes
        let caloriesPerMinute = intensity / duration
        
        if caloriesPerMinute > 10 {
            return "vigorous"
        } else if caloriesPerMinute > 6 {
            return "moderate"
        } else if caloriesPerMinute > 3 {
            return "light"
        } else {
            return "rest"
        }
    }
    
    private func syncToBackend(heartRate: Double) {
        guard let url = URL(string: apiURL) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let data: [String: Any] = [
            "userId": "user_001", // Get from your auth system
            "heartRate": heartRate,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: data)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("❌ Sync error: \\(error.localizedDescription)")
            } else {
                print("✅ Heart rate synced: \\(heartRate) BPM")
            }
        }.resume()
    }
    
    private func syncActivitiesToBackend(_ activities: [Activity]) {
        guard let url = URL(string: apiURL) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let activitiesData = activities.map { activity in
            [
                "start": ISO8601DateFormatter().string(from: activity.start),
                "end": ISO8601DateFormatter().string(from: activity.end),
                "type": activity.type,
                "caloriesBurned": activity.caloriesBurned
            ]
        }
        
        let data: [String: Any] = [
            "userId": "user_001",
            "activities": activitiesData
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: data)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("❌ Activity sync error: \\(error.localizedDescription)")
            } else {
                print("✅ Activities synced: \\(activities.count) activities")
            }
        }.resume()
    }
}

struct Activity {
    let start: Date
    let end: Date
    let type: String
    let caloriesBurned: Double
}
```

#### SwiftUI View
```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var healthKit = HealthKitManager()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Food for Thought")
                .font(.largeTitle)
                .bold()
            
            Text("Heart Rate: \\(Int(healthKit.heartRate)) BPM")
                .font(.title)
            
            Button("Request Health Access") {
                healthKit.requestAuthorization()
            }
            .buttonStyle(.borderedProminent)
            
            Text("Activities Today: \\(healthKit.activities.count)")
            
            Text("Data syncs automatically to backend")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
    }
}
```

### Step 2: Backend Endpoints (For Your Friend)

Add to `server/app.py`:

```python
from flask import Flask, request, jsonify
from datetime import datetime
import json

# Endpoint to receive data from iOS app
@app.route("/sync-watch", methods=["POST"])
def sync_watch():
    data = request.get_json()
    user_id = data.get("userId")
    
    # Save heart rate
    if "heartRate" in data:
        heart_rate_entry = {
            "userId": user_id,
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
            "bpm": int(data["heartRate"])
        }
        save_to_file("heartRateLogs.json", heart_rate_entry)
    
    # Save activities
    if "activities" in data:
        for activity in data["activities"]:
            activity_entry = {
                "userId": user_id,
                "start": activity["start"],
                "end": activity["end"],
                "activity_level": activity["type"],
                "estimated_calories_burned": activity["caloriesBurned"]
            }
            save_to_file("activityLogs.json", activity_entry)
    
    return jsonify({"status": "OK", "message": "Data synced successfully"})

# Endpoint for web app to fetch data
@app.route("/watch-data/<user_id>", methods=["GET"])
def get_watch_data(user_id):
    # Read latest heart rate
    heart_rate_data = read_from_file("heartRateLogs.json")
    latest_heart_rate = next((x for x in reversed(heart_rate_data) if x["userId"] == user_id), None)
    
    # Read today's activities
    today = datetime.now().strftime("%Y-%m-%d")
    activity_data = read_from_file("activityLogs.json")
    today_activities = [x for x in activity_data if x["userId"] == user_id and x["start"].startswith(today)]
    
    return jsonify({
        "heartRate": latest_heart_rate["bpm"] if latest_heart_rate else None,
        "activities": today_activities
    })

def save_to_file(filename, entry):
    filepath = f"data/{filename}"
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except:
        data = {filename.replace(".json", ""): []}
    
    key = list(data.keys())[0]
    data[key].append(entry)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

def read_from_file(filename):
    filepath = f"data/{filename}"
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            return list(data.values())[0]
    except:
        return []
```

### Step 3: Deploy & Connect

1. **Deploy Backend**: Make sure it's accessible via HTTPS
2. **Update iOS App**: Set the backend URL
3. **Update React App**: 
   ```bash
   # In .env
   REACT_APP_API_URL=https://your-backend.com
   ```
4. **Select Backend Mode**: In Activity Tracker, choose "📡 Backend API"

---

## 🧪 Testing Each Method

### Test Demo Mode
```
1. Select 🎮 Demo Mode
2. Click 🔄 Sync Now
3. ✅ Should see simulated heart rate
```

### Test Bluetooth
```
1. Turn on Bluetooth heart rate monitor
2. Select 🔗 Bluetooth Heart Rate Monitor
3. Click 🔗 Connect Bluetooth
4. Grant permissions in browser
5. ✅ Should see real heart rate
```

### Test Backend
```
1. Ensure backend is running
2. Ensure iOS app is syncing data
3. Select 📡 Backend API
4. ✅ Should auto-sync every 30 seconds
```

---

## 📋 Requirements Summary

| Method | Requirements | Complexity | Time |
|--------|--------------|------------|------|
| Demo | None | ⭐ Easy | 0 min (works now!) |
| Bluetooth | BLE heart rate monitor | ⭐⭐ Medium | 5 min setup |
| iOS App | Xcode, Apple Developer | ⭐⭐⭐⭐⭐ Hard | 1-2 weeks dev |

---

## 💡 Recommendations

### For Development/Demo (Now)
✅ Use **Demo Mode** - works instantly, perfect for showing off your app!

### For Beta Testing (Soon)
✅ Use **Bluetooth** - works with any BLE heart rate monitor, no app needed

### For Production (Long-term)
✅ Build **Native iOS App** - full Apple Watch integration, best user experience

---

## 🆘 Troubleshooting

### "Bluetooth not available"
- Use Chrome or Edge browser
- Ensure HTTPS (localhost is OK)
- Check device has Bluetooth

### "Backend sync failed"
- Verify backend is running
- Check CORS is enabled
- Confirm API URL is correct

### "No heart rate data"
- Make sure device is paired
- Check battery level
- Grant browser permissions

---

## 📚 Resources

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Apple HealthKit](https://developer.apple.com/documentation/healthkit)
- [HKWorkout](https://developer.apple.com/documentation/healthkit/hkworkout)
- [React Hooks Best Practices](https://react.dev/reference/react)

---

🎉 **You're all set!** Your app now supports multiple Apple Watch connection methods!
