import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EmotionIntensity, Step } from '../types/session';

interface SessionStore {
  emotionText: string;
  intensityBefore: EmotionIntensity | null;
  intensityAfter: EmotionIntensity | null;
  completed: Record<Step, boolean>;
  secretMode: boolean;
  afterEmotionText: string;
  completeInput: ({ text, secretMode }: { text: string; secretMode: boolean }) => void;
  completeMeasure: (v: EmotionIntensity) => void;
  completeGame: () => void;
  completeResult: ({
    intensityAfter,
    afterEmotionText,
  }: {
    intensityAfter: EmotionIntensity;
    afterEmotionText: string;
  }) => void;
  reset: () => void;
}

const initialState = {
  emotionText: '',
  secretMode: false,
  intensityBefore: null as EmotionIntensity | null,
  intensityAfter: null as EmotionIntensity | null,
  afterEmotionText: '',
  completed: { input: false, measure: false, game: false, result: false },
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,
      completeInput: ({ text, secretMode }) =>
        set({
          ...initialState,
          emotionText: text,
          secretMode: secretMode,
          completed: { input: true, measure: false, game: false, result: false },
        }),
      completeMeasure: (v) =>
        set((s) => ({
          intensityBefore: v,
          completed: { ...s.completed, measure: true },
        })),
      completeGame: () => set((s) => ({ completed: { ...s.completed, game: true } })),
      completeResult: ({ intensityAfter, afterEmotionText }) =>
        set((s) => ({
          intensityAfter,
          afterEmotionText,
          completed: { ...s.completed, result: true },
        })),
      reset: () => set(initialState),
    }),
    {
      name: 'toktok-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
