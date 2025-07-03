import React, { memo, useState } from 'react';
import { Bell, Search, LogOut, User, X, Database } from 'lucide-react';
import { useLocalAuth } from '../../hooks/useLocalAuth';
import { useLocalInventory } from '../../hooks/useLocalInventory';
import { format } from 'date-fns';

const Header = memo(() => {
  const { user, signOut } = useLocalAuth();
  const { alerts } = useLocalInventory();
  const [showNotifications, setShowNotifications] = useState(false);

  const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(alert => alert.alertLevel === 'CRITICAL' || alert.alertLevel === 'OUT_OF_STOCK');

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory, transactions, or users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Local Database Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <Database className="w-4 h-4" />
            <span>Local DB</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center text-white ${
                  criticalAlerts.length > 0 ? 'bg-red-500' : 'bg-orange-500'
                }`}>
                  {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {activeAlerts.length > 0 ? (
                    activeAlerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border-b border-gray-100 last:border-b-0 border-l-4 ${
                          alert.alertLevel === 'CRITICAL' || alert.alertLevel === 'OUT_OF_STOCK' 
                            ? 'border-l-red-500 bg-red-50' 
                            : 'border-l-orange-500 bg-orange-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {alert.alertLevel === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock Alert'}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {alert.item?.name} - Current: {alert.currentQuantity}, Min: {alert.minQuantity}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                Stock Alert
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(alert.createdAt), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;