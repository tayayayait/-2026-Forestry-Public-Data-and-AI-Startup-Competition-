import { MapPin, Coffee, Utensils, Compass } from "lucide-react";
import type { RecommendationResult } from "@/types";

interface NearbyPlacesProps {
  places: RecommendationResult["nearby"];
}

function getAccessibilityBadges(place: RecommendationResult["nearby"][number]): string[] {
  const accessibility = place.accessibility;
  if (!accessibility) return [];

  return [
    accessibility.wheelchair ? "휠체어" : null,
    accessibility.stroller ? "유모차" : null,
    accessibility.parking ? "장애인 주차" : null,
    accessibility.restroom ? "장애인 화장실" : null,
    accessibility.elevator ? "엘리베이터" : null,
    accessibility.helpdog ? "보조견" : null,
  ].filter((badge): badge is string => Boolean(badge));
}

export function NearbyPlaces({ places }: NearbyPlacesProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return <Utensils className="size-4" />;
      case "cafe":
        return <Coffee className="size-4" />;
      default:
        return <Compass className="size-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text-primary">함께 방문하기 좋은 곳</h3>

      <div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-4 scrollbar-hide">
        <div className="flex gap-3">
          {places.map((place, index) => {
            const badges = getAccessibilityBadges(place);
            const accessibilityTitle = place.accessibilityNotes?.slice(0, 3).join("\n");

            return (
              <div
                key={index}
                className="flex w-[200px] shrink-0 snap-start flex-col justify-between rounded-xl border border-border-subtle bg-white p-3 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm-bg text-text-secondary">
                      {getIcon(place.type)}
                    </div>
                    <span className="flex items-center text-[11px] font-bold text-forest-600">
                      <MapPin className="mr-0.5 size-3" />
                      {place.distance}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-text-primary line-clamp-1">{place.name}</h4>
                  {place.description && (
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                      {place.description}
                    </p>
                  )}
                  {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1" title={accessibilityTitle}>
                      {badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-forest-50 px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-forest-700"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
