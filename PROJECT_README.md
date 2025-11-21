# 🍎 Food for Thought

An AI-powered fitness tracking application with Apple Watch integration, computer vision food recognition, and a motivational tamagotchi companion!

## 🌟 Features

- **Smart Food Logging**
  - 📸 AI-powered food recognition via computer vision
  - ✍️ Manual entry with detailed nutritional tracking
  - 🤖 Confidence scoring for AI predictions
  
- **Apple Watch Integration**
  - ⌚ Real-time heart rate monitoring
  - 🏃‍♂️ Automatic activity detection
  - 🔥 Calorie burn estimation

- **Tamagotchi Companion**
  - 😊 Dynamic mood system
  - 🎉 Celebrates your achievements
  - 💬 Personalized motivational messages

- **Comprehensive Tracking**
  - 📊 Daily calorie and macro tracking
  - ⚖️ Weight progress monitoring
  - 🎯 Customizable fitness goals

## 🚀 Quick Start

### Frontend (React + TypeScript)

```bash
cd client
npm install
cp .env.example .env
npm start
```

The app will run at `http://localhost:3000`

### Backend (Python + Flask)

```bash
cd server
pip install -r requirements.txt
python app.py
```

The API will run at `http://localhost:8080`

## 📁 Project Structure

```
food-for-thought/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── FoodLogger.tsx
│   │   │   ├── ActivityTracker.tsx
│   │   │   └── Tamagotchi.tsx
│   │   ├── App.tsx        # Main app
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── mockData.ts    # Demo data
│   ├── package.json
│   └── README.md
│
├── server/                # Python backend
│   ├── app.py            # Flask server
│   ├── handle_rag.py     # RAG system
│   ├── requirements.txt
│   └── data/             # JSON data storage
│       ├── userData.json
│       ├── foodLogs.json
│       ├── activityLogs.json
│       ├── heartRateLogs.json
│       ├── weightLogs.json
│       └── dailyEnergyLogs.json
│
└── README.md
```

## 🎨 Tech Stack

### Frontend
- **React 18** + TypeScript
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **Modern CSS** - Gradients and responsive design

### Backend
- **Flask** - Python web framework
- **Transformers** - AI/ML models
- **ChromaDB** - Vector database for RAG
- **OpenCV** - Image processing
- **PyTorch** - Deep learning

## 🎯 Core Components

### 1. Dashboard
- Daily calorie overview
- Macro goals visualization
- Progress tracking
- Weight history

### 2. Profile Management
- User biometrics (age, sex, height, weight)
- Fitness goals (weight loss/gain/maintenance)
- Customizable macro targets
- BMI calculator

### 3. Food Logger
- **Photo Mode**: Take/upload food photos for AI analysis
- **Manual Mode**: Enter food details manually
- Real-time nutritional information
- Edit AI-suggested values before saving

### 4. Activity Tracker
- Apple Watch connection status
- Real-time heart rate monitoring
- Activity session tracking
- Calorie burn estimation

### 5. Tamagotchi
- Dynamic mood system (happy, excited, sad, tired, neutral)
- Health bar visualization
- Motivational messages
- Celebrates achievements

## 🔌 API Endpoints (Backend)

### User Management
- `GET /users/:userId` - Get user profile
- `POST /users` - Create new user
- `PUT /users/:userId` - Update user profile

### Food Logging
- `POST /analyze-food` - AI food image analysis
- `POST /food-logs` - Log food entry
- `GET /food-logs/:userId` - Get user's food logs

### Activity & Health
- `POST /sync-watch` - Sync Apple Watch data
- `GET /heart-rate/:userId` - Get heart rate logs
- `GET /activities/:userId` - Get activity sessions
- `GET /daily-summary/:userId` - Get daily summary

### Tamagotchi
- `GET /tamagotchi/:userId` - Get tamagotchi state

## 🎨 Color Palette

- **Primary Gradient**: `#667eea` → `#764ba2` (Purple)
- **Secondary Gradient**: `#f093fb` → `#f5576c` (Pink)
- **Success Gradient**: `#43e97b` → `#38f9d7` (Green)
- **Accent Gradient**: `#feca57` → `#fdcb6e` (Yellow/Gold)

## 🚧 Roadmap

- [ ] OCR for nutritional label scanning
- [ ] Enhanced tamagotchi personality system
- [ ] Social features (challenges, leaderboards)
- [ ] Meal planning and recipes
- [ ] More wearable integrations
- [ ] Progressive Web App (PWA)
- [ ] Dark mode
- [ ] Multi-language support

## 📄 License

MIT

## 👥 Contributors

Built with ❤️ by the Food for Thought team

---

**Note**: This is currently in active development. The backend handles the AI models and data processing, while the frontend provides a beautiful, user-friendly interface with vibrant colors and smooth animations!
