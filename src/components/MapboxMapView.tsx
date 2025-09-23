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
    businessType?:
      | "recommendation"
      | "competitor"
      | "infrastructure"
      | "renewable"
      | "facility"
      | "warehouse"
      | "distribution"
      | "transportation"
      | "logistics";
    neighborhood?: string;
    footTraffic?: string;
    rawFootTraffic?: {
      average_dwell_time?: number;
      peak_hours?: Array<{
        day: string;
        peak_start: number;
        peak_end: number;
        peak_intensity: number;
      }>;
    };
    // Enhanced retail-specific properties
    retail_score?: number;
    foot_traffic?: string;
    market_potential?: number;
    competition_density?: number;
    demographics_match?: number;
    accessibility_score?: number;
    parking_availability?: string;
    rent_estimate?: string;
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
    // Enhanced supply chain-specific properties
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

interface MapboxMapViewProps {
  mapData: MapData | null;
}

// Enhanced marker component with business type support
function CustomMarker({
  businessType = "competitor",
  analysisType,
}: {
  businessType?:
    | "recommendation"
    | "competitor"
    | "infrastructure"
    | "renewable"
    | "facility"
    | "warehouse"
    | "distribution"
    | "transportation"
    | "logistics";
  analysisType?:
    | "business_location"
    | "general_search"
    | "real_estate"
    | "energy"
    | "supply_chain";
}) {
  const isRecommendation = businessType === "recommendation";
  const isRealEstate = analysisType === "real_estate";
  const isEnergy = analysisType === "energy";
  const isSupplyChain = analysisType === "supply_chain";

  return (
    <div
      style={{
        position: "relative",
        width: "28px",
        height: "28px",
        cursor: "pointer",
      }}
    >
      {/* Drop shadow */}
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: "3px",
          width: "22px",
          height: "22px",
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
          width: "22px",
          height: "22px",
          background: isSupplyChain
            ? businessType === "warehouse"
              ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" // Purple for warehouses
              : businessType === "distribution"
              ? "linear-gradient(135deg, #06b6d4, #0891b2)" // Cyan for distribution
              : businessType === "transportation"
              ? "linear-gradient(135deg, #f59e0b, #d97706)" // Orange for transportation
              : "linear-gradient(135deg, #ef4444, #dc2626)" // Red for logistics
            : isEnergy
            ? businessType === "renewable"
              ? "linear-gradient(135deg, #22c55e, #16a34a)" // Green for renewable
              : businessType === "infrastructure"
              ? "linear-gradient(135deg, #eab308, #ca8a04)" // Yellow for infrastructure
              : "linear-gradient(135deg, #3b82f6, #1d4ed8)" // Blue for facilities
            : isRealEstate
            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" // Blue for real estate
            : isRecommendation
            ? "linear-gradient(135deg, #22c55e, #16a34a)" // Green for recommendations
            : "linear-gradient(135deg, #f59e0b, #d97706)", // Orange for competitors
          border: "2px solid white",
          borderRadius: "50%",
          boxShadow: isSupplyChain
            ? businessType === "warehouse"
              ? "0 3px 8px rgba(139, 92, 246, 0.4)" // Purple shadow
              : businessType === "distribution"
              ? "0 3px 8px rgba(6, 182, 212, 0.4)" // Cyan shadow
              : businessType === "transportation"
              ? "0 3px 8px rgba(245, 158, 11, 0.4)" // Orange shadow
              : "0 3px 8px rgba(239, 68, 68, 0.4)" // Red shadow
            : isEnergy
            ? businessType === "renewable"
              ? "0 3px 8px rgba(34, 197, 94, 0.4)"
              : businessType === "infrastructure"
              ? "0 3px 8px rgba(234, 179, 8, 0.4)"
              : "0 3px 8px rgba(59, 130, 246, 0.4)"
            : isRealEstate
            ? "0 3px 8px rgba(59, 130, 246, 0.4)"
            : isRecommendation
            ? "0 3px 8px rgba(34, 197, 94, 0.4)"
            : "0 3px 8px rgba(245, 158, 11, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isSupplyChain ? (
          // Supply chain icons based on business type
          businessType === "warehouse" ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M3 21h18v-2H3v2zm2-8h2v-2H5v2zm4 0h2v-2H9v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM5 9h2V7H5v2zm4 0h2V7H9v2zm4 0h2V7h-2v2zm4 0h2V7h-2v2zM12 3L2 9v2h20V9l-10-6z" />
            </svg>
          ) : businessType === "distribution" ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
            </svg>
          ) : businessType === "transportation" ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M18 18.5a1.5 1.5 0 0 1-3 0V17h3v1.5zM19.5 9.5h-1V8h-15v1.5h-1c-.8 0-1.5.7-1.5 1.5v7c0 .6.4 1 1 1h.5v1.5a1.5 1.5 0 0 0 3 0V19h11v1.5a1.5 1.5 0 0 0 3 0V19h.5c.6 0 1-.4 1-1v-7c0-.8-.7-1.5-1.5-1.5zM6 18.5a1.5 1.5 0 0 1-3 0V17h3v1.5z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          )
        ) : isEnergy ? (
          // Energy icons based on facility type
          businessType === "renewable" ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          ) : businessType === "infrastructure" ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )
        ) : isRealEstate ? (
          // House icon for real estate
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        ) : isRecommendation ? (
          // Star icon for recommendations
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ) : (
          // Building/competitor icon
          <div
            style={{
              width: "8px",
              height: "8px",
              background: "white",
              borderRadius: "2px",
            }}
          />
        )}
      </div>

      {/* Business type indicator */}
      {isRecommendation && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "12px",
            height: "12px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            borderRadius: "50%",
            border: "1px solid white",
            fontSize: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          !
        </div>
      )}
    </div>
  );
}

export default function MapboxMapView({ mapData }: MapboxMapViewProps) {
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">(
    "satellite"
  );
  const [popupInfo, setPopupInfo] = useState<Place | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showCompetitors, setShowCompetitors] = useState(true);
  const mapRef = useRef<MapRef>(null);

  // Debug: Log when mapData changes
  useEffect(() => {
    console.log("MapboxMapView: Received mapData:", mapData);
    if (mapData) {
      console.log(
        "🗺️ MapboxMapView: Places count:",
        mapData.layers.places.length
      );
      console.log(
        "🗺️ MapboxMapView: Analysis type:",
        mapData.metadata?.analysisType
      );
      console.log(
        "🗺️ MapboxMapView: First 3 places coordinates:",
        mapData.layers.places.slice(0, 3).map((p) => ({
          name: p.properties.name,
          coordinates: p.coordinates,
        }))
      );
    }
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
          <p className="text-sm">Interactive map will appear here</p>
          <p className="text-xs text-gray-400 mt-1">
            Maps display when the backend provides location data with
            coordinates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 p-3 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                mapData.metadata?.analysisType === "business_location"
                  ? "bg-green-500"
                  : mapData.metadata?.analysisType === "real_estate"
                  ? "bg-indigo-500"
                  : "bg-blue-500"
              }`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mapData.metadata?.analysisType === "business_location" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                ) : mapData.metadata?.analysisType === "real_estate" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                )}
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">
                {mapData.metadata?.analysisType === "business_location"
                  ? "Retail Intelligence Analysis"
                  : mapData.metadata?.analysisType === "real_estate"
                  ? "Real Estate Investment Analysis"
                  : "Location Map"}
              </h3>
              <p className="text-xs text-gray-500">
                {mapData.layers.places.length} locations
                {mapData.metadata?.neighborhoods &&
                  ` • ${mapData.metadata.neighborhoods.length} neighborhoods`}
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

        {/* Business Analysis Filters */}
        {mapData.metadata?.analysisType === "business_location" && (
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCompetitors(!showCompetitors)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  showCompetitors
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <span>Competitors</span>
              </button>
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  showRecommendations
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                <span>Opportunities</span>
              </button>
            </div>

            {mapData.metadata.neighborhoods && (
              <div className="text-xs text-gray-500 ml-auto">
                Analysis:{" "}
                {mapData.metadata.neighborhoods.map((n) => n.name).join(", ")}
              </div>
            )}
          </div>
        )}
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

          {/* Place Markers with Business Type Support */}
          {mapData.layers.places
            .filter((place) => {
              if (mapData.metadata?.analysisType === "business_location") {
                const businessType =
                  place.properties.businessType || "competitor";
                if (businessType === "recommendation" && !showRecommendations)
                  return false;
                if (businessType === "competitor" && !showCompetitors)
                  return false;
              }
              return true;
            })
            .map((place, index) => (
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
                <CustomMarker
                  businessType={place.properties.businessType}
                  analysisType={mapData.metadata?.analysisType}
                />
              </Marker>
            ))}

          {/* Enhanced Popup for Business Analysis */}
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
              <div className="p-3 min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {popupInfo.properties.name}
                  </h3>
                  {popupInfo.properties.businessType && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        popupInfo.properties.businessType === "recommendation"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {popupInfo.properties.businessType === "recommendation"
                        ? "Opportunity"
                        : "Competitor"}
                    </span>
                  )}
                </div>

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

                  {/* Business Analysis Info */}
                  {popupInfo.properties.neighborhood && (
                    <div className="flex items-center text-xs text-gray-600">
                      <svg
                        className="w-3 h-3 mr-2 text-purple-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>{popupInfo.properties.neighborhood}</span>
                    </div>
                  )}

                  {/* Retail-specific Properties */}
                  {popupInfo.properties.retail_score && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-emerald-500 mr-2">⭐</span>
                      <span>
                        Retail Score: {popupInfo.properties.retail_score}/10
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.market_potential && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-blue-500 mr-2">📈</span>
                      <span>
                        Market Potential:{" "}
                        {popupInfo.properties.market_potential}/10
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.foot_traffic && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-indigo-500 mr-2">🚶</span>
                      <span>
                        Foot Traffic: {popupInfo.properties.foot_traffic}
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.competition_density && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-orange-500 mr-2">🏢</span>
                      <span>
                        Competition: {popupInfo.properties.competition_density}
                        /10
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.accessibility_score && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-green-500 mr-2">🚇</span>
                      <span>
                        Accessibility:{" "}
                        {popupInfo.properties.accessibility_score}/10
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.rent_estimate && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-yellow-500 mr-2">💰</span>
                      <span>
                        Est. Rent: {popupInfo.properties.rent_estimate}
                      </span>
                    </div>
                  )}

                  {/* Real Estate-specific Properties */}
                  {popupInfo.properties.property_type && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-indigo-500 mr-2">🏠</span>
                      <span>Type: {popupInfo.properties.property_type}</span>
                    </div>
                  )}

                  {popupInfo.properties.price_range && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-green-500 mr-2">💵</span>
                      <span>Price: {popupInfo.properties.price_range}</span>
                    </div>
                  )}

                  {popupInfo.properties.investment_potential && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-blue-500 mr-2">📊</span>
                      <span>
                        Investment Score:{" "}
                        {popupInfo.properties.investment_potential}/10
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.cap_rate && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-purple-500 mr-2">📈</span>
                      <span>Cap Rate: {popupInfo.properties.cap_rate}%</span>
                    </div>
                  )}

                  {popupInfo.properties.roi_estimate && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-emerald-500 mr-2">📊</span>
                      <span>ROI: {popupInfo.properties.roi_estimate}</span>
                    </div>
                  )}

                  {popupInfo.properties.rental_yield && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-teal-500 mr-2">🏘️</span>
                      <span>
                        Rental Yield: {popupInfo.properties.rental_yield}%
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.zoning && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-gray-500 mr-2">📋</span>
                      <span>Zoning: {popupInfo.properties.zoning}</span>
                    </div>
                  )}

                  {popupInfo.properties.school_district && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-orange-500 mr-2">🎓</span>
                      <span>
                        School District: {popupInfo.properties.school_district}
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.transit_access && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="text-blue-500 mr-2">🚇</span>
                      <span>
                        Transit: {popupInfo.properties.transit_access}
                      </span>
                    </div>
                  )}

                  {popupInfo.properties.footTraffic && (
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center mb-1">
                        <svg
                          className="w-3 h-3 mr-2 text-indigo-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="font-medium">Foot Traffic</span>
                      </div>
                      <div className="ml-5">
                        <div>{popupInfo.properties.footTraffic}</div>
                        {popupInfo.properties.rawFootTraffic?.peak_hours &&
                          popupInfo.properties.rawFootTraffic.peak_hours
                            .length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              <div className="font-medium">
                                Peak Hours Today:
                              </div>
                              {popupInfo.properties.rawFootTraffic.peak_hours
                                .slice(0, 2)
                                .map((peak, idx) => (
                                  <div key={idx} className="text-xs">
                                    {peak.day}: {peak.peak_start}:00-
                                    {peak.peak_end}:00 (Level{" "}
                                    {peak.peak_intensity})
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
