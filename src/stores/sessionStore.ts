import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EmotionIntensity, Step } from '../types/session';

interface SessionStore {
  emotionText: string;
  intensityBefore: EmotionIntensity | null;
  intensityAfter: EmotionIntensity | null;
  completed: Record<Step, boolean>;
  completeInput: (text: string) => void;
  completeMeasure: (v: EmotionIntensity) => void;
  completeGame: () => void;
  completeResult: (v: EmotionIntensity) => void;
  reset: () => void;
}

const initialState = {
  emotionText: '',
  intensityBefore: null as EmotionIntensity | null,
  intensityAfter: null as EmotionIntensity | null,
  completed: { input: false, measure: false, game: false, result: false },
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,
      completeInput: (text) =>
        set({
          emotionText: text,
          completed: { input: true, measure: false, game: false, result: false },
        }),
      completeMeasure: (v) =>
        set((s) => ({ intensityBefore: v, completed: { ...s.completed, measure: true } })),
      completeGame: () => set((s) => ({ completed: { ...s.completed, game: true } })),
      completeResult: (v) =>
        set((s) => ({ intensityAfter: v, completed: { ...s.completed, result: true } })),
      reset: () => set(initialState),
    }),
    {
      name: 'toktok-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
