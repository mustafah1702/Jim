import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type WeightUnit = 'lbs' | 'kg';
export type ThemePreference = 'system' | 'light' | 'dark';

export type Preferences = {
  weightUnit: WeightUnit;
  restTimerSeconds: number;
  theme: ThemePreference;
};

type PreferencesState = Preferences & {
  loaded: boolean;
  setPreferences: (prefs: Partial<Preferences>) => void;
  load: (prefs: Preferences) => void;
};

const defaults: Preferences = {
  weightUnit: 'lbs',
  restTimerSeconds: 90,
  theme: 'system',
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...defaults,
  loaded: false,

  load: (prefs) => set({ ...prefs, loaded: true }),

  setPreferences: (updates) => {
    set(updates);
    // Fire-and-forget persist to Supabase
    persistToSupabase({ ...pick(get()), ...updates });
  },
}));

function pick(state: PreferencesState): Preferences {
  return {
    weightUnit: state.weightUnit,
    restTimerSeconds: state.restTimerSeconds,
    theme: state.theme,
  };
}

async function persistToSupabase(prefs: Preferences) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase
    .from('profiles')
    .update({
      weight_unit: prefs.weightUnit,
      rest_timer_seconds: prefs.restTimerSeconds,
      theme: prefs.theme,
    })
    .eq('id', session.user.id);
}
