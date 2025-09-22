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
    businessType?: "recommendation" | "competitor";
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
    analysisType: "business_location" | "general_search" | "real_estate";
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
  businessType?: "recommendation" | "competitor";
  analysisType?: "business_location" | "general_search" | "real_estate";
}) {
  const isRecommendation = businessType === "recommendation";
  const isRealEstate = analysisType === "real_estate";

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
          background: isRealEstate
            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" // Blue for real estate
            : isRecommendation
            ? "linear-gradient(135deg, #22c55e, #16a34a)" // Green for recommendations
            : "linear-gradient(135deg, #f59e0b, #d97706)", // Orange for competitors
          border: "2px solid white",
          borderRadius: "50%",
          boxShadow: isRealEstate
            ? "0 3px 8px rgba(59, 130, 246, 0.4)"
            : isRecommendation
            ? "0 3px 8px rgba(34, 197, 94, 0.4)"
            : "0 3px 8px rgba(245, 158, 11, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isRealEstate ? (
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
