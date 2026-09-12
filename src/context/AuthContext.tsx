import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types.ts";
import { api } from "../services/api.ts";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  demoLogin: (role: "agent" | "customer") => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    const data = await api.register(name, email, password);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const demoLogin = async (role: "agent" | "customer"): Promise<User> => {
    const data = await api.demoLogin(role);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
