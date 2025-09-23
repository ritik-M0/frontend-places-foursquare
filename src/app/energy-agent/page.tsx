"use client";

import EnergyPanel from "@/components/EnergyPanel";
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
        businessType?: "infrastructure" | "renewable" | "facility";
        neighborhood?: string;
        // Enhanced energy-specific properties
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
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
  metadata?: {
    analysisType:
      | "business_location"
      | "general_search"
      | "real_estate"
      | "energy";
    neighborhoods?: Array<{
      name: string;
      description: string;
      competitors: number;
    }>;
  };
}

export default function EnergyAgentPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      // Set analysis type for energy
      const enhancedData = {
        ...data,
        metadata: {
          ...data.metadata,
          analysisType: "energy" as const,
        },
      };
      setMapData(enhancedData);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-50 flex">
      {/* Left Side - Energy Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        <EnergyPanel onMapData={handleMapData} />
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>
    </div>
  );
}
