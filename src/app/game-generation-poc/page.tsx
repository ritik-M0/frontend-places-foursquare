"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DetectedService {
  url: string;
  type: string;
  description: string;
  timestamp: Date;
}

export default function GameGenerationPOCPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState("kjegfihifeojgbjhv");
  const [userId, setUserId] = useState("user_123");
  const [emailId, setEmailId] = useState("user@example.com");
  const [showSettings, setShowSettings] = useState(false);
  const [detectedServices, setDetectedServices] = useState<DetectedService[]>(
    []
  );
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        `http://localhost:8000/api/projects/${projectId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            user_id: userId,
            project_id: projectId,
            email_id: emailId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let currentEvent = "";

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
              currentEvent = line.replace("event:", "").trim();
              console.log("Event:", currentEvent);
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

                  // Check for E2B URLs in the token
                  const urlRegex =
                    /https?:\/\/\d+-[a-z0-9]+\.e2b\.app[^\s)]*/gi;
                  const foundUrls = jsonData.token.match(urlRegex);
                  if (foundUrls) {
                    foundUrls.forEach((url: string) => {
                      setDetectedServices((prev) => {
                        // Avoid duplicates
                        if (!prev.find((s) => s.url === url)) {
                          const newService: DetectedService = {
                            url: url,
                            type: "e2b_service",
                            description: "E2B Sandbox Service",
                            timestamp: new Date(),
                          };
                          // Auto-set as active preview if first one
                          if (prev.length === 0) {
                            setActivePreviewUrl(url);
                            setShowPreview(true);
                          }
                          return [...prev, newService];
                        }
                        return prev;
                      });
                    });
                  }
                }

                // Handle tool_complete events for service URLs
                if (
                  currentEvent === "tool_complete" &&
                  jsonData.tool_name === "get_service_url"
                ) {
                  const urlRegex =
                    /https?:\/\/\d+-[a-z0-9]+\.e2b\.app[^\s)]*/gi;
                  const output = jsonData.output_preview || "";
                  const foundUrls = output.match(urlRegex);
                  if (foundUrls) {
                    foundUrls.forEach((url: string) => {
                      setDetectedServices((prev) => {
                        if (!prev.find((s) => s.url === url)) {
                          const newService: DetectedService = {
                            url: url,
                            type: "service_url",
                            description: "Running Service",
                            timestamp: new Date(),
                          };
                          if (prev.length === 0) {
                            setActivePreviewUrl(url);
                            setShowPreview(true);
                          }
                          return [...prev, newService];
                        }
                        return prev;
                      });
                    });
                  }
                }
              } catch {
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
              Game Generation POC
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
            Create games with AI-powered streaming responses
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
                  placeholder="user_123"
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
                  placeholder="kjegfihifeojgbjhv"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
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
                  Start creating your game
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
              <span title={`Email: ${emailId}`}>✉️ {emailId}</span>
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

      {/* Right Side - Preview Panel */}
      <div className="w-1/2 bg-slate-950 border-l border-slate-700 flex flex-col">
        {/* Preview Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">E2B Preview</h2>
              <p className="text-xs text-gray-400 mt-1">
                {detectedServices.length > 0
                  ? `${detectedServices.length} service${
                      detectedServices.length > 1 ? "s" : ""
                    } detected`
                  : "No services detected yet"}
              </p>
            </div>
            {detectedServices.length > 0 && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            )}
          </div>

          {/* Service Tabs */}
          {detectedServices.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {detectedServices.map((service, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActivePreviewUrl(service.url);
                    setShowPreview(true);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    activePreviewUrl === service.url
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>Service {index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="flex-1 relative bg-slate-950">
          {detectedServices.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  No Preview Available
                </h3>
                <p className="text-sm text-gray-500">
                  Send a message to create a game or service. When the agent
                  starts a server, it will appear here for preview.
                </p>
                <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <p className="text-xs text-gray-400 text-left">
                    <span className="font-semibold text-gray-300">
                      Try asking:
                    </span>
                    <br />
                    • &quot;Create a simple HTML5 game&quot;
                    <br />
                    • &quot;Build a Phaser.js game&quot;
                    <br />• &quot;Make a puzzle game with React&quot;
                  </p>
                </div>
              </div>
            </div>
          ) : showPreview && activePreviewUrl ? (
            <div className="h-full flex flex-col">
              {/* Preview Toolbar */}
              <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded px-3 py-1.5">
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <input
                    type="text"
                    value={activePreviewUrl}
                    readOnly
                    className="flex-1 bg-transparent text-xs text-gray-300 outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activePreviewUrl);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors"
                  title="Copy URL"
                >
                  Copy
                </button>
                <a
                  href={activePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Open in New Tab
                </a>
              </div>

              {/* iframe Preview */}
              <div className="flex-1 relative bg-white">
                <iframe
                  src={activePreviewUrl}
                  className="w-full h-full border-0"
                  title="E2B Service Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400">Preview hidden</p>
                <button
                  onClick={() => setShowPreview(true)}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Show Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Service Details Footer */}
        {detectedServices.length > 0 && activePreviewUrl && (
          <div className="p-3 border-t border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Service Running</span>
              </div>
              <div className="text-gray-500">
                {detectedServices.find((s) => s.url === activePreviewUrl)
                  ?.timestamp
                  ? new Date(
                      detectedServices.find(
                        (s) => s.url === activePreviewUrl
                      )!.timestamp
                    ).toLocaleTimeString()
                  : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
