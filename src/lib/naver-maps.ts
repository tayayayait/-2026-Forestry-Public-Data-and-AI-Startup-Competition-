const NAVER_MAPS_SCRIPT_ID = "naver-maps-sdk";
const NAVER_MAPS_SCRIPT_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";

export type NaverMapsScriptOptions = {
  clientId: string;
  submodules?: string[];
};

export type NaverMapsLoaderOptions = {
  documentRef?: Document;
  windowRef?: Window & typeof globalThis;
  submodules?: string[];
};

export type NaverMapsNamespace = {
  Map: new (element: HTMLElement, options?: Record<string, unknown>) => NaverMapInstance;
  LatLng: new (lat: number, lng: number) => unknown;
  LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
  Marker: new (options: Record<string, unknown>) => NaverOverlayInstance;
  Polyline: new (options: Record<string, unknown>) => NaverOverlayInstance;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Event: {
    addListener: (
      target: unknown,
      eventName: string,
      listener: (...args: unknown[]) => void,
    ) => unknown;
  };
  MapTypeId?: {
    NORMAL?: string;
  };
};

export type NaverMapInstance = {
  fitBounds?: (bounds: unknown) => void;
  setCenter?: (center: unknown) => void;
  setZoom?: (zoom: number) => void;
  getBounds?: () => any;
  getZoom?: () => number;
  morph?: (coord: unknown, zoom?: number, transitionOptions?: unknown) => void;
  destroy?: () => void;
};

export type NaverOverlayInstance = {
  setMap?: (map: NaverMapInstance | null) => void;
};

declare global {
  interface Window {
    naver?: {
      maps?: NaverMapsNamespace;
    };
  }
}

let naverMapsScriptPromise: Promise<NaverMapsNamespace> | undefined;

function cleanConfigValue(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function validateNaverMapsNamespace(maps: NaverMapsNamespace | undefined): NaverMapsNamespace {
  if (!maps) {
    throw new Error("NAVER Maps SDK loaded without the maps namespace.");
  }

  try {
    void new maps.LatLng(37.5665, 126.978);
  } catch {
    throw new Error("NAVER Maps SDK is unavailable or unauthorized for this domain.");
  }

  return maps;
}

export function buildNaverMapsScriptUrl({
  clientId,
  submodules = [],
}: NaverMapsScriptOptions): URL {
  const url = new URL(NAVER_MAPS_SCRIPT_URL);
  url.searchParams.set("ncpKeyId", cleanConfigValue(clientId));
  if (submodules.length > 0) {
    url.searchParams.set("submodules", submodules.join(","));
  }
  return url;
}

export function readNaverMapsClientId(
  env: Record<string, string | undefined> = import.meta.env,
): string {
  return cleanConfigValue(env.VITE_NAVER_MAPS_CLIENT_ID ?? env.NAVER_MAPS_CLIENT_ID);
}

export function resetNaverMapsLoaderForTests(): void {
  naverMapsScriptPromise = undefined;
}

export function loadNaverMapsScript(
  clientId: string,
  {
    documentRef = globalThis.document,
    windowRef = globalThis.window,
    submodules = [],
  }: NaverMapsLoaderOptions = {},
): Promise<NaverMapsNamespace> {
  const cleanClientId = cleanConfigValue(clientId);
  if (!cleanClientId) {
    return Promise.reject(new Error("NAVER Maps Client ID is not configured."));
  }

  if (windowRef.naver?.maps) {
    try {
      return Promise.resolve(validateNaverMapsNamespace(windowRef.naver.maps));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  if (naverMapsScriptPromise) {
    return naverMapsScriptPromise;
  }

  naverMapsScriptPromise = new Promise<NaverMapsNamespace>((resolve, reject) => {
    const existing = documentRef.getElementById?.(NAVER_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? documentRef.createElement("script");

    script.id = NAVER_MAPS_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src = buildNaverMapsScriptUrl({
      clientId: cleanClientId,
      submodules,
    }).toString();

    script.onload = () => {
      try {
        resolve(validateNaverMapsNamespace(windowRef.naver?.maps));
      } catch (error) {
        naverMapsScriptPromise = undefined;
        reject(error);
      }
    };
    script.onerror = () => {
      naverMapsScriptPromise = undefined;
      reject(new Error("Failed to load NAVER Maps SDK."));
    };

    if (!existing) {
      documentRef.head.appendChild(script);
    }
  });

  return naverMapsScriptPromise;
}
