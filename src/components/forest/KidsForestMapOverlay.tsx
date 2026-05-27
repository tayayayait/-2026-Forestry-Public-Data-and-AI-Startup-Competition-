import { Link } from "@tanstack/react-router";
import { ExternalLink, Info, MapPin, Navigation2, Phone, X } from "lucide-react";
import type { FacilityInfo } from "@/types";
import { useAppStore } from "@/stores/appStore";

type KidsForestMapOverlayProps = {
  facility: FacilityInfo;
  onClose: () => void;
};

function getKidsForestProgram(facility: FacilityInfo) {
  return facility.educationPrograms?.[0];
}

export function KidsForestMapOverlay({ facility, onClose }: KidsForestMapOverlayProps) {
  const locationCoords = useAppStore((s) => s.location.coords);
  const program = getKidsForestProgram(facility);
  const participationMethod = program?.participationMethod;
  const period = program?.period ?? facility.operatingHours;

  const handleDirections = () => {
    const encodedName = encodeURIComponent(facility.name);
    const startParams = locationCoords
      ? `&slng=${locationCoords.lng}&slat=${locationCoords.lat}&sname=${encodeURIComponent("내 위치")}`
      : "";
    const url = `https://map.naver.com/index.nhn?menu=route${startParams}&elng=${facility.lng}&elat=${facility.lat}&etext=${encodedName}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="absolute bottom-20 left-1/2 z-20 w-[min(360px,calc(100vw-28px))] -translate-x-1/2 rounded-[22px] border border-emerald-100 bg-white p-5 shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        aria-label="유아숲체험원 정보 닫기"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
        <Info className="size-3.5" aria-hidden />
        아이 전용 숲체험
      </div>

      <h3 className="pr-8 text-lg font-black leading-snug text-slate-950">{facility.name}</h3>
      <p className="mt-2 flex items-start gap-1.5 text-xs font-medium leading-5 text-slate-500">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
        {facility.address}
      </p>

      <div className="mt-4 grid gap-2 rounded-[16px] bg-emerald-50/60 p-3 text-xs">
        {period && (
          <div className="flex justify-between gap-3">
            <span className="shrink-0 font-bold text-emerald-800">운영기간</span>
            <span className="text-right font-semibold text-slate-700">{period}</span>
          </div>
        )}
        {participationMethod && (
          <div className="flex justify-between gap-3">
            <span className="shrink-0 font-bold text-emerald-800">참여방법</span>
            <span className="text-right font-semibold text-slate-700">{participationMethod}</span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/facilities/$facilityId"
          params={{ facilityId: facility.id }}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-white py-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          상세정보
        </Link>
        <button
          type="button"
          onClick={handleDirections}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-3 text-xs font-black text-white hover:bg-emerald-800"
        >
          <Navigation2 className="size-3.5" aria-hidden />
          길찾기
        </button>
        {facility.tel && (
          <a
            href={`tel:${facility.tel}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-white py-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"
          >
            <Phone className="size-3.5" aria-hidden />
            전화하기
          </a>
        )}
      </div>
    </div>
  );
}
