import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import {
  MessageSquare,
  LayoutDashboard,
  Inbox,
  PlusCircle,
  LogOut,
  Headphones,
  Menu,
  X,
  Radio,
  ArrowLeftRight,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onOpenNewTicket?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onOpenNewTicket }) => {
  const { user, logout, demoLogin } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const isCustomer = user?.role === "customer";
  const isAgent = user?.role === "agent";

  const handleQuickSwitch = async () => {
    try {
      setIsSwitching(true);
      if (isCustomer) {
        await demoLogin("agent");
        navigate("/agent/dashboard");
      } else {
        await demoLogin("customer");
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Failed to switch demo role:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const customerNavItems = [
    { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
    { label: "My Conversations", href: "/customer/conversations", icon: Inbox },
  ];

  const agentNavItems = [
    { label: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
    { label: "Conversations Queue", href: "/agent/conversations", icon: Inbox },
  ];

  const currentNavItems = isCustomer ? customerNavItems : agentNavItems;

  return (
    <div id="app-dashboard-layout" className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Testing Demo Banner */}
      <div id="demo-role-banner" className="bg-stone-900 text-stone-200 text-xs px-4 py-2 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Real-Time Demo Mode
          </span>
          <span className="hidden sm:inline text-stone-400">
            Logged in as <strong className="text-white">{user?.name}</strong> ({user?.role === "agent" ? "Support Agent" : "Customer"})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-stone-400">
            Testing dual-party chat? Open an Incognito window or switch roles:
          </span>
          <button
            id="btn-quick-switch-role"
            onClick={handleQuickSwitch}
            disabled={isSwitching}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded text-xs font-medium transition-colors border border-stone-700"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span>{isCustomer ? "Switch to Demo Agent (Sarah)" : "Switch to Demo Customer (Alex)"}</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header id="main-header" className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to={isCustomer ? "/customer/dashboard" : "/agent/dashboard"} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-stone-900 block leading-tight">
                  SupportDesk<span className="text-blue-600">.io</span>
                </span>
                <span className="text-[11px] text-stone-500 block leading-none font-medium">
                  Real-Time Customer Support
                </span>
              </div>
            </Link>
          </div>

          {/* Right Status & Profile Controls */}
          <div className="flex items-center gap-4">
            {/* Socket connection indicator */}
            <div
              id="socket-connection-indicator"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-500" : "text-amber-500"}`} />
              <span className="hidden sm:inline">{isConnected ? "Socket.IO Connected" : "Connecting..."}</span>
              <span className="sm:hidden">{isConnected ? "Live" : "Connecting"}</span>
            </div>

            {/* Role Badge */}
            <span
              id="header-role-badge"
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAgent
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {isAgent ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
              <span>{isAgent ? "Agent" : "Customer"}</span>
            </span>

            {/* User Profile dropdown or signout */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                id="btn-logout-header"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
            {/* Customer Start New Conversation CTA */}
            {isCustomer && onOpenNewTicket && (
              <div className="mb-4">
                <button
                  id="btn-sidebar-new-ticket"
                  onClick={onOpenNewTicket}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>
            )}

            <div className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase px-3 mb-2">
              Navigation
            </div>

            <nav className="space-y-1">
              {currentNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-stone-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Details Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs text-xs text-stone-600">
            <div className="font-semibold text-stone-800 mb-1">{user?.name}</div>
            <div className="text-stone-500 mb-2 truncate">{user?.email}</div>
            <div className="inline-block px-2 py-0.5 rounded bg-stone-100 font-medium text-[11px] text-stone-600 capitalize">
              Role: {user?.role}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100">
              <button
                id="btn-sidebar-logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors py-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Slide-down */}
        {mobileMenuOpen && (
          <div id="mobile-nav-panel" className="lg:hidden fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <span className="font-bold text-stone-900">Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-stone-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isCustomer && onOpenNewTicket && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenNewTicket();
                    }}
                    className="w-full my-4 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Start New Conversation</span>
                  </button>
                )}

                <nav className="mt-4 space-y-1">
                  {currentNavItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-rose-600 py-2 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
