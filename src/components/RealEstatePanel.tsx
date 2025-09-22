"use client";
import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  at: string;
  analysis?: RealEstateAnalysis;
};

interface RealEstateAnalysis {
  marketDensity?: string;
  competitionLevel?: string;
  keyFindings?: string[];
  risks?: string[];
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

interface RealEstatePanelProps {
  onMapData: (data: MapData) => void;
}

export default function RealEstatePanel({ onMapData }: RealEstatePanelProps) {
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
    id: place.id || `property_${index}`,
    type: place.type || "point",
    coordinates: place.coordinates,
    properties: {
      name: (place.properties?.name as string) || "Unknown Property",
      address: (place.properties?.address as string) || "",
      category: (place.properties?.category as string) || "real estate",
      relevance: (place.properties?.relevance as number) || 1.0,
      businessType:
        (place.properties?.businessType as "recommendation" | "competitor") ||
        "recommendation",
      neighborhood: (place.properties?.neighborhood as string) || "",
      // Real estate-specific properties
      property_type: (place.properties?.property_type as string) || undefined,
      price_range: (place.properties?.price_range as string) || undefined,
      investment_potential:
        (place.properties?.investment_potential as number) || undefined,
      market_trend: (place.properties?.market_trend as string) || undefined,
      roi_estimate: (place.properties?.roi_estimate as string) || undefined,
      cap_rate: (place.properties?.cap_rate as number) || undefined,
      property_size: (place.properties?.property_size as string) || undefined,
      zoning: (place.properties?.zoning as string) || undefined,
      walkability_score:
        (place.properties?.walkability_score as number) || undefined,
      transit_access: (place.properties?.transit_access as string) || undefined,
      school_district:
        (place.properties?.school_district as string) || undefined,
      crime_rate: (place.properties?.crime_rate as string) || undefined,
      appreciation_rate:
        (place.properties?.appreciation_rate as number) || undefined,
      rental_yield: (place.properties?.rental_yield as number) || undefined,
    },
  });

  // Extract key real estate insights from analysis text
  const extractRealEstateInsights = (text: string) => {
    const insights: Array<{
      icon: string;
      label: string;
      value: string;
      type: "metric" | "insight";
    }> = [];

    // Extract average price
    const priceMatch = text.match(
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:million|M|k|thousand)?/i
    );
    if (priceMatch) {
      insights.push({
        icon: "💰",
        label: "Avg. Price",
        value: `$${priceMatch[1]}`,
        type: "metric",
      });
    }

    // Extract cap rate
    const capRateMatch = text.match(/(\d+\.?\d*)%?\s*cap\s*rate/i);
    if (capRateMatch) {
      insights.push({
        icon: "📊",
        label: "Cap Rate",
        value: `${capRateMatch[1]}%`,
        type: "metric",
      });
    }

    // Extract ROI
    const roiMatch = text.match(/(\d+\.?\d*)%?\s*(?:ROI|return)/i);
    if (roiMatch) {
      insights.push({
        icon: "📈",
        label: "Expected ROI",
        value: `${roiMatch[1]}%`,
        type: "metric",
      });
    }

    // Extract appreciation rate
    const appreciationMatch = text.match(/(\d+\.?\d*)%?\s*appreciation/i);
    if (appreciationMatch) {
      insights.push({
        icon: "📊",
        label: "Appreciation",
        value: `${appreciationMatch[1]}%`,
        type: "insight",
      });
    }

    // Extract market trend
    if (
      text.toLowerCase().includes("bullish") ||
      text.toLowerCase().includes("growing market")
    ) {
      insights.push({
        icon: "📈",
        label: "Market Trend",
        value: "Bullish",
        type: "insight",
      });
    } else if (
      text.toLowerCase().includes("bearish") ||
      text.toLowerCase().includes("declining")
    ) {
      insights.push({
        icon: "📉",
        label: "Market Trend",
        value: "Bearish",
        type: "insight",
      });
    }

    // Extract rental yield
    const yieldMatch = text.match(/(\d+\.?\d*)%?\s*(?:rental\s*)?yield/i);
    if (yieldMatch) {
      insights.push({
        icon: "🏠",
        label: "Rental Yield",
        value: `${yieldMatch[1]}%`,
        type: "metric",
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
          <span className="mr-1">🏘️</span>
          Key Real Estate Metrics
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-2 rounded text-xs ${
                insight.type === "metric"
                  ? "bg-blue-900/40 border border-blue-700/50"
                  : "bg-purple-900/40 border border-purple-700/50"
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
    analysis: RealEstateAnalysis;
  }) => {
    return (
      <div className="mt-4 space-y-3 border-t border-slate-700 pt-3">
        {/* Market Density */}
        {analysis.marketDensity && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">📊</span>
              <span className="text-slate-300 font-medium text-sm">
                Market Density
              </span>
            </div>
            <div className="text-white text-xs">{analysis.marketDensity}</div>
          </div>
        )}

        {/* Competition Level */}
        {analysis.competitionLevel && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-orange-400">⚡</span>
              <span className="text-slate-300 font-medium text-sm">
                Competition Level
              </span>
            </div>
            <div
              className={`text-xs font-medium ${
                analysis.competitionLevel.toLowerCase().includes("saturated")
                  ? "text-red-400"
                  : analysis.competitionLevel.toLowerCase().includes("high")
                  ? "text-orange-400"
                  : analysis.competitionLevel.toLowerCase().includes("moderate")
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {analysis.competitionLevel}
            </div>
          </div>
        )}

        {/* Key Findings */}
        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-400">🔍</span>
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
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {analysis.risks && analysis.risks.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-slate-300 font-medium text-sm">Risks</span>
            </div>
            <div className="space-y-1">
              {analysis.risks.map((risk, index) => (
                <div
                  key={index}
                  className="text-white text-xs flex items-start space-x-2"
                >
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{risk}</span>
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
      .replace(/\*\*(.*?)\*\*/g, "🏠 $1") // Bold headings with house icon
      .replace(/^### (.*?)$/gm, "\n🎯 $1") // Level 3 headings
      .replace(/^- (.*?)$/gm, "  • $1") // Bullet points with better indentation
      .replace(/^(\d+\.)/gm, "\n$1") // Numbered lists with spacing
      .replace(/\n\n\n+/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*---\s*$/gm, "") // Remove markdown horizontal rules
      .trim();

    // If text is mostly empty after cleaning, provide a fallback
    if (cleanedText.length < 50) {
      return "Real estate analysis completed successfully. Check the structured analysis data below for detailed insights.";
    }

    return cleanedText;
  };

  // Create comprehensive analysis summary with metadata
  const createAnalysisSummary = (
    propertyCount: number,
    metadata?: {
      executionTime?: number;
      confidence?: number;
      agentsUsed?: string[];
      toolsUsed?: string[];
      intent?: string;
    }
  ) => {
    const count = propertyCount;
    const plural = count > 1 ? "ies" : "y";
    const time = metadata?.executionTime || 0;
    const confidence = Math.round((metadata?.confidence || 0) * 100);
    const agents = metadata?.agentsUsed || [];
    const tools = metadata?.toolsUsed || [];
    const intent = metadata?.intent || "real-estate";

    return (
      `\n\n🏠 **Real Estate Analysis Complete!**\n\n` +
      `📊 **Analysis Results:**\n` +
      `• ${count} propert${plural} identified with coordinates\n` +
      `• ${confidence}% confidence score\n` +
      `• ${time}ms processing time\n\n` +
      `🤖 **AI Agents Used:** ${agents.join(", ")}\n` +
      `🛠️ **Tools Applied:** ${tools.join(", ")}\n` +
      `🎯 **Analysis Type:** ${intent}\n\n` +
      `🗺️ **View interactive map with detailed property insights below →**`
    );
  };

  // Assistant avatar component
  const AssistantAvatar = () => (
    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
      <svg
        className="w-4 h-4 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 3a1 1 0 000 2h12a1 1 0 100-2H4zm-1 6a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm8-1a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  // Real estate investment request
  async function sendMessage(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/real-estate", {
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
        const analysisData = json.analysis as RealEstateAnalysis | undefined;

        // Handle map data if present - ALWAYS show if mapData exists
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
          // Text-only response with formatting
          const formattedResponse = formatAnalysisText(
            json.response || "Real estate analysis completed."
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
              Real Estate Investment Assistant
            </h3>
            <p className="text-xs text-slate-400">
              {busy ? "Analyzing properties..." : "Online"}
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">
              Ask about real estate investment opportunities
            </p>
            <p className="text-slate-500 text-sm mt-1">
              I can help with property analysis, market trends, and investment
              insights.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const insights =
                m.role === "assistant" ? extractRealEstateInsights(m.text) : [];

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
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
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
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-16 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about real estate investments..."
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
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
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
