"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.module.css";
import { useEffect, useState } from "react";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface Place {
  id: string;
  type: string;
  coordinates: [number, number];
  properties: {
    name: string;
    address: string;
    category: string;
    relevance?: number;
  };
}

interface MapData {
  center: { lat: number; lng: number };
  bounds?: { north: number; south: number; east: number; west: number };
  layers: {
    places: Place[];
    events?: unknown[];
    weather?: unknown[];
    userLocation?: unknown;
  };
}

interface SideMapViewProps {
  mapData: MapData | null;
}

// Component to fit bounds when map data changes
function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length > 0) {
      const group = new L.featureGroup(
        places.map((place) =>
          L.marker([place.coordinates[1], place.coordinates[0]])
        )
      );
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  }, [map, places]);

  return null;
}

// Custom zoom controls component
function CustomZoomControls() {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all text-sm"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all text-sm"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>
    </div>
  );
}

export default function SideMapView({ mapData }: SideMapViewProps) {
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">(
    "satellite"
  );

  if (!mapData) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm">Map will appear here</p>
          <p className="text-xs text-gray-400 mt-1">
            Ask for locations to see them on the map
          </p>
        </div>
      </div>
    );
  }

  // Enhanced marker icon with drop shadow
  const placeIcon = new L.DivIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
      ">
        <div style="
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(1px);
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  // Map style configurations
  const mapStyles = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  };

  const placesWithCoords = mapData.layers.places.map((place) => ({
    lat: place.coordinates[1],
    lng: place.coordinates[0],
    ...place,
  }));

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Map</h3>
            <p className="text-xs text-gray-500">
              {mapData.layers.places.length} places
            </p>
          </div>
        </div>

        {/* Map Style Switcher */}
        <div className="flex bg-gray-100 rounded p-0.5">
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              mapStyle === "satellite"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle("streets")}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              mapStyle === "streets"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Streets
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[mapData.center.lat, mapData.center.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          className="z-10"
          zoomControl={false}
        >
          {/* Custom zoom controls */}
          <CustomZoomControls />

          {/* High-quality tile layer */}
          <TileLayer
            attribution={mapStyles[mapStyle].attribution}
            url={mapStyles[mapStyle].url}
            maxZoom={19}
            tileSize={256}
          />

          {/* Street labels overlay for satellite view */}
          {mapStyle === "satellite" && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution=""
              opacity={0.8}
            />
          )}

          {/* Auto-fit bounds */}
          <FitBounds places={mapData.layers.places} />

          {/* Enhanced markers */}
          {placesWithCoords.map((place, index) => (
            <Marker
              key={`place-${index}`}
              position={[place.lat, place.lng]}
              icon={placeIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    {place.properties.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <svg
                        className="w-3 h-3 mr-1 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {place.properties.category}
                    </div>
                    <div className="flex items-start text-xs text-gray-600">
                      <svg
                        className="w-3 h-3 mr-1 mt-0.5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="leading-relaxed">
                        {place.properties.address}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
