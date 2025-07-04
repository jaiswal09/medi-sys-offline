import { useState, useEffect, useCallback, useRef } from 'react';
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
  loading: boolean;
  error: string | null;
}

export const useLocalAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Use refs to prevent multiple simultaneous requests
  const isValidatingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔐 Attempting login for:', email);
      const result = await apiClient.login(email, password);
      
      if (result.error) {
        console.error('❌ Login failed:', result.error);
        setState(prev => ({ ...prev, error: result.error, loading: false }));
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Login successful:', result.data.user);
      setState(prev => ({ 
        ...prev, 
        user: result.data.user, 
        loading: false, 
        error: null 
      }));
      
      toast.success('Successfully signed in!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      console.error('❌ Login error:', error);
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(async (userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📝 Attempting registration for:', userData.email);
      const result = await apiClient.register(userData);
      
      if (result.error) {
        console.error('❌ Registration failed:', result.error);
        setState(prev => ({ ...prev, error: result.error, loading: false }));
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Registration successful:', result.data.user);
      setState(prev => ({ 
        ...prev, 
        user: result.data.user, 
        loading: false, 
        error: null 
      }));
      
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account';
      console.error('❌ Registration error:', error);
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out user');
      apiClient.logout();
      setState({
        user: null,
        loading: false,
        error: null
      });
      hasInitializedRef.current = false;
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('❌ Error signing out:', error);
      toast.error('Error signing out');
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' };

    try {
      console.log('👤 Updating profile:', updates);
      const result = await apiClient.updateProfile(updates);
      
      if (result.error) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      setState(prev => ({ 
        ...prev, 
        user: result.data.user 
      }));

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.user]);

  // Single session validation on mount only
  useEffect(() => {
    const validateSession = async () => {
      // Prevent multiple simultaneous validations
      if (isValidatingRef.current || hasInitializedRef.current) {
        return;
      }

      isValidatingRef.current = true;
      hasInitializedRef.current = true;

      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.log('🔍 No token found, user not authenticated');
        setState(prev => ({ ...prev, loading: false }));
        isValidatingRef.current = false;
        return;
      }

      try {
        console.log('🔍 Validating existing session...');
        const result = await apiClient.getCurrentUser();
        
        if (result.error) {
          console.log('❌ Session invalid, clearing token');
          apiClient.logout();
          setState(prev => ({ ...prev, loading: false }));
          isValidatingRef.current = false;
          return;
        }

        console.log('✅ Session valid, user authenticated:', result.data.user);
        setState(prev => ({
          ...prev,
          user: result.data.user,
          loading: false
        }));
      } catch (error) {
        console.error('❌ Session validation failed:', error);
        apiClient.logout();
        setState(prev => ({ ...prev, loading: false }));
      } finally {
        isValidatingRef.current = false;
      }
    };

    validateSession();
  }, []); // Empty dependency array - only run once on mount

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    // Add profile for compatibility with existing components
    profile: state.user,
    isAdmin: state.user?.role === 'ADMIN',
    isStaff: state.user?.role === 'STAFF',
    isMedicalPersonnel: state.user?.role === 'MEDICAL_PERSONNEL',
    canManageInventory: state.user?.role === 'ADMIN' || state.user?.role === 'STAFF',
    canManageUsers: state.user?.role === 'ADMIN'
  };
};
