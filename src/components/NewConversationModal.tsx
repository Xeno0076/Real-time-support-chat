import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.ts";
import { ConversationCategory } from "../types.ts";
import { X, Send, AlertCircle, Loader2 } from "lucide-react";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ConversationCategory>("General");
  const [initialMessage, setInitialMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: ConversationCategory[] = [
    "Account",
    "Billing",
    "Technical Support",
    "General",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please provide a subject for your request.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await api.createConversation({
        subject: subject.trim(),
        category,
        initialMessage: initialMessage.trim() || undefined,
      });

      onClose();
      if (onCreated) onCreated();
      // Redirect directly to the newly created conversation's chat room!
      navigate(`/customer/chat/${res.conversation._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create conversation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-conversation-modal-overlay"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="new-conversation-modal-container"
        className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 className="text-base font-bold text-stone-900">Start New Conversation</h2>
            <p className="text-xs text-stone-500">
              Submit a support ticket and connect with our team in real time.
            </p>
          </div>
          <button
            id="btn-close-new-modal"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              id="new-ticket-error-banner"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="ticket-subject" className="block text-xs font-semibold text-stone-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              required
              placeholder="e.g. Issue updating billing details"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="ticket-category" className="block text-xs font-semibold text-stone-700 mb-1">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ConversationCategory)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ticket-message" className="block text-xs font-semibold text-stone-700 mb-1">
              Initial Message (Optional)
            </label>
            <textarea
              id="ticket-message"
              rows={3}
              placeholder="Provide context or details for the support agent..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              id="btn-cancel-modal"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-modal"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Start Conversation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
