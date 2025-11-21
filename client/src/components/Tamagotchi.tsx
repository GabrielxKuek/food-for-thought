import React, { useState, useEffect } from 'react';
import { TamagotchiState } from '../types';
import './Tamagotchi.css';

interface TamagotchiProps {
  userId: string;
}

const Tamagotchi: React.FC<TamagotchiProps> = ({ userId }) => {
  const [state] = useState<TamagotchiState>({
    mood: 'happy',
    health: 85,
    motivation: 'Keep up the great work! 🌟'
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Simulate fetching tamagotchi state
    // In production, this would call getTamagotchiState(userId)
    const interval = setInterval(() => {
      // Random animations for engagement
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const getMoodEmoji = () => {
    switch (state.mood) {
      case 'happy':
        return '😊';
      case 'excited':
        return '🎉';
      case 'sad':
        return '😢';
      case 'tired':
        return '😴';
      default:
        return '😐';
    }
  };

  const getHealthColor = () => {
    if (state.health >= 80) return '#43e97b';
    if (state.health >= 50) return '#feca57';
    return '#ff6b6b';
  };

  return (
    <div className="tamagotchi-container">
      <div className={`tamagotchi ${isAnimating ? 'celebrating' : ''}`}>
        <div className="tamagotchi-character">
          <div className="character-emoji">{getMoodEmoji()}</div>
          <div className="character-body">
            <div className="eye left"></div>
            <div className="eye right"></div>
            <div className="mouth"></div>
          </div>
        </div>
        
        <div className="tamagotchi-stats">
          <div className="stat-row">
            <span className="stat-label">Health</span>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ 
                  width: `${state.health}%`,
                  background: getHealthColor()
                }}
              >
                {state.health}%
              </div>
            </div>
          </div>
          
          <div className="motivation-text">
            {state.motivation}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tamagotchi;
