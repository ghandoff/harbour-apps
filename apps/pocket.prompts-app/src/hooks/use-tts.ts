import { useCallback, useState, useRef } from 'react';
import * as Speech from 'expo-speech';

export interface Voice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

interface UseTtsResult {
  speak: (text: string) => void;
  stop: () => void;
  is_speaking: boolean;
  voice_id: string | null;
  set_voice_id: (id: string | null) => void;
}

export function useTts(): UseTtsResult {
  const [is_speaking, set_is_speaking] = useState(false);
  const voice_ref = useRef<string | null>(null);

  const set_voice_id = useCallback((id: string | null) => {
    voice_ref.current = id;
  }, []);

  const speak = useCallback((text: string) => {
    Speech.stop();

    set_is_speaking(true);
    Speech.speak(text, {
      language: 'en-US',
      voice: voice_ref.current ?? undefined,
      rate: 1.0,
      pitch: 1.0,
      onDone: () => set_is_speaking(false),
      onError: () => set_is_speaking(false),
      onStopped: () => set_is_speaking(false),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    set_is_speaking(false);
  }, []);

  return { speak, stop, is_speaking, voice_id: voice_ref.current, set_voice_id };
}

/** Get available en-US voices on this device. */
export async function get_available_voices(): Promise<Voice[]> {
  const all = await Speech.getAvailableVoicesAsync();
  return all
    .filter(v => v.language.startsWith('en'))
    .map(v => ({
      identifier: v.identifier,
      name: v.name,
      quality: (v as any).quality ?? 'default',
      language: v.language,
    }))
    .sort((a, b) => {
      // prefer enhanced/premium voices first
      if (a.quality !== b.quality) {
        if (a.quality === 'Enhanced') return -1;
        if (b.quality === 'Enhanced') return 1;
      }
      return a.name.localeCompare(b.name);
    });
}
