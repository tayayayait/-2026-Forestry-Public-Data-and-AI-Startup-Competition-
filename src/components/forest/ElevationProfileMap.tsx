import * as React from "react";
import { Loader2 } from "lucide-react";
// Leaflet Map을 동적으로 불러오기 위한 Lazy Component
const LeafletMap = React.lazy(() => import("./ElevationProfileLeaflet"));
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ElevationProfileMapProps {
  geoJson: any;
}

// 거리 계산 유틸리티 (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // 지구 반경 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ElevationProfileMap({ geoJson }: ElevationProfileMapProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // GeoJSON 데이터에서 고도 그래프용 데이터 추출
  React.useEffect(() => {
    if (!geoJson?.geometry?.coordinates) return;

    let coords = geoJson.geometry.coordinates;
    if (geoJson.geometry.type === "MultiLineString") {
      coords = coords.flat(1);
    }

    let cumulativeDistance = 0;
    const data = coords.map((coord: any, index: number) => {
      // coord: [lng, lat, elevation]
      const [lng, lat, elevation] = coord;

      if (index > 0) {
        const prevCoord = coords[index - 1];
        const dist = getDistanceFromLatLonInKm(prevCoord[1], prevCoord[0], lat, lng);
        cumulativeDistance += dist;
      }

      return {
        distance: cumulativeDistance.toFixed(2),
        elevation: elevation || 0,
      };
    });

    setChartData(data);
  }, [geoJson]);

  if (!isClient) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-2xl bg-gray-100">
        <Loader2 className="size-6 animate-spin text-forest-700" />
      </div>
    );
  }

  // 중심점 계산
  let center: [number, number] = [37.5666102, 126.9783881];
  try {
    const coords = geoJson.geometry?.coordinates;
    if (coords && coords.length > 0) {
      let firstCoord;
      if (geoJson.geometry.type === "MultiLineString") {
        firstCoord = coords[0][0];
      } else if (geoJson.geometry.type === "LineString") {
        firstCoord = coords[0];
      }
      if (firstCoord) {
        center = [firstCoord[1], firstCoord[0]];
      }
    }
  } catch (e) {
    console.error("Failed to parse GeoJSON center", e);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 고도 그래프 렌더링 영역 (Recharts) */}
      <div className="h-[150px] w-full rounded-xl bg-white shadow-sm border border-border-default overflow-hidden p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(value) => `${value}km`}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelFormatter={(value) => `${value} km`}
                formatter={(value: number) => [`${value.toFixed(1)} m`, "고도"]}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="#2e7d32"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorElevation)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            고도 데이터가 없습니다
          </div>
        )}
      </div>

      {/* Leaflet 지도 영역 */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-sm border border-border-default bg-gray-50">
        <React.Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-forest-700" />
            </div>
          }
        >
          <LeafletMap center={center} geoJson={geoJson} />
        </React.Suspense>
      </div>
    </div>
  );
}
