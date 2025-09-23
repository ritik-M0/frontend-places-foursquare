"use client";

import SupplyChainPanel from "@/components/SupplyChainPanel";
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
        businessType?:
          | "warehouse"
          | "distribution"
          | "transportation"
          | "logistics";
        neighborhood?: string;
        // Enhanced supply chain-specific properties
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
    events: unknown[];
    weather: unknown[];
    userLocation: Record<string, unknown>;
  };
  metadata?: {
    analysisType:
      | "business_location"
      | "general_search"
      | "real_estate"
      | "energy"
      | "supply_chain";
    neighborhoods?: Array<{
      name: string;
      description: string;
      competitors: number;
    }>;
  };
}

export default function SupplyChainAgentPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      // Set analysis type for supply chain
      const enhancedData = {
        ...data,
        metadata: {
          ...data.metadata,
          analysisType: "supply_chain" as const,
        },
      };
      setMapData(enhancedData);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-gray-50 flex">
      {/* Left Side - Supply Chain Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        <SupplyChainPanel onMapData={handleMapData} />
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>
    </div>
  );
}
