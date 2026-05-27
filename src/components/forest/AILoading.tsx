import * as React from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "건강 프로필을 분석하고 있어요",
  "전국 100여 개 산림치유 시설을 탐색 중이에요",
  "환경 데이터를 연동하여 최적의 코스를 찾았어요",
];

interface AILoadingProps {
  className?: string;
}

export function AILoading({ className }: AILoadingProps) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 2000); // 2초마다 텍스트 변경

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-forest-50 shadow-inner">
        <div className="absolute inset-0 animate-spin-slow rounded-full border-4 border-forest-100 border-t-forest-700" />
        <Leaf className="size-10 text-forest-700 animate-pulse" aria-hidden />
      </div>

      <h2 className="mb-2 text-xl font-bold text-text-primary">맞춤형 코스 설계 중</h2>

      <div className="h-6 overflow-hidden">
        <p
          key={step}
          className="animate-in slide-in-from-bottom-2 fade-in text-sm font-medium text-forest-700 duration-500"
        >
          {LOADING_STEPS[step]}
        </p>
      </div>
    </div>
  );
}
