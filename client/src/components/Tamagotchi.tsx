import React, { useState, useEffect, useCallback } from 'react';
import { TamagotchiState } from '../types';
import { useHealth } from '../context/HealthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Tamagotchi.css';

interface TamagotchiProps {
  userId: string;
}

type CharacterType = 'omelette' | 'mindy' | 'xR4PT0Rx';

interface Character {
  id: CharacterType;
  name: string;
  normalImage: string;
  fatImage: string;
  hungryMessages: string[];
  fullMessages: string[];
}

const CHARACTERS: Character[] = [
  {
    id: 'omelette',
    name: 'Omelette',
    normalImage: '/omelette.png',
    fatImage: '/fat-omelette.png',
    hungryMessages: [
      "You should eat more!",
      "I'm getting hungry...",
      "Time for a snack?",
      "Feed me please!",
      "Let's eat something!",
    ],
    fullMessages: [
      "I'm so full!",
      "That was delicious!",
      "No more food please!",
      "I need a nap...",
      "Great meal!",
    ],
  },
  {
    id: 'mindy',
    name: 'Mindy',
    normalImage: '/mindy.png',
    fatImage: '/mindy.png',
    hungryMessages: [
      "Let's grab a bite!",
      "Feeling a bit peckish...",
      "Snack time?",
      "I could use some fuel!",
      "How about some food?",
    ],
    fullMessages: [
      "That hit the spot!",
      "Feeling satisfied!",
      "Perfect portion!",
      "Time to rest...",
      "Yummy!",
    ],
  },
  {
    id: 'xR4PT0Rx',
    name: 'xR4PT0Rx',
    normalImage: '/xR4PT0Rx.png',
    fatImage: '/xR4PT0Rx.png',
    hungryMessages: [
      "ENERGY LOW... NEED FUEL",
      "INITIATING HUNGER PROTOCOL",
      "FOOD.EXE REQUIRED",
      "SCANNING FOR NUTRIENTS...",
      "CALORIE DEFICIT DETECTED",
    ],
    fullMessages: [
      "FUEL TANK: FULL",
      "ENERGY RESTORED",
      "OPTIMAL NUTRITION ACHIEVED",
      "ENTERING DIGEST MODE...",
      "MISSION COMPLETE",
    ],
  },
];

const Tamagotchi: React.FC<TamagotchiProps> = ({ userId }) => {
  const { foodLogCount } = useHealth();
  
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const currentCharacter = CHARACTERS[currentCharacterIndex];
  
  // Calculate health based on food log count
  const calculateHealth = useCallback(() => {
    if (foodLogCount === 0) return 70;
    if (foodLogCount <= 3) return 85 + (foodLogCount * 5);
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

  // Determine if character is fat based on food log count
  const isFat = foodLogCount > 0;
  const characterSrc = isFat ? currentCharacter.fatImage : currentCharacter.normalImage;
  const characterName = isFat 
    ? `${currentCharacter.name} (full)` 
    : `${currentCharacter.name} (hungry)`;

  // Get speech based on fat/hungry state
  const getSpeechMessage = useCallback(() => {
    if (isFat) {
      const messages = currentCharacter.fullMessages;
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      const messages = currentCharacter.hungryMessages;
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }, [isFat, currentCharacter]);

  // Character navigation
  const nextCharacter = () => {
    setCurrentCharacterIndex((prev) => (prev + 1) % CHARACTERS.length);
    setIsAnimating(true);
  };

  const prevCharacter = () => {
    setCurrentCharacterIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length);
    setIsAnimating(true);
  };

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

    setSpeechBubble(getSpeechMessage());

    const interval = setInterval(() => {
      setSpeechBubble(getSpeechMessage());
      
      setTimeout(() => {
        setSpeechBubble(null);
      }, 5000);
    }, 30000);

    return () => clearInterval(interval);
  }, [speechEnabled, getSpeechMessage]);

  // Animation when state changes
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
          <button className="character-nav prev" onClick={prevCharacter}>
            <ChevronLeft size={16} />
          </button>
          
          <div className={`tamagotchi-character ${isAnimating ? 'celebrating' : ''}`}>
            {speechBubble && (
              <div className="speech-bubble">
                {speechBubble}
              </div>
            )}
            <img 
              src={characterSrc} 
              alt={currentCharacter.name}
              className="character-image"
            />
          </div>
          
          <button className="character-nav next" onClick={nextCharacter}>
            <ChevronRight size={16} />
          </button>
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