import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { api } from "../services/api.ts";
import { Conversation, Message, ConversationStatus } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import {
  ArrowLeft,
  Send,
  Radio,
  User,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserCheck,
  Calendar,
  Clock,
  Mail,
  Tag,
} from "lucide-react";

export const AgentChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendSocketMessage,
    emitTyping,
    emitStopTyping,
    onMessageReceived,
    onConversationUpdated,
    activeTypingUsers,
  } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversation details and messages
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function loadChat() {
      try {
        setIsLoading(true);
        setError(null);

        const [convRes, msgsRes] = await Promise.all([
          api.getConversationById(id!),
          api.getMessages(id!),
        ]);

        if (isMounted) {
          setConversation(convRes.conversation);
          setMessages(msgsRes.messages);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load conversation details.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadChat();

    // Join the Socket.IO conversation room
    joinConversation(id);

    return () => {
      isMounted = false;
      leaveConversation(id);
    };
  }, [id, joinConversation, leaveConversation]);

  // Scroll to bottom on updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time incoming messages and updates
  useEffect(() => {
    if (!id) return;

    const cleanupMessage = onMessageReceived((newMsg: Message) => {
      if (String(newMsg.conversationId) === String(id)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    const cleanupConv = onConversationUpdated((updatedConv: Conversation) => {
      if (String(updatedConv._id) === String(id)) {
        setConversation(updatedConv);
      }
    });

    return () => {
      cleanupMessage();
      cleanupConv();
    };
  }, [id, onMessageReceived, onConversationUpdated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (!id) return;

    emitTyping(id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(id);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !id || isSending) return;

    const text = inputMessage.trim();
    setInputMessage("");
    emitStopTyping(id);

    try {
      setIsSending(true);
      sendSocketMessage(id, text);
    } catch (err: any) {
      console.error("Failed to send message via socket:", err);
      try {
        await api.sendMessage(id, text);
      } catch (restErr: any) {
        setError(restErr.message || "Failed to deliver message.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!id || !conversation || isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      const res = await api.updateConversationStatus(id, newStatus);
      setConversation(res.conversation);
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!id || isAssigning) return;
    try {
      setIsAssigning(true);
      const res = await api.assignConversation(id);
      setConversation(res.conversation);
    } catch (err: any) {
      setError(err.message || "Failed to assign conversation.");
    } finally {
      setIsAssigning(false);
    }
  };

  const isAssignedToMe = conversation?.agentId?._id === user?._id;
  const customer = conversation?.customerId;

  const typingNames = (id && activeTypingUsers[id]) || [];
  const otherTyping = typingNames.filter((name) => name !== user?.name);

  return (
    <DashboardLayout>
      <div id="agent-chat-page-container" className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/agent/conversations"
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors"
                title="Back to queue"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                    {conversation?.subject || "Support Inquiry"}
                  </h1>
                  {conversation && <CategoryBadge category={conversation.category} />}
                </div>

                <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-stone-700">
                    Customer: {customer?.name || "User"}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-500" : "text-amber-500"}`} />
                    <span className="text-[11px]">{isConnected ? "Socket Connected" : "Connecting"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Status Change & Assignment Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {!isAssignedToMe && (
                <button
                  id="btn-agent-claim-chat"
                  onClick={handleAssignToMe}
                  disabled={isAssigning}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isAssigning ? "Claiming..." : "Assign to Me"}</span>
                </button>
              )}

              <select
                id="select-agent-change-status"
                value={conversation?.status || "Open"}
                onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                disabled={isUpdatingStatus}
                aria-label="Change conversation status"
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Messages Thread */}
          <div id="agent-messages-thread" className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50/50">
            {isLoading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2 text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-xs">Loading chat history...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              messages.map((msg) => {
                const senderObj = typeof msg.senderId === "object" ? msg.senderId : null;
                const senderRole = senderObj?.role || "customer";
                const isCurrentUser = senderObj?._id === user?._id;
                const isAgent = senderRole === "agent";

                return (
                  <div
                    key={msg._id}
                    id={`agent-msg-bubble-${msg._id}`}
                    className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">
                        {isCurrentUser ? "You (Agent)" : senderObj?.name || "Customer"}
                      </span>
                      {!isAgent && (
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                          Customer
                        </span>
                      )}
                      <span>&bull;</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-md sm:max-w-lg px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
                        isCurrentUser
                          ? "bg-purple-700 text-white rounded-br-xs"
                          : "bg-white text-stone-900 border border-stone-200 rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {otherTyping.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-stone-500 italic py-1 px-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                <span>{otherTyping.join(", ")} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-end gap-2 shrink-0"
          >
            <div className="flex-1 relative">
              <textarea
                id="agent-chat-textarea"
                rows={2}
                placeholder="Reply as support agent... (Press Enter to send)"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

            <button
              type="submit"
              id="btn-agent-send-reply"
              disabled={!inputMessage.trim() || isSending}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5 h-10 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Reply</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Info Sidebar / Customer Context (Desktop) */}
        <div className="w-full lg:w-72 bg-white rounded-xl border border-stone-200 p-5 shadow-2xs shrink-0 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Customer Profile
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {customer?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-900 truncate">{customer?.name}</div>
                  <div className="text-xs text-stone-500 truncate">{customer?.email}</div>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="space-y-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Ticket Details
              </span>

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Status</span>
                {conversation && <StatusBadge status={conversation.status} />}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Category</span>
                {conversation && <CategoryBadge category={conversation.category} />}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Assignee</span>
                <span className="font-semibold text-stone-800">
                  {conversation?.agentId?.name || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Created</span>
                <span className="text-stone-700">
                  {conversation && new Date(conversation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Status Workflow Buttons */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Quick Actions
              </span>
              <button
                id="btn-quick-in-progress"
                onClick={() => handleStatusChange("In Progress")}
                className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold text-left flex items-center justify-between"
              >
                <span>Set In Progress</span>
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-quick-resolve"
                onClick={() => handleStatusChange("Resolved")}
                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold text-left flex items-center justify-between"
              >
                <span>Mark as Resolved</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg text-[11px] text-stone-500 border border-stone-200">
            Real-time messages sent here will immediately appear in the customer&apos;s window without refresh.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
