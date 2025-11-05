import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api";
import type { AuthResponse } from "../services/api";
import { AuthContext } from "./AuthContextProvider";

export interface AuthContextType {
  user: AuthResponse["user"] | null;
  token: string | null;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    const response = await apiService.login({ emailOrPhone, password });
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem("token", response.access_token);
    localStorage.setItem("user", JSON.stringify(response.user));
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    const response = await apiService.register({
      name,
      email: email || undefined,
      phone_number: phone || undefined,
      password,
    });
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem("token", response.access_token);
    localStorage.setItem("user", JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
