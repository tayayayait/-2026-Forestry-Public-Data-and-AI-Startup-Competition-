import type { FacilityInfo } from "@/types";

export type LatLng = {
  lat: number;
  lng: number;
};

type NearbyFacilityOptions = {
  limit?: number;
};

function isValidLatLng(point: LatLng | null | undefined): point is LatLng {
  return (
    typeof point?.lat === "number" &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(a: LatLng, b: LatLng): number {
  const earthRadiusKm = 6371.0088;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function estimateTravelMinutes(distanceKmValue: number): number {
  const averageRoadSpeedKmH = 45;
  const accessBufferMinutes = 10;
  return Math.max(
    5,
    Math.round((distanceKmValue / averageRoadSpeedKmH) * 60 + accessBufferMinutes),
  );
}

export function getNearbyFacilities(
  facilities: FacilityInfo[],
  userLocation: LatLng | null,
  { limit = facilities.length }: NearbyFacilityOptions = {},
): FacilityInfo[] {
  if (!isValidLatLng(userLocation)) {
    return facilities.slice(0, limit);
  }

  return facilities
    .filter(isValidLatLng)
    .map((facility) => ({
      facility,
      distanceKm: distanceKm(userLocation, facility),
    }))
    .sort(
      (left, right) =>
        left.distanceKm - right.distanceKm || left.facility.name.localeCompare(right.facility.name),
    )
    .slice(0, limit)
    .map((item) => item.facility);
}

export function withFacilityTravelEstimates(
  facilities: FacilityInfo[],
  userLocation: LatLng | null | undefined,
): FacilityInfo[] {
  if (!isValidLatLng(userLocation)) return facilities;

  return facilities.map((facility) => {
    if (!isValidLatLng(facility)) return facility;
    return {
      ...facility,
      distanceMinutes: estimateTravelMinutes(distanceKm(userLocation, facility)),
    };
  });
}
