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

// Frontend enhanced types for real estate map data
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
      // Enhanced real estate-specific data
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
}

interface RealEstateAnalysis {
  marketDensity?: string;
  competitionLevel?: string;
  keyFindings?: string[];
  risks?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

interface FrontendRealEstateResponse {
  success: boolean;
  type: ResponseType;
  response: string;
  mapData?: MapData;
  analysis?: RealEstateAnalysis;
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
  center?: {
    lat: number;
    lon: number;
  };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  metadata?: {
    totalFeatures: number;
    sources: string[];
    generatedAt: string;
  };
}

// Backend URL configuration
const NEST_API_URL = process.env.NEST_API_URL || "http://localhost:4000/api";

// Backend response data types
interface AnalysisData {
  text?: string;
  analysis?: Record<string, unknown>;
  mapData?: GeoJSONFeatureCollection;
}

// Helper function to create text from structured analysis data
function createAnalysisTextFromStructuredData(
  analysis: RealEstateAnalysis
): string {
  let text = "🏠 **Real Estate Market Analysis**\n\n";

  if (analysis.marketDensity) {
    text += `📊 **Market Density:** ${analysis.marketDensity}\n\n`;
  }

  if (analysis.competitionLevel) {
    text += `⚡ **Competition Level:** ${analysis.competitionLevel}\n\n`;
  }

  if (analysis.keyFindings && analysis.keyFindings.length > 0) {
    text += `🔍 **Key Findings:**\n`;
    analysis.keyFindings.forEach((finding) => {
      text += `• ${finding}\n`;
    });
    text += "\n";
  }

  if (analysis.risks && analysis.risks.length > 0) {
    text += `⚠️ **Risks:**\n`;
    analysis.risks.forEach((risk) => {
      text += `• ${risk}\n`;
    });
    text += "\n";
  }

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    text += `💡 **Recommendations:**\n`;
    analysis.recommendations.forEach((rec) => {
      text += `• ${rec}\n`;
    });
    text += "\n";
  }

  return text;
}

// GeoJSON extraction function optimized for real estate data
function extractRealEstateMapData(
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
        console.log("✅ Found mapData in real estate backend response");
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

    console.log("No GeoJSON found in real estate response");
    return null;
  } catch (error) {
    console.error("Error extracting real estate map data:", error);
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

// Convert GeoJSON to MapData format with real estate enhancements
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

      // Flexible property validation - require name (address is optional, can be derived from name)
      if (!feature.properties?.name) {
        console.warn(
          `Skipping feature ${i}: missing required properties (name)`
        );
        continue;
      }

      const [lng, lat] = feature.geometry.coordinates;

      console.log(
        `🏠 Processing real estate feature ${i}: [${lng}, ${lat}] - ${feature.properties?.name}`
      );

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
            : `property-${i + 1}`,
        type: "place",
        coordinates: [lng, lat],
        properties: {
          name: feature.properties.name as string,
          address:
            (feature.properties.address as string) ||
            (feature.properties.name as string) ||
            "",
          category:
            typeof feature.properties.category === "string"
              ? feature.properties.category
              : typeof feature.properties.property_type === "string"
              ? feature.properties.property_type
              : "Real Estate",
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
          // Enhanced real estate-specific data
          property_type:
            typeof feature.properties.property_type === "string"
              ? feature.properties.property_type
              : undefined,
          price_range:
            typeof feature.properties.price_range === "string"
              ? feature.properties.price_range
              : undefined,
          investment_potential:
            typeof feature.properties.investment_potential === "number"
              ? feature.properties.investment_potential
              : undefined,
          market_trend:
            typeof feature.properties.market_trend === "string"
              ? feature.properties.market_trend
              : undefined,
          roi_estimate:
            typeof feature.properties.roi_estimate === "string"
              ? feature.properties.roi_estimate
              : undefined,
          cap_rate:
            typeof feature.properties.cap_rate === "number"
              ? feature.properties.cap_rate
              : undefined,
          property_size:
            typeof feature.properties.property_size === "string"
              ? feature.properties.property_size
              : undefined,
          zoning:
            typeof feature.properties.zoning === "string"
              ? feature.properties.zoning
              : undefined,
          walkability_score:
            typeof feature.properties.walkability_score === "number"
              ? feature.properties.walkability_score
              : undefined,
          transit_access:
            typeof feature.properties.transit_access === "string"
              ? feature.properties.transit_access
              : undefined,
          school_district:
            typeof feature.properties.school_district === "string"
              ? feature.properties.school_district
              : undefined,
          crime_rate:
            typeof feature.properties.crime_rate === "string"
              ? feature.properties.crime_rate
              : undefined,
          appreciation_rate:
            typeof feature.properties.appreciation_rate === "number"
              ? feature.properties.appreciation_rate
              : undefined,
          rental_yield:
            typeof feature.properties.rental_yield === "number"
              ? feature.properties.rental_yield
              : undefined,
        },
      });
    }

    if (places.length === 0) {
      console.log("No valid places found in real estate GeoJSON");
      return null;
    }

    // Calculate center and bounds
    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    console.log(
      `✅ Successfully processed ${places.length} real estate features from GeoJSON`
    );

    // Use backend-provided center and bounds if available, otherwise calculate
    const center = geoJson.center
      ? { lat: geoJson.center.lat, lng: geoJson.center.lon }
      : {
          lat:
            coordinates.reduce((sum, coord) => sum + coord[1], 0) /
            coordinates.length,
          lng:
            coordinates.reduce((sum, coord) => sum + coord[0], 0) /
            coordinates.length,
        };

    console.log(
      `🏠 Real estate center coordinates: [${center.lng}, ${center.lat}]`
    );
    console.log(
      `🏘️ First 3 property coordinates:`,
      places
        .slice(0, 3)
        .map(
          (p) =>
            `${p.properties.name}: [${p.coordinates[0]}, ${p.coordinates[1]}]`
        )
    );

    const bounds = geoJson.bounds || {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };

    return {
      center,
      bounds,
      places,
    };
  } catch (error) {
    console.error("Error converting real estate GeoJSON to MapData:", error);
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
      sessionId: body.sessionId || `real-estate-${Date.now()}`,
      responsePreference: body.responsePreference || ResponsePreference.AUTO,
      context: body.context || {},
    };

    console.log(
      `🏠 Processing real estate query: ${body.message.substring(0, 100)}...`
    );

    // Call the NestJS backend real estate endpoint
    const backendUrl = `${NEST_API_URL}/places/real-estate`;
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

    console.log(`🏠 Backend response type: ${backendData.type}`);
    console.log(`🏠 Backend response success: ${backendData.success}`);
    if (backendData.data && typeof backendData.data === "object") {
      const data = backendData.data as AnalysisData;
      if (data.mapData) {
        console.log(
          `🏠 MapData features count: ${data.mapData.features?.length || 0}`
        );
        console.log(`🏠 MapData center:`, data.mapData.center);
        console.log(
          `🏠 First 3 features:`,
          data.mapData.features?.slice(0, 3).map((f: GeoJSONFeature) => ({
            name: f.properties?.name,
            coordinates: f.geometry?.coordinates,
          }))
        );
      }
    }

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
    const mapData = extractRealEstateMapData(backendData);

    // Extract structured analysis data
    let analysisData: RealEstateAnalysis | undefined;
    let responseText = "";

    // Handle the analysis response structure from your backend
    if (typeof backendData.data === "object" && backendData.data !== null) {
      const data = backendData.data as Record<string, unknown>;

      // Extract the structured analysis object
      if (data.analysis && typeof data.analysis === "object") {
        analysisData = data.analysis as RealEstateAnalysis;
        console.log(
          "✅ Successfully extracted structured analysis data:",
          analysisData
        );
      }

      // Try to extract text from data.text (this should be the main analysis)
      if (typeof data.text === "string" && data.text.trim().length > 0) {
        responseText = data.text;
        console.log(
          "✅ Successfully extracted real estate analysis text from backend"
        );
      } else {
        console.log("⚠️ data.text not found, checking for fallback data");

        // If no text but we have analysis data, create meaningful text
        if (analysisData) {
          responseText = createAnalysisTextFromStructuredData(analysisData);
          console.log("✅ Created text from structured analysis data");
        } else {
          responseText = "Real estate analysis completed successfully.";
          console.log("⚠️ Using minimal fallback text");
        }
      }
    } else if (typeof backendData.data === "string") {
      responseText = backendData.data;
      console.log("✅ Used string data directly");
    } else {
      responseText = "Real estate analysis completed successfully.";
      console.log("⚠️ Used default fallback");
    }

    const response: FrontendRealEstateResponse = {
      success: true,
      type: backendData.type,
      response: responseText,
      mapData: mapData || undefined,
      analysis: analysisData,
      metadata: backendData.metadata,
      timestamp: new Date().toISOString(),
      originalBackendResponse: backendData,
    };

    console.log(
      `✅ Real estate query processed successfully. Map data: ${
        mapData ? "Yes" : "No"
      }`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Real estate API route error:", error);

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
