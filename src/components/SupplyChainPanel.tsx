"use client";
import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  at: string;
  analysis?: SupplyChainAnalysis;
};

interface SupplyChainAnalysis {
  distributionNetwork?: string;
  warehouseOptimization?: string;
  transportationRoutes?: string;
  costAnalysis?: string;
  capacityAssessment?: string;
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
    businessType?:
      | "warehouse"
      | "distribution"
      | "transportation"
      | "logistics";
    neighborhood?: string;
    // Enhanced supply chain-specific properties
    facility_type?: string;
    storage_capacity?: string;
    transportation_access?: string;
    rail_access?: boolean;
    highway_access?: boolean;
    port_proximity?: string;
    loading_docks?: number;
    automation_level?: string;
    warehouse_size?: string;
    distribution_range?: string;
    operating_hours?: string;
    last_mile_capability?: boolean;
    cold_storage?: boolean;
    hazmat_certified?: boolean;
    cross_docking?: boolean;
    inventory_turnover?: string;
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

interface SupplyChainPanelProps {
  onMapData: (data: MapData) => void;
}

export default function SupplyChainPanel({ onMapData }: SupplyChainPanelProps) {
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
    id: place.id || `supply_chain_${index}`,
    type: place.type || "point",
    coordinates: place.coordinates,
    properties: {
      name: (place.properties?.name as string) || "Logistics Facility",
      address: (place.properties?.address as string) || "",
      category: (place.properties?.category as string) || "logistics facility",
      relevance: (place.properties?.relevance as number) || 1.0,
      businessType:
        (place.properties?.businessType as
          | "warehouse"
          | "distribution"
          | "transportation"
          | "logistics") || "logistics",
      neighborhood: (place.properties?.neighborhood as string) || "",
      // Supply chain-specific properties
      facility_type: (place.properties?.facility_type as string) || undefined,
      storage_capacity:
        (place.properties?.storage_capacity as string) || undefined,
      transportation_access:
        (place.properties?.transportation_access as string) || undefined,
      rail_access: (place.properties?.rail_access as boolean) || undefined,
      highway_access:
        (place.properties?.highway_access as boolean) || undefined,
      port_proximity: (place.properties?.port_proximity as string) || undefined,
      loading_docks: (place.properties?.loading_docks as number) || undefined,
      automation_level:
        (place.properties?.automation_level as string) || undefined,
      warehouse_size: (place.properties?.warehouse_size as string) || undefined,
      distribution_range:
        (place.properties?.distribution_range as string) || undefined,
      operating_hours:
        (place.properties?.operating_hours as string) || undefined,
      last_mile_capability:
        (place.properties?.last_mile_capability as boolean) || undefined,
      cold_storage: (place.properties?.cold_storage as boolean) || undefined,
      hazmat_certified:
        (place.properties?.hazmat_certified as boolean) || undefined,
      cross_docking: (place.properties?.cross_docking as boolean) || undefined,
      inventory_turnover:
        (place.properties?.inventory_turnover as string) || undefined,
    },
  });

  // Extract supply chain insights from response text
  const extractSupplyChainInsights = (
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

    // Market density patterns
    const densityMatch =
      text.match(/market[_\s]density[:\s]+"([^"]+)"/gi) ||
      text.match(/(\d+\.?\d*)\s*businesses\s*per\s*km/gi);
    if (densityMatch) {
      insights.push({
        icon: "�",
        label: "Market Density",
        value: densityMatch[0].includes('"')
          ? densityMatch[0].split('"')[1]
          : densityMatch[0],
        type: "metric",
      });
    }

    // Warehouse count patterns
    const warehouseMatch =
      text.match(/warehouses[:\s]+"?([^";\n]+)"?/gi) ||
      text.match(/(\d+\+?)\s*warehouse/gi);
    if (warehouseMatch) {
      insights.push({
        icon: "🏭",
        label: "Warehouses",
        value: warehouseMatch[0].includes('"')
          ? warehouseMatch[0].split('"')[1]
          : warehouseMatch[0].split(":")[1]?.trim() || warehouseMatch[0],
        type: "metric",
      });
    }

    // Competition level patterns
    const competitionMatch = text.match(
      /competition[_\s]levels?[:\s]+"?([^";\n]+)"?/gi
    );
    if (competitionMatch) {
      insights.push({
        icon: "⚔️",
        label: "Competition",
        value: competitionMatch[0].includes('"')
          ? competitionMatch[0].split('"')[1]
          : competitionMatch[0].split(":")[1]?.trim() || "High",
        type: "insight",
      });
    }

    // Transportation access patterns
    const transportMatch =
      text.match(/highway.*?(I-\d+[^\s,]*)/gi) ||
      text.match(/freeway.*?(I-\d+[^\s,]*)/gi);
    if (transportMatch) {
      insights.push({
        icon: "�️",
        label: "Highway Access",
        value:
          transportMatch
            .slice(0, 2)
            .map((m) => m.match(/I-\d+[^\s,]*/)?.[0])
            .filter(Boolean)
            .join(", ") || "Available",
        type: "insight",
      });
    }

    // Port proximity patterns
    const portMatch =
      text.match(/port.*?(\d+\.?\d*\s*km)/gi) ||
      text.match(/(\d+\.?\d*)\s*km.*?port/gi);
    if (portMatch) {
      insights.push({
        icon: "�",
        label: "Port Distance",
        value: portMatch[0].match(/\d+\.?\d*\s*km/)?.[0] || "Close",
        type: "metric",
      });
    }

    // Facility count patterns
    const facilityMatch =
      text.match(/(\d+[,\d]*)\s*total.*?facilities?/gi) ||
      text.match(/(\d+[,\d]*)\s*businesses/gi);
    if (facilityMatch) {
      insights.push({
        icon: "🏢",
        label: "Total Facilities",
        value: facilityMatch[0].match(/\d+[,\d]*/)?.[0] || "Many",
        type: "metric",
      });
    }

    return insights;
  };

  // Insights display component for supply chain metrics
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
          <span className="mr-1">🚛</span>
          Supply Chain Insights
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-2 rounded text-xs ${
                insight.type === "metric"
                  ? "bg-orange-900/30 border border-orange-700/30"
                  : "bg-blue-900/30 border border-blue-700/30"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-1">{insight.icon}</span>
                <span className="text-slate-300">{insight.label}</span>
              </div>
              <div className="text-white font-medium mt-1">{insight.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format the response text for better readability
  const formatAnalysisText = (text: string) => {
    if (!text) return text;

    // Remove JSON code blocks that show raw analysis data
    const cleanedText = text
      .replace(/\{\s*"analysis":\s*\{[\s\S]*?\}\s*\}/g, "") // Remove embedded JSON analysis
      .replace(/```json\s*\{[\s\S]*?\}\s*```/g, "") // Remove JSON blocks
      .replace(/---\s*\n\n/g, "") // Remove markdown separators
      .replace(/\*\*(.*?)\*\*/g, "🚛 $1") // Bold headings with supply chain icon
      .replace(/^### (.*?)$/gm, "\n🎯 $1") // Level 3 headings
      .replace(/^- (.*?)$/gm, "  • $1") // Bullet points with better indentation
      .replace(/^(\d+\.)/gm, "\n$1") // Numbered lists with spacing
      .replace(/\n\n\n+/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*---\s*$/gm, "") // Remove markdown horizontal rules
      .replace(/^\s*"toolsUsed":\s*\[[\s\S]*?\],?\s*$/gm, "") // Remove toolsUsed arrays
      .replace(/^\s*"mapData":\s*null,?\s*$/gm, "") // Remove null mapData references
      .trim();

    // If text is mostly empty after cleaning, provide a fallback
    if (cleanedText.length < 50) {
      return "Supply chain and logistics analysis completed successfully. Check the structured analysis data below for detailed insights.";
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
    }
  ): string => {
    const executionTime = metadata?.executionTime || 0;
    const confidence = Math.round((metadata?.confidence || 0.9) * 100);
    const agents = metadata?.agentsUsed?.length || 1;

    return `\n\n---\n📊 **Analysis Summary**\n🏭 **Facilities Analyzed:** ${facilityCount}\n⏱️ **Processing Time:** ${executionTime}ms\n🎯 **Confidence:** ${confidence}%\n🤖 **Agents Used:** ${agents}\n\n*Supply chain optimization analysis powered by AI logistics intelligence.*`;
  };

  // Supply chain logistics request
  async function sendMessage(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/supply-chain", {
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
        const analysisData = json.analysis as SupplyChainAnalysis | undefined;

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
          // Comprehensive text-only response (common for supply chain analysis)
          const formattedResponse = formatAnalysisText(
            json.response || "Supply chain and logistics analysis completed."
          );

          // For supply chain analysis, we often have rich text content without specific facilities
          console.log(
            "📄 Processing supply chain analysis as text-based response (length:",
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
        throw new Error(json?.error || "Unknown error from supply chain API");
      }
    } catch (error) {
      console.error("Supply chain request error:", error);

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        if (
          error.message.includes("timeout") ||
          error.message.includes("Headers Timeout")
        ) {
          errorMessage =
            "Request timeout - The backend service took too long to respond. Please try again or check if the backend is running.";
        } else if (
          error.message.includes("fetch failed") ||
          error.message.includes("Failed to fetch")
        ) {
          errorMessage =
            "Backend connection failed - Unable to connect to the supply chain service. Please ensure the backend is running on port 4000.";
        } else if (error.message.includes("Backend API error")) {
          errorMessage = error.message;
        } else {
          errorMessage = `Connection error: ${error.message}`;
        }
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `🚨 **Connection Error**\n\n${errorMessage}\n\n💡 **Troubleshooting:**\n• Ensure the NestJS backend is running\n• Check that the /places/supply-chain endpoint is available\n• Verify the backend is accessible on the configured port`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🚛</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Supply Chain & Logistics Agent
              </h2>
              <p className="text-sm text-slate-400">
                {busy ? "Optimizing supply chain..." : "Ready to analyze"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                busy ? "bg-orange-400 animate-pulse" : "bg-green-400"
              }`}
            ></div>
            <span className="text-xs text-slate-400">Connected</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Optimize distribution networks, warehouse locations, and supply chain
          efficiency
        </p>
      </div>

      {/* Suggested Queries */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Supply Chain Analysis Examples:
          </h3>
          <div className="grid gap-2">
            {[
              "Find optimal warehouse locations near major highways in Texas with rail access",
              "Analyze transportation infrastructure around Port of Los Angeles for import distribution",
              "Identify micro-fulfillment center locations for same-day delivery in Chicago metropolitan area",
              "Assess distribution center connectivity and last-mile delivery options in Miami",
              "Optimize cold storage facilities for pharmaceutical distribution in Northeast",
            ].map((query, i) => (
              <button
                key={i}
                onClick={() => sendMessage(query)}
                disabled={busy}
                className="p-3 text-left text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors disabled:opacity-50"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-4xl">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`${
                message.role === "user" ? "ml-auto max-w-xs" : "mr-auto"
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-orange-600 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.text}
                </div>
                {message.analysis && (
                  <InsightsDisplay
                    insights={extractSupplyChainInsights(message.text)}
                  />
                )}
              </div>
              <div
                className={`text-xs text-slate-500 mt-1 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {new Date(message.at).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {busy && (
            <div className="flex justify-start">
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">🚛</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about supply chain optimization, warehouse locations, distribution networks..."
            disabled={busy}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition-colors"
          >
            {busy ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
