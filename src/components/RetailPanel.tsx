"use client";
import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  at: string;
};

interface Place {
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
    // Enhanced retail-specific properties
    retail_score?: number;
    foot_traffic?: string;
    market_potential?: number;
    competition_density?: number;
    demographics_match?: number;
    accessibility_score?: number;
    parking_availability?: string;
    rent_estimate?: string;
  };
}

interface MapData {
  center: { lat: number; lng: number };
  bounds?: { north: number; south: number; east: number; west: number };
  layers: {
    places: Place[];
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
}

interface RetailPanelProps {
  onMapData: (data: MapData) => void;
}

export default function RetailPanel({ onMapData }: RetailPanelProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Transform backend Place to frontend Place format
  const transformFeatureToPlace = (
    place: {
      id: string;
      type: string;
      coordinates: [number, number];
      properties: Record<string, unknown>;
    },
    index: number
  ): Place => ({
    id: place.id || `place_${index}`,
    type: place.type || "point",
    coordinates: place.coordinates,
    properties: {
      name: (place.properties?.name as string) || "Unknown Location",
      address: (place.properties?.address as string) || "",
      category: (place.properties?.category as string) || "retail",
      relevance: (place.properties?.relevance as number) || 1.0,
      businessType:
        (place.properties?.businessType as "recommendation" | "competitor") ||
        "recommendation",
      neighborhood: (place.properties?.neighborhood as string) || "",
      // Retail-specific properties
      retail_score: (place.properties?.retail_score as number) || undefined,
      foot_traffic: (place.properties?.foot_traffic as string) || undefined,
      market_potential:
        (place.properties?.market_potential as number) || undefined,
      competition_density:
        (place.properties?.competition_density as number) || undefined,
      demographics_match:
        (place.properties?.demographics_match as number) || undefined,
      accessibility_score:
        (place.properties?.accessibility_score as number) || undefined,
      parking_availability:
        (place.properties?.parking_availability as string) || undefined,
      rent_estimate: (place.properties?.rent_estimate as string) || undefined,
    },
  });

  // Extract key insights from analysis text
  const extractKeyInsights = (text: string) => {
    const insights: Array<{
      icon: string;
      label: string;
      value: string;
      type: "metric" | "insight";
    }> = [];

    // Extract market density
    const densityMatch = text.match(/(\d+\.?\d*)\s+restaurants per km²/i);
    if (densityMatch) {
      insights.push({
        icon: "📊",
        label: "Market Density",
        value: `${densityMatch[1]} restaurants/km²`,
        type: "metric",
      });
    }

    // Extract total restaurants
    const restaurantMatch = text.match(/(\d+,?\d*)\s+operational restaurants/i);
    if (restaurantMatch) {
      insights.push({
        icon: "🍽️",
        label: "Total Restaurants",
        value: restaurantMatch[1],
        type: "metric",
      });
    }

    // Extract estimated budget
    const budgetMatch = text.match(
      /\$(\d+,?\d*(?:,\d{3})*)(?:–\$(\d+,?\d*(?:,\d{3})*))?/
    );
    if (budgetMatch) {
      const budget = budgetMatch[2]
        ? `$${budgetMatch[1]}–$${budgetMatch[2]}`
        : `$${budgetMatch[1]}`;
      insights.push({
        icon: "💰",
        label: "Est. Budget/Location",
        value: budget,
        type: "metric",
      });
    }

    // Extract competition level
    if (
      text.toLowerCase().includes("high competition") ||
      text.toLowerCase().includes("saturated market")
    ) {
      insights.push({
        icon: "⚡",
        label: "Competition Level",
        value: "High",
        type: "insight",
      });
    }

    // Extract timeline
    const timelineMatch = text.match(/(\d+)[-–](\d+)\s+months/);
    if (timelineMatch) {
      insights.push({
        icon: "⏱️",
        label: "Timeline",
        value: `${timelineMatch[1]}-${timelineMatch[2]} months`,
        type: "insight",
      });
    }

    return insights;
  };

  // Insights display component
  const InsightsDisplay = ({
    insights,
  }: {
    insights: Array<{
      icon: string;
      label: string;
      value: string;
      type: "metric" | "insight";
    }>;
  }) => {
    if (insights.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center">
          <span className="mr-1">📈</span>
          Key Insights
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-2 rounded text-xs ${
                insight.type === "metric"
                  ? "bg-emerald-900/40 border border-emerald-700/50"
                  : "bg-blue-900/40 border border-blue-700/50"
              }`}
            >
              <div className="flex items-center space-x-1">
                <span>{insight.icon}</span>
                <span className="text-slate-300 font-medium">
                  {insight.label}
                </span>
              </div>
              <div className="text-white font-mono text-xs mt-1">
                {insight.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format the response text for better readability
  const formatAnalysisText = (text: string) => {
    if (!text) return text;

    // Replace markdown-style formatting with better display
    return text
      .replace(/\*\*(.*?)\*\*/g, "📋 $1") // Bold headings with clipboard icon
      .replace(/^### (.*?)$/gm, "\n🎯 $1") // Level 3 headings
      .replace(/^- (.*?)$/gm, "  • $1") // Bullet points with better indentation
      .replace(/^(\d+\.)/gm, "\n$1") // Numbered lists with spacing
      .replace(/\n\n\n+/g, "\n\n") // Remove excessive line breaks
      .trim();
  };
  const createAnalysisSummary = (
    locationCount: number,
    metadata?: {
      executionTime?: number;
      confidence?: number;
      agentsUsed?: string[];
      toolsUsed?: string[];
      intent?: string;
    }
  ) => {
    const count = locationCount;
    const plural = count > 1 ? "s" : "";
    const time = metadata?.executionTime || 0;
    const confidence = Math.round((metadata?.confidence || 0) * 100);
    const agents = metadata?.agentsUsed || [];
    const tools = metadata?.toolsUsed || [];
    const intent = metadata?.intent || "retail";

    return (
      `\n\n🏪 **Retail Location Analysis Complete!**\n\n` +
      `� **Analysis Results:**\n` +
      `• ${count} potential location${plural} identified with coordinates\n` +
      `• ${confidence}% confidence score\n` +
      `• ${time}ms processing time\n\n` +
      `🤖 **AI Agents Used:** ${agents.join(", ")}\n` +
      `🛠️ **Tools Applied:** ${tools.join(", ")}\n` +
      `🎯 **Analysis Type:** ${intent}\n\n` +
      `🗺️ **View interactive map with detailed market insights below →**`
    );
  };

  // Assistant avatar component
  const AssistantAvatar = () => (
    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
      <svg
        className="w-4 h-4 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  // Retail location optimization request
  async function sendMessage(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/retail", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId,
          responsePreference: "auto",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (json?.success) {
        // Handle map data if present - ALWAYS show if mapData exists
        if (json.mapData?.places?.length > 0) {
          const transformedMapData: MapData = {
            center: json.mapData.center,
            bounds: json.mapData.bounds,
            layers: {
              places: json.mapData.places.map(transformFeatureToPlace),
              events: [],
              weather: [],
              userLocation: {},
            },
          };

          onMapData(transformedMapData);

          const mapMessage = createAnalysisSummary(
            json.mapData.places.length,
            json.metadata
          );
          const formattedResponse = formatAnalysisText(
            json.response || "Analysis completed"
          );

          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: `${formattedResponse}${mapMessage}`,
              at: json.timestamp,
            },
          ]);
        } else {
          // Text-only response with formatting
          const formattedResponse = formatAnalysisText(
            json.response || "Retail analysis completed."
          );
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: formattedResponse,
              at: json.timestamp,
            },
          ]);
        }
      } else {
        // Handle error responses
        const errorText =
          json?.response || json?.error || "Unknown error occurred";
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: `Error: ${errorText}`,
            at: json?.timestamp || new Date().toISOString(),
          },
        ]);
      }
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Connection Error: ${String(e)}`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const message = input.trim();
    if (!message) return;

    setInput("");
    await sendMessage(message);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <AssistantAvatar />
          <div>
            <h3 className="text-white font-medium">
              Retail Location Assistant
            </h3>
            <p className="text-xs text-slate-400">
              {busy ? "Analyzing markets..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              busy ? "bg-yellow-500" : "bg-green-500"
            }`}
          ></div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">
              Ask about retail location optimization
            </p>
            <p className="text-slate-500 text-sm mt-1">
              I can help with market analysis, site selection, and retail
              potential insights.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const insights =
                m.role === "assistant" ? extractKeyInsights(m.text) : [];

              return (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && <AssistantAvatar />}

                  <div
                    className={`max-w-[75%] ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white rounded-2xl rounded-br-md"
                        : "bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md border border-slate-700"
                    } px-4 py-3 shadow-sm`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.text}
                    </div>

                    {/* Show insights for assistant messages */}
                    {m.role === "assistant" && (
                      <InsightsDisplay insights={insights} />
                    )}

                    {m.role === "assistant" && (
                      <div className="text-xs text-slate-400 mt-2">
                        {new Date(m.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {busy && (
              <div className="flex justify-start">
                <AssistantAvatar />
                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="relative">
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-16 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about retail locations..."
            disabled={busy}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="p-2 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              {busy ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
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
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
