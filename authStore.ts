import { create } from 'zustand';
import { supabase } from './services/supabase';
import { UserProfile, UserRole } from './types';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  
  signIn: (email: string) => Promise<{ error: any }>; 
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
  loginAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isGuest: false,

  signIn: async (email) => {
    return { error: null }; 
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, isGuest: false });
  },

  loginAsGuest: () => {
    set({ 
      isGuest: true,
      isLoading: false,
      user: { id: 'guest', email: 'guest@intimateintel.com' } as User, // Mock user
      profile: { 
        id: 'guest', 
        email: 'guest@intimateintel.com', 
        username: 'Guest', 
        role: 'guest', 
        created_at: new Date().toISOString() 
      }
    });
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        set({ profile: { id: userId, email: '', role: 'user', created_at: '' } }); 
      } else {
        set({ profile: data as UserProfile });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    
    // Check if already guest in session storage? (Optional, skipping for simplicity)
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      set({ session, user: session.user, isGuest: false });
      await get().fetchProfile(session.user.id);
    } else {
        set({ session: null, user: null, profile: null, isGuest: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = get().user;
      const newUserId = session?.user?.id;
      
      // If we are guest, ignore auth state change unless it's a login
      if (get().isGuest && !session) return;

      set({ session, user: session?.user ?? null, isGuest: false });
      
      if (newUserId && newUserId !== currentUser?.id) {
          await get().fetchProfile(newUserId);
      } else if (!newUserId) {
          set({ profile: null });
      }
      
      set({ isLoading: false });
    });
    
    set({ isLoading: false });
  }
}));
