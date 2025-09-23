"use client";
import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  at: string;
  analysis?: EnergyAnalysis;
};

interface EnergyAnalysis {
  gridCapacity?: string;
  renewablePotential?: string;
  infrastructureCondition?: string;
  keyFindings?: string[];
  challenges?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

interface Place {
  id: string;
  type: string;
  coordinates: [number, number];
  properties: {
    name: string;
    address: string;
    category: string;
    relevance: number;
    businessType?: "infrastructure" | "renewable" | "facility";
    neighborhood?: string;
    // Enhanced energy-specific properties
    facility_type?: string;
    energy_capacity?: string;
    grid_connection?: string;
    renewable_type?: string;
    efficiency_rating?: string;
    maintenance_status?: string;
    power_output?: string;
    service_area?: string;
    installation_year?: number;
    environmental_impact?: string;
    grid_stability?: string;
    backup_systems?: string;
    energy_storage?: string;
    transmission_voltage?: string;
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

interface EnergyPanelProps {
  onMapData: (data: MapData) => void;
}

export default function EnergyPanel({ onMapData }: EnergyPanelProps) {
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
    id: place.id || `energy_${index}`,
    type: place.type || "point",
    coordinates: place.coordinates,
    properties: {
      name: (place.properties?.name as string) || "Energy Facility",
      address: (place.properties?.address as string) || "",
      category:
        (place.properties?.category as string) || "energy infrastructure",
      relevance: (place.properties?.relevance as number) || 1.0,
      businessType:
        (place.properties?.businessType as
          | "infrastructure"
          | "renewable"
          | "facility") || "facility",
      neighborhood: (place.properties?.neighborhood as string) || "",
      // Energy-specific properties
      facility_type: (place.properties?.facility_type as string) || undefined,
      energy_capacity:
        (place.properties?.energy_capacity as string) || undefined,
      grid_connection:
        (place.properties?.grid_connection as string) || undefined,
      renewable_type: (place.properties?.renewable_type as string) || undefined,
      efficiency_rating:
        (place.properties?.efficiency_rating as string) || undefined,
      maintenance_status:
        (place.properties?.maintenance_status as string) || undefined,
      power_output: (place.properties?.power_output as string) || undefined,
      service_area: (place.properties?.service_area as string) || undefined,
      installation_year:
        (place.properties?.installation_year as number) || undefined,
      environmental_impact:
        (place.properties?.environmental_impact as string) || undefined,
      grid_stability: (place.properties?.grid_stability as string) || undefined,
      backup_systems: (place.properties?.backup_systems as string) || undefined,
      energy_storage: (place.properties?.energy_storage as string) || undefined,
      transmission_voltage:
        (place.properties?.transmission_voltage as string) || undefined,
    },
  });

  // Extract energy insights from response text
  const extractEnergyInsights = (
    text: string
  ): Array<{
    icon: string;
    label: string;
    value: string;
    type: "metric" | "insight";
  }> => {
    const insights: Array<{
      icon: string;
      label: string;
      value: string;
      type: "metric" | "insight";
    }> = [];

    // Grid capacity patterns
    const gridMatch = text.match(/grid capacity[:\s]+([^.\n]+)/gi);
    if (gridMatch) {
      insights.push({
        icon: "🔌",
        label: "Grid Capacity",
        value: gridMatch[0].split(":")[1]?.trim() || "Available",
        type: "metric",
      });
    }

    // Renewable potential patterns
    const renewableMatch = text.match(/renewable potential[:\s]+([^.\n]+)/gi);
    if (renewableMatch) {
      insights.push({
        icon: "🌱",
        label: "Renewable Potential",
        value: renewableMatch[0].split(":")[1]?.trim() || "High",
        type: "metric",
      });
    }

    // Infrastructure condition patterns
    const infraMatch = text.match(/infrastructure condition[:\s]+([^.\n]+)/gi);
    if (infraMatch) {
      insights.push({
        icon: "🏗️",
        label: "Infrastructure",
        value: infraMatch[0].split(":")[1]?.trim() || "Good",
        type: "metric",
      });
    }

    // Energy efficiency patterns
    const efficiencyMatch = text.match(/efficiency[:\s]+(\d+%)/gi);
    if (efficiencyMatch) {
      insights.push({
        icon: "⚡",
        label: "Efficiency",
        value: efficiencyMatch[0].match(/\d+%/)?.[0] || "N/A",
        type: "metric",
      });
    }

    // Storage capacity patterns
    const storageMatch = text.match(/storage[:\s]+([^.\n]+)/gi);
    if (storageMatch) {
      insights.push({
        icon: "🔋",
        label: "Storage",
        value: storageMatch[0].split(":")[1]?.trim() || "Available",
        type: "insight",
      });
    }

    // Transmission voltage patterns
    const voltageMatch = text.match(/(\d+)\s*kV/gi);
    if (voltageMatch) {
      insights.push({
        icon: "⚡",
        label: "Transmission",
        value: voltageMatch[0] || "Standard",
        type: "metric",
      });
    }

    return insights;
  };

  // Insights display component for energy metrics
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
          <span className="mr-1">⚡</span>
          Key Energy Metrics
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-2 rounded text-xs ${
                insight.type === "metric"
                  ? "bg-blue-900/40 border border-blue-700/50"
                  : "bg-green-900/40 border border-green-700/50"
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

  // Structured analysis display component
  const StructuredAnalysisDisplay = ({
    analysis,
  }: {
    analysis: EnergyAnalysis;
  }) => {
    return (
      <div className="mt-4 space-y-3 border-t border-slate-700 pt-3">
        {/* Grid Capacity */}
        {analysis.gridCapacity && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">🔌</span>
              <span className="text-slate-300 font-medium text-sm">
                Grid Capacity
              </span>
            </div>
            <div className="text-white text-xs">{analysis.gridCapacity}</div>
          </div>
        )}

        {/* Renewable Potential */}
        {analysis.renewablePotential && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-400">🌱</span>
              <span className="text-slate-300 font-medium text-sm">
                Renewable Potential
              </span>
            </div>
            <div className="text-white text-xs">
              {analysis.renewablePotential}
            </div>
          </div>
        )}

        {/* Infrastructure Condition */}
        {analysis.infrastructureCondition && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-orange-400">🏗️</span>
              <span className="text-slate-300 font-medium text-sm">
                Infrastructure Condition
              </span>
            </div>
            <div
              className={`text-xs font-medium ${
                analysis.infrastructureCondition
                  .toLowerCase()
                  .includes("excellent")
                  ? "text-green-400"
                  : analysis.infrastructureCondition
                      .toLowerCase()
                      .includes("good")
                  ? "text-blue-400"
                  : analysis.infrastructureCondition
                      .toLowerCase()
                      .includes("fair")
                  ? "text-yellow-400"
                  : "text-orange-400"
              }`}
            >
              {analysis.infrastructureCondition}
            </div>
          </div>
        )}

        {/* Key Findings */}
        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">🔍</span>
              <span className="text-slate-300 font-medium text-sm">
                Key Findings
              </span>
            </div>
            <div className="space-y-1">
              {analysis.keyFindings.map((finding, index) => (
                <div
                  key={index}
                  className="text-white text-xs flex items-start space-x-2"
                >
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        {analysis.challenges && analysis.challenges.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-slate-300 font-medium text-sm">
                Challenges
              </span>
            </div>
            <div className="space-y-1">
              {analysis.challenges.map((challenge, index) => (
                <div
                  key={index}
                  className="text-white text-xs flex items-start space-x-2"
                >
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>{challenge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-purple-400">💡</span>
              <span className="text-slate-300 font-medium text-sm">
                Recommendations
              </span>
            </div>
            <div className="space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="text-white text-xs flex items-start space-x-2"
                >
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Format the response text for better readability
  const formatAnalysisText = (text: string) => {
    if (!text) return text;

    // Remove JSON code blocks that show raw analysis data
    const cleanedText = text
      .replace(/```json\s*\{[\s\S]*?\}\s*```/g, "") // Remove JSON blocks
      .replace(/\*\*(.*?)\*\*/g, "⚡ $1") // Bold headings with energy icon
      .replace(/^### (.*?)$/gm, "\n🎯 $1") // Level 3 headings
      .replace(/^- (.*?)$/gm, "  • $1") // Bullet points with better indentation
      .replace(/^(\d+\.)/gm, "\n$1") // Numbered lists with spacing
      .replace(/\n\n\n+/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*---\s*$/gm, "") // Remove markdown horizontal rules
      .trim();

    // If text is mostly empty after cleaning, provide a fallback
    if (cleanedText.length < 50) {
      return "Energy and utilities analysis completed successfully. Check the structured analysis data below for detailed insights.";
    }

    return cleanedText;
  };

  // Create comprehensive analysis summary with metadata
  const createAnalysisSummary = (
    facilityCount: number,
    metadata?: {
      executionTime?: number;
      confidence?: number;
      agentsUsed?: string[];
      toolsUsed?: string[];
      intent?: string;
    }
  ) => {
    const count = facilityCount;
    const plural = count > 1 ? "ies" : "y";
    const time = metadata?.executionTime || 0;
    const confidence = Math.round((metadata?.confidence || 0) * 100);
    const agents = metadata?.agentsUsed || [];
    const tools = metadata?.toolsUsed || [];
    const intent = metadata?.intent || "energy-utilities";

    return (
      `\n\n⚡ **Energy & Utilities Analysis Complete!**\n\n` +
      `📊 **Analysis Results:**\n` +
      `• ${count} facilit${plural} identified with coordinates\n` +
      `• ${confidence}% confidence score\n` +
      `• ${time}ms processing time\n\n` +
      `🤖 **AI Agents Used:** ${agents.join(", ")}\n` +
      `🛠️ **Tools Applied:** ${tools.join(", ")}\n` +
      `🎯 **Analysis Type:** ${intent}\n\n` +
      `🗺️ **View interactive map with detailed infrastructure insights below →**`
    );
  };

  // Assistant avatar component
  const AssistantAvatar = () => (
    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
      <svg
        className="w-4 h-4 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  // Energy infrastructure request
  async function sendMessage(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/energy", {
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
        // Extract analysis data from response
        const analysisData = json.analysis as EnergyAnalysis | undefined;

        // Handle map data if present - show all data regardless of relevance
        if (json.mapData?.places?.length > 0) {
          console.log(
            "🗺️ Received mapData with",
            json.mapData.places.length,
            "places"
          );
          console.log("🗺️ Map center:", json.mapData.center);
          console.log(
            "🗺️ First 3 places:",
            json.mapData.places.slice(0, 3).map((p: unknown) => {
              const place = p as {
                properties?: { name?: string };
                coordinates?: [number, number];
              };
              return {
                name: place.properties?.name,
                coordinates: place.coordinates,
              };
            })
          );

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

          console.log(
            "🗺️ Transformed mapData with",
            transformedMapData.layers.places.length,
            "places"
          );
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
              analysis: analysisData,
            },
          ]);
        } else {
          // Comprehensive text-only response (common for energy analysis)
          const formattedResponse = formatAnalysisText(
            json.response || "Energy and utilities analysis completed."
          );

          // For energy analysis, we often have rich text content without specific facilities
          console.log(
            "📄 Processing energy analysis as text-based response (length:",
            json.response?.length || 0,
            ")"
          );

          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: formattedResponse,
              at: json.timestamp,
              analysis: analysisData,
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
              Energy & Utilities Assistant
            </h3>
            <p className="text-xs text-slate-400">
              {busy ? "Analyzing infrastructure..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Connected</span>
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">
              Ask about energy infrastructure & utilities
            </p>
            <p className="text-slate-500 text-sm mt-1">
              I can help with grid analysis, renewable energy, and
              infrastructure optimization.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const insights =
                m.role === "assistant" ? extractEnergyInsights(m.text) : [];

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
                        ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                        : "bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md border border-slate-700"
                    } px-4 py-3 shadow-sm`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.text}
                    </div>

                    {/* Show structured analysis data for assistant messages */}
                    {m.role === "assistant" && m.analysis && (
                      <StructuredAnalysisDisplay analysis={m.analysis} />
                    )}

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
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
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
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-16 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about energy infrastructure..."
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
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
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
