export type JarvisMode = 'auto' | 'online' | 'offline';

export type JarvisState = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'muted' | 'alert';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: number;
  provider?: string;
  isOffline?: boolean;
  action?: IntentAction | null;
  status?: 'success' | 'warning' | 'error';
}

export interface IntentAction {
  action: string;
  target?: string;
  params?: Record<string, any>;
  label?: string;
  description?: string;
  executed?: boolean;
  executionResult?: string;
  timestamp?: number;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'User Profile' | 'Directive' | 'Device Specs' | 'Preference' | 'Protocol' | 'General';
  created: number;
  updated: number;
  confidence: number;
}

export interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
  completed: boolean;
  created: number;
}

export interface SystemTelemetry {
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  networkType: string;
  isOnline: boolean;
  memoryGB: number;
  hardwareCores: number;
  storageUsedMB: number;
  storageQuotaMB: number;
  corePowerPercent: number;
  reactorTemp: number;
  fps: number;
}

export interface OfflineModelSpec {
  id: string;
  name: string;
  parameters: string;
  quantization: string;
  downloadSizeMB: number;
  ramUsageMB: number;
  status: 'not_downloaded' | 'downloading' | 'ready' | 'active' | 'error';
  progress?: number;
  description: string;
  targetDevice: string;
}

export interface ProtocolDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  level: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  status: 'INACTIVE' | 'ACTIVE' | 'STANDBY';
  actionSummary: string;
}
