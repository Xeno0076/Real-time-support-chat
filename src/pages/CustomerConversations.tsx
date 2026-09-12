import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";
import { Conversation, ConversationStatus, ConversationCategory } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import { NewConversationModal } from "../components/NewConversationModal.tsx";
import {
  Search,
  Filter,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";

export const CustomerConversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
      console.error("Failed to load customer conversations:", err);
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

  const statusOptions = ["All", "Open", "In Progress", "Resolved", "Closed"];
  const categoryOptions = [
    "All",
    "Account",
    "Billing",
    "Technical Support",
    "General",
    "Other",
  ];

  return (
    <DashboardLayout onOpenNewTicket={() => setIsModalOpen(true)}>
      <div id="customer-conversations-page" className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">My Support Conversations</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Review conversation histories and reconnect with agents on past tickets.
            </p>
          </div>

          <button
            id="btn-customer-page-new-ticket"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                id="search-customer-conversations"
                type="text"
                placeholder="Search by subject keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                id="filter-customer-category"
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
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">No conversations match your criteria</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Try adjusting your search terms or filters to find older tickets.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setCategoryFilter("All");
                  setSearchTerm("");
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {conversations.map((conv) => (
                <Link
                  key={conv._id}
                  to={`/customer/chat/${conv._id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                        {conv.subject}
                      </span>
                      <CategoryBadge category={conv.category} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Opened {new Date(conv.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span>&bull;</span>
                      <span>
                        {conv.agentId ? (
                          <strong className="text-stone-700 font-semibold">
                            Agent: {conv.agentId.name}
                          </strong>
                        ) : (
                          <span className="text-amber-600 font-medium">Unassigned</span>
                        )}
                      </span>
                      <span>&bull;</span>
                      <span>
                        Last active {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <StatusBadge status={conv.status} size="md" />
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
        onCreated={loadConversations}
      />
    </DashboardLayout>
  );
};
