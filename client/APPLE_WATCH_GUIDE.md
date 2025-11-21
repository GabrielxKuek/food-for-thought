# 🍎 Apple Watch Integration Guide

## Overview

To connect your React app to Apple Watch, you have several options depending on your deployment strategy.

## 🎯 Best Approach: Hybrid Architecture

```
Apple Watch → iPhone (Native App) → Backend API ← React Web App
```

### Architecture

1. **Native iOS App** (Swift/SwiftUI)
   - Accesses HealthKit data from Apple Watch
   - Syncs data to your backend
   
2. **Backend API** (Your friend's Python Flask)
   - Receives health data from iOS app
   - Stores and processes data
   - Serves data to web app

3. **React Web App** (This frontend)
   - Displays data from backend
   - Works on any device

## 📱 Implementation Steps

### Step 1: Create iOS Companion App (Required)

You'll need to create a native iOS app using Xcode:

```swift
// iOS App - HealthKitManager.swift
import HealthKit

class HealthKitManager {
    let healthStore = HKHealthStore()
    
    func requestAuthorization() {
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.workoutType()
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                print("HealthKit authorized")
                self.startObserving()
            }
        }
    }
    
    func startObserving() {
        // Observe heart rate
        let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate)!
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { query, completionHandler, error in
            self.fetchLatestHeartRate()
            completionHandler()
        }
        
        healthStore.execute(query)
    }
    
    func fetchLatestHeartRate() {
        // Fetch and sync to backend
    }
}
```

### Step 2: Backend API Endpoints (For your friend)

Add these endpoints to receive data from iOS app:

```python
# server/app.py

@app.route("/sync-watch", methods=["POST"])
def sync_watch_data():
    data = request.get_json()
    user_id = data.get("userId")
    
    # Heart rate data
    if "heartRate" in data:
        save_heart_rate(user_id, data["heartRate"])
    
    # Activity data
    if "activities" in data:
        save_activities(user_id, data["activities"])
    
    return jsonify({"status": "OK", "message": "Data synced"})

@app.route("/heart-rate/<user_id>", methods=["GET"])
def get_heart_rate(user_id):
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    
    # Query heart rate logs
    logs = query_heart_rate_logs(user_id, start_date, end_date)
    
    return jsonify({"status": "OK", "data": logs})

@app.route("/activities/<user_id>", methods=["GET"])
def get_activities(user_id):
    date = request.args.get("date", datetime.now().strftime("%Y-%m-%d"))
    
    # Query activity sessions
    sessions = query_activity_sessions(user_id, date)
    
    return jsonify({"status": "OK", "data": sessions})
```

### Step 3: Update React App (Already Done!)

Your frontend is already set up to consume this data! The `ActivityTracker` component just needs the backend to be ready.

## 🔄 Alternative: Web-Based Approach (PWA)

If you want to avoid building a native app, you can use Web APIs:

### Option A: Generic Sensors API

```typescript
// Works on supported browsers
if ('Accelerometer' in window) {
  const accelerometer = new Accelerometer({ frequency: 60 });
  accelerometer.addEventListener('reading', () => {
    console.log(`Acceleration: ${accelerometer.x}, ${accelerometer.y}, ${accelerometer.z}`);
  });
  accelerometer.start();
}
```

### Option B: Web Bluetooth (For Smart Devices)

```typescript
// Connect to Bluetooth heart rate monitors
async function connectToHeartRateMonitor() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    });
    
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');
    
    await characteristic.startNotifications();
    
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value;
      const heartRate = value.getUint8(1);
      console.log('Heart Rate:', heartRate);
    });
  } catch (error) {
    console.error('Bluetooth error:', error);
  }
}
```

## 🚀 Quick Start Implementation

I'll create enhanced components that support both approaches:

