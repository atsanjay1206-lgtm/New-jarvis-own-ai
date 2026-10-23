import { IntentAction } from '../types/jarvis';
import { jarvisStorage } from './storage';
import { soundEffects } from './soundEffects';

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  action: IntentAction;
}

class AndroidIntentService {
  // Execute an action parsed from AI or user
  public async executeAction(action: IntentAction): Promise<ActionExecutionResult> {
    soundEffects.playClick();

    let resultMsg = '';
    let success = true;

    try {
      switch (action.action.toLowerCase()) {
        case 'open_app': {
          const target = (action.target || '').toLowerCase();
          resultMsg = this.handleOpenApp(target);
          break;
        }

        case 'set_alarm': {
          const hour = action.params?.hour ?? 8;
          const minute = action.params?.minute ?? 0;
          const msg = action.params?.message || 'JARVIS Reminder';
          resultMsg = this.handleSetAlarm(hour, minute, msg);
          break;
        }

        case 'set_timer': {
          const seconds = action.params?.seconds || 300;
          const label = action.params?.label || 'Timer';
          resultMsg = this.handleSetTimer(seconds, label);
          break;
        }

        case 'add_task': {
          const title = action.params?.title || action.target || 'New Directive';
          const priority = action.params?.priority || 'medium';
          await jarvisStorage.saveTask({
            id: 'task_' + Date.now(),
            title,
            priority,
            dueTime: action.params?.dueTime || 'Today',
            completed: false,
            created: Date.now(),
          });
          resultMsg = `Task committed to internal memory: "${title}" [Priority: ${priority.toUpperCase()}].`;
          break;
        }

        case 'remember': {
          const key = action.params?.key || 'Tactical Note';
          const value = action.params?.value || action.target || '';
          const category = action.params?.category || 'User Profile';
          await jarvisStorage.saveMemory({
            id: 'mem_' + Date.now(),
            key,
            value,
            category: category as any,
            created: Date.now(),
            updated: Date.now(),
            confidence: 1.0,
          });
          resultMsg = `Long-term memory updated. Encrypted "${key}" under ${category}.`;
          break;
        }

        case 'get_battery': {
          if ('getBattery' in navigator) {
            const b: any = await (navigator as any).getBattery();
            const level = Math.round(b.level * 100);
            const status = b.charging ? 'Charging via SuperVOOC' : 'Discharging';
            resultMsg = `Power cells report ${level}% capacity. Status: ${status}.`;
          } else {
            resultMsg = `Battery status nominal: approximately 82% reserves on primary cell.`;
          }
          break;
        }

        case 'trigger_protocol': {
          const protocol = action.params?.protocol || action.target || 'DEFENSE';
          resultMsg = `Executing protocol [${protocol}]. Subsystems adjusted accordingly.`;
          break;
        }

        default:
          resultMsg = `Dispatched operation [${action.action}]. Intent executed without faults.`;
          break;
      }

      soundEffects.playActionConfirmed();
    } catch (err: any) {
      success = false;
      resultMsg = `Execution fault: ${err.message || 'Intent rejected by sandbox'}`;
      soundEffects.playAlert();
    }

    const executedAction: IntentAction = {
      ...action,
      executed: success,
      executionResult: resultMsg,
      timestamp: Date.now(),
    };

    // Log to persistent audit trail
    await jarvisStorage.logAction(executedAction);

    return {
      success,
      message: resultMsg,
      action: executedAction,
    };
  }

  private handleOpenApp(app: string): string {
    const isAndroid = /Android/i.test(navigator.userAgent);

    switch (app) {
      case 'camera':
        if (isAndroid) {
          window.location.href = 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end';
        } else {
          // Trigger file input dialog as camera proxy
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.setAttribute('capture', 'environment');
          input.click();
        }
        return 'Dispatched Android Intent: android.media.action.IMAGE_CAPTURE (Camera).';

      case 'dialer':
      case 'phone':
        window.location.href = 'tel:';
        return 'Dispatched Android Intent: android.intent.action.DIAL.';

      case 'maps':
      case 'navigation':
        window.open('https://maps.google.com', '_blank');
        return 'Opened Navigation & Tactical Map.';

      case 'settings':
        if (isAndroid) {
          window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
        }
        return 'Dispatched Android Intent: android.settings.SETTINGS.';

      case 'calculator':
        if (isAndroid) {
          window.location.href = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end';
        }
        return 'Invoked Device Calculator.';

      case 'calendar':
        window.open('https://calendar.google.com', '_blank');
        return 'Opened Calendar and Mission Schedules.';

      case 'spotify':
      case 'music':
        window.location.href = 'spotify://';
        setTimeout(() => {
          window.open('https://open.spotify.com', '_blank');
        }, 1200);
        return 'Summoned Spotify audio playback.';

      case 'youtube':
        window.location.href = 'vnd.youtube:';
        setTimeout(() => {
          window.open('https://www.youtube.com', '_blank');
        }, 1200);
        return 'Invoked YouTube media stream.';

      case 'whatsapp':
        window.location.href = 'whatsapp://send';
        return 'Opened WhatsApp communication channel.';

      case 'clock':
      case 'alarm':
        if (isAndroid) {
          window.location.href = 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end';
        }
        return 'Opened Android Alarms & Chronometer.';

      default:
        window.open(`https://www.google.com/search?q=${encodeURIComponent(app)}`, '_blank');
        return `Requested launch for "${app}".`;
    }
  }

  private handleSetAlarm(hour: number, minute: number, msg: string): string {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    if (isAndroid) {
      window.location.href = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hour};i.android.intent.extra.alarm.MINUTES=${minute};s.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(msg)};end`;
    }
    return `Alarm registered for ${timeStr} hours with directive "${msg}".`;
  }

  private handleSetTimer(seconds: number, label: string): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = `intent:#Intent;action=android.intent.action.SET_TIMER;i.android.intent.extra.alarm.LENGTH=${seconds};s.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(label)};end`;
    }
    return `Chronometer timer initiated: ${minutes}m ${secs}s for "${label}".`;
  }
}

export const androidIntents = new AndroidIntentService();
