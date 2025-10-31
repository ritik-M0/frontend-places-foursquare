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

// Updated to match actual backend response structure
interface UnifiedChatResponseDto {
  type: "analysis";
  data: {
    text: string; // Contains JSON + markdown content
    analysis: {
      key_metrics?: {
        market_density?: string;
        facility_counts?: {
          warehouses?: number;
          distribution_centers?: number;
        };
        competition_level?: string;
      };
      recommendations?: string[];
      risks?: string[];
    };
    mapData?: {
      type: "FeatureCollection";
      features: Array<{
        type: "Feature";
        geometry: {
          type: "Point";
          coordinates: [number, number];
        };
        properties: {
          name: string;
          address: string;
          category?: string;
          phone?: string;
          score: number;
          source: string;
        };
      }>;
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
      center: {
        lat: number;
        lon: number;
      };
      metadata: {
        totalFeatures: number;
        sources: string[];
        generatedAt: string;
      };
    };
  };
  metadata: {
    executionTime: number;
    agentsUsed: string[];
    toolsUsed: string[];
    confidence: number;
    intent: string;
    detectedEntities: string[];
  };
  success: boolean;
  timestamp: string;
}

// Supply Chain-specific analysis structure
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

interface FrontendSupplyChainResponse {
  success: boolean;
  type: ResponseType;
  response: string;
  mapData?: MapData;
  analysis?: SupplyChainAnalysis;
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

// Frontend enhanced types for supply chain map data
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
      businessType?:
        | "warehouse"
        | "distribution"
        | "transportation"
        | "logistics";
      neighborhood?: string;
      // Enhanced supply chain-specific data
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

// Helper function to create text from structured analysis data
function createAnalysisTextFromStructuredData(
  analysis: SupplyChainAnalysis
): string {
  let text = "🚛 **Supply Chain & Logistics Analysis**\n\n";

  if (analysis.distributionNetwork) {
    text += `📦 **Distribution Network:** ${analysis.distributionNetwork}\n\n`;
  }

  if (analysis.warehouseOptimization) {
    text += `🏭 **Warehouse Optimization:** ${analysis.warehouseOptimization}\n\n`;
  }

  if (analysis.transportationRoutes) {
    text += `🚚 **Transportation Routes:** ${analysis.transportationRoutes}\n\n`;
  }

  if (analysis.costAnalysis) {
    text += `💰 **Cost Analysis:** ${analysis.costAnalysis}\n\n`;
  }

  if (analysis.capacityAssessment) {
    text += `📊 **Capacity Assessment:** ${analysis.capacityAssessment}\n\n`;
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

// GeoJSON extraction function optimized for supply chain data
function extractSupplyChainMapData(
  backendResponse: UnifiedChatResponseDto
): MapData | null {
  try {
    // Check if data has direct mapData property
    if (
      backendResponse.type === "analysis" &&
      typeof backendResponse.data === "object" &&
      backendResponse.data !== null
    ) {
      const data = backendResponse.data;

      // Check for mapData in the data object
      if (
        data.mapData &&
        typeof data.mapData === "object" &&
        data.mapData.type === "FeatureCollection" &&
        Array.isArray(data.mapData.features)
      ) {
        console.log("✅ Found mapData in supply chain backend response");
        console.log(
          `🔍 MapData features count: ${data.mapData.features.length}`
        );

        // Show all map data regardless of supply chain relevance
        if (data.mapData.features.length > 0) {
          console.log("🗺️ Displaying all map data features from backend");
          return convertGeoJsonToMapData(data.mapData);
        } else {
          console.log("⚠️ No features found in mapData");
          return null;
        }
      }
    }

    // Check if data contains text with embedded GeoJSON (fallback)
    if (backendResponse.type === "analysis") {
      const data = backendResponse.data;
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

    console.log("No GeoJSON found in supply chain response");
    return null;
  } catch (error) {
    console.error("Error extracting supply chain map data:", error);
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

// Convert GeoJSON to MapData format with supply chain enhancements
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
        `🚛 Processing supply chain feature ${i}: [${lng}, ${lat}] - ${feature.properties?.name}`
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
            : `supply-chain-facility-${i + 1}`,
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
              : "Logistics Facility",
          relevance:
            typeof feature.properties.relevance === "number"
              ? feature.properties.relevance
              : typeof feature.properties.score === "number"
              ? feature.properties.score
              : 1.0,
          businessType:
            feature.properties.businessType === "warehouse" ||
            feature.properties.businessType === "distribution" ||
            feature.properties.businessType === "transportation" ||
            feature.properties.businessType === "logistics"
              ? feature.properties.businessType
              : // Smart categorization based on category and name
              (feature.properties.category as string)
                  ?.toLowerCase()
                  .includes("warehouse") ||
                (feature.properties.name as string)
                  ?.toLowerCase()
                  .includes("warehouse")
              ? "warehouse"
              : (feature.properties.category as string)
                  ?.toLowerCase()
                  .includes("distribution") ||
                (feature.properties.name as string)
                  ?.toLowerCase()
                  .includes("distribution")
              ? "distribution"
              : (feature.properties.category as string)
                  ?.toLowerCase()
                  .includes("transport") ||
                (feature.properties.name as string)
                  ?.toLowerCase()
                  .includes("transport") ||
                (feature.properties.category as string)
                  ?.toLowerCase()
                  .includes("industrial")
              ? "transportation"
              : "logistics",
          neighborhood:
            typeof feature.properties.neighborhood === "string"
              ? feature.properties.neighborhood
              : undefined,
          // Enhanced supply chain-specific data
          facility_type:
            typeof feature.properties.facility_type === "string"
              ? feature.properties.facility_type
              : undefined,
          storage_capacity:
            typeof feature.properties.storage_capacity === "string"
              ? feature.properties.storage_capacity
              : undefined,
          transportation_access:
            typeof feature.properties.transportation_access === "string"
              ? feature.properties.transportation_access
              : undefined,
          rail_access:
            typeof feature.properties.rail_access === "boolean"
              ? feature.properties.rail_access
              : undefined,
          highway_access:
            typeof feature.properties.highway_access === "boolean"
              ? feature.properties.highway_access
              : undefined,
          port_proximity:
            typeof feature.properties.port_proximity === "string"
              ? feature.properties.port_proximity
              : undefined,
          loading_docks:
            typeof feature.properties.loading_docks === "number"
              ? feature.properties.loading_docks
              : undefined,
          automation_level:
            typeof feature.properties.automation_level === "string"
              ? feature.properties.automation_level
              : undefined,
          warehouse_size:
            typeof feature.properties.warehouse_size === "string"
              ? feature.properties.warehouse_size
              : undefined,
          distribution_range:
            typeof feature.properties.distribution_range === "string"
              ? feature.properties.distribution_range
              : undefined,
          operating_hours:
            typeof feature.properties.operating_hours === "string"
              ? feature.properties.operating_hours
              : undefined,
          last_mile_capability:
            typeof feature.properties.last_mile_capability === "boolean"
              ? feature.properties.last_mile_capability
              : undefined,
          cold_storage:
            typeof feature.properties.cold_storage === "boolean"
              ? feature.properties.cold_storage
              : undefined,
          hazmat_certified:
            typeof feature.properties.hazmat_certified === "boolean"
              ? feature.properties.hazmat_certified
              : undefined,
          cross_docking:
            typeof feature.properties.cross_docking === "boolean"
              ? feature.properties.cross_docking
              : undefined,
          inventory_turnover:
            typeof feature.properties.inventory_turnover === "string"
              ? feature.properties.inventory_turnover
              : undefined,
        },
      });
    }

    if (places.length === 0) {
      console.log("No valid places found in supply chain GeoJSON");
      return null;
    }

    // Calculate center and bounds
    const lats = coordinates.map((coord) => coord[1]);
    const lngs = coordinates.map((coord) => coord[0]);

    console.log(
      `✅ Successfully processed ${places.length} supply chain features from GeoJSON`
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
    console.error("Error converting supply chain GeoJSON to MapData:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log("🚛 Supply Chain API route received request:", requestBody);

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

    // Prepare request for backend API - match the exact structure expected by backend
    const requestPayload = {
      message: requestBody.message,
    };

    console.log(`🚛 Calling backend supply-chain API with:`, {
      url: `${NEST_API_URL}/places/supply-chain`,
      message: requestPayload.message.substring(0, 100) + "...",
    });

    // Call backend API
    const backendResponse = await fetch(`${NEST_API_URL}/places/supply-chain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      // Add timeout and connection settings
      signal: AbortSignal.timeout(840000), // 840 second timeout
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

    console.log(`🚛 Backend response type: ${backendData.type}`);
    console.log(`🚛 Backend response success: ${backendData.success}`);
    if (backendData.data && typeof backendData.data === "object") {
      const data = backendData.data;
      if (data.mapData) {
        console.log(
          `🚛 MapData features count: ${data.mapData.features?.length || 0}`
        );
        console.log(`🚛 MapData center:`, data.mapData.center);
        console.log(
          `🚛 First 3 features:`,
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
    const mapData = extractSupplyChainMapData(backendData);

    // Extract structured analysis data
    let analysisData: SupplyChainAnalysis | undefined;
    let responseText = "";

    // Handle the analysis response structure from backend
    if (typeof backendData.data === "object" && backendData.data !== null) {
      const data = backendData.data as Record<string, unknown>;

      // Extract the structured analysis object
      if (data.analysis && typeof data.analysis === "object") {
        analysisData = data.analysis as SupplyChainAnalysis;
        console.log(
          "✅ Successfully extracted structured supply chain analysis data"
        );
      }

      // Try to extract text from data.text (primary source for supply chain analysis)
      if (typeof data.text === "string" && data.text.trim().length > 0) {
        responseText = data.text;

        // Check if text contains JSON + markdown structure
        if (
          responseText.includes('"analysis":') &&
          responseText.includes("---")
        ) {
          // Extract the markdown portion after the JSON and separator
          const markdownMatch = responseText.match(/---\s*\n\n([\s\S]+)$/);
          if (markdownMatch && markdownMatch[1]) {
            responseText = markdownMatch[1].trim();
            console.log(
              "✅ Extracted markdown analysis from combined response"
            );
          }

          // Also try to extract structured JSON analysis
          const jsonMatch = responseText.match(
            /\{\s*"analysis":\s*\{[\s\S]*?\}\s*\}/
          );
          if (jsonMatch && jsonMatch[0]) {
            try {
              const parsedData = JSON.parse(jsonMatch[0]);
              if (parsedData.analysis) {
                analysisData = {
                  distributionNetwork:
                    parsedData.analysis.key_metrics?.market_density,
                  warehouseOptimization:
                    parsedData.analysis.key_metrics?.facility_counts
                      ?.warehouses,
                  transportationRoutes:
                    parsedData.analysis.key_metrics?.competition_levels,
                  keyFindings: parsedData.analysis.recommendations || [],
                  challenges: parsedData.analysis.risks || [],
                  recommendations: parsedData.analysis.recommendations || [],
                  ...parsedData.analysis,
                } as SupplyChainAnalysis;
                console.log(
                  "✅ Successfully extracted structured supply chain analysis from JSON"
                );
              }
            } catch (parseError) {
              console.warn(
                "⚠️ Failed to parse embedded JSON analysis:",
                parseError
              );
            }
          }
        }

        console.log(
          "✅ Successfully extracted supply chain analysis text from backend (length:",
          responseText.length,
          ")"
        );
      } else {
        console.log("⚠️ data.text not found, checking for fallback data");

        // If no text but we have analysis data, create meaningful text
        if (analysisData) {
          responseText = createAnalysisTextFromStructuredData(analysisData);
          console.log(
            "✅ Created text from structured supply chain analysis data"
          );
        } else {
          responseText =
            "Supply chain and logistics analysis completed successfully. The analysis includes comprehensive distribution network assessment and optimization recommendations.";
          console.log("⚠️ Using enhanced fallback text");
        }
      }
    } else if (typeof backendData.data === "string") {
      responseText = backendData.data;
      console.log("✅ Used string data directly");
    } else {
      responseText =
        "Supply chain and logistics analysis completed successfully.";
      console.log("⚠️ Used default fallback");
    }

    const response: FrontendSupplyChainResponse = {
      success: true,
      type: ResponseType.ANALYSIS, // Convert backend "analysis" to our ResponseType.ANALYSIS
      response: responseText,
      mapData: mapData || undefined,
      analysis: analysisData,
      metadata: backendData.metadata,
      timestamp: new Date().toISOString(),
      originalBackendResponse: backendData,
    };

    if (mapData) {
      console.log(
        `✅ Supply chain query processed successfully with ${mapData.places.length} facilities mapped`
      );
    } else {
      console.log(
        `✅ Supply chain query processed successfully with comprehensive text analysis (no map data available)`
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Supply Chain API route error:", error);

    // Handle different types of errors
    let errorMessage = "Internal server error";
    let errorDetails = "Unknown error";

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        errorMessage = "Backend request timeout";
        errorDetails =
          "The backend service took too long to respond. Please try again or check if the backend is running.";
      } else if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED")
      ) {
        errorMessage = "Backend connection failed";
        errorDetails =
          "Unable to connect to the backend service. Please ensure the backend is running on the correct port.";
      } else {
        errorDetails = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        suggestion:
          "Please ensure the NestJS backend is running on port 4000 and the /places/supply-chain endpoint is available.",
      },
      { status: 500 }
    );
  }
}
