"use client";

import ChatPanel from "@/components/ChatPanel";
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
}

export default function HomePage() {
  const [mapData, setMapData] = useState<MapData | null>(null);

  const handleMapData = (data: MapData | undefined) => {
    if (data) {
      setMapData(data);
    }
  };

  // Test function to manually show map
  const showTestMap = () => {
    const testData = {
      center: { lat: 28.4595, lng: 77.0266 },
      bounds: { north: 28.47, south: 28.45, east: 77.03, west: 77.02 },
      layers: {
        places: [
          {
            id: "test-1",
            type: "place",
            coordinates: [77.026578, 28.459557] as [number, number],
            properties: {
              name: "Blue Tokai Coffee Roasters",
              address: "Sadar Bazar Road, Jacobpura, Sector 12, Gurugram",
              category: "Fast Food, Restaurant",
              relevance: 1.0,
            },
          },
          {
            id: "test-2",
            type: "place",
            coordinates: [77.02657, 28.45939] as [number, number],
            properties: {
              name: "Barbeque Nation",
              address: "Sadar Bazar Road, Roshanpura, Gurugram",
              category: "Barbecue, Restaurant",
              relevance: 1.0,
            },
          },
        ],
        events: [],
        weather: [],
        userLocation: {},
      },
    };
    console.log("HomePage: Setting test map data:", testData);
    setMapData(testData);
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Chat Panel */}
      <div className="w-1/2 bg-slate-900 flex flex-col">
        <ChatPanel onMapData={handleMapData} />
      </div>

      {/* Right Side - Map */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <MapboxMapView mapData={mapData} />
      </div>

      {/* Test button for map - positioned over chat panel */}
      <button
        onClick={showTestMap}
        className="fixed top-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors z-40"
      >
        Test Map
      </button>
    </div>
  );
}
