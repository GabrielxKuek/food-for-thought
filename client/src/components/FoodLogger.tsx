import React, { useState, useRef } from 'react';
import { FoodLog } from '../types';
import './FoodLogger.css';

interface FoodLoggerProps {
  userId: string;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ userId }) => {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<FoodLog>>({
    userId,
    source: 'manual',
    name: '',
    portion_g: 0,
    nutritional_information: {
      energy_kcal: 0,
      fat_g: { total: 0, saturated: 0, polyunsaturated: 0, monounsaturated: 0 },
      cholesterol_mg: 0,
      sodium_mg: 0,
      carbohydrates_g: { total: 0, fibre: 0, sugar: 0 },
      protein_g: 0,
      potassium_mg: 0
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze image
    setIsAnalyzing(true);
    try {
      // Mock AI analysis - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analyzedData: Partial<FoodLog> = {
        name: 'Chicken Rice',
        portion_g: 350,
        confidence: 0.92,
        source: 'cv',
        nutritional_information: {
          energy_kcal: 620,
          fat_g: { total: 22.74, saturated: 6.1, polyunsaturated: 5.5, monounsaturated: 9.3 },
          cholesterol_mg: 79,
          sodium_mg: 1011,
          carbohydrates_g: { total: 71.5, fibre: 1.3, sugar: 2.3 },
          protein_g: 29.8,
          potassium_mg: 399
        }
      };

      setFormData({ ...formData, ...analyzedData });
      setIsManualEntry(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLog: FoodLog = {
      ...formData,
      userId,
      timestamp: new Date().toISOString()
    } as FoodLog;

    setLogs([newLog, ...logs]);
    
    // Reset form
    setFormData({
      userId,
      source: 'manual',
      name: '',
      portion_g: 0,
      nutritional_information: {
        energy_kcal: 0,
        fat_g: { total: 0, saturated: 0, polyunsaturated: 0, monounsaturated: 0 },
        cholesterol_mg: 0,
        sodium_mg: 0,
        carbohydrates_g: { total: 0, fibre: 0, sugar: 0 },
        protein_g: 0,
        potassium_mg: 0
      }
    });
    setImagePreview(null);
    setIsManualEntry(false);
  };

  return (
    <div className="food-logger">
      <h2>🍽️ Food Logger</h2>

      <div className="logger-actions">
        <button 
          className="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
        >
          📸 {isAnalyzing ? 'Analyzing...' : 'Take/Upload Photo'}
        </button>
        <button 
          className="button secondary" 
          onClick={() => setIsManualEntry(!isManualEntry)}
        >
          ✍️ Manual Entry
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Food preview" />
        </div>
      )}

      {isManualEntry && (
        <form className="food-form" onSubmit={handleSubmit}>
          <div className="card">
            <h3>Food Details</h3>
            
            <div className="input-group">
              <label>Food Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Portion (grams)</label>
              <input
                type="number"
                value={formData.portion_g}
                onChange={(e) => setFormData({ ...formData, portion_g: parseFloat(e.target.value) })}
                required
              />
            </div>

            {formData.source === 'cv' && formData.confidence && (
              <div className="confidence-badge">
                AI Confidence: {(formData.confidence * 100).toFixed(0)}%
              </div>
            )}

            <h4>Nutritional Information</h4>
            
            <div className="input-group">
              <label>Calories (kcal)</label>
              <input
                type="number"
                value={formData.nutritional_information?.energy_kcal}
                onChange={(e) => setFormData({
                  ...formData,
                  nutritional_information: {
                    ...formData.nutritional_information!,
                    energy_kcal: parseFloat(e.target.value)
                  }
                })}
              />
            </div>

            <div className="macro-inputs">
              <div className="input-group">
                <label>Total Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nutritional_information?.fat_g.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritional_information: {
                      ...formData.nutritional_information!,
                      fat_g: { ...formData.nutritional_information!.fat_g, total: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Total Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nutritional_information?.carbohydrates_g.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritional_information: {
                      ...formData.nutritional_information!,
                      carbohydrates_g: { ...formData.nutritional_information!.carbohydrates_g, total: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nutritional_information?.protein_g}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritional_information: {
                      ...formData.nutritional_information!,
                      protein_g: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
            </div>

            <button type="submit" className="button success">
              ✅ Log Food
            </button>
          </div>
        </form>
      )}

      <div className="food-logs">
        <h3>Today's Food Logs</h3>
        {logs.length === 0 ? (
          <p className="empty-state">No food logged yet today. Start by adding your first meal!</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="food-log-item">
              <div className="log-header">
                <h4>{log.name}</h4>
                <span className="log-source">{log.source === 'cv' ? '🤖 AI' : '✍️ Manual'}</span>
              </div>
              <div className="log-details">
                <span>Portion: {log.portion_g}g</span>
                <span>Calories: {log.nutritional_information.energy_kcal} kcal</span>
              </div>
              <div className="log-macros">
                <span>🍞 {log.nutritional_information.carbohydrates_g.total}g</span>
                <span>🥩 {log.nutritional_information.protein_g}g</span>
                <span>🥑 {log.nutritional_information.fat_g.total}g</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FoodLogger;
