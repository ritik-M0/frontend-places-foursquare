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

// Energy-specific analysis structure
interface EnergyAnalysis {
  gridCapacity?: string;
  renewablePotential?: string;
  infrastructureCondition?: string;
  keyFindings?: string[];
  challenges?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

interface FrontendEnergyResponse {
  success: boolean;
  type: ResponseType;
  response: string;
  mapData?: MapData;
  analysis?: EnergyAnalysis;
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

// Frontend enhanced types for energy map data
interface MapData {
  center: { lat: number; lng: number };
  bounds?: { north: number; south: number; east: number; west: number };
  places: Array<{
    id: string;
    type: "place";
    coordinates: [number, number]; // [lng, lat]
    properties: {
      name: string;
      address: string;
      category?: string;
      relevance?: number;
      businessType?: "infrastructure" | "renewable" | "facility";
      neighborhood?: string;
      // Enhanced energy-specific data
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
  }>;
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
  analysis: EnergyAnalysis
): string {
  let text = "⚡ **Energy & Utilities Analysis**\n\n";

  if (analysis.gridCapacity) {
    text += `🔌 **Grid Capacity:** ${analysis.gridCapacity}\n\n`;
  }

  if (analysis.renewablePotential) {
    text += `🌱 **Renewable Potential:** ${analysis.renewablePotential}\n\n`;
  }

  if (analysis.infrastructureCondition) {
    text += `🏗️ **Infrastructure Condition:** ${analysis.infrastructureCondition}\n\n`;
  }

  if (analysis.keyFindings && analysis.keyFindings.length > 0) {
    text += `🔍 **Key Findings:**\n`;
    analysis.keyFindings.forEach((finding) => {
      text += `• ${finding}\n`;
    });
    text += "\n";
  }

  if (analysis.challenges && analysis.challenges.length > 0) {
    text += `⚠️ **Challenges:**\n`;
    analysis.challenges.forEach((challenge) => {
      text += `• ${challenge}\n`;
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

// GeoJSON extraction function optimized for energy data
function extractEnergyMapData(
  backendResponse: UnifiedChatResponseDto
): MapData | null {
  try {
    // Check if data has direct mapData property
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
        console.log("✅ Found mapData in energy backend response");
        console.log(
          `🔍 MapData features count: ${data.mapData.features.length}`
        );

        // Show all map data regardless of energy relevance
        if (data.mapData.features.length > 0) {
          console.log("🗺️ Displaying all map data features from backend");
          return convertGeoJsonToMapData(data.mapData);
        } else {
          console.log("⚠️ No features found in mapData");
          return null;
        }
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

    console.log("No GeoJSON found in energy response");
    return null;
  } catch (error) {
    console.error("Error extracting energy map data:", error);
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

// Convert GeoJSON to MapData format with energy enhancements
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

      // Flexible property validation - require name
      if (!feature.properties?.name) {
        console.warn(
          `Skipping feature ${i}: missing required properties (name)`
        );
        continue;
      }

      const [lng, lat] = feature.geometry.coordinates;

      console.log(
        `⚡ Processing energy feature ${i}: [${lng}, ${lat}] - ${feature.properties?.name}`
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
            : `energy-facility-${i + 1}`,
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
              : typeof feature.properties.facility_type === "string"
              ? feature.properties.facility_type
              : "Energy Infrastructure",
          relevance:
            typeof feature.properties.relevance === "number"
              ? feature.properties.relevance
              : typeof feature.properties.score === "number"
              ? feature.properties.score
              : 1.0,
          businessType:
            feature.properties.businessType === "infrastructure" ||
            feature.properties.businessType === "renewable" ||
            feature.properties.businessType === "facility"
              ? feature.properties.businessType
              : feature.properties.category === "renewable"
              ? "renewable"
              : feature.properties.category === "transmission"
              ? "infrastructure"
              : "facility",
          neighborhood:
            typeof feature.properties.neighborhood === "string"
              ? feature.properties.neighborhood
              : undefined,
          // Enhanced energy-specific data
          facility_type:
            typeof feature.properties.facility_type === "string"
              ? feature.properties.facility_type
              : undefined,
          energy_capacity:
            typeof feature.properties.energy_capacity === "string"
              ? feature.properties.energy_capacity
              : undefined,
          grid_connection:
            typeof feature.properties.grid_connection === "string"
              ? feature.properties.grid_connection
              : undefined,
          renewable_type:
            typeof feature.properties.renewable_type === "string"
              ? feature.properties.renewable_type
              : undefined,
          efficiency_rating:
            typeof feature.properties.efficiency_rating === "string"
              ? feature.properties.efficiency_rating
              : undefined,
          maintenance_status:
            typeof feature.properties.maintenance_status === "string"
              ? feature.properties.maintenance_status
              : undefined,
          power_output:
            typeof feature.properties.power_output === "string"
              ? feature.properties.power_output
              : undefined,
          service_area:
            typeof feature.properties.service_area === "string"
              ? feature.properties.service_area
              : undefined,
          installation_year:
            typeof feature.properties.installation_year === "number"
              ? feature.properties.installation_year
              : undefined,
          environmental_impact:
            typeof feature.properties.environmental_impact === "string"
              ? feature.properties.environmental_impact
              : undefined,
          grid_stability:
            typeof feature.properties.grid_stability === "string"
              ? feature.properties.grid_stability
              : undefined,
          backup_systems:
            typeof feature.properties.backup_systems === "string"
              ? feature.properties.backup_systems
              : undefined,
          energy_storage:
            typeof feature.properties.energy_storage === "string"
              ? feature.properties.energy_storage
              : undefined,
          transmission_voltage:
            typeof feature.properties.transmission_voltage === "string"
              ? feature.properties.transmission_voltage
              : undefined,
        },
      });
    }

    if (places.length === 0) {
      console.log("No valid places found in energy GeoJSON");
      return null;
    }

    // Calculate center and bounds
    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    console.log(
      `✅ Successfully processed ${places.length} energy features from GeoJSON`
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

    const bounds = geoJson.bounds
      ? {
          north: geoJson.bounds.north,
          south: geoJson.bounds.south,
          east: geoJson.bounds.east,
          west: geoJson.bounds.west,
        }
      : {
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
    console.error("Error converting energy GeoJSON to MapData:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log("⚡ Energy API route received request:", requestBody);

    // Validate request body
    if (!requestBody?.message || typeof requestBody.message !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: message is required",
        },
        { status: 400 }
      );
    }

    // Prepare request for backend API
    const requestPayload: UnifiedChatDto = {
      message: requestBody.message,
      sessionId: requestBody.sessionId || crypto.randomUUID(),
      responsePreference:
        requestBody.responsePreference || ResponsePreference.AUTO,
      context: requestBody.context || {},
    };

    console.log(`⚡ Calling backend energy-utilities API with:`, {
      url: `${NEST_API_URL}/places/energy-utilities`,
      message: requestPayload.message.substring(0, 100) + "...",
      sessionId: requestPayload.sessionId,
    });

    // Call backend API
    const backendResponse = await fetch(
      `${NEST_API_URL}/places/energy-utilities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      }
    );

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

    console.log(`⚡ Backend response type: ${backendData.type}`);
    console.log(`⚡ Backend response success: ${backendData.success}`);
    if (backendData.data && typeof backendData.data === "object") {
      const data = backendData.data as AnalysisData;
      if (data.mapData) {
        console.log(
          `⚡ MapData features count: ${data.mapData.features?.length || 0}`
        );
        console.log(`⚡ MapData center:`, data.mapData.center);
        console.log(
          `⚡ First 3 features:`,
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
    const mapData = extractEnergyMapData(backendData);

    // Extract structured analysis data
    let analysisData: EnergyAnalysis | undefined;
    let responseText = "";

    // Handle the analysis response structure from backend
    if (typeof backendData.data === "object" && backendData.data !== null) {
      const data = backendData.data as Record<string, unknown>;

      // Extract the structured analysis object
      if (data.analysis && typeof data.analysis === "object") {
        analysisData = data.analysis as EnergyAnalysis;
        console.log(
          "✅ Successfully extracted structured energy analysis data"
        );
      }

      // Try to extract text from data.text (primary source for energy analysis)
      if (typeof data.text === "string" && data.text.trim().length > 0) {
        responseText = data.text;
        console.log(
          "✅ Successfully extracted energy analysis text from backend (length:",
          data.text.length,
          ")"
        );
      } else {
        console.log("⚠️ data.text not found, checking for fallback data");

        // If no text but we have analysis data, create meaningful text
        if (analysisData) {
          responseText = createAnalysisTextFromStructuredData(analysisData);
          console.log("✅ Created text from structured energy analysis data");
        } else {
          responseText =
            "Energy and utilities analysis completed successfully. The analysis includes comprehensive infrastructure assessment and recommendations.";
          console.log("⚠️ Using enhanced fallback text");
        }
      }
    } else if (typeof backendData.data === "string") {
      responseText = backendData.data;
      console.log("✅ Used string data directly");
    } else {
      responseText = "Energy and utilities analysis completed successfully.";
      console.log("⚠️ Used default fallback");
    }

    const response: FrontendEnergyResponse = {
      success: true,
      type: backendData.type,
      response: responseText,
      mapData: mapData || undefined,
      analysis: analysisData,
      metadata: backendData.metadata,
      timestamp: new Date().toISOString(),
      originalBackendResponse: backendData,
    };

    if (mapData) {
      console.log(
        `✅ Energy query processed successfully with ${mapData.places.length} facilities mapped`
      );
    } else {
      console.log(
        `✅ Energy query processed successfully with comprehensive text analysis (no map data available)`
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Energy API route error:", error);

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
