"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import MapboxMapView (no SSR needed for Mapbox)
const MapboxMapView = dynamic(() => import("@/components/MapboxMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface MapData {
  center: { lat: number; lng: number };
  bounds?: { north: number; south: number; east: number; west: number };
  layers: {
    places: Array<{
      id: string;
      type: string;
      coordinates: [number, number];
      properties: {
        name: string;
        address: string;
        category: string;
        relevance: number;
        businessType?: "recommendation" | "competitor";
        neighborhood?: string;
        // Enhanced real estate-specific properties
        property_type?: string;
        price_range?: string;
        investment_potential?: number;
        market_trend?: string;
        roi_estimate?: string;
        cap_rate?: number;
        property_size?: string;
        zoning?: string;
        walkability_score?: number;
        transit_access?: string;
        school_district?: string;
        crime_rate?: string;
        appreciation_rate?: number;
        rental_yield?: number;
      };
    }>;
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
  metadata?: {
    analysisType: "business_location" | "general_search" | "real_estate";
    neighborhoods?: Array<{
      name: string;
      description: string;
      competitors: number;
    }>;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function FullStackPOCPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState("khfkjfbjbhwiejihn");
  const [userId, setUserId] = useState("meta-user-1");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      // Set analysis type for full stack POC
      const enhancedData = {
        ...data,
        metadata: {
          ...data.metadata,
          analysisType: "general_search" as const,
        },
      };
      setMapData(enhancedData);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://python-fullstack-backend-dev.up.railway.app/api/projects/${projectId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            user_id: userId,
            project_id: projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        // Add initial empty assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("event:")) {
              const eventType = line.replace("event:", "").trim();
              // You can handle different event types here if needed
              console.log("Event:", eventType);
            } else if (line.startsWith("data:")) {
              try {
                const jsonData = JSON.parse(line.replace("data:", "").trim());

                // Handle agent_thinking events with tokens
                if (jsonData.token) {
                  assistantMessage += jsonData.token;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (
                      newMessages[newMessages.length - 1].role === "assistant"
                    ) {
                      newMessages[newMessages.length - 1].content =
                        assistantMessage;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Skip invalid JSON
                console.log("Non-JSON data:", line);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-50 flex">
      {/* Left Side - Chat Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">
              Full Stack POC Chat
            </h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Settings"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Ask questions and get streaming responses
          </p>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-white mb-2">
                Configuration
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="meta-user-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="khfkjfbjbhwiejihn"
                />
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 font-medium">
                  Start a conversation
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Type a message below to begin
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-gray-100 border border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.role === "user" ? "You" : "Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap break-words">
                      {message.content || (
                        <span className="text-gray-400 italic">
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-700 bg-slate-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>

          {/* Configuration Info */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-4">
              <span title={`User ID: ${userId}`}>👤 {userId}</span>
              <span title={`Project ID: ${projectId}`}>
                📁 {projectId.substring(0, 8)}...
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ⚙️ Edit Config
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>
    </div>
  );
}
