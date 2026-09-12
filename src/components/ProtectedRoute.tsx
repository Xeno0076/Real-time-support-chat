import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { UserRole } from "../types.ts";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div id="loading-spinner-screen" className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-stone-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If a customer tries to access an agent page, redirect to customer dashboard
    if (user.role === "customer") {
      return <Navigate to="/customer/dashboard" replace />;
    }
    // If an agent tries to access a customer page, redirect to agent dashboard
    return <Navigate to="/agent/dashboard" replace />;
  }

  return <>{children}</>;
};
