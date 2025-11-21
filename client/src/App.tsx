import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import FoodLogger from './components/FoodLogger';
import ActivityTracker from './components/ActivityTracker';
import Tamagotchi from './components/Tamagotchi';
import { UserProfile } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'food' | 'activity'>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId] = useState<string>('user_001'); // Default user for demo

  useEffect(() => {
    // Initialize with demo data if no profile exists
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
        return <ActivityTracker userId={userId} />;
      default:
        return <Dashboard userId={userId} userProfile={userProfile} />;
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="page">
          <div className="header">
            <h1>🍎 Food for Thought</h1>
            <p>Your AI-Powered Fitness Companion</p>
          </div>

          <nav className="nav">
            <button
              className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentPage('profile')}
            >
              👤 Profile
            </button>
            <button
              className={`nav-button ${currentPage === 'food' ? 'active' : ''}`}
              onClick={() => setCurrentPage('food')}
            >
              🍽️ Food Log
            </button>
            <button
              className={`nav-button ${currentPage === 'activity' ? 'active' : ''}`}
              onClick={() => setCurrentPage('activity')}
            >
              💪 Activity
            </button>
          </nav>

          {/* Tamagotchi - Always visible */}
          <Tamagotchi userId={userId} />

          {/* Main content */}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
