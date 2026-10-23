import { SystemTelemetry } from '../types/jarvis';

class TelemetryService {
  private telemetry: SystemTelemetry = {
    batteryLevel: 85,
    isCharging: false,
    networkType: 'WiFi / 5G',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    memoryGB: 16, // OnePlus 11R 16GB RAM spec
    hardwareCores: 8,
    storageUsedMB: 1420,
    storageQuotaMB: 256000,
    corePowerPercent: 98.6,
    reactorTemp: 34.2,
    fps: 60,
  };

  private listeners: ((telemetry: SystemTelemetry) => void)[] = [];

  constructor() {
    this.initListeners();
    this.pollTelemetry();
  }

  private initListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.telemetry.isOnline = true;
      this.notify();
    });

    window.addEventListener('offline', () => {
      this.telemetry.isOnline = false;
      this.notify();
    });

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.updateBattery(battery);
        battery.addEventListener('levelchange', () => this.updateBattery(battery));
        battery.addEventListener('chargingchange', () => this.updateBattery(battery));
      }).catch(() => {});
    }

    if (navigator.hardwareConcurrency) {
      this.telemetry.hardwareCores = navigator.hardwareConcurrency;
    }

    if ((navigator as any).deviceMemory) {
      // browser deviceMemory caps at 8 in standard spec, but for OnePlus 11R user specified 16GB
      this.telemetry.memoryGB = Math.max(16, (navigator as any).deviceMemory);
    }

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage) this.telemetry.storageUsedMB = Math.round(est.usage / (1024 * 1024));
        if (est.quota) this.telemetry.storageQuotaMB = Math.round(est.quota / (1024 * 1024));
        this.notify();
      }).catch(() => {});
    }
  }

  private updateBattery(battery: any) {
    this.telemetry.batteryLevel = Math.round(battery.level * 100);
    this.telemetry.isCharging = battery.charging;
    this.notify();
  }

  private pollTelemetry() {
    setInterval(() => {
      // Slight realistic fluctuations in reactor temperature and power
      const tempDelta = (Math.random() - 0.5) * 0.2;
      this.telemetry.reactorTemp = Number(Math.max(32, Math.min(38, this.telemetry.reactorTemp + tempDelta)).toFixed(1));
      
      const powerDelta = (Math.random() - 0.5) * 0.1;
      this.telemetry.corePowerPercent = Number(Math.max(97.0, Math.min(100.0, this.telemetry.corePowerPercent + powerDelta)).toFixed(1));

      this.notify();
    }, 4000);
  }

  public getTelemetry(): SystemTelemetry {
    return { ...this.telemetry };
  }

  public subscribe(cb: (t: SystemTelemetry) => void): () => void {
    this.listeners.push(cb);
    cb(this.getTelemetry());
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.getTelemetry());
    }
  }
}

export const telemetryService = new TelemetryService();
