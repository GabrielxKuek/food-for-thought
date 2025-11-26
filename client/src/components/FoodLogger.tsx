import React, { useState, useRef } from 'react';
import { FoodLog } from '../types';
import { Camera, PenLine, Search, Plus, ChevronLeft, ChevronRight, Loader2, Cpu, X, AlertCircle } from 'lucide-react';
import './FoodLogger.css';
import { useHealth } from '../context/HealthContext';

const API_URL = "https://food-for-thought-production.up.railway.app";

interface SearchResult {
  fdc_id: number;
  name: string;
  brand: string | null;
  category: string;
  data_type: string;
  nutritional_information: {
    energy: string;
    protein: string;
    fat: string;
    carbohydrates: string;
    fiber: string;
    sugars: string;
    sodium: string;
    potassium: string;
    cholesterol: string;
  };
}

interface SearchResponse {
  status: string;
  query: string;
  count: number;
  results: SearchResult[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_results: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Response from /classify-nutrition endpoint
interface ClassifyNutritionResponse {
  status: string;
  food: string;
  confidence: number;
  nutritional_information: {
    energy: number;
    protein: number;
    serving_size: number;
    sodium: number;
    potassium: number;
    cholesterol: number;
    fat: {
      base: number;
      saturated: number;
      polyunsaturated: number;
      monounsaturated: number;
    };
    carbohydrates: {
      base: number;
      fibre: number;
      sugar: number;
    };
  };
}

interface FoodLoggerProps {
  userId: string;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ userId }) => {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { incrementFoodLog } = useHealth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPagination, setSearchPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [showSearch, setShowSearch] = useState(false);

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

  // Safe parsing function that handles undefined/null values
  const parseNutrientValue = (value: string | undefined | null): number => {
    if (!value) return 0;
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Format food name for display (replace underscores, capitalize)
  const formatFoodName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const searchFood = async (query: string, page: number = 1) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/search-food?q=${encodeURIComponent(query)}&page=${page}&page_size=10`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setSearchPagination(data.pagination);
    } catch (error) {
      console.error('Error searching food:', error);
      setError('Failed to search food database. Please try again.');
      setSearchResults([]);
      setSearchPagination(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchFood(searchQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    searchFood(searchQuery, newPage);
  };

  const selectSearchResult = (result: SearchResult) => {
    const nutritionalInfo = result.nutritional_information || {};
    
    setFormData({
      ...formData,
      name: result.name,
      source: 'search',
      portion_g: 100,
      nutritional_information: {
        energy_kcal: parseNutrientValue(nutritionalInfo.energy),
        fat_g: { 
          total: parseNutrientValue(nutritionalInfo.fat), 
          saturated: 0, 
          polyunsaturated: 0, 
          monounsaturated: 0 
        },
        cholesterol_mg: parseNutrientValue(nutritionalInfo.cholesterol),
        sodium_mg: parseNutrientValue(nutritionalInfo.sodium),
        carbohydrates_g: { 
          total: parseNutrientValue(nutritionalInfo.carbohydrates), 
          fibre: parseNutrientValue(nutritionalInfo.fiber), 
          sugar: parseNutrientValue(nutritionalInfo.sugars) 
        },
        protein_g: parseNutrientValue(nutritionalInfo.protein),
        potassium_mg: parseNutrientValue(nutritionalInfo.potassium)
      }
    });
    
    setIsManualEntry(true);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle image upload and send to /classify-nutrition API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Show image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Send to classification API
    setIsAnalyzing(true);
    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append('image', file);

      const response = await fetch(`${API_URL}/classify-nutrition`, {
        method: 'POST',
        body: formDataToSend,
        // Note: Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Classification failed: ${response.status} - ${errorText}`);
      }

      const data: ClassifyNutritionResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Classification failed: Invalid response status');
      }

      // Map API response to form data structure
      const analyzedData: Partial<FoodLog> = {
        name: formatFoodName(data.food),
        portion_g: data.nutritional_information.serving_size || 100,
        confidence: data.confidence,
        source: 'cv',
        nutritional_information: {
          energy_kcal: data.nutritional_information.energy,
          fat_g: {
            total: data.nutritional_information.fat.base,
            saturated: data.nutritional_information.fat.saturated,
            polyunsaturated: data.nutritional_information.fat.polyunsaturated,
            monounsaturated: data.nutritional_information.fat.monounsaturated
          },
          cholesterol_mg: data.nutritional_information.cholesterol,
          sodium_mg: data.nutritional_information.sodium,
          carbohydrates_g: {
            total: data.nutritional_information.carbohydrates.base,
            fibre: data.nutritional_information.carbohydrates.fibre,
            sugar: data.nutritional_information.carbohydrates.sugar
          },
          protein_g: data.nutritional_information.protein,
          potassium_mg: data.nutritional_information.potassium
        }
      };

      setFormData({ ...formData, ...analyzedData });
      setIsManualEntry(true);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to analyze image. Please try again or use manual entry.'
      );
      // Keep the image preview so user can retry or switch to manual
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate required fields
    if (!formData.name?.trim()) {
      setError('Please enter a food name');
      return;
    }

    const newLog: FoodLog = {
      ...formData,
      userId,
      timestamp: new Date().toISOString()
    } as FoodLog;

    // TODO: Send to backend API to persist the log
    // try {
    //   await fetch(`${API_URL}/log/food`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       userId,
    //       food_name: newLog.name,
    //       meal_type: 'snack', // Could add meal type selector
    //       calories_kcal: newLog.nutritional_information.energy_kcal,
    //       protein_g: newLog.nutritional_information.protein_g,
    //       fat_g: newLog.nutritional_information.fat_g.total,
    //       carbs_g: newLog.nutritional_information.carbohydrates_g.total
    //     })
    //   });
    // } catch (error) {
    //   console.error('Failed to save food log:', error);
    // }

    setLogs([newLog, ...logs]);
    incrementFoodLog(); 
    
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

  const handleClearImage = () => {
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'cv': return 'AI';
      case 'search': return 'Database';
      default: return 'Manual';
    }
  };

  return (
    <div className="food-logger">
      <h2>Food Logger</h2>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="logger-actions">
        <button 
          className="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={14} className="spinning" />
              Analyzing...
            </>
          ) : (
            <>
              <Camera size={14} />
              Upload Photo
            </>
          )}
        </button>
        <button 
          className="button secondary" 
          onClick={() => {
            setShowSearch(!showSearch);
            setIsManualEntry(false);
            setError(null);
          }}
        >
          <Search size={14} />
          Search Food
        </button>
        <button 
          className="button secondary" 
          onClick={() => {
            setIsManualEntry(!isManualEntry);
            setShowSearch(false);
            setError(null);
          }}
        >
          <PenLine size={14} />
          Custom Entry
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

      {showSearch && (
        <div className="search-section">
          <div className="search-header">
            <h3>Search Food Database</h3>
            <button className="close-button" onClick={() => setShowSearch(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="search-form">
            <input
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
            />
            <button 
              className="button" 
              onClick={handleSearchSubmit}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? <Loader2 size={14} className="spinning" /> : <Search size={14} />}
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <>
              <div className="search-results">
                {searchResults.map((result) => (
                  <div 
                    key={result.fdc_id} 
                    className="search-result-item"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="result-main">
                      <div className="result-name">{result.name}</div>
                      <div className="result-category">{result.category}</div>
                    </div>
                    <div className="result-nutrition">
                      <span>{result.nutritional_information?.energy || 'N/A'}</span>
                      <span>P: {result.nutritional_information?.protein || 'N/A'}</span>
                      <span>C: {result.nutritional_information?.carbohydrates || 'N/A'}</span>
                      <span>F: {result.nutritional_information?.fat || 'N/A'}</span>
                    </div>
                    <button className="add-button">
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {searchPagination && searchPagination.total_pages > 1 && (
                <div className="pagination">
                  <button
                    className="button secondary"
                    onClick={() => handlePageChange(searchPagination.page - 1)}
                    disabled={!searchPagination.has_previous}
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <span className="page-info">
                    Page {searchPagination.page} of {searchPagination.total_pages}
                  </span>
                  <button
                    className="button secondary"
                    onClick={() => handlePageChange(searchPagination.page + 1)}
                    disabled={!searchPagination.has_next}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <p className="empty-state">No results found for "{searchQuery}"</p>
          )}
        </div>
      )}

      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Food preview" />
          <button className="clear-image-button" onClick={handleClearImage}>
            <X size={16} />
          </button>
          {isAnalyzing && (
            <div className="analyzing-overlay">
              <Loader2 size={32} className="spinning" />
              <span>Analyzing food...</span>
            </div>
          )}
        </div>
      )}

      {isManualEntry && (
        <div className="food-form">
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
                onChange={(e) => setFormData({ ...formData, portion_g: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            {formData.source === 'cv' && formData.confidence && (
              <div className="confidence-badge">
                <Cpu size={12} />
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
                    energy_kcal: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>

            <div className="macro-inputs">
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
                      protein_g: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nutritional_information?.carbohydrates_g.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritional_information: {
                      ...formData.nutritional_information!,
                      carbohydrates_g: { ...formData.nutritional_information!.carbohydrates_g, total: parseFloat(e.target.value) || 0 }
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nutritional_information?.fat_g.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritional_information: {
                      ...formData.nutritional_information!,
                      fat_g: { ...formData.nutritional_information!.fat_g, total: parseFloat(e.target.value) || 0 }
                    }
                  })}
                />
              </div>
            </div>

            {/* Additional nutrition details (collapsible in future) */}
            <div className="detailed-nutrition">
              <h5>Detailed Breakdown</h5>
              
              <div className="nutrition-row">
                <div className="input-group small">
                  <label>Saturated Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.nutritional_information?.fat_g.saturated}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        fat_g: { ...formData.nutritional_information!.fat_g, saturated: parseFloat(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
                <div className="input-group small">
                  <label>Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.nutritional_information?.carbohydrates_g.fibre}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        carbohydrates_g: { ...formData.nutritional_information!.carbohydrates_g, fibre: parseFloat(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
                <div className="input-group small">
                  <label>Sugar (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.nutritional_information?.carbohydrates_g.sugar}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        carbohydrates_g: { ...formData.nutritional_information!.carbohydrates_g, sugar: parseFloat(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
              </div>

              <div className="nutrition-row">
                <div className="input-group small">
                  <label>Sodium (mg)</label>
                  <input
                    type="number"
                    value={formData.nutritional_information?.sodium_mg}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        sodium_mg: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div className="input-group small">
                  <label>Potassium (mg)</label>
                  <input
                    type="number"
                    value={formData.nutritional_information?.potassium_mg}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        potassium_mg: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div className="input-group small">
                  <label>Cholesterol (mg)</label>
                  <input
                    type="number"
                    value={formData.nutritional_information?.cholesterol_mg}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutritional_information: {
                        ...formData.nutritional_information!,
                        cholesterol_mg: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <button type="button" className="button" onClick={handleSubmit}>
              <Plus size={14} />
              Log Food
            </button>
          </div>
        </div>
      )}

      <div className="food-logs">
        <h3>Today's Food Logs</h3>
        {logs.length === 0 ? (
          <p className="empty-state">No food logged yet today</p>
        ) : (
          <>
            {/* Daily summary */}
            <div className="daily-summary">
              <div className="summary-item">
                <span className="summary-value">
                  {logs.reduce((sum, log) => sum + log.nutritional_information.energy_kcal, 0)}
                </span>
                <span className="summary-label">kcal</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {logs.reduce((sum, log) => sum + log.nutritional_information.protein_g, 0).toFixed(1)}g
                </span>
                <span className="summary-label">Protein</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {logs.reduce((sum, log) => sum + log.nutritional_information.carbohydrates_g.total, 0).toFixed(1)}g
                </span>
                <span className="summary-label">Carbs</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {logs.reduce((sum, log) => sum + log.nutritional_information.fat_g.total, 0).toFixed(1)}g
                </span>
                <span className="summary-label">Fat</span>
              </div>
            </div>

            {logs.map((log, index) => (
              <div key={index} className="food-log-item">
                <div className="log-header">
                  <h4>{log.name}</h4>
                  <span 
                    className="log-source"
                  >
                    {getSourceLabel(log.source)}
                  </span>
                </div>
                <div className="log-details">
                  <span>{log.portion_g}g</span>
                  <span>{log.nutritional_information.energy_kcal} kcal</span>
                  {log.confidence && (
                    <span className="confidence-indicator">
                      {(log.confidence * 100).toFixed(0)}% confident
                    </span>
                  )}
                </div>
                <div className="log-macros">
                  <span>P: {log.nutritional_information.protein_g}g</span>
                  <span>C: {log.nutritional_information.carbohydrates_g.total}g</span>
                  <span>F: {log.nutritional_information.fat_g.total}g</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default FoodLogger;
