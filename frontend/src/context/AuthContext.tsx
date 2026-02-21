/**
 * AuthContext — stores current user + role, provides login/logout helpers.
 * No public registration — admin creates users.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/client";
import type { UserRole, AuthUser } from "../api/client";

export type { UserRole, AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Quick helper — e.g. hasRole("SUPER_ADMIN") or hasRole(["SUPER_ADMIN","DISPATCHER"]) */
  hasRole: (role: UserRole | UserRole[]) => boolean;
  /** Switch role for demo purposes */
  switchRole: (role: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Rehydrate user from token on mount ────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  // ── Mock users for demo (matches backend seed data) ──────────────────
  const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
    "superadmin@fleetflow.io": { id: "1", fullName: "Super Admin",      email: "superadmin@fleetflow.io", role: "SUPER_ADMIN",     password: "FleetFlow@2025" },
    "manager@fleetflow.io":    { id: "2", fullName: "Fleet Manager",    email: "manager@fleetflow.io",    role: "MANAGER",         password: "FleetFlow@2025" },
    "dispatcher@fleetflow.io": { id: "3", fullName: "Lead Dispatcher",  email: "dispatcher@fleetflow.io", role: "DISPATCHER",      password: "FleetFlow@2025" },
    "safety@fleetflow.io":     { id: "4", fullName: "Safety Officer",   email: "safety@fleetflow.io",     role: "SAFETY_OFFICER",  password: "FleetFlow@2025" },
    "finance@fleetflow.io":    { id: "5", fullName: "Finance Analyst",  email: "finance@fleetflow.io",    role: "FINANCE_ANALYST", password: "FleetFlow@2025" },
  };

  // ── Login ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    // Always use mock credentials — bypasses backend/network entirely
    const mock = MOCK_USERS[email.toLowerCase().trim()];
    if (mock && mock.password === password) {
      const { password: _pw, ...user } = mock;
      void _pw;
      localStorage.setItem("auth_token", "mock-token-" + user.id);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setUser(user);
      return user;
    }
    // Wrong credentials — throw a friendly error (no network call)
    throw new Error("Invalid email or password. Use demo credentials below.");
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  // ── Role check helper ─────────────────────────────────────────────────
  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      if (Array.isArray(role)) return role.includes(user.role);
      return user.role === role;
    },
    [user]
  );

  // ── Switch role (for demo role-switcher in TopBar) ────────────────────
  const ROLE_EMAILS: Record<string, string> = {
    SUPER_ADMIN: "superadmin@fleetflow.io",
    MANAGER: "manager@fleetflow.io",
    DISPATCHER: "dispatcher@fleetflow.io",
    SAFETY_OFFICER: "safety@fleetflow.io",
    FINANCE_ANALYST: "finance@fleetflow.io",
  };

  const switchRole = useCallback((role: string) => {
    const email = ROLE_EMAILS[role];
    if (!email) return;
    const mock = MOCK_USERS[email];
    if (!mock) return;
    const { password: _pw, ...u } = mock;
    void _pw;
    localStorage.setItem("auth_token", "mock-token-" + u.id);
    localStorage.setItem("auth_user", JSON.stringify(u));
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
