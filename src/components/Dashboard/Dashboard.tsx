import React, { memo, useMemo } from 'react';
import { Package, AlertTriangle, ArrowRightLeft, Wrench, TrendingUp, DollarSign } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const Dashboard = memo(() => {
  const { items, transactions, alerts, maintenance, stats, isLoading } = useInventory();

  // Generate usage stats for the last 7 days
  const usageStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), i));
      const dayTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= date && 
        new Date(t.createdAt) < new Date(date.getTime() + 24 * 60 * 60 * 1000)
      );
      
      return {
        date: format(date, 'MMM dd'),
        checkouts: dayTransactions.filter(t => t.transactionType === 'CHECKOUT').length,
        checkins: dayTransactions.filter(t => t.transactionType === 'CHECKIN').length
      };
    }).reverse();
    
    return last7Days;
  }, [transactions]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const categoryMap = new Map();
    
    items.forEach(item => {
      const categoryName = item.category?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { category: categoryName, count: 0, value: 0 };
      existing.count += 1;
      existing.value += (item.unitPrice || 0) * item.quantity;
      categoryMap.set(categoryName, existing);
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  }, [items]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return transactions
      .slice(0, 10)
      .map(transaction => ({
        ...transaction,
        item_name: transaction.item?.name || 'Unknown Item',
        user_name: transaction.user?.fullName || 'Unknown User'
      }));
  }, [transactions]);

  // Maintenance due
  const maintenanceDue = useMemo(() => {
    const today = new Date();
    return maintenance.filter(m => 
      m.status === 'SCHEDULED' && 
      new Date(m.scheduledDate) <= today
    ).length;
  }, [maintenance]);

  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'orange',
      change: '+3'
    },
    {
      title: 'Active Transactions',
      value: stats.activeTransactions,
      icon: ArrowRightLeft,
      color: 'green',
      change: '+8'
    },
    {
      title: 'Maintenance Due',
      value: maintenanceDue,
      icon: Wrench,
      color: 'red',
      change: '-2'
    },
    {
      title: 'Total Value',
      value: `₹${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'purple',
      change: '+5.2%'
    },
    {
      title: 'Overdue Items',
      value: stats.overdueItems,
      icon: TrendingUp,
      color: 'red',
      change: '-1'
    }
  ];

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Medical inventory system overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  stat.color === 'red' ? 'bg-red-100 text-red-600' :
                  stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="checkouts" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="checkins" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        activity.transactionType === 'CHECKOUT' ? 'bg-blue-100 text-blue-800' :
                        activity.transactionType === 'CHECKIN' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          </div>
          <div className="p-6 space-y-4">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  alert.alertLevel === 'CRITICAL' || alert.alertLevel === 'OUT_OF_STOCK' 
                    ? 'bg-red-500' 
                    : 'bg-orange-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.item?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {alert.currentQuantity} / {alert.minQuantity} minimum
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  alert.alertLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  alert.alertLevel === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {alert.alertLevel?.replace('_', ' ')}
                </span>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
