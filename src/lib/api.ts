const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; error: string | null }> {
    const url = `${this.baseURL}${endpoint}`;
    const requestKey = `${options.method || 'GET'}-${url}`;
    
    // Prevent duplicate requests
    if (this.requestQueue.has(requestKey)) {
      console.log('🔄 Reusing existing request for:', requestKey);
      return this.requestQueue.get(requestKey);
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const requestPromise = (async () => {
      try {
        console.log('📡 Making API request:', options.method || 'GET', endpoint);
        
        const response = await fetch(url, {
          ...options,
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('❌ API Error:', response.status, data.error);
          return { data: null as T, error: data.error || 'Request failed' };
        }

        console.log('✅ API Success:', options.method || 'GET', endpoint);
        return { data, error: null };
      } catch (error) {
        console.error('❌ API request failed:', error);
        return { 
          data: null as T, 
          error: error instanceof Error ? error.message : 'Network error' 
        };
      } finally {
        // Remove from queue after completion
        this.requestQueue.delete(requestKey);
      }
    })();

    // Add to queue
    this.requestQueue.set(requestKey, requestPromise);
    
    return requestPromise;
  }

  // Auth methods
  async login(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async register(userData: any) {
    const result = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  logout() {
    this.setToken(null);
    this.requestQueue.clear(); // Clear any pending requests
  }

  // Categories
  async getCategories() {
    return this.request<any[]>('/categories');
  }

  async createCategory(categoryData: any) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: any) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory
  async getInventoryItems() {
    return this.request<any[]>('/inventory');
  }

  async getInventoryItem(id: string) {
    return this.request<any>(`/inventory/${id}`);
  }

  async createInventoryItem(itemData: any) {
    return this.request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(id: string, itemData: any) {
    return this.request<any>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.request<any>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async getItemQRCode(id: string) {
    return this.request<{ qrCode: string; qrCodeImage: string }>(`/inventory/${id}/qr-code`);
  }

  // Transactions
  async getTransactions() {
    return this.request<any[]>('/transactions');
  }

  async createTransaction(transactionData: any) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(id: string, transactionData: any) {
    return this.request<any>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  // Maintenance
  async getMaintenanceSchedules() {
    return this.request<any[]>('/maintenance');
  }

  async createMaintenanceSchedule(maintenanceData: any) {
    return this.request<any>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  }

  async updateMaintenanceSchedule(id: string, maintenanceData: any) {
    return this.request<any>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(maintenanceData),
    });
  }

  async deleteMaintenanceSchedule(id: string) {
    return this.request<any>(`/maintenance/${id}`, {
      method: 'DELETE',
    });
  }

  // Alerts
  async getLowStockAlerts() {
    return this.request<any[]>('/alerts');
  }

  async acknowledgeAlert(id: string) {
    return this.request<any>(`/alerts/${id}/acknowledge`, {
      method: 'PUT',
    });
  }

  // Users (Admin only)
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
