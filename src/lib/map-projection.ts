type LatLng = {
  lat: number;
  lng: number;
};

const TOP_PADDING = 20;
const LEFT_PADDING = 15;
const HEIGHT_SPAN = 60;
const WIDTH_SPAN = 70;

function ratio(value: number, min: number, max: number): number {
  if (min === max) return 0.5;
  return (value - min) / (max - min);
}

function roundPercent(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function createLatLngProjector(
  points: LatLng[],
): (point: LatLng) => { top: number; left: number } {
  const validPoints = points.filter(
    (candidate) => Number.isFinite(candidate.lat) && Number.isFinite(candidate.lng),
  );
  if (validPoints.length === 0) {
    return () => ({ top: 50, left: 50 });
  }

  const lats = validPoints.map((candidate) => candidate.lat);
  const lngs = validPoints.map((candidate) => candidate.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return (point: LatLng) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      return { top: 50, left: 50 };
    }

    return {
      top: roundPercent(TOP_PADDING + (1 - ratio(point.lat, minLat, maxLat)) * HEIGHT_SPAN),
      left: roundPercent(LEFT_PADDING + ratio(point.lng, minLng, maxLng) * WIDTH_SPAN),
    };
  };
}

export function projectLatLngToPercent(
  point: LatLng,
  points: LatLng[],
): { top: number; left: number } {
  return createLatLngProjector(points)(point);
}
