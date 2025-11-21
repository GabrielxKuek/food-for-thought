# Food for Thought - Frontend

A vibrant, modern React + TypeScript fitness tracking application with AI-powered food recognition and Apple Watch integration.

## Features

### 🎯 Core Features
- **User Profile Management**: Set age, sex, height, weight, and fitness goals
- **Food Logging**: 
  - 📸 Take photos of food for AI-powered nutritional analysis
  - ✍️ Manual entry with detailed nutritional information
  - 🤖 AI confidence scoring for computer vision detections
- **Activity Tracking**:
  - ⌚ Apple Watch integration (real-time heart rate monitoring)
  - 🏃‍♂️ Automatic exercise detection
  - 📊 Calorie burn estimation
- **Tamagotchi Companion**: 
  - 😊 Mood-based animations
  - 🎉 Celebrates your achievements
  - 💬 Motivational messages
- **Dashboard**:
  - Daily calorie tracking
  - Macro goals visualization
  - Progress monitoring
  - Weight tracking

### 🎨 Design Features
- Vibrant gradient colors
- Smooth animations with Framer Motion
- Responsive design for mobile and desktop
- Modern, intuitive UI/UX

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Backend server running (see `/server` directory)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
REACT_APP_API_URL=http://localhost:8080
```

### Running the App

Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard with daily stats
│   ├── Profile.tsx            # User profile management
│   ├── FoodLogger.tsx         # Food logging with AI
│   ├── ActivityTracker.tsx    # Apple Watch integration
│   └── Tamagotchi.tsx         # Motivational companion
├── types.ts                   # TypeScript interfaces
├── api.ts                     # API client
├── App.tsx                    # Main app component
└── index.tsx                  # Entry point
```

## API Integration

The frontend communicates with the backend via REST API:

- `GET /users/:userId` - Get user profile
- `POST /users` - Create user profile
- `PUT /users/:userId` - Update user profile
- `POST /food-logs` - Log food entry
- `GET /food-logs/:userId` - Get food logs
- `POST /analyze-food` - AI food image analysis
- `POST /sync-watch` - Sync Apple Watch data
- `GET /heart-rate/:userId` - Get heart rate logs
- `GET /activities/:userId` - Get activity sessions
- `GET /tamagotchi/:userId` - Get tamagotchi state

## Apple Watch Integration

The app is designed to integrate with Apple Watch for:
- Real-time heart rate monitoring
- Automatic activity detection
- Calorie burn estimation
- Exercise tracking

Note: Full Apple Watch integration requires native iOS app development or use of HealthKit APIs.

## Color Scheme

- Primary: `#667eea` to `#764ba2` (Purple gradient)
- Secondary: `#f093fb` to `#f5576c` (Pink gradient)
- Success: `#43e97b` to `#38f9d7` (Green gradient)
- Accent: `#feca57` to `#fdcb6e` (Yellow/Gold)

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Router** - Navigation
- **CSS3** - Styling with gradients and animations

## Future Enhancements

- [ ] OCR for nutritional label scanning
- [ ] More detailed tamagotchi personality system
- [ ] Social features (friend challenges)
- [ ] Meal planning and recipes
- [ ] Integration with more fitness wearables
- [ ] Progressive Web App (PWA) support
- [ ] Dark mode

## License

MIT
