import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Headphones, Lock, Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<"customer" | "agent">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const user = await login(email.trim(), password);

      // Redirect to respective dashboard
      if (user.role === "agent") {
        navigate("/agent/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "customer" | "agent") => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await demoLogin(role);
      if (user.role === "agent") {
        navigate("/agent/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in with demo account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Headphones className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">
            SupportDesk<span className="text-blue-600">.io</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-stone-600">
          Enter your credentials or click a demo account below for instant evaluation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-2xl sm:px-10">
          {/* Role Tabs */}
          <div className="flex rounded-lg bg-stone-100 p-1 mb-6">
            <button
              id="tab-select-customer"
              type="button"
              onClick={() => {
                setActiveTab("customer");
                setEmail("alex@customer.com");
                setPassword("password123");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "customer"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Customer Sign In
            </button>
            <button
              id="tab-select-agent"
              type="button"
              onClick={() => {
                setActiveTab("agent");
                setEmail("agent@support.com");
                setPassword("password123");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "agent"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Support Agent Sign In
            </button>
          </div>

          {/* Quick Demo Login Shortcut */}
          <div className="mb-6 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-700">Quick Demo Access</span>
              <span className="text-[10px] text-stone-500">1-click login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-quick-customer"
                onClick={() => handleQuickDemo("customer")}
                disabled={isLoading}
                className="py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
              >
                Demo Customer
              </button>
              <button
                type="button"
                id="btn-demo-quick-agent"
                onClick={() => handleQuickDemo("agent")}
                disabled={isLoading}
                className="py-1.5 px-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-medium transition-colors"
              >
                Demo Agent
              </button>
            </div>
          </div>

          {error && (
            <div
              id="login-error-banner"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-stone-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {activeTab === "agent" ? "Agent" : "Customer"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Don&apos;t have a customer account?{" "}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
