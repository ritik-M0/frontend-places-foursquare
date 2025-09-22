import { NextRequest, NextResponse } from "next/server";

// Types matching the NestJS backend DTOs
export enum ResponsePreference {
  AUTO = "auto",
  TEXT = "text",
  GEOJSON = "geojson",
  STREAMING = "streaming",
  ANALYSIS = "analysis",
}

export enum ResponseType {
  TEXT = "text",
  GEOJSON = "geojson",
  ANALYSIS = "analysis",
  STREAMING = "streaming",
}

interface UnifiedChatDto {
  message: string;
  sessionId?: string;
  responsePreference?: ResponsePreference;
  context?: Record<string, unknown>;
}

interface UnifiedChatResponseDto {
  type: ResponseType;
  data: unknown;
  metadata: {
    executionTime: number;
    agentsUsed: string[];
    toolsUsed: string[];
    confidence: number;
    intent?: string;
    detectedEntities?: string[];
  };
  success: boolean;
  timestamp: string;
}

// Frontend enhanced types for map data
interface MapData {
  center: {
    lat: number;
    lng: number;
  };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  places: Array<{
    id: string;
    type: "place";
    coordinates: [number, number]; // [lng, lat]
    properties: {
      name: string;
      address: string;
      category?: string;
      relevance?: number;
      businessType?: "recommendation" | "competitor";
      neighborhood?: string;
      // Enhanced urban planning data
      urban_score?: number;
      sustainability_rating?: string;
      transit_accessibility?: number;
      walkability_score?: number;
      green_space_access?: number;
      infrastructure_quality?: string;
    };
  }>;
}

interface FrontendUrbanPlanningResponse {
  success: boolean;
  type: ResponseType;
  response: string;
  mapData?: MapData;
  metadata: {
    executionTime: number;
    agentsUsed: string[];
    toolsUsed: string[];
    confidence: number;
    intent?: string;
    detectedEntities?: string[];
  };
  timestamp: string;
  originalBackendResponse?: UnifiedChatResponseDto;
}

// GeoJSON Types for parsing
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: string;
  features: GeoJSONFeature[];
}

// Backend URL configuration
const NEST_API_URL = process.env.NEST_API_URL || "http://localhost:4000/api";

// Backend response data types
interface AnalysisData {
  text?: string;
  analysis?: Record<string, unknown>;
  mapData?: GeoJSONFeatureCollection;
}

// GeoJSON extraction function optimized for urban planning data
function extractUrbanPlanningMapData(
  backendResponse: UnifiedChatResponseDto
): MapData | null {
  try {
    // Check if data has direct mapData property (your backend structure)
    if (
      backendResponse.type === ResponseType.ANALYSIS &&
      typeof backendResponse.data === "object" &&
      backendResponse.data !== null
    ) {
      const data = backendResponse.data as AnalysisData;

      // Check for mapData in the data object
      if (
        data.mapData &&
        typeof data.mapData === "object" &&
        data.mapData.type === "FeatureCollection" &&
        Array.isArray(data.mapData.features)
      ) {
        console.log("✅ Found mapData in backend response");
        return convertGeoJsonToMapData(data.mapData);
      }
    }

    // Check if data is already GeoJSON at root level
    if (
      backendResponse.type === ResponseType.GEOJSON &&
      typeof backendResponse.data === "object" &&
      backendResponse.data !== null
    ) {
      return convertGeoJsonToMapData(
        backendResponse.data as GeoJSONFeatureCollection
      );
    }

    // Check if data contains text with embedded GeoJSON (fallback)
    if (
      backendResponse.type === ResponseType.TEXT ||
      backendResponse.type === ResponseType.ANALYSIS
    ) {
      const data = backendResponse.data as AnalysisData;
      let textData = "";

      if (typeof backendResponse.data === "string") {
        textData = backendResponse.data;
      } else if (data.text && typeof data.text === "string") {
        textData = data.text;
      } else {
        textData = JSON.stringify(backendResponse.data);
      }

      return extractMapDataFromText(textData);
    }

    console.log("No GeoJSON found in urban planning response");
    return null;
  } catch (error) {
    console.error("Error extracting urban planning map data:", error);
    return null;
  }
}

// Extract GeoJSON from text content
function extractMapDataFromText(text: string): MapData | null {
  try {
    // Look for GeoJSON patterns in the text
    const geoJsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    let geoJsonStr = geoJsonMatch?.[1];

    if (!geoJsonStr) {
      // Try to find raw JSON objects that look like GeoJSON
      const jsonMatches = text.match(
        /\{[\s\S]*?"type":\s*"FeatureCollection"[\s\S]*?\}/g
      );
      if (jsonMatches && jsonMatches.length > 0) {
        geoJsonStr = jsonMatches[0];
      }
    }

    if (!geoJsonStr) {
      console.log("No GeoJSON found in text content");
      return null;
    }

    const geoJson = JSON.parse(geoJsonStr);

    if (
      geoJson.type !== "FeatureCollection" ||
      !Array.isArray(geoJson.features)
    ) {
      console.log("Invalid GeoJSON structure");
      return null;
    }

    return convertGeoJsonToMapData(geoJson);
  } catch (error) {
    console.error("Error extracting map data from text:", error);
    return null;
  }
}

// Convert GeoJSON to MapData format with urban planning enhancements
function convertGeoJsonToMapData(
  geoJson: GeoJSONFeatureCollection
): MapData | null {
  try {
    const places: MapData["places"] = [];
    const coordinates: [number, number][] = [];

    for (let i = 0; i < geoJson.features.length; i++) {
      const feature = geoJson.features[i];

      if (
        !feature.geometry ||
        feature.geometry.type !== "Point" ||
        !Array.isArray(feature.geometry.coordinates) ||
        feature.geometry.coordinates.length !== 2
      ) {
        console.warn(`Skipping feature ${i}: invalid geometry`);
        continue;
      }

      // Flexible property validation - require name and address
      if (!feature.properties?.name || !feature.properties?.address) {
        console.warn(
          `Skipping feature ${i}: missing required properties (name or address)`
        );
        continue;
      }

      const [lng, lat] = feature.geometry.coordinates;

      if (
        typeof lng !== "number" ||
        typeof lat !== "number" ||
        isNaN(lng) ||
        isNaN(lat) ||
        Math.abs(lng) > 180 ||
        Math.abs(lat) > 90
      ) {
        console.warn(
          `Skipping feature ${i}: invalid coordinates [${lng}, ${lat}]`
        );
        continue;
      }

      coordinates.push([lng, lat]);

      places.push({
        id:
          typeof feature.properties.id === "string"
            ? feature.properties.id
            : `place-${i + 1}`,
        type: "place",
        coordinates: [lng, lat],
        properties: {
          name: feature.properties.name as string,
          address: feature.properties.address as string,
          category:
            typeof feature.properties.category === "string"
              ? feature.properties.category
              : typeof feature.properties.businessType === "string"
              ? feature.properties.businessType
              : "Urban Feature",
          relevance:
            typeof feature.properties.relevance === "number"
              ? feature.properties.relevance
              : typeof feature.properties.score === "number"
              ? feature.properties.score
              : 1.0,
          businessType:
            feature.properties.businessType === "recommendation" ||
            feature.properties.businessType === "competitor"
              ? feature.properties.businessType
              : feature.properties.category === "opportunity"
              ? "recommendation"
              : "competitor",
          neighborhood:
            typeof feature.properties.neighborhood === "string"
              ? feature.properties.neighborhood
              : undefined,
          // Enhanced urban planning data
          urban_score:
            typeof feature.properties.urban_score === "number"
              ? feature.properties.urban_score
              : undefined,
          sustainability_rating:
            typeof feature.properties.sustainability_rating === "string"
              ? feature.properties.sustainability_rating
              : undefined,
          transit_accessibility:
            typeof feature.properties.transit_accessibility === "number"
              ? feature.properties.transit_accessibility
              : undefined,
          walkability_score:
            typeof feature.properties.walkability_score === "number"
              ? feature.properties.walkability_score
              : undefined,
          green_space_access:
            typeof feature.properties.green_space_access === "number"
              ? feature.properties.green_space_access
              : undefined,
          infrastructure_quality:
            typeof feature.properties.infrastructure_quality === "string"
              ? feature.properties.infrastructure_quality
              : undefined,
        },
      });
    }

    if (places.length === 0) {
      console.log("No valid places found in urban planning GeoJSON");
      return null;
    }

    // Calculate center and bounds
    const avgLat =
      coordinates.reduce((sum, coord) => sum + coord[1], 0) /
      coordinates.length;
    const avgLng =
      coordinates.reduce((sum, coord) => sum + coord[0], 0) /
      coordinates.length;

    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };

    console.log(
      `✅ Successfully processed ${places.length} urban planning features from GeoJSON`
    );

    return {
      center: { lat: avgLat, lng: avgLng },
      bounds,
      places,
    };
  } catch (error) {
    console.error("Error converting urban planning GeoJSON to MapData:", error);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UnifiedChatDto = await request.json();

    // Validate request body
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Set default values
    const requestPayload: UnifiedChatDto = {
      message: body.message,
      sessionId: body.sessionId || `urban-planning-${Date.now()}`,
      responsePreference: body.responsePreference || ResponsePreference.AUTO,
      context: body.context || {},
    };

    console.log(
      `🏙️ Processing urban planning query: ${body.message.substring(0, 100)}...`
    );

    // Call the NestJS backend urban-planning endpoint
    const backendUrl = `${NEST_API_URL}/places/urban-planning`;
    console.log(`Calling backend at: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend API error: ${backendResponse.status} - ${errorText}`
      );

      return NextResponse.json(
        {
          success: false,
          error: `Backend API error: ${backendResponse.status}`,
          details: errorText,
        },
        { status: backendResponse.status }
      );
    }

    const backendData: UnifiedChatResponseDto = await backendResponse.json();

    if (!backendData.success) {
      console.error("Backend returned unsuccessful response:", backendData);
      return NextResponse.json(
        {
          success: false,
          error: "Backend returned unsuccessful response",
          details: backendData,
        },
        { status: 500 }
      );
    }

    // Extract map data from backend response
    const mapData = extractUrbanPlanningMapData(backendData);

    // Create user-friendly response text from backend data
    let responseText = "";
    if (typeof backendData.data === "string") {
      responseText = backendData.data;
    } else if (
      typeof backendData.data === "object" &&
      backendData.data !== null
    ) {
      const data = backendData.data as AnalysisData;
      if (data.text && typeof data.text === "string") {
        responseText = data.text;
      } else {
        responseText = JSON.stringify(backendData.data, null, 2);
      }
    } else {
      responseText = "Urban planning analysis completed successfully.";
    }

    const response: FrontendUrbanPlanningResponse = {
      success: true,
      type: backendData.type,
      response: responseText,
      mapData: mapData || undefined,
      metadata: backendData.metadata,
      timestamp: new Date().toISOString(),
      originalBackendResponse: backendData,
    };

    console.log(
      `✅ Urban planning query processed successfully. Map data: ${
        mapData ? "Yes" : "No"
      }`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Urban planning API route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
