import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import {
  MessageSquare,
  Headphones,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoCustomer = async () => {
    await demoLogin("customer");
    navigate("/customer/dashboard");
  };

  const handleDemoAgent = async () => {
    await demoLogin("agent");
    navigate("/agent/dashboard");
  };

  return (
    <div id="landing-page" className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-stone-900">
              SupportDesk<span className="text-blue-600">.io</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                id="btn-nav-dashboard"
                to={user.role === "agent" ? "/agent/dashboard" : "/customer/dashboard"}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  id="btn-nav-login"
                  to="/login"
                  className="px-3.5 py-1.5 text-stone-700 hover:text-stone-900 text-xs font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  id="btn-nav-register"
                  to="/register"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Real-Time Bi-Directional WebSockets via Socket.IO</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight max-w-3xl leading-tight">
          Modern Customer Support, <br className="hidden sm:inline" />
          Delivered in Real Time.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
          A full-stack, production-grade support platform connecting customers with support agents instantly.
          Zero page reloads, authenticated JWT rooms, and persistent conversation history.
        </p>

        {/* Demo Fast-Track Action Box */}
        <div
          id="demo-action-box"
          className="mt-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-xl w-full text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Interactive Live Testing
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Socket.IO Server Ready
            </span>
          </div>

          <p className="text-xs text-stone-600 mb-4">
            Experience both sides of customer support. Click either role below to test live messaging:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn-hero-demo-customer"
              onClick={handleDemoCustomer}
              className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Demo Customer</div>
                  <div className="text-[11px] text-blue-700">Alex Morgan</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="btn-hero-demo-agent"
              onClick={handleDemoAgent}
              className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Demo Support Agent</div>
                  <div className="text-[11px] text-purple-700">Sarah Jenkins</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Or test normal registration:</span>
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Create Customer Account &rarr;
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Instant Socket.IO Sync</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Real-time message dispatching with conversation-specific socket rooms, connection indicators, and typing alerts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Role-Based Authorization</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Customers and support agents have distinct dashboards and protected API endpoints with bcrypt password hashing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Full Ticket Lifecycles</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Manage ticket workflows from Open to In Progress, Resolved, and Closed with response time metrics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-500">
          Real-Time Customer Support Chat Platform &bull; Node.js &bull; Express &bull; Socket.IO &bull; React &bull; Tailwind CSS
        </div>
      </footer>
    </div>
  );
};
