import React, { useState, useEffect, useCallback } from 'react';
import { TamagotchiState } from '../types';
import { useHealth } from '../context/HealthContext';
import './Tamagotchi.css';

interface TamagotchiProps {
  userId: string;
}

const Tamagotchi: React.FC<TamagotchiProps> = ({ userId }) => {
  const { foodLogCount } = useHealth();
  
  // Calculate health based on food log count
  // Health decreases when overeating (fat state)
  const calculateHealth = useCallback(() => {
    if (foodLogCount === 0) return 70; // Hungry but okay
    if (foodLogCount <= 3) return 85 + (foodLogCount * 5); // 90-100% for balanced eating
    // Health decreases as overeating increases
    return Math.max(20, 100 - ((foodLogCount - 3) * 15));
  }, [foodLogCount]);

  const [state, setState] = useState<TamagotchiState>({
    mood: 'happy',
    health: 85,
    motivation: 'Keep up the great work!'
  });

  // Update health when foodLogCount changes
  useEffect(() => {
    const newHealth = calculateHealth();
    let newMood: 'happy' | 'sad' | 'neutral' = 'happy';
    let newMotivation = 'Keep up the great work!';

    if (foodLogCount === 0) {
      newMood = 'sad';
      newMotivation = "I'm hungry! Time to eat something healthy.";
    } else if (foodLogCount <= 3) {
      newMood = 'happy';
      newMotivation = 'Great balanced eating today!';
    } else if (foodLogCount <= 5) {
      newMood = 'neutral';
      newMotivation = "That's a lot of food... maybe take a walk?";
    } else {
      newMood = 'sad';
      newMotivation = "I don't feel so good... too much food!";
    }

    setState({
      mood: newMood,
      health: newHealth,
      motivation: newMotivation
    });
  }, [foodLogCount, calculateHealth]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  // Determine if Omelette is fat based on food log count
  const isFat = foodLogCount > 0;
  const characterSrc = isFat ? '/fat-omelette.png' : '/omelette.png';
  const characterName = isFat ? 'Omelette (full)' : 'Omelette (hungry)';

  // Get speech based on fat/hungry state
  const getSpeechMessage = useCallback(() => {
    if (isFat) {
      const fullMessages = [
        "I'm so full!",
        "That was delicious!",
        "No more food please!",
        "I need a nap...",
        "Great meal!",
      ];
      return fullMessages[Math.floor(Math.random() * fullMessages.length)];
    } else {
      const hungryMessages = [
        "You should eat more!",
        "I'm getting hungry...",
        "Time for a snack?",
        "Feed me please!",
        "Let's eat something!",
      ];
      return hungryMessages[Math.floor(Math.random() * hungryMessages.length)];
    }
  }, [isFat]);

  // Handle "y" key press to toggle speech mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'y') {
        setSpeechEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Speech bubble interval when enabled
  useEffect(() => {
    if (!speechEnabled) {
      setSpeechBubble(null);
      return;
    }

    // Show immediately when enabled
    setSpeechBubble(getSpeechMessage());

    const interval = setInterval(() => {
      setSpeechBubble(getSpeechMessage());
      
      // Hide after 5 seconds
      setTimeout(() => {
        setSpeechBubble(null);
      }, 5000);
    }, 30000);

    return () => clearInterval(interval);
  }, [speechEnabled, getSpeechMessage]);

  // Celebration animation when state changes
  useEffect(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isFat]);

  const getHealthColor = () => {
    if (state.health >= 80) return '#059669';
    if (state.health >= 50) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="tamagotchi-container">
      <div className="tamagotchi-wrapper">
        <div 
          className="tamagotchi-environment"
          style={{ backgroundImage: 'url(/background.jpg)' }}
        >
          <div className={`tamagotchi-character ${isAnimating ? 'celebrating' : ''}`}>
            {speechBubble && (
              <div className="speech-bubble">
                {speechBubble}
              </div>
            )}
            <img 
              src={characterSrc} 
              alt="Omelette"
              className="character-image"
            />
          </div>
        </div>

        <div className="tamagotchi-controls">
          <div className="character-status">
            <span className="character-name">{characterName}</span>
            <span className="food-count">{foodLogCount} meal{foodLogCount !== 1 ? 's' : ''} logged</span>
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
                />
              </div>
              <span className="stat-value">{state.health}%</span>
            </div>
          </div>

          <div className="motivation-text">
            {state.motivation}
          </div>

          <div className="speech-toggle">
            <span className={`toggle-indicator ${speechEnabled ? 'active' : ''}`} />
            <span className="toggle-hint">Press Y to {speechEnabled ? 'disable' : 'enable'} speech</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tamagotchi;