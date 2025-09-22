"use client";

import RealEstatePanel from "@/components/RealEstatePanel";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import MapboxMapView (no SSR needed for Mapbox)
const MapboxMapView = dynamic(() => import("@/components/MapboxMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface MapData {
  center: { lat: number; lng: number };
  bounds?: { north: number; south: number; east: number; west: number };
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
    }>;
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
  metadata?: {
    analysisType: "business_location" | "general_search" | "real_estate";
    neighborhoods?: Array<{
      name: string;
      description: string;
      competitors: number;
    }>;
  };
}

export default function RealEstateAgentPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      // Set analysis type for real estate
      const enhancedData = {
        ...data,
        metadata: {
          ...data.metadata,
          analysisType: "real_estate" as const,
        },
      };
      setMapData(enhancedData);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-50 flex">
      {/* Left Side - Real Estate Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        <RealEstatePanel onMapData={handleMapData} />
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>
    </div>
  );
}
