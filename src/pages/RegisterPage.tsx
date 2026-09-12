import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Headphones, Lock, Mail, User, AlertCircle, Loader2, ArrowRight, ShieldAlert } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await register(name.trim(), email.trim(), password);
      navigate("/customer/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="register-page" className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Headphones className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">
            SupportDesk<span className="text-blue-600">.io</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Create your customer account</h2>
        <p className="mt-1 text-xs text-stone-600">
          Get real-time answers and 24/7 assistance from our support team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-2xl sm:px-10">
          {/* Role Policy Notice */}
          <div className="mb-6 p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Public Registration: Customer Role Only</span>
              <span>Support agents are provisioned via administrative seeds and internal provisioning.</span>
            </div>
          </div>

          {error && (
            <div
              id="register-error-banner"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="register-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-xs font-semibold text-stone-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@customer.com"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold text-stone-700 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="register-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-stone-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="register-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Customer Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
