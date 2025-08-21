import { NextRequest } from "next/server";

// Function to extract coordinates from text response
function extractMapDataFromText(text: string): {
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
} | null {
  const coordinateRegex = /-\s*\*\*Coordinates:\*\*\s*([\d.-]+),\s*([\d.-]+)/g;
  const nameRegex = /\d+\.\s*\*\*(.*?)\*\*/g;
  const categoryRegex = /-\s*\*\*Category:\*\*\s*(.*?)(?:\n|$)/g;
  const addressRegex = /-\s*\*\*Address:\*\*\s*(.*?)(?:\n|$)/g;

  const places = [];
  const coordinates: [number, number][] = [];
  const names = [];
  const categories = [];
  const addresses = [];

  let match;

  console.log("Extracting map data from text:", text.substring(0, 500) + "...");

  // Extract all coordinates
  while ((match = coordinateRegex.exec(text)) !== null) {
    console.log("Found coordinates:", match[1], match[2]);
    coordinates.push([parseFloat(match[2]), parseFloat(match[1])] as [
      number,
      number
    ]);
  }

  // Extract all names
  while ((match = nameRegex.exec(text)) !== null) {
    console.log("Found name:", match[1]);
    names.push(match[1].trim());
  }

  // Extract all categories
  while ((match = categoryRegex.exec(text)) !== null) {
    console.log("Found category:", match[1]);
    categories.push(match[1].trim());
  }

  // Extract all addresses
  while ((match = addressRegex.exec(text)) !== null) {
    console.log("Found address:", match[1]);
    addresses.push(match[1].trim());
  }

  console.log("Extracted data:", {
    coordinates: coordinates.length,
    names: names.length,
    categories: categories.length,
    addresses: addresses.length,
  });

  // Combine all data into places array
  for (let i = 0; i < coordinates.length && i < names.length; i++) {
    places.push({
      id: `place-${i}`,
      type: "place",
      coordinates: coordinates[i],
      properties: {
        name: names[i] || `Place ${i + 1}`,
        address: addresses[i] || "Address not available",
        category: categories[i] || "Unknown",
        relevance: 1.0,
      },
    });
  }

  if (places.length === 0) return null;

  // Calculate center from all coordinates
  const avgLat =
    coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  const avgLng =
    coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;

  // Calculate bounds
  const lats = coordinates.map((coord) => coord[1]);
  const lngs = coordinates.map((coord) => coord[0]);

  return {
    center: { lat: avgLat, lng: avgLng },
    bounds: {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    },
    layers: {
      places,
      events: [],
      weather: [],
      userLocation: {},
    },
  };
}

export async function POST(req: NextRequest) {
  const base = process.env.NEST_API_URL || "http://localhost:3000";

  try {
    // Parse the request payload
    const payload = await req.json().catch(() => null);

    if (!payload || !payload.message) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Forward to NestJS streaming endpoint
    const response = await fetch(`${base}/places/chat/stream`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return new Response(`Backend error: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Create a readable stream to forward the SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let actualContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Check if the actual content contains map-worthy data
              const mapData = extractMapDataFromText(actualContent);
              if (mapData) {
                // Send map data as a special event
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "map_data",
                      mapData: mapData,
                      timestamp: new Date().toISOString(),
                    })}\n\n`
                  )
                );
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "done",
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                )
              );
              controller.close();
              break;
            }

            // Decode the chunk and forward it
            const chunk = decoder.decode(value, { stream: true });

            // Extract actual content from SSE format
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const eventData = JSON.parse(line.slice(6));
                  if (eventData.type === "content" && eventData.content) {
                    actualContent += eventData.content;
                  }
                } catch {
                  // Ignore parsing errors
                }
              }
            }

            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: String(error),
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    // Return the stream with proper SSE headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Streaming API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
