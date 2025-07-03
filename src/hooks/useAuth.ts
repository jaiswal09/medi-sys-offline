import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null
  });

  // Session timeout management (45 minutes)
  const SESSION_TIMEOUT = 45 * 60 * 1000; // 45 minutes in milliseconds
  let sessionTimeoutId: NodeJS.Timeout | null = null;
  let lastActivityTime = Date.now();

  const resetSessionTimeout = useCallback(() => {
    lastActivityTime = Date.now();
    
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
    }
    
    sessionTimeoutId = setTimeout(() => {
      toast.error('Session expired due to inactivity');
      signOut();
    }, SESSION_TIMEOUT);
  }, []);

  const handleUserActivity = useCallback(() => {
    // Only reset if user is authenticated and it's been more than 1 minute since last activity
    if (state.user && Date.now() - lastActivityTime > 60000) {
      resetSessionTimeout();
    }
  }, [state.user, resetSessionTimeout]);

  // Add activity listeners
  useEffect(() => {
    if (state.user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });

      // Start session timeout
      resetSessionTimeout();

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        
        if (sessionTimeoutId) {
          clearTimeout(sessionTimeoutId);
        }
      };
    }
  }, [state.user, handleUserActivity, resetSessionTimeout]);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile doesn't exist, return null - don't create default profile
        // The database operator will handle role assignment
        if (error.code === 'PGRST116') {
          console.log('Profile not found - awaiting administrator setup');
          return null;
        }
        return null;
      }
      
      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast.success('Successfully signed in!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Sign up the user without role - role will be set by database operator
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;

      // Create a basic user profile without role - awaiting administrator assignment
      if (authData.user) {
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: email,
              full_name: fullName,
              role: null, // No role assigned - database operator will set this
              is_active: false // Inactive until administrator approves
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            toast.warning('Account created but requires administrator setup.');
          }
        } catch (profileErr) {
          console.error('Profile creation error:', profileErr);
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      toast.success('Account created! Please contact your administrator for role assignment and activation.');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear session timeout
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
      }
      
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null
      });
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Refetch profile
      const updatedProfile = await fetchUserProfile(state.user.id);
      setState(prev => ({ ...prev, profile: updatedProfile }));

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.user, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, error: error.message }));
          }
          return;
        }

        console.log('Initial session:', session?.user?.id || 'No session');

        if (mounted) {
          setState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null,
            loading: !!session // Only keep loading if we have a session and need to fetch profile
          }));
        }

        if (session?.user && mounted) {
          console.log('Fetching profile for initial session...');
          
          // Add timeout to prevent infinite loading
          timeoutId = setTimeout(() => {
            if (mounted) {
              console.log('Profile fetch timeout, proceeding without profile');
              setState(prev => ({ ...prev, loading: false }));
            }
          }, 10000); // 10 second timeout

          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              clearTimeout(timeoutId);
              setState(prev => ({
                ...prev,
                profile,
                loading: false
              }));
            }
          } catch (error) {
            console.error('Error fetching profile in initial session:', error);
            if (mounted) {
              clearTimeout(timeoutId);
              setState(prev => ({ ...prev, loading: false }));
            }
          }
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error: any) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, error: error.message }));
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No user');
        
        if (!mounted) return;

        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Handle different auth events
        if (event === 'TOKEN_REFRESHED') {
          // Don't show loading for token refresh, just update session
          setState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null
          }));
          return;
        }

        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          });
          return;
        }

        // For SIGNED_IN and other events
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: !!session, // Show loading only if we have a session and need to fetch profile
          error: null
        }));

        if (session?.user && mounted) {
          console.log('Fetching profile for auth state change...');
          
          // Add timeout to prevent infinite loading
          timeoutId = setTimeout(() => {
            if (mounted) {
              console.log('Profile fetch timeout after auth change, proceeding without profile');
              setState(prev => ({ ...prev, loading: false }));
            }
          }, 10000); // 10 second timeout

          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              clearTimeout(timeoutId);
              setState(prev => ({
                ...prev,
                profile,
                loading: false
              }));
            }
          } catch (error) {
            console.error('Error fetching profile after auth change:', error);
            if (mounted) {
              clearTimeout(timeoutId);
              setState(prev => ({ ...prev, loading: false }));
            }
          }
        } else if (mounted) {
          setState(prev => ({
            ...prev,
            profile: null,
            loading: false
          }));
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin: state.profile?.role === 'admin',
    isStaff: state.profile?.role === 'staff',
    isMedicalPersonnel: state.profile?.role === 'medical_personnel',
    canManageInventory: state.profile?.role === 'admin' || state.profile?.role === 'staff',
    canManageUsers: state.profile?.role === 'admin'
  };
};