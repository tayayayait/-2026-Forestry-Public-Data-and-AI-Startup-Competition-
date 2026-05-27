import { MapPin, TreePine, Leaf, Tent, Trees, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFacilityCategoryStyle } from "@/lib/facility-category-style";
import type { FacilityType } from "@/types";

interface FacilityMarkerProps {
  type: FacilityType;
  isActive?: boolean;
}

export function FacilityMarker({ type, isActive }: FacilityMarkerProps) {
  const getMarkerConfig = () => {
    switch (type) {
      case "healing_forest":
        return {
          icon: <Leaf className="size-5" />,
        };
      case "kids_forest":
        return {
          icon: <Sprout className="size-5" />,
        };
      case "recreation_forest":
        return {
          icon: <Tent className="size-5" />,
        };
      case "traditional_village_forest":
        return {
          icon: <Trees className="size-5" />,
        };
      case "arboretum":
        return {
          icon: <TreePine className="size-5" />,
        };
      default:
        return {
          icon: <MapPin className="size-5" />,
        };
    }
  };

  const config = getMarkerConfig();
  const categoryStyle = getFacilityCategoryStyle(type);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full text-white shadow-md transition-transform",
        isActive ? "size-10 scale-110 z-10 border-2" : "size-8 border",
      )}
      style={{
        backgroundColor: categoryStyle.marker,
        borderColor: categoryStyle.markerBorder,
        boxShadow: `0 8px 18px ${categoryStyle.shadow}`,
      }}
      title={`${categoryStyle.label} - ${categoryStyle.colorName}`}
    >
      {config.icon}
      {isActive && (
        <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 bg-inherit border-inherit" />
      )}
    </div>
  );
}
