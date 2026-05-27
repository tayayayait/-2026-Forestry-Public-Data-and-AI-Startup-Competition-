import * as React from "react";
import { useAppStore } from "@/stores/appStore";
import type { LocationPermission } from "@/types";

const GEOLOCATION_PERMISSION_DENIED = 1;

export function getGeolocationFailurePermission(
  error: Pick<GeolocationPositionError, "code">,
): LocationPermission {
  return error.code === GEOLOCATION_PERMISSION_DENIED ? "denied" : "prompt";
}

export function useGeolocation() {
  const setLocation = useAppStore((s) => s.setLocation);
  const setLocationPermission = useAppStore((s) => s.setLocationPermission);
  const setLocationStatus = useAppStore((s) => s.setLocationStatus);

  const requestLocation = React.useCallback(() => {
    setLocationStatus("loading");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationPermission("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission("granted");
        setLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          "현재 위치", // 추후 리버스 지오코딩으로 실제 주소 변환
        );
      },
      (error) => {
        setLocationPermission(getGeolocationFailurePermission(error));
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, [setLocation, setLocationPermission, setLocationStatus]);

  return { requestLocation };
}
