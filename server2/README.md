# Food for Thought - Health API (Express + MongoDB)

## 🎯 Overview

Clean Express.js backend for handling Apple Watch health data with MongoDB persistence.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server2
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

**Option B: MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env` file with connection string

### 3. Configure Environment

Update `server2/.env`:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/food-for-thought
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🍎 Food for Thought - Health API Server
📡 Server running on: http://0.0.0.0:8080
```

## 📊 Database Schema

### HeartRate Collection
```javascript
{
  userId: String,
  timestamp: Date,
  bpm: Number,
  source: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Collection
```javascript
{
  userId: String,
  start: Date,
  end: Date,
  activityType: String, // running, walking, cycling, etc.
  caloriesBurned: Number,
  durationMinutes: Number,
  avgHeartRate: Number,
  distanceMeters: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Steps Collection
```javascript
{
  userId: String,
  date: String, // YYYY-MM-DD
  steps: Number,
  distanceMeters: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### POST /api/health/sync
Sync health data from iOS app.

**Request:**
```json
{
  "user_id": "user123",
  "heart_rates": [
    {
      "timestamp": "2024-11-22T10:30:00Z",
      "bpm": 75,
      "source": "Apple Watch"
    }
  ],
  "activities": [
    {
      "start": "2024-11-22T09:00:00Z",
      "end": "2024-11-22T09:30:00Z",
      "activity_type": "running",
      "calories_burned": 250,
      "duration_minutes": 30,
      "avg_heart_rate": 145,
      "distance_meters": 5000
    }
  ],
  "steps": [
    {
      "date": "2024-11-22",
      "steps": 8543,
      "distance_meters": 6234.5
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Health data synced successfully",
  "results": {
    "heart_rates_synced": 1,
    "activities_synced": 1,
    "steps_synced": 1
  }
}
```

### GET /api/health/:userId
Get all health data for a user.

**Response:**
```json
{
  "user_id": "user123",
  "current_heart_rate": {
    "bpm": 75,
    "timestamp": "2024-11-22T10:30:00Z",
    "source": "Apple Watch"
  },
  "heart_rates": [...],
  "activities": [...],
  "steps": [...],
  "summary": {
    "total_heart_rates": 100,
    "total_activities": 5,
    "total_calories_burned": 850,
    "total_steps": 8543,
    "last_sync": "2024-11-22T10:30:00Z"
  }
}
```

### GET /api/health/activities/:userId
Get activities for a user.

### GET /api/health/watch-status/:userId
Check if Apple Watch is recently connected.

### GET /api/health/test
Health check endpoint.

## 🔧 Update Configuration

### iOS App
Update `ios/APIService.swift` line 20:
```swift
private let baseURL = "http://192.168.1.26:8080"
```

### React Web App
Update `client/.env`:
```env
REACT_APP_API_URL=http://192.168.1.26:8080
```

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://192.168.1.26:8080/api/health/test

# Sync data
curl -X POST http://192.168.1.26:8080/api/health/sync \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "heart_rates": [{"timestamp": "2024-11-22T10:00:00Z", "bpm": 75}],
    "activities": [],
    "steps": []
  }'

# Get user data
curl http://192.168.1.26:8080/api/health/user123
```

### View Database
```bash
# Open MongoDB shell
mongosh

# Use database
use food-for-thought

# View collections
show collections

# View heart rates
db.heartrates.find().pretty()

# View activities
db.activities.find().pretty()

# View steps
db.steps.find().pretty()

# Count documents
db.heartrates.countDocuments()
```

## 📈 Benefits vs Flask

| Feature | Flask (server/) | Express (server2/) |
|---------|----------------|-------------------|
| Storage | In-memory | MongoDB (persistent) |
| Data Loss | On restart | Never |
| Scalability | Limited | High |
| Queries | Limited | Full MongoDB queries |
| Production Ready | No | Yes |

## 🚀 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up

# Add MongoDB
railway add mongodb
```

### Heroku
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create food-for-thought-health

# Add MongoDB
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main
```

## 🎯 Migration Complete!

Your new Express backend:
- ✅ Stores data in MongoDB (persistent)
- ✅ Same API endpoints as Flask version
- ✅ Better performance
- ✅ Production ready
- ✅ Easy to deploy
- ✅ Scalable

Your Flask backend (server/) is still there for food classification!
