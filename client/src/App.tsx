import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import FoodLogger from './components/FoodLogger';
import ActivityTracker from './components/ActivityTracker';
import Planner from './components/Planner';
import Tamagotchi from './components/Tamagotchi';
import Chatbot from './components/Chatbot';
import { UserProfile } from './types';
import { HealthProvider } from './context/HealthContext';
import { LayoutDashboard, User, Utensils, Activity, ClipboardList } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'food' | 'activity' | 'planner'>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId] = useState<string>('user_001');

  useEffect(() => {
    if (!userProfile) {
      setUserProfile({
        userId: userId,
        profile: {
          age: 25,
          sex: 'male',
          height_cm: 175,
          initial_weight_kg: 70
        },
        goal: {
          type: 'maintenance',
          weekly_target_kg: 0,
          macro_goals: {
            carbs_g: 250,
            protein_g: 150,
            fat_g: 70
          }
        }
      });
    }
  }, [userId, userProfile]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userId={userId} userProfile={userProfile} />;
      case 'profile':
        return <Profile userProfile={userProfile} setUserProfile={setUserProfile} />;
      case 'food':
        return <FoodLogger userId={userId} />;
      case 'activity':
        return <ActivityTracker />;
      case 'planner':
        return <Planner userProfile={userProfile} setUserProfile={setUserProfile} />;
      default:
        return <Dashboard userId={userId} userProfile={userProfile} />;
    }
  };

  return (
    <HealthProvider>
      <div className="App">
        <div className="container">
          <div className="page">
            <div className="header">
              <h1>Food for Thought</h1>
              <p>Track your nutrition and fitness</p>
            </div>

            <nav className="nav">
              <button
                className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentPage('profile')}
              >
                <User size={16} />
                Profile
              </button>
              <button
                className={`nav-button ${currentPage === 'food' ? 'active' : ''}`}
                onClick={() => setCurrentPage('food')}
              >
                <Utensils size={16} />
                Food Log
              </button>
              <button
                className={`nav-button ${currentPage === 'activity' ? 'active' : ''}`}
                onClick={() => setCurrentPage('activity')}
              >
                <Activity size={16} />
                Activity
              </button>
              <button
                className={`nav-button ${currentPage === 'planner' ? 'active' : ''}`}
                onClick={() => setCurrentPage('planner')}
              >
                <ClipboardList size={16} />
                Planner
              </button>
            </nav>

            <Tamagotchi userId={userId} />

            {renderPage()}
          </div>
        </div>

        {/* Global Chatbot */}
        <Chatbot userProfile={userProfile} />
      </div>
    </HealthProvider>
  );
}

export default App;