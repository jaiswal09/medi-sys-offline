import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useLocalAuth } from './hooks/useLocalAuth';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryPage from './components/Inventory/InventoryPage';
import TransactionsPage from './components/Transactions/TransactionsPage';
import ReportsPage from './components/Reports/ReportsPage';
import MaintenancePage from './components/Maintenance/MaintenancePage';
import AlertsPage from './components/Alerts/AlertsPage';
import UsersPage from './components/Users/UsersPage';
import SettingsPage from './components/Settings/SettingsPage';
import DebugPanel from './components/Debug/DebugPanel';
import AINotificationPanel from './components/AI/AINotificationPanel';

function App() {
  const { user, loading } = useLocalAuth();

  // Show loading with timeout protection
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Connecting to local database...</p>
        </div>
      </div>
    );
  }

  // Show login form if no user
  if (!user) {
    return (
      <>
        <LoginForm />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="analytics" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      
      {/* Global Components */}
      <AINotificationPanel />
      <DebugPanel />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;
