// Apple Watch Integration Service
// This service handles multiple connection methods for health data

export interface HealthDataSync {
  heartRate?: number;
  activities?: Array<{
    start: string;
    end: string;
    type: string;
    caloriesBurned: number;
  }>;
  steps?: number;
  activeMinutes?: number;
}

// Type guard to check if Web Bluetooth is available
const hasBluetoothSupport = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

class AppleWatchService {
  private apiUrl: string;
  private userId: string;

  constructor(apiUrl: string, userId: string) {
    this.apiUrl = apiUrl;
    this.userId = userId;
  }

  // Method 1: Sync from native iOS app via backend
  async syncFromBackend(): Promise<HealthDataSync> {
    try {
      const response = await fetch(`${this.apiUrl}/watch-data/${this.userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error syncing from backend:', error);
      throw error;
    }
  }

  // Method 2: Web Bluetooth (for Bluetooth heart rate monitors)
  async connectViaBluetooth(): Promise<boolean> {
    if (!hasBluetoothSupport() || !navigator.bluetooth) {
      console.warn('Web Bluetooth not supported');
      return false;
    }

    try {
      const bluetooth = navigator.bluetooth;
      const device = await bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      const server = await device.gatt?.connect();
      if (!server) return false;

      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();

      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value as DataView;
        const heartRate = value.getUint8(1);
        this.sendHeartRateToBackend(heartRate);
      });

      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return false;
    }
  }

  // Method 3: Manual data entry simulation
  async simulateWatchConnection(): Promise<HealthDataSync> {
    return {
      heartRate: Math.floor(Math.random() * (85 - 65 + 1)) + 65,
      activities: [
        {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() - 1800000).toISOString(),
          type: 'moderate',
          caloriesBurned: 180
        }
      ],
      steps: Math.floor(Math.random() * 5000) + 3000,
      activeMinutes: Math.floor(Math.random() * 60) + 20
    };
  }

  // Send heart rate to backend
  private async sendHeartRateToBackend(heartRate: number): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/heart-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          timestamp: new Date().toISOString(),
          bpm: heartRate
        })
      });
    } catch (error) {
      console.error('Error sending heart rate:', error);
    }
  }

  // Trigger sync from iOS app
  async triggerIosSync(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/trigger-ios-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId })
      });
    } catch (error) {
      console.error('Error triggering iOS sync:', error);
    }
  }

  // Check if native app is installed
  async checkNativeAppInstalled(): Promise<boolean> {
    // Try to open custom URL scheme
    const appScheme = 'foodforthought://';
    try {
      window.location.href = appScheme + 'check';
      // If no error, app might be installed
      return true;
    } catch {
      return false;
    }
  }

  // Start periodic sync
  startPeriodicSync(intervalMs: number = 30000): () => void {
    const interval = setInterval(async () => {
      try {
        await this.syncFromBackend();
      } catch (error) {
        console.error('Periodic sync error:', error);
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

export default AppleWatchService;

// Usage example:
/*
const watchService = new AppleWatchService(
  'http://localhost:8080',
  'user_001'
);

// Try to connect via Bluetooth
await watchService.connectViaBluetooth();

// Or sync from backend
const data = await watchService.syncFromBackend();

// Start periodic updates
const stopSync = watchService.startPeriodicSync(30000);

// Later, to stop:
stopSync();
*/
