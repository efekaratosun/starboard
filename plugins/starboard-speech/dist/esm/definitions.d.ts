export type SpeechPermission = 'granted' | 'denied' | 'prompt';

export interface SpeechStatusResult {
  supported: boolean;
  permission: SpeechPermission;
}

export interface SpeechStartOptions {
  hints?: string[];
}

export interface SpeechTextResult {
  text: string;
}

export interface StarboardSpeechPlugin {
  status(): Promise<SpeechStatusResult>;
  start(options?: SpeechStartOptions): Promise<SpeechTextResult>;
  stop(): Promise<SpeechTextResult>;
  cancel(): Promise<void>;
  addListener(
    eventName: 'partial',
    listenerFunc: (data: { text: string }) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}