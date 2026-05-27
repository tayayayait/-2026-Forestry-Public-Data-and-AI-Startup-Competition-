import type { AsyncStatus, LocationPermission, UserLocation } from "@/types";

type AutoLocationInput = {
  coords: UserLocation["coords"];
  status: AsyncStatus;
  permission: LocationPermission;
};

export function shouldAutoRequestLocation({
  coords,
  status,
  permission,
}: AutoLocationInput): boolean {
  return !coords && status === "idle" && permission === "prompt";
}
