import React from "react";
import { ConversationStatus, ConversationCategory } from "../types.ts";

export const StatusBadge: React.FC<{ status: ConversationStatus; size?: "sm" | "md" }> = ({
  status,
  size = "sm",
}) => {
  const styles: Record<ConversationStatus, { bg: string; dot: string }> = {
    Open: {
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      dot: "bg-amber-500",
    },
    "In Progress": {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      dot: "bg-blue-500",
    },
    Resolved: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      dot: "bg-emerald-500",
    },
    Closed: {
      bg: "bg-stone-100 border-stone-200 text-stone-700",
      dot: "bg-stone-400",
    },
  };

  const current = styles[status] || styles.Open;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      id={`badge-status-${status.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${padding} ${current.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span className="whitespace-nowrap">{status}</span>
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: ConversationCategory }> = ({ category }) => {
  const styles: Record<string, string> = {
    Account: "bg-purple-50 text-purple-700 border-purple-200",
    Billing: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Technical Support": "bg-indigo-50 text-indigo-700 border-indigo-200",
    General: "bg-sky-50 text-sky-700 border-sky-200",
    Other: "bg-stone-100 text-stone-700 border-stone-200",
  };

  const currentStyle = styles[category] || styles.Other;

  return (
    <span
      id={`badge-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${currentStyle}`}
    >
      {category}
    </span>
  );
};
