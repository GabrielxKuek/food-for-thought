import React, { useState } from 'react';

interface RedisTestProps {
  userId: string;
}

interface RedisStats {
  heart_rates: number;
  activities: number;
  steps: number;
  total_calories: number;
  last_sync: string | null;
  sample_activity?: any;
}

const RedisTest: React.FC<RedisTestProps> = ({ userId = 'user123' }) => {
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testRedisConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📊 Full Redis Data:', data);
      
      const redisStats: RedisStats = {
        heart_rates: data.heart_rates?.length || 0,
        activities: data.activities?.length || 0,
        steps: data.steps?.length || 0,
        total_calories: data.summary?.total_calories_burned || 0,
        last_sync: data.summary?.last_sync || null,
        sample_activity: data.activities?.[0] || null
      };
      
      setStats(redisStats);
      
    } catch (err: any) {
      console.error('❌ Redis Test Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '16px', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      margin: '16px 0',
      backgroundColor: '#f9fafb'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#111827' }}>Redis Connection Test</h4>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          User ID:
        </label>
        <input 
          type="text" 
          value={userId} 
          readOnly
          style={{ 
            padding: '8px', 
            border: '1px solid #d1d5db', 
            borderRadius: '4px',
            fontSize: '0.875rem'
          }} 
        />
      </div>
      
      <button 
        onClick={testRedisConnection}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        {loading ? '🔄 Testing...' : '🧪 Test Redis Connection'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '4px',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {stats && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#059669' }}>✅ Redis Connection Successful</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div>
              <strong>Heart Rates:</strong> {stats.heart_rates}
            </div>
            <div>
              <strong>Activities:</strong> {stats.activities}
            </div>
            <div>
              <strong>Steps Days:</strong> {stats.steps}
            </div>
            <div>
              <strong>Total Calories:</strong> {stats.total_calories} kcal
            </div>
          </div>
          
          {stats.last_sync && (
            <div style={{ marginTop: '8px' }}>
              <strong>Last Sync:</strong> {new Date(stats.last_sync).toLocaleString()}
            </div>
          )}
          
          {stats.sample_activity && (
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Sample Activity Data
              </summary>
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '8px', 
                borderRadius: '4px', 
                fontSize: '0.75rem',
                overflow: 'auto',
                marginTop: '8px'
              }}>
                {JSON.stringify(stats.sample_activity, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default RedisTest;
