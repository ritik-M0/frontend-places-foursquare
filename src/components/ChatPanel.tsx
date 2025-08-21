"use client";
import { useEffect, useState, useRef } from "react";

type Msg = { role: "user" | "assistant"; text: string; at: string };

interface StreamEvent {
  type: "start" | "content" | "done" | "error" | "map_data";
  content?: string;
  error?: string;
  timestamp?: string;
  sessionId?: string;
  mapData?: {
    center: { lat: number; lng: number };
    bounds: { north: number; south: number; east: number; west: number };
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
        };
      }>;
      events: unknown[];
      weather: unknown[];
      userLocation: Record<string, unknown>;
    };
  };
}

interface ChatPanelProps {
  onMapData: (data: StreamEvent["mapData"]) => void;
}

export default function ChatPanel({ onMapData }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle streaming response
  async function sendWithStreaming(message: string) {
    setBusy(true);
    setIsStreaming(true);

    // Add user message
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/places/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body reader available");
      }

      let assistantMessageIndex = -1;
      let accumulatedContent = "";

      // Add initial assistant message placeholder
      setMessages((m) => {
        const newMessages = [
          ...m,
          {
            role: "assistant" as const,
            text: "",
            at: new Date().toISOString(),
          },
        ];
        assistantMessageIndex = newMessages.length - 1;
        return newMessages;
      });

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData: StreamEvent = JSON.parse(line.slice(6));

                switch (eventData.type) {
                  case "start":
                    console.log("Stream started:", eventData);
                    break;

                  case "content":
                    if (eventData.content) {
                      accumulatedContent += eventData.content;
                      // Update the assistant message with accumulated content
                      setMessages((m) => {
                        const updatedMessages = [...m];
                        if (assistantMessageIndex >= 0) {
                          updatedMessages[assistantMessageIndex] = {
                            ...updatedMessages[assistantMessageIndex],
                            text: accumulatedContent,
                            at: eventData.timestamp || new Date().toISOString(),
                          };
                        }
                        return updatedMessages;
                      });
                    }
                    break;

                  case "map_data":
                    if (eventData.mapData) {
                      console.log("Map data received:", eventData.mapData);
                      // Show the map in side panel
                      onMapData(eventData.mapData);

                      // Add a message indicating places were found
                      setMessages((m) => {
                        const updatedMessages = [...m];
                        if (assistantMessageIndex >= 0 && eventData.mapData) {
                          updatedMessages[assistantMessageIndex] = {
                            ...updatedMessages[assistantMessageIndex],
                            text: `� Found ${eventData.mapData.layers.places.length} locations (check the map panel)`,
                            at: eventData.timestamp || new Date().toISOString(),
                          };
                        }
                        return updatedMessages;
                      });
                    }
                    break;

                  case "done":
                    console.log("Stream completed:", eventData);
                    setIsStreaming(false);
                    break;

                  case "error":
                    console.error("Stream error:", eventData.error);
                    setMessages((m) => {
                      const updatedMessages = [...m];
                      if (assistantMessageIndex >= 0) {
                        updatedMessages[assistantMessageIndex] = {
                          ...updatedMessages[assistantMessageIndex],
                          text: `Error: ${eventData.error}`,
                          at: eventData.timestamp || new Date().toISOString(),
                        };
                      }
                      return updatedMessages;
                    });
                    setIsStreaming(false);
                    break;
                }
              } catch (parseError) {
                console.warn("Failed to parse SSE data:", line, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }

      console.error("Streaming error:", error);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${String(error)}`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  // Fallback to regular non-streaming request
  async function sendRegular(message: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/places/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const json = await res.json();

      // Check if response contains map data
      if (
        json?.response &&
        typeof json.response === "object" &&
        json.response.center
      ) {
        onMapData(json.response);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: `🗺️ Map opened with ${json.response.layers.places.length} locations`,
            at: json?.timestamp ?? new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: json?.response ?? String(json),
            at: json?.timestamp ?? new Date().toISOString(),
          },
        ]);
      }
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${String(e)}`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send(useStreaming = true) {
    const message = input.trim();
    if (!message) return;

    setInput("");

    if (useStreaming) {
      await sendWithStreaming(message);
    } else {
      await sendRegular(message);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setBusy(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
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
          <div>
            <h3 className="text-white font-medium">Tom Tom Agent</h3>
            <p className="text-xs text-slate-400">
              {isStreaming ? "Streaming..." : busy ? "Analyzing..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isStreaming && (
            <button
              onClick={stopStream}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
            >
              Stop
            </button>
          )}
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isStreaming
                ? "bg-blue-500"
                : busy
                ? "bg-yellow-500"
                : "bg-green-500"
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
            <p className="text-slate-300 font-medium">Ask me anything</p>
            <p className="text-slate-500 text-sm mt-1">
              I can help you find places, restaurants and locations. Try asking
              &ldquo;show me restaurants on a map&rdquo;!
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
                {m.role === "assistant" && (
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
                )}

                <div
                  className={`max-w-[75%] ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                      : "bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md border border-slate-700"
                  } px-4 py-3 shadow-sm`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.text}
                    {isStreaming &&
                      i === messages.length - 1 &&
                      m.role === "assistant" && (
                        <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                      )}
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

            {busy && !isStreaming && (
              <div className="flex justify-start">
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
            placeholder="Ask me anything..."
            disabled={busy}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
            {/* Toggle between streaming and regular mode */}
            <button
              onClick={() => send(false)}
              disabled={busy || !input.trim()}
              className="p-2 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send without streaming"
            >
              <svg
                className="w-4 h-4"
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
            </button>
            <button
              onClick={() => send(true)}
              disabled={busy || !input.trim()}
              className="p-2 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send with streaming"
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
