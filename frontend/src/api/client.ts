/**
 * Axios API client — single instance for all backend calls.
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
    const message =
      error.response?.data?.detail || error.message || "An unexpected error occurred";
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
