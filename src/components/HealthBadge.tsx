"use client";
import { useEffect, useState } from "react";

export default function HealthBadge() {
  const [status, setStatus] = useState<"loading" | "healthy" | "down">(
    "loading"
  );

  useEffect(() => {
    fetch("/api/places/health")
      .then((r) => r.json())
      .then((d) => setStatus(d?.status === "healthy" ? "healthy" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case "healthy":
        return {
          bg: "bg-emerald-900/30",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: "Online",
        };
      case "down":
        return {
          bg: "bg-red-900/30",
          text: "text-red-400",
          border: "border-red-500/30",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: "Offline",
        };
      default:
        return {
          bg: "bg-amber-900/30",
          text: "text-amber-400",
          border: "border-amber-500/30",
          icon: (
            <div className="w-4 h-4 relative">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            </div>
          ),
          label: "Checking...",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 border transition-all duration-200 ${config.bg} ${config.text} ${config.border}`}
    >
      <div className="flex items-center justify-center">{config.icon}</div>
      <span className="text-sm font-medium">Backend: {config.label}</span>
    </div>
  );
}
