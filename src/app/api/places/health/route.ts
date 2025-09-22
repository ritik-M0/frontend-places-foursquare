import { NextResponse } from "next/server";

// Types matching the NestJS backend DTO
interface HealthResponseDto {
  status: string;
  timestamp: string;
}

interface FrontendHealthResponse extends HealthResponseDto {
  version?: string;
  backend?: {
    url: string;
    reachable: boolean;
    response?: HealthResponseDto;
    error?: string;
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    // Use the actual NestJS backend URL
    const NEST_API_URL =
      process.env.NEST_API_URL || "http://localhost:4000/api";
    const healthUrl = `${NEST_API_URL}/places/health`;

    const backendStatus = {
      url: healthUrl,
      reachable: false,
      response: undefined as HealthResponseDto | undefined,
      error: undefined as string | undefined,
    };

    // Try to ping the NestJS backend health endpoint
    try {
      console.log(`Checking backend health at: ${healthUrl}`);

      const backendResponse = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Set a timeout for the health check
        signal: AbortSignal.timeout(5000),
      });

      if (backendResponse.ok) {
        const backendData: HealthResponseDto = await backendResponse.json();
        backendStatus.reachable = true;
        backendStatus.response = backendData;
        console.log("✅ Backend health check successful:", backendData);
      } else {
        const errorText = await backendResponse.text();
        backendStatus.reachable = false;
        backendStatus.error = `HTTP ${backendResponse.status}: ${errorText}`;
        console.warn("⚠️ Backend health check failed:", backendStatus.error);
      }
    } catch (error) {
      backendStatus.reachable = false;
      backendStatus.error =
        error instanceof Error ? error.message : "Unknown error";
      console.warn("❌ Backend health check error:", backendStatus.error);
    }

    // Frontend is healthy if it can respond, backend status is additional info
    const response: FrontendHealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      backend: backendStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Frontend health check error:", error);

    const response: FrontendHealthResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      backend: {
        url: "unknown",
        reachable: false,
        error: "Frontend health check failed",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Support OPTIONS for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
