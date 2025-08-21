"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  ViewState,
  MapRef,
  MarkerEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

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

interface MapboxMapViewProps {
  mapData: MapData | null;
}

// Custom marker component
function CustomMarker() {
  return (
    <div
      style={{
        position: "relative",
        width: "24px",
        height: "24px",
        cursor: "pointer",
      }}
    >
      {/* Drop shadow */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: "2px",
          width: "20px",
          height: "20px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "50%",
          filter: "blur(1px)",
        }}
      />
      {/* Main marker */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "20px",
          height: "20px",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          border: "2px solid white",
          borderRadius: "50%",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            background: "white",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}

export default function MapboxMapView({ mapData }: MapboxMapViewProps) {
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">(
    "satellite"
  );
  const [popupInfo, setPopupInfo] = useState<Place | null>(null);
  const mapRef = useRef<MapRef>(null);

  // Debug: Log when mapData changes
  useEffect(() => {
    console.log("MapboxMapView: Received mapData:", mapData);
  }, [mapData]);

  // Initial view state - will be updated when mapData is available
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -74.5, // Default to New York until real data comes
    latitude: 40,
    zoom: 14,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  // Update view state when mapData changes
  useEffect(() => {
    if (mapData && mapData.layers.places.length > 0) {
      const places = mapData.layers.places;

      // Calculate bounds for all places
      const lngs = places.map((place) => place.coordinates[0]);
      const lats = places.map((place) => place.coordinates[1]);

      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      console.log("MapboxMapView: Updating map view with new data", {
        center: mapData.center,
        places: places.length,
        bounds: { minLng, maxLng, minLat, maxLat },
      });

      // Update view state to center
      setViewState({
        longitude: mapData.center.lng,
        latitude: mapData.center.lat,
        zoom: 14,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      // Fit bounds to show all places after a short delay to ensure map is ready
      setTimeout(() => {
        if (mapRef.current) {
          console.log("MapboxMapView: Fitting bounds to show all places");
          mapRef.current.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            {
              padding: 40,
              duration: 1000,
            }
          );
        }
      }, 500);
    }
  }, [mapData]);

  // Map style configurations
  const mapStyles = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    streets: "mapbox://styles/mapbox/streets-v12",
  };

  const onMapClick = useCallback(() => {
    setPopupInfo(null);
  }, []);

  const onMarkerClick = useCallback((place: Place) => {
    setPopupInfo(place);
  }, []);

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

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between z-10">
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
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: { viewState: ViewState }) =>
            setViewState(evt.viewState)
          }
          onClick={onMapClick}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyles[mapStyle]}
          attributionControl={false}
          logoPosition="bottom-left"
        >
          {/* Navigation Controls */}
          <NavigationControl position="top-right" showCompass={false} />
          <FullscreenControl position="top-right" />
          <ScaleControl position="bottom-right" />

          {/* Place Markers */}
          {mapData.layers.places.map((place, index) => (
            <Marker
              key={`marker-${index}`}
              longitude={place.coordinates[0]}
              latitude={place.coordinates[1]}
              anchor="center"
              onClick={(e: MarkerEvent<MouseEvent>) => {
                e.originalEvent?.stopPropagation();
                onMarkerClick(place);
              }}
            >
              <CustomMarker />
            </Marker>
          ))}

          {/* Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.coordinates[0]}
              latitude={popupInfo.coordinates[1]}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              className="mapbox-popup"
            >
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-gray-900 text-sm mb-2">
                  {popupInfo.properties.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-600">
                    <svg
                      className="w-3 h-3 mr-2 text-blue-500 flex-shrink-0"
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
                    <span>{popupInfo.properties.category}</span>
                  </div>
                  <div className="flex items-start text-xs text-gray-600">
                    <svg
                      className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0"
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
                      {popupInfo.properties.address}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
