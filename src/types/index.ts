export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff' | 'medical_personnel';
  department?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  category?: Category;
  item_type: 'equipment' | 'supplies' | 'medications' | 'consumables';
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  unit_price?: number;
  location: string;
  qr_code?: string;
  barcode?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'lost' | 'expired' | 'discontinued';
  expiry_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  maintenance_interval_days?: number;
  image_url?: string;
  notes?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Transaction {
  id: string;
  item_id: string;
  item?: InventoryItem;
  user_id: string;
  user?: UserProfile;
  transaction_type: 'checkout' | 'checkin' | 'lost' | 'damaged' | 'maintenance';
  quantity: number;
  due_date?: string;
  returned_date?: string;
  status: 'active' | 'completed' | 'overdue' | 'lost' | 'damaged';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  location_used?: string;
  condition_on_return?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  item_id: string;
  item?: InventoryItem;
  maintenance_type: 'preventive' | 'corrective' | 'calibration' | 'inspection';
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  technician_id?: string;
  technician?: UserProfile;
  description?: string;
  cost?: number;
  notes?: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LowStockAlert {
  id: string;
  item_id: string;
  item?: InventoryItem;
  current_quantity: number;
  min_quantity: number;
  alert_level: 'low' | 'critical' | 'out_of_stock';
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  activeTransactions: number;
  overdueItems: number;
  maintenanceDue: number;
  totalValue: number;
  recentActivity: Transaction[];
  categoryDistribution: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  usageStats: Array<{
    date: string;
    checkouts: number;
    checkins: number;
  }>;
}

export interface ConnectionStatus {
  online: boolean;
  supabaseConnected: boolean;
  realtimeConnected: boolean;
  lastPing?: number;
  latency?: number;
}

export interface DebugInfo {
  connectionStatus: ConnectionStatus;
  apiRequests: Array<{
    id: string;
    method: string;
    url: string;
    status: number;
    duration: number;
    timestamp: string;
    error?: string;
  }>;
  realtimeEvents: Array<{
    id: string;
    type: string;
    table: string;
    eventType: string;
    timestamp: string;
    payload?: any;
  }>;
  environment: {
    supabaseUrl?: string;
    projectId?: string;
    userId?: string;
    userRole?: string;
  };
}