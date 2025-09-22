"use client";
import { useEffect, useState } from "react";

interface HealthStatus {
  status: string;
  timestamp: string;
  version?: string;
  backend?: {
    url: string;
    reachable: boolean;
    response?: {
      status: string;
      timestamp: string;
    };
    error?: string;
  };
}

export default function HealthBadge() {
  const [status, setStatus] = useState<
    "loading" | "healthy" | "backend-down" | "down"
  >("loading");
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      const response = await fetch("/api/places/health");
      const data: HealthStatus = await response.json();

      setHealthData(data);
      setLastCheck(new Date());

      if (data.status === "healthy") {
        if (data.backend?.reachable) {
          setStatus("healthy");
        } else {
          setStatus("backend-down");
        }
      } else {
        setStatus("down");
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setStatus("down");
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
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
          detail: "Backend Connected",
        };
      case "backend-down":
        return {
          bg: "bg-amber-900/30",
          text: "text-amber-400",
          border: "border-amber-500/30",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          label: "Frontend Only",
          detail: "Backend Disconnected",
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
          detail: "Service Unavailable",
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
          detail: "Loading status",
        };
    }
  };

  const config = getStatusConfig();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 border transition-all duration-200 ${config.bg} ${config.text} ${config.border} cursor-pointer group relative`}
      onClick={checkHealth}
      title={`Click to refresh • Last check: ${
        lastCheck ? formatTime(lastCheck) : "Never"
      }`}
    >
      <div className="flex items-center justify-center">{config.icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{config.label}</span>
        <span className="text-xs opacity-75">{config.detail}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-max">
        <div className="text-xs space-y-1">
          <div>
            <span className="text-gray-400">Frontend:</span>{" "}
            <span className="text-green-400">
              {healthData?.status || "unknown"}
            </span>
          </div>
          {healthData?.backend && (
            <>
              <div>
                <span className="text-gray-400">Backend:</span>{" "}
                <span
                  className={
                    healthData.backend.reachable
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {healthData.backend.reachable ? "connected" : "disconnected"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">URL:</span>{" "}
                <span className="text-gray-300">{healthData.backend.url}</span>
              </div>
              {healthData.backend.error && (
                <div>
                  <span className="text-gray-400">Error:</span>{" "}
                  <span className="text-red-400">
                    {healthData.backend.error}
                  </span>
                </div>
              )}
            </>
          )}
          {lastCheck && (
            <div>
              <span className="text-gray-400">Last check:</span>{" "}
              <span className="text-gray-300">{formatTime(lastCheck)}</span>
            </div>
          )}
          <div className="text-gray-500 pt-1 border-t border-gray-700">
            Click to refresh
          </div>
        </div>
      </div>
    </div>
  );
}
