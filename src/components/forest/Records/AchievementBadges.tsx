import { Medal, Star, Award, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_BADGES = [
  {
    id: "b1",
    title: "첫 걸음",
    desc: "첫 치유의 숲 방문",
    icon: <Leaf className="size-6 text-green-500" />,
    achieved: true,
  },
  {
    id: "b2",
    title: "숲 매니아",
    desc: "서로 다른 5곳 방문",
    icon: <Medal className="size-6 text-blue-500" />,
    achieved: true,
  },
  {
    id: "b3",
    title: "꾸준함의 힘",
    desc: "4주 연속 방문",
    icon: <Star className="size-6 text-yellow-500" />,
    achieved: false,
  },
  {
    id: "b4",
    title: "마스터",
    desc: "누적 50회 방문",
    icon: <Award className="size-6 text-purple-500" />,
    achieved: false,
  },
];

export function AchievementBadges() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-text-primary">획득한 배지</h3>
        <span className="text-sm font-medium text-forest-700">2 / 12</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {MOCK_BADGES.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-full shadow-sm transition-all",
                badge.achieved
                  ? "bg-white border-2 border-forest-100"
                  : "bg-warm-bg border border-border-subtle opacity-40 grayscale",
              )}
            >
              {badge.icon}
            </div>
            <span
              className={cn(
                "text-[11px] font-bold text-center leading-tight",
                badge.achieved ? "text-text-primary" : "text-text-tertiary",
              )}
            >
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
