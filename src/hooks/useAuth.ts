import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'MEDICAL_PERSONNEL';
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  profile: User | null; // Add profile for compatibility
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await apiClient.login(email, password);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, loading: false }));
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      setState(prev => ({ 
        ...prev, 
        user: result.data.user,
        profile: result.data.user, // Set profile same as user for compatibility
        loading: false, 
        error: null 
      }));
      
      toast.success('Successfully signed in!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(async (userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await apiClient.register(userData);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, loading: false }));
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      setState(prev => ({ 
        ...prev, 
        user: result.data.user,
        profile: result.data.user,
        loading: false, 
        error: null 
      }));
      
      toast.success('Account created successfully!');
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
      apiClient.logout();
      setState({
        user: null,
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

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' };

    try {
      const result = await apiClient.updateProfile(updates);
      
      if (result.error) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      setState(prev => ({ 
        ...prev, 
        user: result.data.user,
        profile: result.data.user
      }));

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.user]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const result = await apiClient.getCurrentUser();
        
        if (result.error) {
          // Token is invalid, clear it
          apiClient.logout();
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        setState(prev => ({
          ...prev,
          user: result.data.user,
          profile: result.data.user,
          loading: false
        }));
      } catch (error) {
        console.error('Session check failed:', error);
        apiClient.logout();
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    checkSession();
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin: state.user?.role === 'ADMIN',
    isStaff: state.user?.role === 'STAFF',
    isMedicalPersonnel: state.user?.role === 'MEDICAL_PERSONNEL',
    canManageInventory: state.user?.role === 'ADMIN' || state.user?.role === 'STAFF',
    canManageUsers: state.user?.role === 'ADMIN'
  };
};
