/**
 * Axios API client — single instance for all backend calls.
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ── Response interceptor for global error handling ─────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "An unexpected error occurred";

    // Auto-logout on 401 (expired/invalid token)
    if (status === 401 && localStorage.getItem("auth_token")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }

    console.error("[API Error]", message);
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Auth API ───────────────────────────────────────────────────────────────

export type UserRole = "MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE_ANALYST";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: "MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE_ANALYST";
}

export interface CreateUserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export interface ListUsersResponse {
  success: boolean;
  data: AuthUser[];
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/login", credentials);
    localStorage.setItem("auth_token", data.data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.data.user));
    return data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<MeResponse>("/api/v1/auth/me");
    return data.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put("/api/v1/auth/change-password", payload);
  },

  /** Request a password reset token */
  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { message: string; resetToken?: string } }>(
      "/api/v1/auth/forgot-password",
      { email }
    );
    return data.data;
  },

  /** Reset password using the token */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { message: string } }>(
      "/api/v1/auth/reset-password",
      { token, newPassword }
    );
    return data.data;
  },

  /** Admin-only: create a new user with an initial password */
  createUser: async (payload: CreateUserPayload): Promise<CreateUserResponse["data"]> => {
    const { data } = await apiClient.post<CreateUserResponse>("/api/v1/auth/admin/users", payload);
    return data.data;
  },

  /** Admin-only: list all users */
  listUsers: async (): Promise<AuthUser[]> => {
    const { data } = await apiClient.get<ListUsersResponse>("/api/v1/auth/admin/users");
    return data.data;
  },

  logout: (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem("auth_token"));
  },
};

// Attach token to every request when present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Fleet (Vehicles) API ────────────────────────────────────────────────────

export const fleetApi = {
  listVehicles: (params?: Record<string, unknown>) =>
    apiClient.get('/api/v1/fleet/vehicles', { params }),

  getVehicle: (id: string) =>
    apiClient.get(`/api/v1/fleet/vehicles/${id}`),

  createVehicle: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/fleet/vehicles', data),

  updateVehicle: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/fleet/vehicles/${id}`, data),

  updateVehicleStatus: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/fleet/vehicles/${id}/status`, data),

  deleteVehicle: (id: string) =>
    apiClient.delete(`/api/v1/fleet/vehicles/${id}`),

  listVehicleTypes: () =>
    apiClient.get('/api/v1/fleet/types'),

  getVehicleMaintenanceLogs: (id: string) =>
    apiClient.get(`/api/v1/fleet/vehicles/${id}/maintenance`),
};

// ── Drivers (HR) API ────────────────────────────────────────────────────────

export const driversApi = {
  listDrivers: (params?: Record<string, unknown>) =>
    apiClient.get('/api/v1/drivers', { params }),

  getDriver: (id: string) =>
    apiClient.get(`/api/v1/drivers/${id}`),

  createDriver: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/drivers', data),

  updateDriver: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/drivers/${id}`, data),

  updateDriverStatus: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/drivers/${id}/status`, data),

  adjustSafetyScore: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/drivers/${id}/safety-score`, data),

  deleteDriver: (id: string) =>
    apiClient.delete(`/api/v1/drivers/${id}`),

  getExpiringLicenses: () =>
    apiClient.get('/api/v1/drivers/expiring'),
};

// ── Trips (Dispatch) API ────────────────────────────────────────────────────

export const tripsApi = {
  listTrips: (params?: Record<string, unknown>) =>
    apiClient.get('/api/v1/trips', { params }),

  getTrip: (id: string) =>
    apiClient.get(`/api/v1/trips/${id}`),

  createTrip: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/trips', data),

  updateTrip: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/trips/${id}`, data),

  transitionTrip: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/v1/trips/${id}/status`, data),

  getTripLedger: (id: string) =>
    apiClient.get(`/api/v1/trips/${id}/ledger`),
};

// ── Finance API ─────────────────────────────────────────────────────────────

export const financeApi = {
  createFuelLog: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/finance/fuel', data),

  listFuelLogs: (params?: Record<string, unknown>) =>
    apiClient.get('/api/v1/finance/fuel', { params }),

  createExpense: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/finance/expenses', data),

  listExpenses: (params?: Record<string, unknown>) =>
    apiClient.get('/api/v1/finance/expenses', { params }),

  createMaintenanceLog: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/finance/maintenance', data),
};

// ── Analytics API ────────────────────────────────────────────────────────────

export interface KpiData {
  fleet: { total: number; active: number; available: number; onTrip: number; inShop: number; retired: number; utilizationRate: string };
  drivers: { total: number; onDuty: number; suspended: number; expiringLicenses: number };
  trips: { pending: number; active: number; completedToday: number };
  alerts: { maintenanceAlerts: number; expiringLicenses: number; suspendedDrivers: number };
}

export interface MonthlyData {
  month: number;
  label: string;
  tripsCompleted: number;
  totalDistanceKm: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
  profit: number;
}

export interface DriverPerformanceData {
  driverId: string;
  driverName: string;
  licenseNumber: string;
  tripsCompleted: number;
  totalDistanceKm: number;
  avgSafetyScore: number;
  safetyScore: number;
  status: string;
}

export interface FuelEfficiencyData {
  vehicleId: string;
  licensePlate: string;
  make: string;
  model: string;
  totalDistanceKm: number;
  totalFuelLiters: number;
  kmPerLiter: number | null;
}

export const analyticsApi = {
  getKpi: async (): Promise<KpiData> => {
    const { data } = await apiClient.get<{ success: boolean; data: KpiData }>('/api/v1/analytics/kpi');
    return data.data;
  },

  getMonthly: async (year?: number): Promise<MonthlyData[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: MonthlyData[] }>(
      '/api/v1/analytics/monthly',
      { params: year ? { year } : {} }
    );
    return data.data;
  },

  getDriverPerformance: async (params?: { startDate?: string; endDate?: string }): Promise<DriverPerformanceData[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: DriverPerformanceData[] }>(
      '/api/v1/analytics/driver-performance',
      { params }
    );
    return data.data;
  },

  getFuelEfficiency: async (params?: { startDate?: string; endDate?: string }): Promise<FuelEfficiencyData[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: FuelEfficiencyData[] }>(
      '/api/v1/analytics/fuel-efficiency',
      { params }
    );
    return data.data;
  },
};
