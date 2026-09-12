import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { api } from "../services/api.ts";
import { Conversation, Message } from "../types.ts";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { StatusBadge, CategoryBadge } from "../components/Badges.tsx";
import {
  ArrowLeft,
  Send,
  Radio,
  Clock,
  User,
  Headphones,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Scroll to bottom on initial load and when message count changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time incoming messages via Socket.IO
  useEffect(() => {
    if (!id) return;

    const cleanupMessage = onMessageReceived((newMsg: Message) => {
      // Check if message belongs to this conversation
      if (String(newMsg.conversationId) === String(id)) {
        setMessages((prev) => {
          // Idempotent guard: avoid adding duplicate message IDs
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
      // We send through the socket for instant sub-millisecond dispatch
      // AND server saves to MongoDB
      sendSocketMessage(id, text);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Fallback to REST if socket fails
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

  const handleToggleStatus = async (newStatus: "Closed" | "Open") => {
    if (!id) return;
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

  const typingNames = (id && activeTypingUsers[id]) || [];
  const otherTyping = typingNames.filter((name) => name !== user?.name);

  return (
    <DashboardLayout>
      <div id="chat-page-container" className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/customer/conversations"
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                  {conversation?.subject || "Support Conversation"}
                </h1>
                {conversation && <CategoryBadge category={conversation.category} />}
                {conversation && <StatusBadge status={conversation.status} />}
              </div>

              <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                {conversation?.agentId ? (
                  <span className="flex items-center gap-1 font-medium text-stone-700">
                    <Headphones className="w-3.5 h-3.5 text-blue-600" />
                    <span>Agent: {conversation.agentId.name}</span>
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Waiting for an agent...</span>
                )}
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-500" : "text-amber-500"}`} />
                  <span className="text-[11px]">{isConnected ? "Live Room" : "Reconnecting"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action: Close or Reopen Ticket */}
          <div className="flex items-center gap-2 shrink-0">
            {conversation?.status === "Closed" ? (
              <button
                id="btn-customer-reopen-ticket"
                onClick={() => handleToggleStatus("Open")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            ) : (
              <button
                id="btn-customer-close-ticket"
                onClick={() => handleToggleStatus("Closed")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-600 border border-stone-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Closed</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Thread Area */}
        <div id="messages-thread" className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50/50">
          {isLoading ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading conversation history...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col text-center p-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Conversation Initialized</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Say hello to our support team below. An agent will respond in real time.
              </p>
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
                  id={`msg-bubble-${msg._id}`}
                  className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-700">
                      {isCurrentUser ? "You" : senderObj?.name || "Support"}
                    </span>
                    {isAgent && (
                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                        Agent
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
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : isAgent
                        ? "bg-white text-stone-900 border border-purple-200 rounded-bl-xs shadow-xs"
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
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span>{otherTyping.join(", ")} is typing a response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Closed Alert */}
        {conversation?.status === "Closed" ? (
          <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3 text-xs text-stone-600">
            <span>This conversation is marked as <strong>Closed</strong>. Need further help?</span>
            <button
              id="btn-reopen-closed-bottom"
              onClick={() => handleToggleStatus("Open")}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-lg font-semibold transition-colors shadow-2xs"
            >
              Reopen Conversation
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-end gap-2 shrink-0"
          >
            <div className="flex-1 relative">
              <textarea
                id="chat-input-textarea"
                rows={2}
                placeholder="Type your message here... (Press Enter to send)"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              id="btn-chat-send-message"
              disabled={!inputMessage.trim() || isSending}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5 h-10 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
