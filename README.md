# Retail & Real Estate Intelligence Platform

A Next.js frontend for the Retail and Real Estate Intelligence Assistant powered by Mastra agents and multiple AI tools.

## Production Setup

### Map Data Strategy

- **GeoJSON Only**: Maps display only real location data from the Map Orchestrator Agent
- **No Fallbacks**: No mock coordinates or text-based location approximations
- **Backend Dependent**: Map visualization requires proper GeoJSON FeatureCollection from backend
- **Real Coordinates**: All markers show actual latitude/longitude from API responses

### Data Flow

1. User asks for location-based analysis
2. TomTom Agent processes request and triggers Map Orchestrator Agent (when applicable)
3. Map Orchestrator Agent returns GeoJSON FeatureCollection with real coordinates
4. Frontend parses GeoJSON and displays interactive map
5. No map appears if backend doesn't provide GeoJSON data

## Features

- **🏢 Business Location Analysis**: AI-powered site selection and competitive analysis
- **🗺️ Interactive Mapping**: Mapbox integration with business intelligence overlays
- **🚶‍♂️ Foot Traffic Analysis**: Real-time foot traffic forecasting via BestTime.app
- **🎭 Event Impact**: Event analysis through PredictHQ for business planning
- **🌤️ Weather Intelligence**: Climate analysis for location-based decisions
- **💬 Real-time Chat**: Direct communication with AI agents

## Architecture

### Frontend (Next.js 15)

- **React 19** with TypeScript 5
- **Mapbox GL** for interactive mapping
- **Tailwind CSS 4** for modern styling
- **Server-Sent Events** for real-time communication

### Backend Integration

- **NestJS API** with Mastra agent orchestration
- **TomTom Agent**: Primary business intelligence assistant
- **Map Orchestrator Agent**: GeoJSON data processing
- **Multiple AI Tools**: POI search, foot traffic, events, weather

## Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Environment Setup:**

```bash
cp .env.local.example .env.local
# Fill in your environment variables:
# - NEST_API_URL: Your NestJS backend URL
# - NEXT_PUBLIC_MAPBOX_TOKEN: Your Mapbox access token
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Examples

- "Find the best location for opening a luxury gym in Miami"
- "Analyze foot traffic patterns for coffee shops in downtown Seattle"
- "Show me competitor analysis for restaurants in Times Square"
- "Map business opportunities in the tech district"

## Backend Requirements

This frontend requires the NestJS backend with Mastra agents running. The backend should include:

- TomTom Agent with business intelligence tools
- Map Orchestrator Agent for GeoJSON processing
- Streaming endpoints at `/places/chat`

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Mapping**: Mapbox GL JS, react-map-gl
- **Backend**: NestJS + Mastra Agents
- **AI Tools**: TomTom API, BestTime.app, PredictHQ, Weather APIs
