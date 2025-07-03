import { useState, useEffect, useCallback } from 'react';
import type { DebugInfo, ConnectionStatus } from '../types';

let requestId = 0;
const debugRequests: DebugInfo['apiRequests'] = [];
const realtimeEvents: DebugInfo['realtimeEvents'] = [];

export const useDebug = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    connectionStatus: {
      online: navigator.onLine,
      supabaseConnected: true, // Assume connected for local setup
      realtimeConnected: true
    },
    apiRequests: [],
    realtimeEvents: [],
    environment: {}
  });

  const [isVisible, setIsVisible] = useState(false);

  // Connection status checking
  const checkConnectionStatus = useCallback(async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    
    try {
      // Simple connection check for local setup
      const latency = Date.now() - startTime;
      
      const status: ConnectionStatus = {
        online: navigator.onLine,
        supabaseConnected: true, // Local database is always connected
        realtimeConnected: true,
        lastPing: Date.now(),
        latency
      };
      
      return status;
    } catch (error) {
      return {
        online: navigator.onLine,
        supabaseConnected: false,
        realtimeConnected: false,
        lastPing: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }, []);

  // API request interceptor
  const logApiRequest = useCallback((method: string, url: string, status: number, duration: number, error?: string) => {
    const request = {
      id: (++requestId).toString(),
      method,
      url,
      status,
      duration,
      timestamp: new Date().toISOString(),
      error
    };
    
    debugRequests.unshift(request);
    if (debugRequests.length > 50) debugRequests.pop(); // Keep only last 50
    
    setDebugInfo(prev => ({
      ...prev,
      apiRequests: [...debugRequests]
    }));
  }, []);

  // Realtime event interceptor
  const logRealtimeEvent = useCallback((type: string, table: string, eventType: string, payload?: any) => {
    const event = {
      id: Date.now().toString(),
      type,
      table,
      eventType,
      timestamp: new Date().toISOString(),
      payload
    };
    
    realtimeEvents.unshift(event);
    if (realtimeEvents.length > 30) realtimeEvents.pop(); // Keep only last 30
    
    setDebugInfo(prev => ({
      ...prev,
      realtimeEvents: [...realtimeEvents]
    }));
  }, []);

  // Environment info
  const updateEnvironmentInfo = useCallback(async () => {
    try {
      setDebugInfo(prev => ({
        ...prev,
        environment: {
          supabaseUrl: 'Local Database',
          projectId: 'local-medical-inventory',
          userId: 'local-user',
          userRole: 'admin'
        }
      }));
    } catch (error) {
      console.warn('Failed to update environment info:', error);
    }
  }, []);

  // Ping test
  const performPingTest = useCallback(async () => {
    const status = await checkConnectionStatus();
    setDebugInfo(prev => ({
      ...prev,
      connectionStatus: status
    }));
    return status;
  }, [checkConnectionStatus]);

  // Clear logs
  const clearLogs = useCallback(() => {
    debugRequests.length = 0;
    realtimeEvents.length = 0;
    setDebugInfo(prev => ({
      ...prev,
      apiRequests: [],
      realtimeEvents: []
    }));
  }, []);

  // Toggle debug panel
  const toggleDebugPanel = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Export debug data
  const exportDebugData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      ...debugInfo
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [debugInfo]);

  useEffect(() => {
    // Initial setup
    updateEnvironmentInfo();
    checkConnectionStatus().then(status => {
      setDebugInfo(prev => ({ ...prev, connectionStatus: status }));
    });

    // Network status listener
    const handleOnlineStatus = () => {
      setDebugInfo(prev => ({
        ...prev,
        connectionStatus: {
          ...prev.connectionStatus,
          online: navigator.onLine
        }
      }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Keyboard shortcut for debug panel (Ctrl/Cmd + Shift + D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebugPanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Periodic connection check
    const connectionCheckInterval = setInterval(() => {
      performPingTest();
    }, 60000); // Every 60 seconds

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(connectionCheckInterval);
    };
  }, [updateEnvironmentInfo, checkConnectionStatus, toggleDebugPanel, performPingTest]);

  return {
    debugInfo,
    isVisible,
    toggleDebugPanel,
    performPingTest,
    clearLogs,
    exportDebugData,
    logApiRequest,
    logRealtimeEvent
  };
};
