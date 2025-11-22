import React, { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useHealth } from '../context/HealthContext';
import { Heart } from 'lucide-react';
import './HeartRateGraph.css';

interface HeartRateGraphProps {
  timeRange?: 'hour' | 'day' | 'week' | 'all';
}

const HeartRateGraph: React.FC<HeartRateGraphProps> = ({ timeRange = 'hour' }) => {
  const { heartRates, currentHeartRate, lastSyncTime } = useHealth();

  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffTime = new Date(0);
    }

    return heartRates
      .filter(hr => new Date(hr.timestamp) >= cutoffTime)
      .map(hr => ({
        timestamp: hr.timestamp,
        bpm: hr.bpm,
        time: formatTime(hr.timestamp, timeRange),
        fullTime: new Date(hr.timestamp).toLocaleString(),
      }))
      .reverse();
  }, [heartRates, timeRange]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avg: 0, min: 0, max: 0, latest: currentHeartRate || 0 };
    }

    const bpms = filteredData.map(d => d.bpm);
    return {
      avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
      min: Math.min(...bpms),
      max: Math.max(...bpms),
      latest: currentHeartRate || bpms[bpms.length - 1],
    };
  }, [filteredData, currentHeartRate]);

  function formatTime(timestamp: string, range: string): string {
    const date = new Date(timestamp);
    
    switch (range) {
      case 'hour':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case 'day':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit',
          hour12: false 
        }) + 'h';
      case 'week':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short',
          hour: '2-digit',
          hour12: false
        });
      default:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
    }
  }

  function getHeartRateZone(bpm: number): string {
    if (bpm < 60) return 'Resting';
    if (bpm < 100) return 'Light';
    if (bpm < 140) return 'Moderate';
    if (bpm < 170) return 'Vigorous';
    return 'Maximum';
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const bpm = payload[0].value;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{payload[0].payload.fullTime}</p>
          <p className="tooltip-bpm">
            <strong>{bpm} BPM</strong>
          </p>
          <p className="tooltip-zone">{getHeartRateZone(bpm)}</p>
        </div>
      );
    }
    return null;
  };

  if (heartRates.length === 0) {
    return (
      <div className="heart-rate-graph-container">
        <div className="graph-header">
          <div className="header-left">
            <h2>Heart Rate Monitor</h2>
          </div>
        </div>
        <p className="no-data-message">
          No heart rate data yet. Sync your device to see heart rate data.
        </p>
      </div>
    );
  }

  return (
    <div className="heart-rate-graph-container">
      <div className="graph-header">
        <div className="header-left">
          <h2>Heart Rate Monitor</h2>
          {lastSyncTime && (
            <p className="sync-time">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="current-hr-display">
          <div className="current-hr-value">
            {stats.latest}
          </div>
          <div className="current-hr-label">BPM</div>
          <div className="current-hr-zone">{getHeartRateZone(stats.latest)}</div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Average</span>
          <span className="stat-value">{stats.avg}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Minimum</span>
          <span className="stat-value">{stats.min}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Maximum</span>
          <span className="stat-value">{stats.max}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Readings</span>
          <span className="stat-value">{filteredData.length}</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              domain={[40, 200]}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={60} stroke="#d1d5db" strokeDasharray="3 3" />
            <ReferenceLine y={100} stroke="#d1d5db" strokeDasharray="3 3" />
            <ReferenceLine y={140} stroke="#d1d5db" strokeDasharray="3 3" />
            
            <Area
              type="monotone"
              dataKey="bpm"
              stroke="#111827"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBpm)"
              name="Heart Rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="heart-rate-zones-legend">
        <h3>Heart Rate Zones</h3>
        <div className="zones-grid">
          <div className="zone-item">
            <div className="zone-color" style={{ backgroundColor: '#d1d5db' }}></div>
            <div className="zone-info">
              <strong>Resting</strong>
              <span>&lt; 60</span>
            </div>
          </div>
          <div className="zone-item">
            <div className="zone-color" style={{ backgroundColor: '#9ca3af' }}></div>
            <div className="zone-info">
              <strong>Light</strong>
              <span>60–100</span>
            </div>
          </div>
          <div className="zone-item">
            <div className="zone-color" style={{ backgroundColor: '#6b7280' }}></div>
            <div className="zone-info">
              <strong>Moderate</strong>
              <span>100–140</span>
            </div>
          </div>
          <div className="zone-item">
            <div className="zone-color" style={{ backgroundColor: '#374151' }}></div>
            <div className="zone-info">
              <strong>Vigorous</strong>
              <span>140–170</span>
            </div>
          </div>
          <div className="zone-item">
            <div className="zone-color" style={{ backgroundColor: '#111827' }}></div>
            <div className="zone-info">
              <strong>Maximum</strong>
              <span>&gt; 170</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateGraph;