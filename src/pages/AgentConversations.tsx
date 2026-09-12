import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { api } from "../services/api.ts";
import { Conversation, ConversationStatus, ConversationCategory } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import {
  Search,
  Filter,
  UserCheck,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";

export const AgentConversations: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [assignmentFilter, setAssignmentFilter] = useState<"All" | "Me" | "Unassigned">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const res = await api.getConversations({
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
      });
      setConversations(res.conversations);
    } catch (err) {
      console.error("Failed to load agent conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadConversations();
  };

  const handleAssignToMe = async (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAssigningId(convId);
      await api.assignConversation(convId);
      loadConversations();
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    } finally {
      setAssigningId(null);
    }
  };

  const statusOptions = ["All", "Open", "In Progress", "Resolved", "Closed"];
  const categoryOptions = [
    "All",
    "Account",
    "Billing",
    "Technical Support",
    "General",
    "Other",
  ];

  // Client-side assignment filter
  const filteredConversations = conversations.filter((c) => {
    if (assignmentFilter === "Me") {
      return c.agentId?._id === user?._id;
    }
    if (assignmentFilter === "Unassigned") {
      return !c.agentId;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div id="agent-conversations-page" className="space-y-6">
        {/* Page Title */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">All Support Conversations</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Comprehensive queue of incoming tickets across all categories and customer accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-lg">
              Total Found: {filteredConversations.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                id="search-agent-conversations"
                type="text"
                placeholder="Search subject, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </form>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <select
                id="filter-agent-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>

              {/* Assignment Filter */}
              <select
                id="filter-agent-assignment"
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="All">All Assignments</option>
                <option value="Me">Assigned to Me</option>
                <option value="Unassigned">Unassigned Only</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-stone-100 pt-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase mr-1">Status:</span>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-purple-700 text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Queue Table / Cards */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-xs font-medium">Filtering tickets...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">No tickets found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                No conversations match the selected status or filters.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setCategoryFilter("All");
                  setAssignmentFilter("All");
                  setSearchTerm("");
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredConversations.map((conv) => {
                const customerName = conv.customerId?.name || "Customer";
                const customerEmail = conv.customerId?.email || "";
                const isAssignedToMe = conv.agentId?._id === user?._id;

                return (
                  <div
                    key={conv._id}
                    id={`agent-conv-item-${conv._id}`}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                          to={`/agent/chat/${conv._id}`}
                          className="text-sm font-bold text-stone-900 hover:text-purple-700 transition-colors"
                        >
                          {conv.subject}
                        </Link>
                        <CategoryBadge category={conv.category} />
                        <StatusBadge status={conv.status} />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-stone-800">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{customerName}</span>
                        </span>
                        <span className="text-stone-400">({customerEmail})</span>
                        <span>&bull;</span>
                        <span>
                          {conv.agentId ? (
                            <span className={isAssignedToMe ? "text-purple-700 font-bold" : "text-stone-600 font-medium"}>
                              {isAssignedToMe ? "Assigned to You" : `Agent: ${conv.agentId.name}`}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold">Unassigned</span>
                          )}
                        </span>
                        <span>&bull;</span>
                        <span>
                          Updated {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!isAssignedToMe && (
                        <button
                          id={`btn-table-claim-${conv._id}`}
                          onClick={(e) => handleAssignToMe(conv._id, e)}
                          disabled={assigningId === conv._id}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{assigningId === conv._id ? "Assigning..." : "Assign to Me"}</span>
                        </button>
                      )}

                      <Link
                        id={`btn-open-chat-${conv._id}`}
                        to={`/agent/chat/${conv._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
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
