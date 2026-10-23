// Natural Speech Recognition (STT) and Speech Synthesis (TTS) Engine for J.A.R.V.I.S.

export interface SpeechVoiceOption {
  voice: SpeechSynthesisVoice;
  isBritish: boolean;
  isPreferred: boolean;
}

class JarvisSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechPitch: number = 0.95; // Slightly deeper, refined Jarvis timbre
  private speechRate: number = 1.05; // Articulate British pace

  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onListeningChangeCallback: ((listening: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onSpeakingChangeCallback: ((speaking: boolean) => void) | null = null;

  constructor() {
    this.initSpeechSynthesis();
    this.initSpeechRecognition();
  }

  // --- Speech Recognition (STT) ---
  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onListeningChangeCallback?.(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onListeningChangeCallback?.(false);
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript.trim()) {
            this.onTranscriptCallback?.(finalTranscript.trim(), true);
          } else if (interimTranscript.trim()) {
            this.onTranscriptCallback?.(interimTranscript.trim(), false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening = false;
          this.onListeningChangeCallback?.(false);
          if (event.error === 'not-allowed') {
            this.onErrorCallback?.('Microphone access denied. Please grant microphone permissions.');
          } else if (event.error === 'no-speech') {
            // normal timeout when user doesn't say anything
          } else {
            this.onErrorCallback?.(`Speech recognition error: ${event.error}`);
          }
        };
      } catch (err) {
        console.warn('Could not initialize SpeechRecognition:', err);
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onStateChange: (listening: boolean) => void,
    onError: (err: string) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onListeningChangeCallback = onStateChange;
    this.onErrorCallback = onError;

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use text input or Chrome on Android.');
      return;
    }

    try {
      this.stopSpeaking();
      this.recognition.start();
    } catch (e: any) {
      console.warn('Start listening exception:', e);
      try {
        this.recognition.abort();
        setTimeout(() => this.recognition.start(), 150);
      } catch (retryErr) {
        onError('Could not activate microphone. Please try tapping again.');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.onListeningChangeCallback?.(false);
  }

  // --- Speech Synthesis (TTS) ---
  private initSpeechSynthesis() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.selectBestJarvisVoice();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private selectBestJarvisVoice() {
    if (!this.voices || this.voices.length === 0) return;

    // Prefer British English male voices: Google UK English Male, Daniel, George, Oliver, Arthur
    const priorityKeywords = ['uk english male', 'daniel', 'george', 'arthur', 'en-gb', 'en_gb', 'british'];
    for (const kw of priorityKeywords) {
      const found = this.voices.find(v => v.name.toLowerCase().includes(kw) || v.lang.toLowerCase().includes(kw));
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

    // Fallback to any English voice
    const anyEnglish = this.voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) {
      this.selectedVoice = anyEnglish;
    } else {
      this.selectedVoice = this.voices[0];
    }
  }

  public getAvailableVoices(): SpeechVoiceOption[] {
    return this.voices.map(v => ({
      voice: v,
      isBritish: v.lang.toLowerCase().includes('gb') || v.name.toLowerCase().includes('uk'),
      isPreferred: v === this.selectedVoice,
    }));
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public setPitch(pitch: number) {
    this.speechPitch = Math.max(0.5, Math.min(1.5, pitch));
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.5, Math.min(1.8, rate));
  }

  public getPitch(): number {
    return this.speechPitch;
  }

  public getRate(): number {
    return this.speechRate;
  }

  public registerSpeakingListener(cb: (speaking: boolean) => void) {
    this.onSpeakingChangeCallback = cb;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();

    // Clean text: strip markdown code blocks, asterisks, URLs, and action tags
    const cleaned = text
      .replace(/\[\[ACTION:.*?\]\]/gs, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.pitch = this.speechPitch;
    utterance.rate = this.speechRate;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onSpeakingChangeCallback?.(true);
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.onSpeakingChangeCallback?.(false);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.onSpeakingChangeCallback?.(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.onSpeakingChangeCallback?.(false);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const jarvisSpeech = new JarvisSpeechService();
