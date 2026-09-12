import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { api } from "../services/api.ts";
import { Conversation, CustomerStats } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import { NewConversationModal } from "../components/NewConversationModal.tsx";
import {
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { onConversationUpdated } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    activeConversations: 0,
    resolvedConversations: 0,
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [convsRes, statsRes] = await Promise.all([
        api.getConversations(),
        api.getStats(),
      ]);
      setConversations(convsRes.conversations);
      setStats(statsRes.stats as CustomerStats);
    } catch (err) {
      console.error("Failed to load customer dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to live socket events to update recent conversation list and stats
  useEffect(() => {
    const cleanup = onConversationUpdated(() => {
      loadData();
    });
    return cleanup;
  }, [onConversationUpdated]);

  return (
    <DashboardLayout onOpenNewTicket={() => setIsModalOpen(true)}>
      <div id="customer-dashboard" className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Customer Helpdesk Center</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Track open tickets or start a new real-time conversation with our support team.
            </p>
          </div>

          <button
            id="btn-customer-new-conversation"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Conversation</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            id="card-customer-active"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Active Conversations</span>
              <span className="text-2xl font-extrabold text-stone-900 mt-1 block">
                {stats.activeConversations}
              </span>
              <span className="text-[11px] text-amber-600 font-medium">Open & In Progress</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div
            id="card-customer-resolved"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Resolved Inquiries</span>
              <span className="text-2xl font-extrabold text-stone-900 mt-1 block">
                {stats.resolvedConversations}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Completed issues</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div
            id="card-customer-total"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Total Tickets</span>
              <span className="text-2xl font-extrabold text-stone-900 mt-1 block">
                {stats.totalConversations}
              </span>
              <span className="text-[11px] text-stone-400 font-medium">Lifetime history</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Conversations List */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Recent Conversations</h2>
              <p className="text-xs text-stone-500">Live communication channels with support agents</p>
            </div>
            <Link
              to="/customer/conversations"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading your conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">No conversations yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Have a question about your account, billing, or technical integration? Open your first support ticket now.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start First Conversation</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv._id}
                  id={`customer-conv-row-${conv._id}`}
                  to={`/customer/chat/${conv._id}`}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                        {conv.subject}
                      </span>
                      <CategoryBadge category={conv.category} />
                    </div>
                    <div className="text-xs text-stone-500 flex items-center gap-3">
                      <span>
                        {conv.agentId ? `Assigned to ${conv.agentId.name}` : "Waiting for support agent"}
                      </span>
                      <span>&bull;</span>
                      <span>Updated {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <StatusBadge status={conv.status} />
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={loadData}
      />
    </DashboardLayout>
  );
};
