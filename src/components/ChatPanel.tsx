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

interface ChatPanelProps {
  onMapData: (data: MapData) => void;
}

export default function ChatPanel({ onMapData }: ChatPanelProps) {
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
      category: (place.properties?.category as string) || "general",
      relevance: (place.properties?.relevance as number) || 1.0,
      businessType:
        (place.properties?.businessType as "recommendation" | "competitor") ||
        "recommendation",
      neighborhood: (place.properties?.neighborhood as string) || "",
    },
  });

  // Create map message summary
  const createMapMessage = (
    locationCount: number,
    metadata?: { executionTime?: number; confidence?: number }
  ) => {
    const count = locationCount;
    const plural = count > 1 ? "s" : "";
    const time = metadata?.executionTime || 0;
    const confidence = Math.round((metadata?.confidence || 0) * 100);

    return (
      `\n\n🏙️ Urban Planning Analysis Complete!\n` +
      `📍 Found ${count} verified location${plural} with coordinates\n` +
      `🗺️ View interactive map with detailed insights →\n` +
      `⚡ Processing: ${time}ms | Confidence: ${confidence}%`
    );
  };

  // Urban planning request
  async function sendMessage(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/urban-planning", {
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
      console.log("=== FULL BACKEND RESPONSE ===");
      console.log(JSON.stringify(json, null, 2));
      console.log("=== END RESPONSE ===");

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
          console.log("=== TRANSFORMED MAP DATA SENT TO MAP ===");
          console.log(JSON.stringify(transformedMapData, null, 2));
          console.log("=== END TRANSFORMED DATA ===");

          const mapMessage = createMapMessage(
            json.mapData.places.length,
            json.metadata
          );
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: `${json.response}${mapMessage}`,
              at: json.timestamp,
            },
          ]);
        } else {
          // Text-only response
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: json.response || "Analysis completed.",
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

  // Assistant avatar component
  const AssistantAvatar = () => (
    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
      <svg
        className="w-4 h-4 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 2C5.58 2 2 5.58 2 10c0 1.4.36 2.71.99 3.86L2 18l4.14-.99C7.29 17.64 8.6 18 10 18c4.42 0 8-3.58 8-8s-3.58-8-8-8z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

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
            <h3 className="text-white font-medium">Urban Planning Assistant</h3>
            <p className="text-xs text-slate-400">
              {busy ? "Analyzing..." : "Online"}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">
              Ask about urban planning
            </p>
            <p className="text-slate-500 text-sm mt-1">
              I can help with smart city analysis, zoning, and urban development
              insights.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
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
            ))}

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
            placeholder="Ask about urban planning..."
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
