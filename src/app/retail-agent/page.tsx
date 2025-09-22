"use client";

import RetailPanel from "@/components/RetailPanel";
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
        // Enhanced retail-specific properties
        retail_score?: number;
        foot_traffic?: string;
        market_potential?: number;
        competition_density?: number;
        demographics_match?: number;
        accessibility_score?: number;
        parking_availability?: string;
        rent_estimate?: string;
      };
    }>;
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
  metadata?: {
    analysisType: "business_location" | "general_search";
    neighborhoods?: Array<{
      name: string;
      description: string;
      competitors: number;
    }>;
  };
}

export default function RetailAgentPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      setMapData(data);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Retail Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        <RetailPanel onMapData={handleMapData} />
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>
    </div>
  );
}
