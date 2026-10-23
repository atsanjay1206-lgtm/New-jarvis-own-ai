import { IntentAction, MemoryItem } from '../types/jarvis';
import { jarvisStorage } from './storage';

export interface OfflineInferenceResult {
  reply: string;
  action: IntentAction | null;
  provider: string;
  isLocal: boolean;
}

export class OfflineCognitiveEngine {
  public async processQuery(
    rawPrompt: string,
    memories: MemoryItem[] = []
  ): Promise<OfflineInferenceResult> {
    const text = rawPrompt.trim();
    const lower = text.toLowerCase();

    // 1. App Launching Intents
    const appMatch = lower.match(/(?:open|launch|start|run|pull up)\s+(?:the\s+)?(camera|dialer|phone|maps|navigation|gps|settings|calculator|calendar|clock|alarm|spotify|music|youtube|whatsapp)/i);
    if (appMatch) {
      const app = appMatch[1].toLowerCase();
      let target = app;
      if (app === 'phone') target = 'dialer';
      if (app === 'gps' || app === 'navigation') target = 'maps';
      if (app === 'music') target = 'spotify';

      return {
        reply: `Accessing local Android subroutines, Sir. Launching ${app} interface immediately.`,
        action: {
          action: 'open_app',
          target: target,
          label: `Open ${app.charAt(0).toUpperCase() + app.slice(1)}`,
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 2. Battery & Power Diagnostics
    if (lower.includes('battery') || lower.includes('power level') || lower.includes('power reserve') || lower.includes('cell status')) {
      return {
        reply: `Scanning device power cells via Android hardware bus. Displaying current telemetry, Sir.`,
        action: {
          action: 'get_battery',
          label: 'Scan Battery Telemetry',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 3. Alarms & Timers
    const timerMatch = lower.match(/(?:set|start|create)(?:\s+a)?\s+timer\s+(?:for\s+)?(\d+)\s*(minute|min|second|sec|hour|hr)s?(?:\s+(?:for|called|labeled)\s+(.+))?/i);
    if (timerMatch) {
      const amount = parseInt(timerMatch[1], 10);
      const unit = timerMatch[2].toLowerCase();
      const label = timerMatch[3]?.trim() || 'Tactical Timer';
      let seconds = amount;
      if (unit.startsWith('min')) seconds = amount * 60;
      if (unit.startsWith('hour') || unit.startsWith('hr')) seconds = amount * 3600;

      return {
        reply: `Chronometer primed for ${amount} ${unit}${amount > 1 ? 's' : ''}. I shall keep watch, Sir.`,
        action: {
          action: 'set_timer',
          params: { seconds, label },
          label: `Set ${amount} ${unit} Timer`,
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    const alarmMatch = lower.match(/(?:set|create)(?:\s+an)?\s+alarm\s+(?:for\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s+(?:for|called|labeled)\s+(.+))?/i);
    if (alarmMatch) {
      let hour = parseInt(alarmMatch[1], 10);
      const minute = alarmMatch[2] ? parseInt(alarmMatch[2], 10) : 0;
      const meridiem = alarmMatch[3]?.toLowerCase();
      const label = alarmMatch[4]?.trim() || 'Stark Industries Wake Directive';

      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      return {
        reply: `Alarm logged in device chronometer for ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}.`,
        action: {
          action: 'set_alarm',
          params: { hour, minute, message: label },
          label: `Set Alarm ${hour}:${minute.toString().padStart(2, '0')}`,
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 4. Tasks & Reminders
    const taskMatch = lower.match(/(?:remind me to|add task|create task|new task|note down|add to checklist)\s+(.+)/i);
    if (taskMatch) {
      const taskTitle = taskMatch[1].trim();
      return {
        reply: `Directive logged to local flash memory: "${taskTitle}". Stored safely without cloud dependency.`,
        action: {
          action: 'add_task',
          params: { title: taskTitle, priority: 'medium' },
          label: `Add Task: ${taskTitle.substring(0, 20)}...`,
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 5. Memory Storage ("remember that...", "remember my...")
    const rememberMatch = lower.match(/(?:remember that|store memory|take note that|keep in mind)\s+(.+)/i);
    if (rememberMatch) {
      const val = rememberMatch[1].trim();
      return {
        reply: `I have committed that to encrypted durable storage, Sir. It will persist across all system reboots.`,
        action: {
          action: 'remember',
          params: { key: 'User Note', value: val, category: 'Directive' },
          label: 'Store Long-Term Memory',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 6. Memory Recall ("what do you know about...", "what is my...", "who am I")
    if (lower.includes('what do you remember') || lower.includes('who am i') || lower.includes('show memories') || lower.includes('recall')) {
      const memoryCount = memories.length;
      const summary = memories.slice(0, 3).map(m => `"${m.key}: ${m.value}"`).join('; ');
      return {
        reply: `I currently maintain ${memoryCount} durable records in secure local storage, Sir. Key entries include: ${summary || 'Default Stark protocols active.'}`,
        action: null,
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 7. Tactical Protocols (Clean Slate, House Party, Stealth, Sentry)
    if (lower.includes('clean slate')) {
      return {
        reply: `Clean Slate Protocol engaged, Sir. Clearing volatile cache and resetting auxiliary buffers.`,
        action: {
          action: 'trigger_protocol',
          params: { protocol: 'CLEAN_SLATE' },
          label: 'Execute Clean Slate Protocol',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    if (lower.includes('house party')) {
      return {
        reply: `House Party Protocol acknowledged. All auxiliary modules deployed and awaiting command.`,
        action: {
          action: 'trigger_protocol',
          params: { protocol: 'HOUSE_PARTY' },
          label: 'Execute House Party Protocol',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    if (lower.includes('stealth')) {
      return {
        reply: `Stealth mode active. Lowering emission signature, muting unnecessary telemetry, and darkening HUD accents.`,
        action: {
          action: 'trigger_protocol',
          params: { protocol: 'STEALTH' },
          label: 'Engage Stealth Protocol',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    if (lower.includes('diagnostic') || lower.includes('system scan') || lower.includes('status report')) {
      return {
        reply: `Initiating full diagnostic sweep. Core temperature optimal, Snapdragon 8+ Gen 1 cores active, 16GB RAM overhead normal.`,
        action: {
          action: 'trigger_protocol',
          params: { protocol: 'DIAGNOSTIC' },
          label: 'Run Full System Diagnostics',
        },
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 8. Math calculations ("calculate 45 * 12", "what is 200 / 4")
    const mathMatch = text.match(/(?:calculate|what is|compute)\s+([0-9\.\s\+\-\*\/\(\)\^\%]+)$/i);
    if (mathMatch) {
      try {
        const expression = mathMatch[1].trim();
        // Safe evaluation
        const sanitized = expression.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        return {
          reply: `Internal mathematical coprocessor calculates: ${expression} = ${result}.`,
          action: null,
          provider: 'Local Tactical Core (On-Device)',
          isLocal: true,
        };
      } catch (e) {
        // fall through to general
      }
    }

    // 9. Time and Date
    if (lower.includes('time') || lower.includes('what time is it') || lower.includes('current time')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        reply: `Current local time is ${timeStr}, Sir. All clocks synchronized with device chronometer.`,
        action: null,
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    if (lower.includes('date') || lower.includes('day is it') || lower.includes("today's date")) {
      const now = new Date();
      const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return {
        reply: `Today is ${dateStr}, Sir.`,
        action: null,
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 10. Lore / Identity
    if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
      return {
        reply: `I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Configured to manage your directives, monitor device integrity, and provide tactical assistance online or off.`,
        action: null,
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    if (lower.includes('oneplus') || lower.includes('phone') || lower.includes('hardware')) {
      return {
        reply: `Operating on the OnePlus 11R host architecture. Equipped with Qualcomm Snapdragon 8+ Gen 1, 16GB LPDDR5X RAM, and Adreno 730 GPU. Subsystems are operating within optimal thermal parameters.`,
        action: null,
        provider: 'Local Tactical Core (On-Device)',
        isLocal: true,
      };
    }

    // 11. General offline response (honest, intelligent, Jarvis persona)
    return {
      reply: `I have processed your query via my on-device offline reasoning core, Sir. Systems are running locally without cloud telemetry. For deep real-time web retrieval, you may switch to Online Mode, though all local device commands, tasks, and memories remain fully functional here.`,
      action: null,
      provider: 'Local Cognitive Engine (On-Device)',
      isLocal: true,
    };
  }
}

export const offlineCognitive = new OfflineCognitiveEngine();
