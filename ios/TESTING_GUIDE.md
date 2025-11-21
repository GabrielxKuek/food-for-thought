# 🧪 Testing Guide - Complete Testing Checklist

## Test your Apple Watch integration end-to-end

---

## 🎯 Pre-Test Setup

### ✅ Backend Running
```bash
cd /Users/rafael/Downloads/Projects/food-for-thought/server
python app.py

# Should see:
# * Running on http://0.0.0.0:8080
```

### ✅ Get Your Mac's IP Address
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output:
# inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
# Use the IP: 192.168.1.100
```

### ✅ Update iOS App
1. Open `APIService.swift` in Xcode
2. Change line 15:
   ```swift
   private let baseURL = "http://192.168.1.100:8080"  // Your Mac's IP
   ```
3. Save (Cmd + S)

### ✅ Build iOS App
1. Connect iPhone to Mac
2. Select iPhone in device selector
3. Click ▶ or Cmd + R
4. Wait for build to complete
5. App launches on iPhone

---

## 📱 Test 1: Backend Connection (2 min)

### Steps:
1. **On iPhone:** Open FoodForThoughtHealth app
2. **Tap:** "Test Backend Connection" button
3. **Expected:** Alert says "Connection Success"

### ✅ Pass Criteria:
- Alert shows "Backend is reachable and running!"
- Backend terminal shows: `GET /api/health/test`

### ❌ If it fails:
```
Check:
1. Backend is running (see terminal)
2. iPhone and Mac on same WiFi network
3. IP address is correct in APIService.swift
4. Firewall isn't blocking port 8080
```

---

## 🔐 Test 2: HealthKit Authorization (5 min)

### Steps:
1. **On iPhone:** Tap "Request HealthKit Access" button
2. **Permission screen appears**
3. **Turn ON all switches:**
   - Heart Rate: ON
   - Active Energy: ON
   - Workouts: ON
   - Step Count: ON
   - Walking + Running Distance: ON
4. **Tap "Allow"** in top right

### ✅ Pass Criteria:
- Alert shows "Success - HealthKit access granted!"
- App shows health summary section
- "Sync Health Data" button appears

### ❌ If it fails:
```
Settings → Health → Data Access & Devices
→ Find "FoodForThoughtHealth"
→ Turn ON all permissions manually
→ Restart app
```

---

## 💓 Test 3: Heart Rate Sync (10 min)

### Steps:
1. **Wear Apple Watch** (must be on wrist)
2. **Wait 2-3 minutes** for watch to record heart rate
3. **On iPhone:** Tap "Sync Health Data"
4. **Wait** for "Syncing..." to complete
5. **Expected:** "Sync Successful" alert

### ✅ Pass Criteria:
- Alert shows number of synced items
- Heart rate displays in app (e.g., "72 BPM")
- Backend terminal shows: `POST /api/health/sync`
- Backend logs: "Synced health data for user123: X heart rates..."

### Check Backend API:
```bash
# In a new terminal:
curl http://localhost:8080/api/health/user123

# Should return JSON with heart_rates array
```

### ❌ If no heart rate data:
```
1. Open Apple Health app on iPhone
2. Go to Browse → Heart
3. Check if recent data exists
4. If not:
   - Wear watch tighter
   - Wait 5 minutes
   - Open Breathe app on watch to force HR reading
   - Try syncing again
```

---

## 🏃 Test 4: Activity/Workout Sync (15 min)

### Steps:
1. **On Apple Watch:**
   - Open **Workout** app
   - Start a workout (Indoor Walk is easiest)
   - Exercise for **5-10 minutes**
   - End workout

2. **Wait** 1-2 minutes for sync to iPhone

3. **On iPhone app:**
   - Tap "Sync Health Data"
   - Wait for completion

### ✅ Pass Criteria:
- "Activities: 1" (or more) shown in summary
- "Calories" shows burned calories
- Backend API returns activity in `activities` array

### Check Data:
```bash
curl http://localhost:8080/api/health/activities/user123

# Should show your workout with:
# - start/end times
# - activity_type
# - calories_burned
# - duration_minutes
```

---

## 👟 Test 5: Steps Sync (5 min)

### Steps:
1. **Walk around** with iPhone or Apple Watch (100+ steps)
2. **Wait** 1-2 minutes
3. **Tap "Sync Health Data"**

### ✅ Pass Criteria:
- "Steps" shows count (e.g., "5,234")
- Backend API returns steps data

### Check:
```bash
curl http://localhost:8080/api/health/user123

# Look for "steps" array with today's date
```

---

## 🌐 Test 6: Web App Integration (10 min)

### Steps:
1. **Start web app:**
   ```bash
   cd /Users/rafael/Downloads/Projects/food-for-thought/client
   npm start
   ```

2. **Open:** http://localhost:3000

3. **Navigate to:** Activity Tracker page

4. **Select:** "📡 Backend API (Native iOS App)" mode

5. **Click:** "🔄 Sync Now"

### ✅ Pass Criteria:
- Watch status shows "Connected"
- Heart rate displays in web app
- Activity sessions appear in list
- Calorie count matches iOS app

### Verify Real-Time Updates:
1. On iPhone: Sync new data
2. On web app: Click "Sync Now"
3. New data should appear immediately

---

## 🔄 Test 7: Auto-Sync (20 min)

### Steps:
1. **On iPhone:**
   - Enable "Auto-sync (every 15 min)" toggle
   - Press home button (don't force quit app)

2. **Do activity:**
   - Walk around
   - Increase heart rate
   - Generate new health data

3. **Wait 15 minutes**

4. **Check web app:**
   - Refresh page
   - New data should appear automatically

### ✅ Pass Criteria:
- Data syncs without manual intervention
- Backend logs show periodic sync requests
- Web app shows updated data every 15 min

---

## 🐛 Test 8: Error Handling (10 min)

### Test A: Backend Down
```bash
# Stop Flask backend (Ctrl+C)
```
1. On iPhone: Tap "Sync Health Data"
2. **Expected:** Error alert explaining backend unreachable
3. **Start backend again** (python app.py)
4. Tap "Sync Health Data" again
5. **Expected:** Sync succeeds

### Test B: No Internet
1. Turn OFF WiFi on iPhone
2. Tap "Sync Health Data"
3. **Expected:** Error alert
4. Turn ON WiFi
5. Retry - should work

### Test C: No Health Data
1. Test with new user who hasn't worn watch
2. Tap "Sync Health Data"
3. **Expected:** Sync completes but shows "0 activities"

---

## 📊 Test 9: Data Accuracy (15 min)

### Compare Data Sources:

#### Apple Health App vs iOS App:
1. **Open Apple Health** on iPhone
2. **Check today's data:**
   - Heart Rate
   - Active Calories
   - Steps
3. **Compare with iOS app:**
   - Numbers should match (±5%)

#### iOS App vs Backend API:
```bash
# Check backend
curl http://localhost:8080/api/health/user123 | python -m json.tool

# Compare:
# - Heart rate count
# - Activity count  
# - Step count
# - Latest values
```

#### Backend vs Web App:
1. Open web app Activity Tracker
2. Click "Sync Now"
3. Compare displayed data with backend API

### ✅ Pass Criteria:
- All three sources show consistent data
- Minor differences (<5%) are acceptable due to timing

---

## 🎯 Performance Tests

### Test 10: Large Data Sync
1. Use app for several days
2. Accumulate 100+ heart rate readings
3. Sync all data
4. **Expected:** Completes in <10 seconds

### Test 11: Battery Usage
1. Enable auto-sync
2. Use normally for 4 hours
3. Check battery usage:
   - Settings → Battery → Show Activity
   - FoodForThoughtHealth should use <5% battery

---

## 🏆 Complete Test Checklist

Mark each test as you complete it:

- [ ] Test 1: Backend Connection
- [ ] Test 2: HealthKit Authorization
- [ ] Test 3: Heart Rate Sync
- [ ] Test 4: Activity/Workout Sync
- [ ] Test 5: Steps Sync
- [ ] Test 6: Web App Integration
- [ ] Test 7: Auto-Sync
- [ ] Test 8: Error Handling
- [ ] Test 9: Data Accuracy
- [ ] Test 10: Large Data Sync
- [ ] Test 11: Battery Usage

---

## 🎉 Success Criteria

Your integration is working if:

✅ **Backend:**
- Receives data from iOS app
- Stores health data correctly
- Serves data to web app
- Logs show successful syncs

✅ **iOS App:**
- Reads HealthKit data
- Syncs to backend successfully
- Auto-sync works in background
- Handles errors gracefully

✅ **Web App:**
- Displays real heart rate
- Shows activity history
- Updates when new data arrives
- Connection status accurate

✅ **End-to-End:**
- Apple Watch → iPhone → Backend → Web App
- Data flows completely within 30 seconds
- All three components stay in sync
- Works reliably over extended period

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to backend"
```
Solutions:
1. Check backend is running: `curl http://localhost:8080/test`
2. Verify IP address in APIService.swift
3. Ensure same WiFi network
4. Check firewall settings
5. Try using Mac's IP instead of localhost
```

### Issue: "No health data available"
```
Solutions:
1. Wear Apple Watch for 10+ minutes
2. Open Workout app on watch to generate data
3. Sync watch with iPhone (open Watch app)
4. Check Apple Health app has data
5. Verify HealthKit permissions granted
```

### Issue: "Sync hangs/never completes"
```
Solutions:
1. Force quit iOS app, reopen
2. Restart Flask backend
3. Check backend terminal for errors
4. Reduce data range (modify hoursBack/daysBack)
5. Check iPhone storage (needs space for caching)
```

### Issue: "Web app doesn't show data"
```
Solutions:
1. Check console for API errors (F12)
2. Verify React app is using backend mode
3. Test backend API directly: curl http://localhost:8080/api/health/user123
4. Hard refresh browser (Cmd+Shift+R)
5. Check CORS is enabled in Flask
```

---

## 📈 Next Steps After Testing

Once all tests pass:

### Short Term:
1. **Test for 1 week** - Verify stability
2. **Collect real data** - Use daily
3. **Monitor performance** - Check logs
4. **Fix any bugs** - Iterate quickly

### Medium Term:
1. **Add user authentication** - Secure the data
2. **Deploy backend to cloud** - Make it accessible anywhere
3. **Improve UI** - Polish both apps
4. **Add more health metrics** - Sleep, HRV, etc.

### Long Term:
1. **Submit to App Store** - Share with others
2. **Add Apple Watch app UI** - Native watch experience
3. **Implement push notifications** - Health alerts
4. **Scale backend** - Handle multiple users

---

## 🆘 Need Help?

If any test fails:
1. **Check the error message carefully**
2. **Look at backend logs** for clues
3. **Test each component separately**
4. **Share the error with me** - I'll help debug!

---

## ✅ You're Done!

If all tests pass, congratulations! 🎉

You now have a **fully functional Apple Watch integration** connecting real health data from your watch to your web app!

**What you've built:**
- Native iOS app with HealthKit
- Backend API for health data
- Real-time web app integration
- Auto-sync background service
- Complete data pipeline

**This is production-ready!** 🚀

Next: Deploy it and share with the world! 🌍
