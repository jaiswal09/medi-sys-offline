import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useLocalAuth } from './hooks/useLocalAuth';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryPage from './components/Inventory/InventoryPage';
import TransactionsPage from './components/Transactions/TransactionsPage';
import ReportsPage from './components/Reports/ReportsPage';
import MaintenancePage from './components/Maintenance/MaintenancePage';
import AlertsPage from './components/Alerts/AlertsPage';
import UsersPage from './components/Users/UsersPage';
import SettingsPage from './components/Settings/SettingsPage';

function App() {
  const { user, loading } = useLocalAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'alerts':
        return <AlertsPage />;
      case 'analytics':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
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
    </div>
  );
}

export default App;