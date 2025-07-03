import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';

export const useLocalUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getUsers();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setUsers(result.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData: any) => {
    try {
      const result = await apiClient.createUser(userData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setUsers(prev => [...prev, result.data.data]);
      toast.success('User created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  }, []);

  // Update user
  const updateUser = useCallback(async ({ id, updates }: { id: string; updates: any }) => {
    try {
      const result = await apiClient.updateUser(id, updates);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setUsers(prev => prev.map(user => 
        user.id === id ? result.data.data : user
      ));
      toast.success('User updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: string) => {
    try {
      const result = await apiClient.deleteUser(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setUsers(prev => prev.filter(user => user.id !== id));
      toast.success('User deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  }, []);

  // Toggle user status
  const toggleUserStatus = useCallback(async ({ id, isActive }: { id: string; isActive: boolean }) => {
    try {
      const result = await apiClient.updateUser(id, { isActive });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setUsers(prev => prev.map(user => 
        user.id === id ? result.data.data : user
      ));
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  }, []);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    // Data
    users,
    
    // Loading states
    isLoading: loading,
    isCreatingUser: false,
    isUpdatingUser: false,
    isDeletingUser: false,
    isTogglingStatus: false,
    
    // Error state
    error,
    
    // Operations
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    
    // Utility
    refetch: fetchUsers
  };
};