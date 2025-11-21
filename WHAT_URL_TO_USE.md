# 🎯 ANSWER: What URL Should I Use?

## For Your MVP (Recommended):

### iOS App (`ios/APIService.swift` line 13):
```swift
private let baseURL = "http://192.168.1.100:8080"
```
**Replace `192.168.1.100` with YOUR Mac's IP address!**

### React Web App (`client/.env`):
```bash
REACT_APP_API_URL=http://192.168.1.100:8080
```
**Same IP address as above!**

---

## How to Find Your Mac's IP:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `inet 192.168.1.100`

---

## Why Not Use Vercel URL?

Your Vercel deployment (https://food-for-thought-lovat.vercel.app/) is **only the frontend**.

For MVP with temporary React Context storage, you still need the Flask backend running locally to:
1. Receive data from iOS app
2. Store in memory (HealthDataStore)
3. Serve data to web app
4. Web app stores in React Context

---

## Data Flow:

```
Apple Watch
    ↓
iOS App → http://YOUR_MAC_IP:8080/api/health/sync
    ↓
Flask Backend (In-Memory Storage)
    ↓
React Web App ← http://YOUR_MAC_IP:8080/api/health/user123
    ↓
HealthContext (React State - Temporary)
    ↓
HeartRateGraph Component
```

---

## ✅ Files Already Updated For You:

I've changed:
- ✅ `ios/APIService.swift` - Set to `http://192.168.1.100:8080`
- ✅ `client/.env` - Set to `http://192.168.1.100:8080`

**Just replace `192.168.1.100` with your actual Mac IP!**

---

## 🚀 Quick Start:

1. Find Mac IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Update both files above with your IP
3. Start Flask: `cd server && python app.py`
4. Start React: `cd client && npm start`
5. Rebuild iOS app in Xcode
6. Test sync!

---

## 💡 Summary:

**You DON'T need to deploy anything to Vercel for MVP!**

- Backend: Runs locally on your Mac (Flask)
- Frontend: Can run locally OR use Vercel (both work)
- Storage: React Context (temporary, in-memory)
- iOS App: Points to your Mac's local IP

**This is the simplest setup for MVP demo!** 🎉

See `MVP_LOCAL_SETUP.md` for detailed instructions.
