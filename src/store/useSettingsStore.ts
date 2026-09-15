import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, SettingsValidationResult } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { validateSettings } from '@/utils/validation';
import { nowIso } from '@/utils/date';

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  update: (patch: Partial<AppSettings>) => void;
  replace: (settings: AppSettings) => void;
  reset: () => void;
  validate: () => SettingsValidationResult;
  markHealthCheck: (ok: boolean) => void;
  setHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      hydrated: false,

      update: (patch) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
          },
        }));
      },

      replace: (settings) => {
        set({ settings });
      },

      reset: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      validate: () => {
        const errors = validateSettings(get().settings);
        const valid = Object.keys(errors).length === 0;
        return { valid, errors };
      },

      markHealthCheck: (ok) => {
        set((state) => ({
          settings: {
            ...state.settings,
            lastHealthCheckAt: nowIso(),
            lastHealthCheckOk: ok,
          },
        }));
      },

      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: 'ng-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function getSettings(): AppSettings {
  return useSettingsStore.getState().settings;
}