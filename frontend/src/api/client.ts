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

/* ─── Item API functions ──────────────────────────────── */

export interface ItemPayload {
  name: string;
  description?: string | null;
}

export interface ItemResponse {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export const itemsApi = {
  getAll: (skip = 0, limit = 100) =>
    apiClient.get<ItemResponse[]>('/items', { params: { skip, limit } }),

  getById: (id: number) =>
    apiClient.get<ItemResponse>(`/items/${id}`),

  create: (data: ItemPayload) =>
    apiClient.post<ItemResponse>('/items', data),

  update: (id: number, data: Partial<ItemPayload>) =>
    apiClient.put<ItemResponse>(`/items/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/items/${id}`),
};

// ── Auth API ───────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE_ANALYST";

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
