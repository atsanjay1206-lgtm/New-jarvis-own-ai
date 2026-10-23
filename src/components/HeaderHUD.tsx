import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Database, 
  Terminal, 
  Layers, 
  Activity,
  Zap
} from 'lucide-react';
import { JarvisMode, SystemTelemetry } from '../types/jarvis';
import { soundEffects } from '../services/soundEffects';

interface HeaderHUDProps {
  mode: JarvisMode;
  onModeChange: (m: JarvisMode) => void;
  telemetry: SystemTelemetry;
  activeProvider: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenMemory: () => void;
  onOpenModels: () => void;
  onOpenDiagnostics: () => void;
  onOpenProtocols: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  mode,
  onModeChange,
  telemetry,
  activeProvider,
  isMuted,
  onToggleMute,
  onOpenMemory,
  onOpenModels,
  onOpenDiagnostics,
  onOpenProtocols,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleModeToggle = () => {
    soundEffects.playClick();
    if (mode === 'auto') onModeChange('online');
    else if (mode === 'online') onModeChange('offline');
    else onModeChange('auto');
  };

  return (
    <header className="w-full bg-[#030712]/90 backdrop-blur-md border-b border-cyan-950/70 px-3 sm:px-6 py-2.5 flex flex-col gap-2 z-30 select-none">
      <div className="flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-400">
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                J.A.R.V.I.S.
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-800/80 bg-cyan-950/40 text-cyan-400">
                MK-LXXXV
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-600 tracking-wider">
              STARK INDUSTRIES OS // ONEPLUS 11R
            </div>
          </div>
        </div>

        {/* Live Telemetry & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mode Switcher */}
          <button
            onClick={handleModeToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              mode === 'offline'
                ? 'border-amber-500/60 bg-amber-950/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : mode === 'online'
                ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            }`}
            title="Toggle Operating Mode: Auto / Online / Offline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span className="font-semibold uppercase tracking-wider">{mode}</span>
          </button>

          {/* Memory Bank Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenMemory();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600 hover:text-cyan-200 transition-colors"
            title="Durable Memory Bank"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MEMORY</span>
          </button>

          {/* Protocols Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenProtocols();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600 hover:text-cyan-200 transition-colors"
            title="Iron Man Protocols"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PROTOCOLS</span>
          </button>

          {/* Local Models Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenModels();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600 hover:text-cyan-200 transition-colors"
            title="On-Device Model Manager"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MODELS</span>
          </button>

          {/* Diagnostics Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenDiagnostics();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600 hover:text-cyan-200 transition-colors"
            title="Hardware & Diagnostics"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SYSTEM</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onToggleMute();
            }}
            className={`p-1.5 rounded border transition-colors ${
              isMuted
                ? 'border-red-900/80 bg-red-950/30 text-red-400'
                : 'border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600 hover:text-cyan-200'
            }`}
            title={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Real-time Telemetry strip */}
      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-500/80 border-t border-cyan-950/60 pt-1.5 flex-wrap gap-y-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>TIME: <strong className="text-cyan-300">{timeStr || '00:00:00'}</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-cyan-600">
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>CORE: <strong className="text-cyan-300">{telemetry.corePowerPercent}%</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Battery */}
          <div className="flex items-center gap-1" title="Real-time Android Battery Level">
            {telemetry.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className={telemetry.batteryLevel <= 20 ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
              {telemetry.batteryLevel}%
            </span>
          </div>

          {/* Connection */}
          <div className="flex items-center gap-1">
            {telemetry.isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline text-cyan-400/90">
              {telemetry.isOnline ? 'ONLINE' : 'AIR-GAPPED'}
            </span>
          </div>

          {/* Active cognitive engine label */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-900/50 text-[10px] text-cyan-300">
            <span>ENGINE: {activeProvider}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
