# Heart Rate Graph Feature - Documentation

## 🎯 Overview

This feature captures Apple Watch heart rate data and displays it in a beautiful, interactive graph with real-time updates. The data is temporarily stored in React Context for MVP testing without requiring a database.

## 📊 What Was Implemented

### 1. **HealthContext** (`/client/src/context/HealthContext.tsx`)
Global state management for all health data using React Context API.

**Features:**
- Stores heart rate data points (timestamp, BPM, source)
- Stores activity sessions with detailed metrics
- Stores daily step counts
- Tracks current heart rate and watch connection status
- Auto-deduplication of entries
- Keeps last 1000 heart rate readings max
- Tracks last sync timestamp

**API:**
```typescript
const {
  heartRates,              // Array of heart rate data points
  activities,              // Array of activity sessions
  steps,                   // Array of daily steps
  currentHeartRate,        // Current BPM (number | null)
  isWatchConnected,        // Connection status
  lastSyncTime,            // Last sync ISO timestamp
  addHeartRates,           // Add heart rate array
  addActivities,           // Add activities array
  addSteps,                // Add steps array
  setCurrentHeartRate,     // Update current BPM
  setWatchConnected,       // Update connection status
  updateSyncTime,          // Update sync timestamp
  clearAllData             // Clear all stored data
} = useHealth();
```

### 2. **HeartRateGraph Component** (`/client/src/components/HeartRateGraph.tsx`)
Beautiful, responsive graph visualization using Recharts library.

**Features:**
- Area chart with gradient fill
- Configurable time ranges (hour/day/week/all)
- Real-time statistics (avg, min, max, latest)
- Heart rate zones with color coding:
  - 🔵 Resting: < 60 BPM
  - 🟢 Light: 60-100 BPM
  - 🟡 Moderate: 100-140 BPM
  - 🟠 Vigorous: 140-170 BPM
  - 🔴 Maximum: > 170 BPM
- Custom tooltip showing full timestamp and zone
- Reference lines for each zone
- Large current heart rate display
- Stats bar with key metrics
- Zone legend with color indicators
- Fully responsive design

### 3. **Updated ActivityTracker** (`/client/src/components/ActivityTracker.tsx`)
Integrated with HealthContext to store and display data.

**Changes:**
- Uses `useHealth()` hook instead of local state
- Stores all synced data in context
- Generates 20 simulated heart rate readings for demo mode
- Stores real heart rates from backend API
- Updates sync timestamp on every sync
- Displays HeartRateGraph below connection status

### 4. **Updated App.tsx**
Wrapped entire app with HealthProvider for global state access.

## 🚀 How It Works

### Data Flow:

```
Apple Watch → iOS App → Flask Backend → React Frontend → HealthContext → HeartRateGraph
                                                              ↓
                                               (Temporary storage in memory)
```

### Sync Process:

1. **User clicks "Sync Now"** in ActivityTracker
2. **Backend Mode**: Fetches from Flask API at `/api/health/{userId}`
3. **Data received**:
   - Heart rates array → `addHeartRates()`
   - Activities array → `addActivities()`
   - Steps array → `addSteps()`
   - Current heart rate → `setCurrentHeartRate()`
4. **Context updates** trigger graph re-render
5. **Graph displays** latest data with animations

### Demo Mode (Simulator):

- Generates 20 random heart rate readings spanning last 20 minutes
- BPM range: 60-100 (simulating resting/light activity)
- Useful for testing UI without real watch

## 🎨 Visual Design

The heart rate graph features:
- **Gradient background**: Purple gradient (667eea → 764ba2)
- **Glass-morphism cards**: Frosted glass effect with backdrop blur
- **Smooth animations**: Recharts built-in transitions
- **Color-coded zones**: Each zone has distinct color
- **Responsive layout**: Works on mobile, tablet, desktop
- **Dark mode ready**: White text on dark background

## 📱 User Experience

### First Time Use:
1. User sees "No heart rate data yet" message
2. Selects connection method (Demo/Bluetooth/Backend)
3. Clicks "Sync Now"
4. Graph appears with data

### With Data:
- Large current BPM display at top right
- Stats bar showing avg/min/max/count
- Interactive area chart with tooltips
- Zone legend at bottom for reference
- Last sync time displayed

### Interactions:
- Hover over graph → See exact BPM and timestamp
- Visual feedback for each heart rate zone
- Auto-refresh when new data synced

## 🔧 Technical Details

### Dependencies Added:
```json
{
  "recharts": "^3.4.1"  // Chart library
}
```

### Data Structures:

```typescript
// Heart Rate Data Point
{
  timestamp: "2024-11-22T10:30:00.000Z",
  bpm: 85,
  source: "Apple Watch"
}

// Activity Data Point
{
  start: "2024-11-22T10:00:00.000Z",
  end: "2024-11-22T10:30:00.000Z",
  activity_type: "running",
  calories_burned: 250,
  duration_minutes: 30,
  avg_heart_rate: 145,
  distance_meters: 5000
}

// Steps Data Point
{
  date: "2024-11-22",
  steps: 8500,
  distance_meters: 6200
}
```

### Performance:
- Context keeps max 1000 heart rate readings
- Auto-deduplication prevents duplicates
- Sorted by timestamp (newest first)
- Efficient filtering for time ranges

## 🧪 Testing

### Test Demo Mode:
1. Select "🎮 Demo Mode (Simulated)"
2. Click "🔄 Sync Now"
3. Should see graph with 20 data points
4. Hover over points to see values

### Test Backend Mode:
1. Ensure Flask backend is running: `cd server && python app.py`
2. Ensure iOS app has synced real data
3. Select "📡 Backend API (Native iOS App)"
4. Click "🔄 Sync Now"
5. Should see real Apple Watch data

### Expected Results:
- ✅ Graph renders without errors
- ✅ Current heart rate updates
- ✅ Stats show correct calculations
- ✅ Tooltips display on hover
- ✅ Zones color-coded correctly
- ✅ Last sync time updates

## 🐛 Troubleshooting

### "No heart rate data yet" shows after sync:
- Check browser console for errors
- Verify backend response includes `heart_rates` array
- Check that `addHeartRates()` is being called
- Inspect React DevTools for HealthContext state

### Graph doesn't update after sync:
- Ensure HealthProvider wraps your app
- Check that ActivityTracker uses `useHealth()` hook
- Verify `updateSyncTime()` is called after sync
- Check that data is in correct format

### Backend sync fails:
- Verify Flask backend is running on port 8080
- Check REACT_APP_API_URL environment variable
- Ensure iOS app has synced data to backend
- Test API endpoint with curl:
  ```bash
  curl http://localhost:8080/api/health/user123
  ```

### Graph shows but values are wrong:
- Check data format matches expected structure
- Verify timestamps are valid ISO 8601 strings
- Ensure BPM values are integers
- Check for console errors about data parsing

## 📈 Future Enhancements

### Potential Improvements:
1. **Time range selector** - Dropdown to switch between hour/day/week/all
2. **Multiple metrics** - Show calories, steps on same graph
3. **Export functionality** - Download graph as PNG or CSV
4. **Persistent storage** - Save to database instead of context
5. **Real-time updates** - WebSocket for live heart rate
6. **Workout detection** - Highlight workout periods on graph
7. **Heart rate variability** - Show HRV trends
8. **Comparison view** - Compare today vs yesterday
9. **Goal tracking** - Set target heart rate zones
10. **Alerts** - Notify when entering specific zones

### Database Integration (Next Step):
Replace HealthContext with API calls:
```typescript
// Instead of context
const { heartRates } = useHealth();

// Use API query
const { data: heartRates } = useQuery('/api/heart-rates');
```

## 📚 Code Examples

### Using HealthContext in a Component:
```typescript
import { useHealth } from '../context/HealthContext';

function MyComponent() {
  const { 
    heartRates, 
    currentHeartRate, 
    addHeartRates 
  } = useHealth();

  const syncData = async () => {
    const response = await fetch('/api/health/user123');
    const data = await response.json();
    addHeartRates(data.heart_rates);
  };

  return (
    <div>
      <p>Current: {currentHeartRate} BPM</p>
      <p>History: {heartRates.length} readings</p>
      <button onClick={syncData}>Sync</button>
    </div>
  );
}
```

### Adding Custom Heart Rate Data:
```typescript
// Single reading
addHeartRates([{
  timestamp: new Date().toISOString(),
  bpm: 75,
  source: 'Manual Entry'
}]);

// Multiple readings
const readings = Array.from({ length: 10 }, (_, i) => ({
  timestamp: new Date(Date.now() - i * 60000).toISOString(),
  bpm: 70 + Math.floor(Math.random() * 20),
  source: 'Apple Watch'
}));
addHeartRates(readings);
```

## ✅ Summary

You now have a fully functional heart rate graphing system that:
- ✅ Captures Apple Watch data from backend
- ✅ Stores temporarily in React Context
- ✅ Displays in beautiful, interactive graph
- ✅ Shows real-time statistics and zones
- ✅ Works in demo mode for testing
- ✅ Fully responsive and user-friendly
- ✅ Ready for database integration later

**Next steps**: Test with real Apple Watch data, then integrate database for persistent storage! 🎉
