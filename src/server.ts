import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleAirQualityApiRequest } from "./lib/air-quality-api-route";
import { handleBarrierFreeTourismApiRequest } from "./lib/barrier-free-tourism-api-route";
import { handleForestEducationProgramsApiRequest } from "./lib/forest-education-api-route";
import {
  handleForestPlantImagesApiRequest,
  handleForestPlantsApiRequest,
} from "./lib/forest-plants-api-route";
import { handlePlantRecognitionApiRequest } from "./lib/plant-recognition-api-route";
import { handleRecommendationApiRequest } from "./lib/gemini-recommendation-api-route";
import { handleHealingForestsApiRequest } from "./lib/healing-forest-api-route";
import { handleKidsForestFacilitiesApiRequest } from "./lib/kids-forest-api-route";
import { handleNaverDirectionApiRequest } from "./lib/naver-direction-api-route";
import { handleNaverGeocodeApiRequest } from "./lib/naver-geocoding-api-route";
import { handleTraditionalVillageForestsApiRequest } from "./lib/traditional-village-forest-api-route";
import { handleRecreationForestsApiRequest } from "./lib/recreation-forest-api-route";
import { handleTourismApiRequest } from "./lib/tourapi-api-route";
import {
  handleTourDetailApiRequest,
  handleTourSearchApiRequest,
} from "./lib/tourapi-detail-api-route";
import { handleGeminiImageCurationApiRequest } from "./lib/gemini-image-curation-api-route";
import { handleFacilityHomepageAnalysisApiRequest } from "./lib/facility-homepage-analysis-api-route";
import { handleNaverImageApiRequest } from "./lib/naver-image-api-route";
import { handleWeatherApiRequest } from "./lib/weather-api-route";
import { handleUvIndexApiRequest } from "./lib/uv-index-api-route";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/weather") {
        return await handleWeatherApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/uv-index") {
        return await handleUvIndexApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/air-quality") {
        return await handleAirQualityApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/forest-education-programs") {
        return await handleForestEducationProgramsApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/recreation-forests") {
        return await handleRecreationForestsApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/tourism") {
        return await handleTourismApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/recommendation") {
        return await handleRecommendationApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/tour-detail") {
        return await handleTourDetailApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/tour-search") {
        return await handleTourSearchApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/naver-images") {
        return await handleNaverImageApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/facility-image-curation") {
        return await handleGeminiImageCurationApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/facility-homepage-analysis") {
        return await handleFacilityHomepageAnalysisApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/barrier-free-tourism") {
        return await handleBarrierFreeTourismApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/healing-forests") {
        return await handleHealingForestsApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/kids-forests") {
        return await handleKidsForestFacilitiesApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/naver-direction") {
        return await handleNaverDirectionApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/forest-plants") {
        return await handleForestPlantsApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/forest-plant-images") {
        return await handleForestPlantImagesApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/geocode") {
        return await handleNaverGeocodeApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/traditional-village-forests") {
        return await handleTraditionalVillageForestsApiRequest(request, env, fetch);
      }
      if (url.pathname === "/api/plant-recognition") {
        return await handlePlantRecognitionApiRequest(request, env, fetch);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
