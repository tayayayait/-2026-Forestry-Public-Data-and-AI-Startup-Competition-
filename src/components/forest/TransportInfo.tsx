import * as React from "react";
import { Bus, Car, Info, ParkingSquare } from "lucide-react";
import type { TransportDetail } from "@/types";
import { InteractiveTransportMap } from "./InteractiveTransportMap";

interface TransportInfoProps {
  transport?: TransportDetail;
  facilityLocation?: { lat: number; lng: number; name: string };
}

function sanitizeHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function TransportInfo({ transport, facilityLocation }: TransportInfoProps) {
  const sections = transport
    ? [
        {
          id: "public",
          icon: <Bus className="size-5 text-sky" />,
          title: "대중교통",
          content: sanitizeHtml(transport.publicTransport),
        },
        {
          id: "car",
          icon: <Car className="size-5 text-forest-500" />,
          title: "자가용",
          content: sanitizeHtml(transport.selfDriving),
        },
        {
          id: "parking",
          icon: <ParkingSquare className="size-5 text-purple" />,
          title: "주차장",
          content: sanitizeHtml(transport.parking),
        },
        {
          id: "info",
          icon: <Info className="size-5 text-amber" />,
          title: "안내소",
          content: sanitizeHtml(transport.infoCenter),
        },
      ].filter((s) => !!s.content)
    : [];

  if (sections.length === 0 && !facilityLocation) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 mb-3">
          <Car className="size-6 text-gray-400" />
        </div>
        <p className="font-medium text-gray-900">교통 정보가 없습니다</p>
        <p className="mt-1 text-sm text-gray-500">대중교통이나 방문 정보를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {facilityLocation && <InteractiveTransportMap destination={facilityLocation} />}

      {sections.length > 0 && (
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm border border-border-subtle"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-beige/50">
                {section.icon}
              </div>
              <div>
                <h4 className="font-bold text-text-primary">{section.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
