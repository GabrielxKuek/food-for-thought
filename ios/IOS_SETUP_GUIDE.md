# 📱 iOS App Setup Guide - Step by Step

## Complete guide to building the iOS app that connects your Apple Watch to the web app

---

## 🎯 Overview

You'll create an iOS app called "FoodForThoughtHealth" that:
1. Requests permission to read HealthKit data
2. Reads heart rate from Apple Watch
3. Reads activity sessions (workouts)
4. Sends data to your Flask backend
5. Syncs automatically in the background

**Time needed:** 4-6 hours
**Difficulty:** Medium (I provide all code!)

---

## 📋 Step 1: Create Xcode Project (30 minutes)

### 1.1 Open Xcode
```bash
# Launch Xcode from Applications folder
# Or use Spotlight: Cmd + Space, type "Xcode"
```

### 1.2 Create New Project
1. **File → New → Project** (or Cmd + Shift + N)
2. Choose **iOS** tab at the top
3. Select **App** template
4. Click **Next**

### 1.3 Configure Project
Fill in these details:
```
Product Name: FoodForThoughtHealth
Team: [Your Apple ID]
Organization Identifier: com.yourname (e.g., com.rafael)
Bundle Identifier: (auto-generated: com.yourname.FoodForThoughtHealth)
Interface: SwiftUI
Language: Swift
☑️ Include Tests (optional)
```

Click **Next**, choose save location, click **Create**

---

## 📋 Step 2: Add HealthKit Capability (10 minutes)

### 2.1 Enable HealthKit

1. **Click on your project** in left sidebar (top blue icon)
2. Select **FoodForThoughtHealth** target (under TARGETS)
3. Click **"Signing & Capabilities"** tab
4. Click **"+ Capability"** button
5. Search for **"HealthKit"**
6. Double-click **HealthKit** to add it

You should now see "HealthKit" section with:
- ☑️ Clinical Health Records
- ☑️ Background Delivery

### 2.2 Add Privacy Descriptions

1. In left sidebar, find **Info.plist** file
2. Right-click on Info.plist → **Open As → Source Code**
3. Find the `<dict>` tag near the top
4. **Add these lines inside the `<dict>` section:**

```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to track your fitness progress and sync with your fitness goals.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>We need to update your health data to provide accurate fitness tracking.</string>

<key>NSHealthClinicalHealthRecordsShareUsageDescription</key>
<string>This app does not access clinical health records.</string>
```

**Save the file** (Cmd + S)

---

## 📋 Step 3: Create Swift Files (2-3 hours)

### 3.1 Create HealthDataModel.swift

1. **Right-click** on **FoodForThoughtHealth** folder in left sidebar
2. Select **New File...** (or Cmd + N)
3. Choose **Swift File**
4. Click **Next**
5. Name it: **HealthDataModel.swift**
6. Click **Create**

7. **Delete all content** in the file
8. **Copy the entire code** from the section below
9. **Paste** into the file
10. **Save** (Cmd + S)

---

### 3.2 Create HealthKitManager.swift

Repeat the same process:
1. Right-click → New File → Swift File
2. Name: **HealthKitManager.swift**
3. Copy code from section below
4. Paste and save

---

### 3.3 Create APIService.swift

Same process:
1. New File → Swift File
2. Name: **APIService.swift**
3. Copy code, paste, save

---

### 3.4 Update ContentView.swift

This file already exists!
1. **Click on ContentView.swift** in left sidebar
2. **Delete ALL existing code**
3. **Copy code** from section below
4. **Paste** and save

---

## 📋 Step 4: Configure API URL (5 minutes)

### 4.1 Update API URL in APIService.swift

1. Open **APIService.swift**
2. Find this line near the top:
```swift
private let baseURL = "http://localhost:8080"
```

3. **For testing with iPhone connected to Mac:**
   - Find your Mac's IP address:
     ```bash
     # Open Terminal on Mac
     ifconfig | grep "inet " | grep -v 127.0.0.1
     ```
   - Update the line to:
     ```swift
     private let baseURL = "http://192.168.X.X:8080"  // Your Mac's IP
     ```

4. **Save the file**

---

## 📋 Step 5: Build and Run (30 minutes)

### 5.1 Connect iPhone to Mac

1. Connect iPhone to Mac with USB cable
2. **Unlock iPhone**
3. If prompted, tap **"Trust This Computer"** on iPhone
4. Enter iPhone passcode

### 5.2 Select Device

1. In Xcode toolbar at top, click device selector (next to "FoodForThoughtHealth")
2. Select your iPhone from the list (e.g., "Rafael's iPhone")

### 5.3 Build and Run

1. Click **▶ button** in top left (or Cmd + R)
2. Xcode will build the app (may take 1-2 minutes first time)
3. **If you see signing error:**
   - Go to Signing & Capabilities
   - Select your Team (Apple ID)
   - Xcode will fix it automatically

4. **On iPhone first time only:**
   - Settings → General → VPN & Device Management
   - Tap your Apple ID
   - Tap **"Trust"**
   - Go back to home screen
   - App should now launch

### 5.4 Grant Permissions

When app launches:
1. **Tap "Request HealthKit Access"**
2. HealthKit permission screen appears
3. **Turn ON all switches:**
   - Heart Rate
   - Active Energy Burned
   - Workouts
   - Step Count
4. **Tap "Allow"** in top right

---

## 📋 Step 6: Test the App (1 hour)

### 6.1 Start Backend

On your Mac in Terminal:
```bash
cd /Users/rafael/Downloads/Projects/food-for-thought/server
python app.py
```

Backend should show: `Running on http://0.0.0.0:8080`

### 6.2 Test Manual Sync

1. **On iPhone app**, tap **"Sync Health Data"** button
2. You should see:
   - "Syncing..." message
   - After 2-3 seconds: "Sync Successful!"
   - Heart rate displayed
   - Activities listed

3. **Check backend logs:**
   - Terminal should show: "Synced health data for user..."

4. **Open web app:**
   ```bash
   # In another terminal
   cd /Users/rafael/Downloads/Projects/food-for-thought/client
   npm start
   ```
   - Go to Activity Tracker page
   - You should see REAL data from Apple Watch! 🎉

### 6.3 Test Background Sync

1. **Close the iOS app** (swipe up)
2. **Wear Apple Watch**
3. **Do some activity** (walk around, increase heart rate)
4. **Wait 15 minutes**
5. **Open web app** - new data should appear!

---

## 📋 Step 7: Troubleshooting

### Problem: "Code Signing Error"
**Solution:**
- Xcode → Preferences → Accounts
- Click **"+"** and add your Apple ID
- Go back to project → Signing & Capabilities
- Select your Team

### Problem: "Cannot connect to backend"
**Solution:**
- Make sure Flask is running on Mac
- Check firewall isn't blocking port 8080
- Verify IP address is correct
- Try `http://YOUR-MAC-IP:8080/api/health/test` in Safari on iPhone

### Problem: "No health data available"
**Solution:**
- Open Apple Health app on iPhone
- Check if data exists
- Make sure Apple Watch is synced (open Watch app)
- Try generating some activity (walk around with watch on)

### Problem: "HealthKit permission denied"
**Solution:**
- iPhone Settings → Health → Data Access & Devices
- Find "FoodForThoughtHealth"
- Turn ON all permissions
- Restart app

---

## 🎉 Success Checklist

- [ ] Xcode project created
- [ ] HealthKit capability added
- [ ] Privacy descriptions in Info.plist
- [ ] All 4 Swift files created
- [ ] API URL configured
- [ ] App builds without errors
- [ ] App runs on iPhone
- [ ] HealthKit permissions granted
- [ ] Manual sync works
- [ ] Data appears in backend logs
- [ ] Data displays in web app
- [ ] Background sync working

---

## 📱 iOS App Features

Your app can now:
- ✅ Read heart rate from Apple Watch
- ✅ Read workout/activity sessions
- ✅ Read step count
- ✅ Sync to backend API
- ✅ Run in background
- ✅ Auto-sync every 15 minutes
- ✅ Handle errors gracefully
- ✅ Display sync status

---

## 🚀 Next Steps

After basic testing works:

### Optional Enhancements
1. **Add user authentication** (login screen)
2. **Show more health metrics** (distance, active calories)
3. **Add Apple Watch app UI** (native watch app)
4. **Improve error handling** (retry logic)
5. **Add notifications** (sync success/failure)
6. **Optimize battery usage** (reduce sync frequency)

### Production Deployment
1. **Test extensively** (different scenarios)
2. **Deploy backend to cloud** (Heroku, AWS)
3. **Update API URL** to production server
4. **Submit to App Store** ($99/year Developer Program)
5. **Beta test with TestFlight**
6. **Launch! 🎉**

---

## 📚 Resources

**If you get stuck:**
- Apple HealthKit Docs: https://developer.apple.com/documentation/healthkit
- Swift Documentation: https://docs.swift.org
- Stack Overflow: Search for specific errors
- **Ask me!** I'm here to help debug

**Learning Swift:**
- 100 Days of SwiftUI: https://www.hackingwithswift.com/100/swiftui
- Apple Swift Tutorials: https://developer.apple.com/tutorials/swiftui

---

## 💡 Tips

1. **Keep Xcode updated** for best experience
2. **Test on real device** - simulator has limited HealthKit data
3. **Keep iPhone unlocked** during initial testing
4. **Check Console.app** on Mac for detailed iOS logs
5. **Use breakpoints** in Xcode to debug issues
6. **Commit to git** after each working step

---

## ✅ You're Ready!

The iOS app code is in the next files. Start with Step 1 above and work through each step carefully.

**Remember:** I'm here to help if you hit any issues! Just share the error message and I'll guide you through fixing it.

Good luck! You've got this! 🚀
