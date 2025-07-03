import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';

export const useInventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        itemsResult,
        categoriesResult,
        transactionsResult,
        maintenanceResult,
        alertsResult
      ] = await Promise.all([
        apiClient.getInventoryItems(),
        apiClient.getCategories(),
        apiClient.getTransactions(),
        apiClient.getMaintenanceSchedules(),
        apiClient.getLowStockAlerts()
      ]);

      // Set data with proper fallbacks
      setItems(itemsResult.data?.data || []);
      setCategories(categoriesResult.data?.data || []);
      setTransactions(transactionsResult.data?.data || []);
      setMaintenance(maintenanceResult.data?.data || []);
      setAlerts(alertsResult.data?.data || []);

    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Failed to fetch data');
      
      // Set empty arrays as fallbacks on error
      setItems([]);
      setCategories([]);
      setTransactions([]);
      setMaintenance([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Item operations
  const createItem = useCallback(async (itemData: any) => {
    try {
      const result = await apiClient.createInventoryItem(itemData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setItems(prev => [...prev, result.data.data]);
      toast.success('Item created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create item');
    }
  }, []);

  const updateItem = useCallback(async ({ id, updates }: { id: string; updates: any }) => {
    try {
      const result = await apiClient.updateInventoryItem(id, updates);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setItems(prev => prev.map(item => 
        item.id === id ? result.data.data : item
      ));
      toast.success('Item updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const result = await apiClient.deleteInventoryItem(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  }, []);

  // Category operations
  const createCategory = useCallback(async (categoryData: any) => {
    try {
      const result = await apiClient.createCategory(categoryData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCategories(prev => [...prev, result.data.data]);
      toast.success('Category created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category');
    }
  }, []);

  const updateCategory = useCallback(async ({ id, updates }: { id: string; updates: any }) => {
    try {
      const result = await apiClient.updateCategory(id, updates);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCategories(prev => prev.map(cat => 
        cat.id === id ? result.data.data : cat
      ));
      toast.success('Category updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const result = await apiClient.deleteCategory(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Category deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  }, []);

  // Transaction operations
  const createTransaction = useCallback(async (transactionData: any) => {
    try {
      const result = await apiClient.createTransaction(transactionData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setTransactions(prev => [result.data.data, ...prev]);
      // Refresh items to get updated quantities
      fetchData();
      toast.success('Transaction created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transaction');
    }
  }, [fetchData]);

  // Alert operations
  const acknowledgeAlert = useCallback(async ({ alertId }: { alertId: string }) => {
    try {
      const result = await apiClient.acknowledgeAlert(alertId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? result.data.data : alert
      ));
      toast.success('Alert acknowledged!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to acknowledge alert');
    }
  }, []);

  // Computed statistics with safe defaults
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = alerts.filter(alert => alert.status === 'ACTIVE').length;
    const activeTransactions = transactions.filter(t => t.status === 'ACTIVE').length;
    const overdueItems = transactions.filter(t => t.status === 'OVERDUE').length;
    const totalValue = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);

    return {
      totalItems,
      lowStockItems,
      activeTransactions,
      overdueItems,
      totalValue
    };
  }, [items, transactions, alerts]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data with safe defaults
    items: items || [],
    categories: categories || [],
    transactions: transactions || [],
    maintenance: maintenance || [],
    alerts: alerts || [],
    
    // Loading states
    isLoading: loading,
    isTransactionsLoading: loading,
    isMaintenanceLoading: loading,
    isAlertsLoading: loading,
    
    // Error state
    error,
    
    // Item operations
    createItem,
    updateItem,
    deleteItem,
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Transaction operations
    createTransaction,
    
    // Alert operations
    acknowledgeAlert,
    
    // Computed data
    stats,
    
    // Utility
    refetch: fetchData,
    
    // Loading states for mutations (simplified)
    isCreatingItem: false,
    isUpdatingItem: false,
    isDeletingItem: false,
    isCreatingTransaction: false,
    isCreatingCategory: false,
    isUpdatingCategory: false,
    isDeletingCategory: false,
  };
};
