import { create } from "zustand";
import type {
  HealthProfile,
  EnvironmentData,
  UserLocation,
  LocationPermission,
  RecommendationResult,
  VisitRecord,
  AsyncStatus,
  CurationItem,
} from "@/types";

// ── 환경 슬라이스 ──
interface EnvironmentSlice {
  environment: EnvironmentData & { status: AsyncStatus; error: string | null };
  setEnvironment: (data: Partial<EnvironmentData>) => void;
  setEnvironmentStatus: (status: AsyncStatus, error?: string) => void;
}

// ── 위치 슬라이스 ──
interface LocationSlice {
  location: UserLocation & { status: AsyncStatus };
  setLocation: (coords: { lat: number; lng: number }, address?: string) => void;
  setLocationPermission: (permission: LocationPermission) => void;
  setLocationStatus: (status: AsyncStatus) => void;
}

// ── 건강 프로필 슬라이스 ──
interface HealthProfileSlice {
  healthProfile: HealthProfile | null;
  setHealthProfile: (profile: HealthProfile | null) => void;
}

// ── AI 추천 슬라이스 ──
interface RecommendationSlice {
  recommendation: {
    result: RecommendationResult | null;
    history: RecommendationResult[];
    status: AsyncStatus;
    error: string | null;
  };
  setRecommendation: (result: RecommendationResult) => void;
  setRecommendationStatus: (status: AsyncStatus, error?: string) => void;
  clearRecommendation: () => void;
}

// ── 방문 기록 슬라이스 ──
interface VisitHistorySlice {
  visitHistory: {
    summary: { totalVisits: number; uniqueFacilities: number; consecutiveWeeks: number };
    records: VisitRecord[];
  };
  addVisitRecord: (record: VisitRecord) => void;
  removeVisitRecord: (id: string) => void;
  setVisitHistory: (records: VisitRecord[]) => void;
}

// ── 큐레이션 슬라이스 ──
interface CurationSlice {
  curation: {
    items: CurationItem[];
    status: AsyncStatus;
  };
  setCuration: (items: CurationItem[]) => void;
  setCurationStatus: (status: AsyncStatus) => void;
}

// ── 커뮤니티 슬라이스 ──
export interface CommunityPost {
  id: number;
  author: string;
  location: string;
  date: string;
  content: string;
  tag?: string;
  likes: number;
  comments: number;
  avatar: string | null;
  isLiked: boolean;
  images?: string[];
  commentList: { id: number; author: string; text: string; date: string }[];
}

interface CommunitySlice {
  posts: CommunityPost[];
  addPost: (post: CommunityPost) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, comment: { id: number; author: string; text: string; date: string }) => void;
}

// ── 전체 스토어 ──
export type AppStore = EnvironmentSlice &
  LocationSlice &
  HealthProfileSlice &
  RecommendationSlice &
  VisitHistorySlice &
  CurationSlice &
  CommunitySlice;

function getWeekStartTime(date: Date): number {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart.getTime();
}

function calculateVisitSummary(
  records: VisitRecord[],
): VisitHistorySlice["visitHistory"]["summary"] {
  const weekStarts = Array.from(
    new Set(records.map((record) => getWeekStartTime(record.visitDate))),
  ).sort((left, right) => right - left);

  let consecutiveWeeks = 0;
  for (let index = 0; index < weekStarts.length; index += 1) {
    if (index === 0) {
      consecutiveWeeks = 1;
      continue;
    }

    const previous = weekStarts[index - 1];
    const current = weekStarts[index];
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    if (previous - current !== oneWeekMs) break;
    consecutiveWeeks += 1;
  }

  return {
    totalVisits: records.length,
    uniqueFacilities: new Set(records.map((record) => record.facilityName)).size,
    consecutiveWeeks,
  };
}

export const useAppStore = create<AppStore>((set) => ({
  // ── 환경 ──
  environment: {
    weather: null,
    airQuality: null,
    uvIndex: null,
    uvLevel: null,
    lastUpdated: null,
    status: "idle",
    error: null,
  },
  setEnvironment: (data) =>
    set((state) => ({
      environment: {
        ...state.environment,
        ...data,
        lastUpdated: new Date(),
        status: "success",
        error: null,
      },
    })),
  setEnvironmentStatus: (status, error) =>
    set((state) => ({
      environment: { ...state.environment, status, error: error ?? null },
    })),

  // ── 위치 ──
  location: {
    coords: null,
    address: null,
    permission: "prompt",
    status: "idle",
  },
  setLocation: (coords, address) =>
    set((state) => ({
      location: {
        ...state.location,
        coords,
        address: address ?? null,
        status: "success",
      },
    })),
  setLocationPermission: (permission) =>
    set((state) => ({
      location: { ...state.location, permission },
    })),
  setLocationStatus: (status) =>
    set((state) => ({
      location: { ...state.location, status },
    })),

  // ── 건강 프로필 ──
  healthProfile: null,
  setHealthProfile: (profile) => set({ healthProfile: profile }),

  // ── AI 추천 ──
  recommendation: {
    result: null,
    history: [],
    status: "idle",
    error: null,
  },
  setRecommendation: (result) =>
    set((state) => ({
      recommendation: {
        result,
        history: [result, ...state.recommendation.history],
        status: "success",
        error: null,
      },
    })),
  setRecommendationStatus: (status, error) =>
    set((state) => ({
      recommendation: {
        ...state.recommendation,
        status,
        error: error ?? null,
      },
    })),
  clearRecommendation: () =>
    set((state) => ({
      recommendation: {
        ...state.recommendation,
        result: null,
        status: "idle",
        error: null,
      },
    })),

  // ── 방문 기록 ──
  visitHistory: {
    summary: { totalVisits: 0, uniqueFacilities: 0, consecutiveWeeks: 0 },
    records: [],
  },
  addVisitRecord: (record) =>
    set((state) => ({
      visitHistory: {
        ...state.visitHistory,
        records: [record, ...state.visitHistory.records],
        summary: calculateVisitSummary([record, ...state.visitHistory.records]),
      },
    })),
  removeVisitRecord: (id) =>
    set((state) => ({
      visitHistory: {
        ...state.visitHistory,
        records: state.visitHistory.records.filter((r) => r.id !== id),
      },
    })),
  setVisitHistory: (records) =>
    set((state) => ({
      visitHistory: { ...state.visitHistory, records, summary: calculateVisitSummary(records) },
    })),

  // ── 큐레이션 ──
  curation: {
    items: [],
    status: "idle",
  },
  setCuration: (items) => set({ curation: { items, status: "success" } }),
  setCurationStatus: (status) =>
    set((state) => ({
      curation: { ...state.curation, status },
    })),

  // ── 커뮤니티 ──
  posts: [
    {
      id: 1,
      author: "박주용",
      location: "지리산",
      date: "2026-05-22",
      content: "5/24 지리산 산행 후 중산리에서 성삼재 택시 쉐어 하실 분 구합니다\n시간은 11-13 사이입니다",
      tag: "#지리산",
      likes: 2,
      comments: 0,
      avatar: null,
      isLiked: false,
      commentList: [],
    },
    {
      id: 2,
      author: "산토끼",
      location: "운제산",
      date: "2026-05-19",
      content: "오늘 운제산 정상 찍고 왔습니다. 날씨가 너무 좋네요!",
      images: [
        "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
        "https://images.unsplash.com/photo-1438786657495-640937046d18",
      ],
      likes: 12,
      comments: 2,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      isLiked: true,
      commentList: [
        { id: 1, author: "산행러버", text: "정상 뷰 최고네요!", date: "2026-05-19" },
        { id: 2, author: "초보등산객", text: "어느 코스로 가셨나요?", date: "2026-05-19" }
      ],
    },
  ],
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      }),
    })),
  addComment: (postId, comment) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments + 1,
            commentList: [...post.commentList, comment],
          };
        }
        return post;
      }),
    })),
}));
