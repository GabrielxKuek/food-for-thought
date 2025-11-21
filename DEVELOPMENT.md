# 🚀 Development Guide

## Getting Started Quickly

### 1. Install Dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd server
pip install -r requirements.txt
```

### 2. Environment Setup

#### Frontend
```bash
cd client
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:8080
```

### 3. Start Development Servers

#### Terminal 1 - Backend
```bash
cd server
python app.py
```
✅ Backend runs on `http://localhost:8080`

#### Terminal 2 - Frontend
```bash
cd client
npm start
```
✅ Frontend runs on `http://localhost:3000`

## 🎯 Development Workflow

### Frontend Development

The app uses a single-page application structure with these main pages:

1. **Dashboard** (`/`) - Overview of daily stats
2. **Profile** - User settings and goals
3. **Food Logger** - Food tracking with AI
4. **Activity Tracker** - Apple Watch integration

### Key Frontend Files

```
src/
├── App.tsx                    # Main app with routing
├── components/
│   ├── Dashboard.tsx          # Daily overview
│   ├── Profile.tsx            # User profile
│   ├── FoodLogger.tsx         # Food tracking
│   ├── ActivityTracker.tsx    # Activity tracking
│   └── Tamagotchi.tsx         # Motivational companion
├── api.ts                     # API client
├── types.ts                   # TypeScript interfaces
└── mockData.ts                # Demo/test data
```

### Adding New Features

#### 1. Add New API Endpoint

**Backend** (`server/app.py`):
```python
@app.route("/new-endpoint", methods=["POST"])
def new_endpoint():
    data = request.get_json()
    # Process data
    return jsonify({"status": "OK", "data": result})
```

**Frontend** (`client/src/api.ts`):
```typescript
export const callNewEndpoint = async (data: any) => {
  const response = await api.post('/new-endpoint', data);
  return response.data;
};
```

#### 2. Create New Component

```bash
cd client/src/components
touch NewComponent.tsx NewComponent.css
```

**NewComponent.tsx**:
```typescript
import React from 'react';
import './NewComponent.css';

interface NewComponentProps {
  // Define props
}

const NewComponent: React.FC<NewComponentProps> = (props) => {
  return (
    <div className="new-component">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

## 🎨 Styling Guide

### Color Variables
Use the predefined gradients:

```css
/* Primary Purple */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Secondary Pink */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Success Green */
background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);

/* Accent Yellow */
background: linear-gradient(135deg, #feca57 0%, #fdcb6e 100%);
```

### Common Classes
- `.card` - White card with shadow
- `.button` - Primary gradient button
- `.button.secondary` - Pink gradient button
- `.button.success` - Green gradient button
- `.stat-box` - Stat display with gradient
- `.input-group` - Form input wrapper

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test
```

### API Testing
Use tools like Postman or curl:

```bash
# Test backend health
curl http://localhost:8080/test

# Test user profile
curl http://localhost:8080/users/user_001
```

## 📱 Responsive Design

The app is mobile-first and responsive:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Media queries are in each component's CSS file.

## 🐛 Common Issues

### Issue: "Cannot find module 'react'"
**Solution**: Run `npm install` in the client directory

### Issue: Backend not connecting
**Solution**: 
1. Check backend is running on port 8080
2. Verify `.env` has correct `REACT_APP_API_URL`
3. Check CORS is enabled in Flask

### Issue: TypeScript errors
**Solution**: 
1. Restart VS Code
2. Run `npm install` again
3. Check `tsconfig.json` is present

## 🔧 Useful Commands

### Frontend
```bash
npm start          # Start dev server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (careful!)
```

### Backend
```bash
python app.py      # Start Flask server
pip freeze         # List installed packages
pip install -r requirements.txt  # Install dependencies
```

## 📊 Data Structure

All data is stored in JSON files in `server/data/`:

- `userData.json` - User profiles and goals
- `foodLogs.json` - Food entries
- `activityLogs.json` - Exercise sessions
- `heartRateLogs.json` - Heart rate data
- `weightLogs.json` - Weight tracking
- `dailyEnergyLogs.json` - Daily summaries

## 🎯 Next Steps

1. ✅ Frontend structure complete
2. 🔄 Connect frontend to backend APIs
3. 🔄 Implement Apple Watch integration
4. 🔄 Train/integrate food recognition model
5. 🔄 Add OCR for nutrition labels
6. 🔄 Enhance tamagotchi personality
7. 🔄 Add user authentication
8. 🔄 Deploy to production

## 💡 Pro Tips

1. **Use React DevTools** - Install browser extension for debugging
2. **Hot Reloading** - Frontend auto-refreshes on save
3. **Mock Data** - Use `mockData.ts` for development without backend
4. **API Testing** - Test backend endpoints independently first
5. **Console Logs** - Use `console.log()` liberally during development
6. **Git Branches** - Create feature branches for new work

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Framer Motion](https://www.framer.com/motion/)

Happy coding! 🚀
