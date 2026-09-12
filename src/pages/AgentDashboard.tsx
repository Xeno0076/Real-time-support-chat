import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { api } from "../services/api.ts";
import { Conversation, AgentStats } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserCheck,
  Zap,
  AlertTriangle,
  Radio,
} from "lucide-react";

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { onConversationUpdated, isConnected } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    activeChats: 0,
    openConversations: 0,
    resolvedToday: 0,
    averageResponseTime: "3m 45s",
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [convsRes, statsRes] = await Promise.all([
        api.getConversations(),
        api.getStats(),
      ]);
      setConversations(convsRes.conversations);
      setStats(statsRes.stats as AgentStats);
    } catch (err) {
      console.error("Failed to load agent dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for live conversation updates from Socket.IO
  useEffect(() => {
    const cleanup = onConversationUpdated(() => {
      loadData();
    });
    return cleanup;
  }, [onConversationUpdated]);

  const handleClaimTicket = async (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setClaimingId(convId);
      await api.assignConversation(convId);
      loadData();
    } catch (err) {
      console.error("Failed to claim ticket:", err);
    } finally {
      setClaimingId(null);
    }
  };

  // Open & Unassigned conversations needing attention
  const urgentQueue = conversations.filter(
    (c) => c.status === "Open" || (!c.agentId && c.status !== "Resolved" && c.status !== "Closed")
  );

  return (
    <DashboardLayout>
      <div id="agent-dashboard" className="space-y-6">
        {/* Agent Workspace Header */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Agent Command Center</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Support Agent Portal
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Assigned Agent: <strong className="text-stone-800">{user?.name}</strong> &bull; Monitor ticket queues and respond in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/agent/conversations"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric Cards (Required 4 metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Chats */}
          <div
            id="metric-agent-active-chats"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Active Chats</span>
              <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                {stats.activeChats}
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Currently In Progress</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Open Conversations */}
          <div
            id="metric-agent-open-convs"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Open Conversations</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {stats.openConversations}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Awaiting First Reply</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Resolved Today */}
          <div
            id="metric-agent-resolved-today"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Resolved Today</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {stats.resolvedToday}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Completed tickets</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Average Response Time */}
          <div
            id="metric-agent-response-time"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-medium text-stone-500 block">Avg Response Time</span>
              <span className="text-2xl font-extrabold text-purple-600 mt-1 block">
                {stats.averageResponseTime}
              </span>
              <span className="text-[11px] text-purple-700 font-medium">Fast SLA benchmark</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Priority Action Queue: Open & Unassigned Inquiries */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-stone-900">Immediate Action Queue</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {urgentQueue.length} Pending
              </span>
            </div>
            <Link
              to="/agent/conversations"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View all tickets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading ticket queue...</span>
            </div>
          ) : urgentQueue.length === 0 ? (
            <div className="p-10 text-center text-stone-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-stone-900">All caught up!</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                There are no open or unassigned tickets waiting for assistance.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {urgentQueue.slice(0, 5).map((conv) => {
                const customerName = conv.customerId?.name || "Customer";
                const customerEmail = conv.customerId?.email || "";
                const isAssignedToMe = conv.agentId?._id === user?._id;

                return (
                  <div
                    key={conv._id}
                    id={`urgent-ticket-${conv._id}`}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/agent/chat/${conv._id}`}
                          className="text-sm font-bold text-stone-900 hover:text-blue-600 transition-colors"
                        >
                          {conv.subject}
                        </Link>
                        <CategoryBadge category={conv.category} />
                        <StatusBadge status={conv.status} />
                      </div>

                      <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-700">{customerName}</span>
                        <span>({customerEmail})</span>
                        <span>&bull;</span>
                        <span>Opened {new Date(conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!isAssignedToMe && (
                        <button
                          id={`btn-claim-${conv._id}`}
                          onClick={(e) => handleClaimTicket(conv._id, e)}
                          disabled={claimingId === conv._id}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{claimingId === conv._id ? "Claiming..." : "Assign to Me"}</span>
                        </button>
                      )}

                      <Link
                        to={`/agent/chat/${conv._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span>Open Chat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
