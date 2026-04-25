import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) => set({ session }),
}));

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  useAuthStore.setState({ session: data.session, hydrated: true });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session });
  });
}
