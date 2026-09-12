import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

import { LandingPage } from "./pages/LandingPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { CustomerDashboard } from "./pages/CustomerDashboard.tsx";
import { CustomerConversations } from "./pages/CustomerConversations.tsx";
import { ChatPage } from "./pages/ChatPage.tsx";
import { AgentDashboard } from "./pages/AgentDashboard.tsx";
import { AgentConversations } from "./pages/AgentConversations.tsx";
import { AgentChatPage } from "./pages/AgentChatPage.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRole="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/conversations"
              element={
                <ProtectedRoute allowedRole="customer">
                  <CustomerConversations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/chat/:id"
              element={
                <ProtectedRoute allowedRole="customer">
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Agent Routes */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/conversations"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentConversations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/chat/:id"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentChatPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
