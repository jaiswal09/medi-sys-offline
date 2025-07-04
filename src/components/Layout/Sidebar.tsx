import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Wrench, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Settings,
  Bug
} from 'lucide-react';
import { useLocalAuth } from '../../hooks/useLocalAuth';
import { useDebug } from '../../hooks/useDebug';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'STAFF', 'MEDICAL_PERSONNEL'] },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', roles: ['ADMIN', 'STAFF', 'MEDICAL_PERSONNEL'] },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft, path: '/transactions', roles: ['ADMIN', 'STAFF', 'MEDICAL_PERSONNEL'] },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance', roles: ['ADMIN', 'STAFF'] },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, path: '/alerts', roles: ['ADMIN', 'STAFF'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['ADMIN', 'STAFF'] },
  { id: 'users', label: 'Users', icon: Users, path: '/users', roles: ['ADMIN'] },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', roles: ['ADMIN'] }
];

const Sidebar = memo(() => {
  const { user, profile } = useLocalAuth();
  const { toggleDebugPanel, debugInfo } = useDebug();

  // Use user role for filtering navigation - with enhanced debugging
  const userRole = user?.role || profile?.role;
  
  const filteredNavigation = navigation.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MedInventory</h1>
            <p className="text-xs text-gray-500">Medical Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.length > 0 ? (
          filteredNavigation.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading navigation...</p>
            <p className="text-xs text-gray-400 mt-1">
              Role: {userRole || 'Not set'}
            </p>
          </div>
        )}
      </nav>

      {/* Connection Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Connection Status</span>
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              debugInfo.connectionStatus.online ? 'bg-green-500' : 'bg-red-500'
            }`} title="Network" />
            <div className={`w-2 h-2 rounded-full ${
              debugInfo.connectionStatus.supabaseConnected ? 'bg-green-500' : 'bg-red-500'
            }`} title="Database" />
            <div className={`w-2 h-2 rounded-full ${
              debugInfo.connectionStatus.realtimeConnected ? 'bg-green-500' : 'bg-orange-500'
            }`} title="Real-time" />
          </div>
        </div>
        
        {/* Debug Button for Admin/Staff */}
        {(userRole === 'ADMIN' || userRole === 'STAFF') && (
          <button
            onClick={toggleDebugPanel}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded"
            title="Press Ctrl+Shift+D to toggle"
          >
            <Bug className="w-3 h-3" />
            <span>Debug Panel</span>
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {(user?.fullName || profile?.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName || profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {(user?.role || profile?.role)?.replace('_', ' ').toLowerCase() || 'No role'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
