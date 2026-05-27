import * as React from "react";
import { Camera, Coffee, Info, ParkingCircle, Utensils } from "lucide-react";
import type { WaypointInfo } from "@/types";

interface WaypointCardProps {
  waypoint: WaypointInfo;
  isLast?: boolean; // 마지막 항목인지 여부 (세로선 렌더링에 사용)
}

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  안내소: <Info className="size-3.5" />,
  주차장: <ParkingCircle className="size-3.5" />,
  화장실: <div className="text-[11px] font-bold">W/C</div>,
  식당: <Utensils className="size-3.5" />,
  카페: <Coffee className="size-3.5" />,
};

export function WaypointCard({ waypoint, isLast = false }: WaypointCardProps) {
  return (
    <div className="relative pl-11 pb-10">
      {/* 1. 세로 타임라인 선 */}
      {!isLast && <div className="absolute left-[1.15rem] top-8 bottom-0 w-0.5 bg-orange-600/80" />}

      {/* 2. 순서 마커 */}
      <div className="absolute left-0 top-0.5 flex size-[2.3rem] items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white shadow-sm ring-4 ring-white">
        {waypoint.order}
      </div>

      {/* 3. 콘텐츠 영역 */}
      <div className="flex flex-col">
        {/* 제목 및 태그 */}
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold tracking-tight text-text-primary">{waypoint.name}</h4>
          {waypoint.tags && waypoint.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {waypoint.tags.map((tag) => (
                <span key={tag} className="text-sm font-bold text-teal-600">
                  {tag}
                  <span className="text-gray-300 mx-1 last:hidden">·</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 텍스트 설명 */}
        {waypoint.description && (
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-text-secondary whitespace-pre-line">
            {waypoint.description}
          </p>
        )}

        {/* 갤러리 이미지 */}
        {waypoint.images && waypoint.images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 overflow-hidden rounded-2xl h-48 sm:h-64">
            <div className={`${waypoint.images.length > 1 ? "col-span-2" : "col-span-3"} h-full`}>
              <img
                src={waypoint.images[0]}
                alt={`${waypoint.name} 전경 1`}
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            {waypoint.images.length > 1 && (
              <div className="col-span-1 flex flex-col gap-2 h-full">
                {waypoint.images.slice(1, 3).map((img, idx) => (
                  <div key={idx} className="flex-1 h-full overflow-hidden">
                    <img
                      src={img}
                      alt={`${waypoint.name} 전경 ${idx + 2}`}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 기존 이미지 호환성 지원 (imageUrl이 있는 경우) */}
        {!waypoint.images && waypoint.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={waypoint.imageUrl}
              alt={waypoint.name}
              className="h-48 w-full object-cover sm:h-64"
              loading="lazy"
            />
          </div>
        )}

        {/* 편의 시설 */}
        {waypoint.facilities && waypoint.facilities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {waypoint.facilities.map((fac) => (
              <span
                key={fac}
                className="flex items-center gap-1.5 rounded-md bg-gray-100/80 px-2.5 py-1 text-[13px] font-semibold text-gray-600"
              >
                {FACILITY_ICONS[fac]}
                {fac}
              </span>
            ))}
          </div>
        )}

        {/* 말풍선 팁 (Tips) */}
        {waypoint.tips && waypoint.tips.length > 0 && (
          <div className="mt-4 space-y-3 pl-2 relative">
            {/* 팁과 타임라인 메인 선을 이어주는 짧은 가로선들 (장식) */}
            <div className="absolute left-[-2rem] top-0 bottom-0 w-0.5 bg-transparent" />

            {waypoint.tips.map((tip, idx) => (
              <div key={idx} className="relative group">
                {/* 팁을 가리키는 점선/연결선 느낌 */}
                <div className="absolute left-[-3.1rem] top-6 size-2.5 rounded-full border-2 border-orange-600 bg-white z-10" />
                <div className="absolute left-[-2rem] top-6 w-8 border-t-2 border-dashed border-gray-200" />

                <div className="relative ml-2 flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow group-hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    {tip.title && (
                      <h5 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                        {tip.title}
                        {tip.imageUrl && <Camera className="size-3.5 text-gray-400" />}
                      </h5>
                    )}
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-600 whitespace-pre-line">
                      {tip.description}
                    </p>
                  </div>

                  {tip.imageUrl && (
                    <div className="shrink-0">
                      <img
                        src={tip.imageUrl}
                        alt={tip.title || "팁 이미지"}
                        className="size-16 rounded-lg object-cover border border-gray-100"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
