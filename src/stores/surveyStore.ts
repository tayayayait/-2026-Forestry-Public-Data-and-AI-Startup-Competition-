import { create } from "zustand";
import type {
  SurveyAnswers,
  SurveyStepConfig,
  PreferredActivity,
  AccessibilityNeed,
} from "@/types";

// ── 7단계 설문 정의 (상세서 Section 6.2) ──
export const SURVEY_STEPS: SurveyStepConfig[] = [
  {
    step: 1,
    question: "현재 스트레스 수준은 어느 정도인가요?",
    description: "최근 1주일 기준으로 슬라이더를 움직여 주세요.",
    type: "slider",
    field: "stressLevel",
    min: 1,
    max: 10,
    required: true,
  },
  {
    step: 2,
    question: "수면 품질은 어떤가요?",
    description: "최근 1주일 기준으로 선택해 주세요.",
    type: "single",
    field: "sleepQuality",
    options: [
      { value: "good", label: "좋아요", emoji: "😴" },
      { value: "normal", label: "보통이에요", emoji: "😐" },
      { value: "poor", label: "안 좋아요", emoji: "😓" },
    ],
    required: true,
  },
  {
    step: 3,
    question: "체력 수준을 알려주세요.",
    description: "평소 활동량을 기준으로 선택해 주세요.",
    type: "single",
    field: "fitnessLevel",
    options: [
      { value: "beginner", label: "초급 (평지 산책)", emoji: "🚶" },
      { value: "moderate", label: "중급 (가벼운 등산)", emoji: "🥾" },
      { value: "advanced", label: "상급 (본격 등산)", emoji: "⛰️" },
    ],
    required: true,
  },
  {
    step: 4,
    question: "선호하는 활동을 선택해 주세요.",
    description: "1개 이상 선택해 주세요.",
    type: "multi",
    field: "preferredActivities",
    options: [
      { value: "walking", label: "산책", emoji: "🚶" },
      { value: "meditation", label: "명상·호흡", emoji: "🧘" },
      { value: "experience", label: "체험·교육", emoji: "🎨" },
      { value: "sports", label: "운동·레포츠", emoji: "🏃" },
    ],
    required: true,
  },
  {
    step: 5,
    question: "누구와 함께하시나요?",
    description: "동반자 유형을 선택해 주세요.",
    type: "single",
    field: "companions",
    options: [
      { value: "solo", label: "혼자", emoji: "👤" },
      { value: "couple", label: "커플·친구", emoji: "👫" },
      { value: "family", label: "가족+유아", emoji: "👨‍👩‍👧" },
      { value: "senior", label: "시니어", emoji: "👴" },
    ],
    required: true,
  },
  {
    step: 6,
    question: "이동 가능한 거리는 어느 정도인가요?",
    description: "편도 기준으로 선택해 주세요.",
    type: "single",
    field: "maxTravelTime",
    options: [
      { value: "30", label: "30분 이내", emoji: "🚗" },
      { value: "60", label: "1시간 이내", emoji: "🚙" },
      { value: "120", label: "2시간 이상 OK", emoji: "🚐" },
    ],
    required: true,
  },
  {
    step: 7,
    question: "특별한 요구 사항이 있나요?",
    description: "해당되는 항목을 모두 선택해 주세요.",
    type: "multi",
    field: "accessibilityNeeds",
    options: [
      { value: "none", label: "없음", emoji: "✅" },
      { value: "wheelchair", label: "휠체어 접근", emoji: "♿" },
      { value: "stroller", label: "유모차 이동", emoji: "🍼" },
      { value: "pet", label: "반려동물 동반", emoji: "🐕" },
    ],
    required: true,
  },
];

export const TOTAL_STEPS = SURVEY_STEPS.length;

// ── 설문 스토어 ──
interface SurveyState {
  currentStep: number;
  answers: Partial<SurveyAnswers>;
  isComplete: boolean;

  // 액션
  setAnswer: (field: keyof SurveyAnswers, value: unknown) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  complete: () => void;
}

const initialState = {
  currentStep: 1,
  answers: {},
  isComplete: false,
};

function normalizeAnswerValue(field: keyof SurveyAnswers, value: unknown): unknown {
  if (field === "maxTravelTime" && typeof value === "string") {
    return Number(value);
  }

  return value;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  ...initialState,

  setAnswer: (field, value) =>
    set((state) => ({
      answers: { ...state.answers, [field]: normalizeAnswerValue(field, value) },
    })),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),

  reset: () => set(initialState),

  complete: () => set({ isComplete: true }),
}));

/* ── 유틸: 현재 스텝의 응답 존재 여부 검사 ── */
export function isStepAnswered(step: number, answers: Partial<SurveyAnswers>): boolean {
  const config = SURVEY_STEPS[step - 1];
  if (!config) return false;

  const value = answers[config.field];
  if (value === undefined || value === null) return false;

  if (config.type === "multi") {
    return Array.isArray(value) && value.length > 0;
  }
  if (config.type === "slider") {
    return typeof value === "number" && value >= 1;
  }
  return !!value;
}
