/**
 * FleetFlow API Client — single Axios instance for all backend calls.
 * Endpoints: /api/v1/{auth,vehicles,trips,drivers,finance,analytics,locations,incidents}
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Auth: attach token to every request ──────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ── Auto-logout on 401 ───────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && localStorage.getItem("auth_token")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

export type UserRole = "MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE_ANALYST";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  vehicleTypeId: string;
  vehicleType: { id: string; name: string };
  status: "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
  currentOdometer: number;
  capacityWeight?: number;
  capacityVolume?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  licenseNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  licenseExpiryDate: string;
  licenseClass?: string;
  status: "ON_DUTY" | "OFF_DUTY" | "ON_TRIP" | "SUSPENDED";
  safetyScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driver: Driver;
  origin: string;
  destination: string;
  distanceEstimated: number;
  distanceActual?: number;
  cargoWeight?: number;
  cargoDescription?: string;
  odometerStart?: number;
  odometerEnd?: number;
  revenue?: number;
  clientName?: string;
  invoiceReference?: string;
  status: "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  dispatchTime?: string;
  completionTime?: string;
  cancelledReason?: string;
  expenses?: Expense[];
  fuelLogs?: FuelLog[];
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  tripId?: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerAtFill: number;
  fuelStation?: string;
  loggedAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  description?: string;
  cost: number;
  odometerAtService: number;
  technicianName?: string;
  shopName?: string;
  serviceDate: string;
  nextServiceDue?: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  amount: number;
  category: "TOLL" | "LODGING" | "MAINTENANCE_EN_ROUTE" | "MISC";
  description?: string;
  loggedByUserId?: string;
  dateLogged: string;
}

export interface VehicleType {
  id: string;
  name: "TRUCK" | "VAN" | "BIKE" | "PLANE";
  description?: string;
}

export interface DashboardKPIs {
  fleet: {
    total: number;
    active: number;
    available: number;
    onTrip: number;
    inShop: number;
    retired: number;
    utilizationRate: string;
  };
  drivers: {
    total: number;
    onDuty: number;
    suspended: number;
    expiringLicenses: number;
  };
  trips: {
    pending: number;
    active: number;
    completedToday: number;
  };
  alerts: {
    maintenanceAlerts: number;
    expiringLicenses: number;
    suspendedDrivers: number;
  };
}

export interface MonthlyReport {
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

export interface VehicleROI {
  vehicleId: string;
  licensePlate: string;
  make: string;
  model: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  profit: number;
  profitMargin: string;
}

export interface FuelEfficiency {
  vehicleId: string;
  licensePlate: string;
  make: string;
  model: string;
  totalDistanceKm: number;
  totalLiters: number;
  totalFuelCost: number;
  kmPerLiter: number | null;
  costPerKm: number | null;
}

// ════════════════════════════════════════════════════════════════
//  AUTH API
// ════════════════════════════════════════════════════════════════

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { token: string; user: AuthUser } }>("/api/v1/auth/login", credentials);
    localStorage.setItem("auth_token", data.data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.data.user));
    return data.data;
  },
  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<{ success: boolean; data: AuthUser }>("/api/v1/auth/me");
    return data.data;
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put("/api/v1/auth/change-password", payload);
  },
  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { message: string; resetToken?: string } }>("/api/v1/auth/forgot-password", { email });
    return data.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { message: string } }>("/api/v1/auth/reset-password", { token, newPassword });
    return data.data;
  },
  createUser: async (payload: { fullName: string; email: string; password: string; role: UserRole }): Promise<AuthUser> => {
    const { data } = await apiClient.post<{ success: boolean; data: AuthUser }>("/api/v1/auth/admin/users", payload);
    return data.data;
  },
  listUsers: async (): Promise<AuthUser[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: AuthUser[] }>("/api/v1/auth/admin/users");
    return data.data;
  },
  logout: (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },
};

// ════════════════════════════════════════════════════════════════
//  FLEET API (vehicles)
// ════════════════════════════════════════════════════════════════

export const fleetApi = {
  listVehicles: async (params?: { status?: string; vehicleTypeId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Vehicle> }>("/api/v1/vehicles", { params });
    return data.data;
  },
  getVehicle: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: Vehicle }>(`/api/v1/vehicles/${id}`);
    return data.data;
  },
  createVehicle: async (payload: {
    licensePlate: string; make: string; model: string; year: number; color?: string;
    vin?: string; vehicleTypeId: string; capacityWeight?: number; capacityVolume?: number; currentOdometer?: number;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: Vehicle }>("/api/v1/vehicles", payload);
    return data.data;
  },
  updateVehicle: async (id: string, payload: Partial<Vehicle>) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Vehicle }>(`/api/v1/vehicles/${id}`, payload);
    return data.data;
  },
  updateVehicleStatus: async (id: string, status: string, reason?: string) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Vehicle }>(`/api/v1/vehicles/${id}/status`, { status, reason });
    return data.data;
  },
  deleteVehicle: async (id: string) => {
    await apiClient.delete(`/api/v1/vehicles/${id}`);
  },
  listVehicleTypes: async (): Promise<VehicleType[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: VehicleType[] }>("/api/v1/vehicles/types");
    return data.data;
  },
  getMaintenanceLogs: async (vehicleId: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: MaintenanceLog[] }>(`/api/v1/vehicles/${vehicleId}/maintenance`);
    return data.data;
  },
  addMaintenanceLog: async (vehicleId: string, payload: {
    serviceType: string; description?: string; cost: number; odometerAtService: number;
    technicianName?: string; shopName?: string; serviceDate: string; nextServiceDue?: string;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: MaintenanceLog }>("/api/v1/finance/maintenance", { ...payload, vehicleId: Number(vehicleId) });
    return data.data;
  },
};

// ════════════════════════════════════════════════════════════════
//  DISPATCH API (trips)
// ════════════════════════════════════════════════════════════════

export const dispatchApi = {
  listTrips: async (params?: { status?: string; vehicleId?: string; driverId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Trip> }>("/api/v1/trips", { params });
    return data.data;
  },
  getTrip: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: Trip }>(`/api/v1/trips/${id}`);
    return data.data;
  },
  createTrip: async (payload: {
    vehicleId: string; driverId: string; origin: string; destination: string;
    distanceEstimated: number; cargoWeight?: number; cargoDescription?: string;
    clientName?: string; invoiceReference?: string; revenue?: number;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: Trip }>("/api/v1/trips", payload);
    return data.data;
  },
  updateTrip: async (id: string, payload: Partial<Trip>) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Trip }>(`/api/v1/trips/${id}`, payload);
    return data.data;
  },
  transitionStatus: async (id: string, payload: {
    status: "DISPATCHED" | "COMPLETED" | "CANCELLED";
    odometerStart?: number; odometerEnd?: number;
    distanceActual?: number; cancelledReason?: string;
  }) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Trip }>(`/api/v1/trips/${id}/status`, payload);
    return data.data;
  },
  getTripLedger: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: unknown }>(`/api/v1/trips/${id}/ledger`);
    return data.data;
  },
  listWaypoints: async (tripId: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: unknown[] }>(`/api/v1/trips/${tripId}/waypoints`);
    return data.data;
  },
  addWaypoint: async (tripId: string, payload: { sequence: number; location: string; latitude?: number; longitude?: number; notes?: string; scheduledAt?: string }) => {
    const { data } = await apiClient.post<{ success: boolean; data: unknown }>(`/api/v1/trips/${tripId}/waypoints`, payload);
    return data.data;
  },
};

// ════════════════════════════════════════════════════════════════
//  HR API (drivers)
// ════════════════════════════════════════════════════════════════

export const hrApi = {
  listDrivers: async (params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Driver> }>("/api/v1/drivers", { params });
    return data.data;
  },
  getDriver: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: Driver }>(`/api/v1/drivers/${id}`);
    return data.data;
  },
  createDriver: async (payload: {
    licenseNumber: string; fullName: string; phone?: string; email?: string;
    dateOfBirth?: string; licenseExpiryDate: string; licenseClass?: string; safetyScore?: number;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: Driver }>("/api/v1/drivers", payload);
    return data.data;
  },
  updateDriver: async (id: string, payload: Partial<Driver>) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Driver }>(`/api/v1/drivers/${id}`, payload);
    return data.data;
  },
  updateDriverStatus: async (id: string, status: string, reason?: string) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Driver }>(`/api/v1/drivers/${id}/status`, { status, reason });
    return data.data;
  },
  adjustSafetyScore: async (id: string, adjustment: number, reason?: string) => {
    const { data } = await apiClient.patch<{ success: boolean; data: Driver }>(`/api/v1/drivers/${id}/safety-score`, { adjustment, reason });
    return data.data;
  },
  deleteDriver: async (id: string) => {
    await apiClient.delete(`/api/v1/drivers/${id}`);
  },
  getExpiringLicenses: async (daysAhead?: number) => {
    const { data } = await apiClient.get<{ success: boolean; data: Driver[] }>("/api/v1/drivers/expiring", { params: { daysAhead } });
    return data.data;
  },
};

// ════════════════════════════════════════════════════════════════
//  FINANCE API (fuel logs, expenses, maintenance)
// ════════════════════════════════════════════════════════════════

export const financeApi = {
  listFuelLogs: async (params?: { vehicleId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: FuelLog[] }>("/api/v1/finance/fuel", { params });
    return data.data;
  },
  createFuelLog: async (payload: {
    vehicleId: string; tripId?: string; liters: number; costPerLiter: number;
    odometerAtFill: number; fuelStation?: string; loggedAt?: string;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: FuelLog }>("/api/v1/finance/fuel", payload);
    return data.data;
  },
  listExpenses: async (params?: { vehicleId?: string; category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: Expense[] }>("/api/v1/finance/expenses", { params });
    return data.data;
  },
  createExpense: async (payload: {
    vehicleId: string; tripId?: string; amount: number;
    category: "TOLL" | "LODGING" | "MAINTENANCE_EN_ROUTE" | "MISC"; description?: string;
  }) => {
    const { data } = await apiClient.post<{ success: boolean; data: Expense }>("/api/v1/finance/expenses", payload);
    return data.data;
  },
  listMaintenanceLogs: async (params?: { vehicleId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: MaintenanceLog[] }>("/api/v1/finance/maintenance", { params });
    return data.data;
  },
};

// ════════════════════════════════════════════════════════════════
//  ANALYTICS API
// ════════════════════════════════════════════════════════════════

export const analyticsApi = {
  getDashboardKPIs: async (): Promise<DashboardKPIs> => {
    const { data } = await apiClient.get<{ success: boolean; data: DashboardKPIs }>("/api/v1/analytics/kpi");
    return data.data;
  },
  getFuelEfficiency: async (startDate?: string, endDate?: string): Promise<FuelEfficiency[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: FuelEfficiency[] }>("/api/v1/analytics/fuel-efficiency", { params: { startDate, endDate } });
    return data.data;
  },
  getVehicleROI: async (startDate?: string, endDate?: string): Promise<VehicleROI[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: VehicleROI[] }>("/api/v1/analytics/roi", { params: { startDate, endDate } });
    return data.data;
  },
  getMonthlyReport: async (year?: number): Promise<MonthlyReport[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: MonthlyReport[] }>("/api/v1/analytics/monthly", { params: { year } });
    return data.data;
  },
  getDriverPerformance: async (startDate?: string, endDate?: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: unknown[] }>("/api/v1/analytics/driver-performance", { params: { startDate, endDate } });
    return data.data;
  },
  exportTripsCSV: async (startDate: string, endDate: string): Promise<string> => {
    const { data } = await apiClient.get<string>("/api/v1/analytics/export/csv", {
      params: { startDate, endDate },
      responseType: "text",
    });
    return data;
  },
};

// ════════════════════════════════════════════════════════════════
//  LOCATIONS API
// ════════════════════════════════════════════════════════════════

export const locationsApi = {
  getLatestLocations: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: unknown[] }>("/api/v1/locations/latest");
    return data.data;
  },
  getVehicleLocation: async (vehicleId: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: unknown }>(`/api/v1/locations/${vehicleId}/latest`);
    return data.data;
  },
  postLocation: async (vehicleId: string, payload: { latitude: number; longitude: number; speed?: number; heading?: number }) => {
    const { data } = await apiClient.post<{ success: boolean; data: unknown }>("/api/v1/locations", { ...payload, vehicleId: Number(vehicleId) });
    return data.data;
  },
};
