# 🚀 Quick Setup - Express Backend with MongoDB

## ✅ What Was Done

Migrated Apple Health logic from Flask (server/) to Express (server2/) with MongoDB persistence!

## 📋 Setup Steps (5 minutes)

### 1. Install MongoDB (macOS)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
# You should see: "Connected to: mongodb://127.0.0.1:27017"
# Type: exit
```

### 2. Install Node Dependencies
```bash
cd /Users/rafael/Downloads/Projects/food-for-thought/server2
npm install
```

### 3. Start Express Server
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB
🍎 Food for Thought - Health API Server
📡 Server running on: http://0.0.0.0:8080
```

### 4. Test It Works
Open new terminal:
```bash
curl http://192.168.1.26:8080/api/health/test
```

Should return:
```json
{"status":"healthy","message":"Health API is running","timestamp":"..."}
```

## ✨ What You Get

### Benefits Over Flask:
- ✅ **Persistent Storage**: Data saved in MongoDB (survives restarts!)
- ✅ **Better Performance**: Express is faster
- ✅ **Production Ready**: Easy to deploy to Railway, Heroku, etc.
- ✅ **Scalable**: Can handle thousands of requests
- ✅ **Real Database Queries**: Filter, sort, aggregate data

### Your iOS App Still Works!
No changes needed - same API endpoints:
- `POST /api/health/sync`
- `GET /api/health/:userId`
- `GET /api/health/activities/:userId`
- `GET /api/health/watch-status/:userId`

### Your React App Still Works!
Same `REACT_APP_API_URL=http://192.168.1.26:8080`

## 🎯 Complete Flow

```
Apple Watch
    ↓
iOS App → http://192.168.1.26:8080/api/health/sync
    ↓
Express Server (Node.js)
    ↓
MongoDB Database (Persistent!)
    ↓
React Web App ← http://192.168.1.26:8080/api/health/user123
    ↓
HealthContext (React State)
    ↓
HeartRateGraph 📈
```

## 🔍 View Your Data in MongoDB

```bash
# Open MongoDB shell
mongosh

# Use your database
use food-for-thought

# See all collections
show collections

# View heart rate data
db.heartrates.find().pretty()

# View activities
db.activities.find().pretty()

# Count total heart rates
db.heartrates.countDocuments()

# Get latest heart rate
db.heartrates.find().sort({timestamp: -1}).limit(1).pretty()

# Exit
exit
```

## 📊 Folder Structure

```
server/              ← Flask (for food classification)
  ├── app.py
  └── models/

server2/             ← Express (for Apple Watch health data) ✨ NEW!
  ├── server.js
  ├── .env
  ├── package.json
  ├── models/
  │   ├── HeartRate.js
  │   ├── Activity.js
  │   └── Steps.js
  └── routes/
      └── health.js
```

## 🎉 You're Done!

Now you have:
1. ✅ Express backend with MongoDB (server2/)
2. ✅ Flask backend for food classification (server/)
3. ✅ React frontend with heart rate graph (client/)
4. ✅ iOS app syncing to persistent database

**Data is now saved permanently in MongoDB!** 🎊

## 🚀 Next: Test End-to-End

1. **Start Express**: `cd server2 && npm start`
2. **Start React**: `cd client && npm start`
3. **Rebuild iOS app** in Xcode
4. **Sync from iPhone**: Tap "Sync Health Data"
5. **View in MongoDB**: `mongosh` → `use food-for-thought` → `db.heartrates.find().pretty()`
6. **View in React**: Go to Activity tab → See heart rate graph!

Your data is now persistent! 🎉
