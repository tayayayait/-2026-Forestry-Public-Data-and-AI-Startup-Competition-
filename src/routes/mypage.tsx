import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  HelpCircle,
  Loader2,
  MapPin,
  Pencil,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedCourses } from "@/hooks/useSavedCourses";
import type { SavedCourse } from "@/types";

export const Route = createFileRoute("/mypage")({
  component: MyPage,
});

function formatSavedCourseDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "저장일 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

type SavedCourseUpdates = {
  title?: string;
  memo?: string | null;
  isBookmarked?: boolean;
};

function SavedCourseCard({
  course,
  isBusy,
  onDelete,
  onUpdate,
}: {
  course: SavedCourse;
  isBusy: boolean;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: SavedCourseUpdates) => Promise<SavedCourse | null>;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(course.title);
  const [draftMemo, setDraftMemo] = React.useState(course.memo ?? "");

  React.useEffect(() => {
    if (!isEditing) {
      setDraftTitle(course.title);
      setDraftMemo(course.memo ?? "");
    }
  }, [course.memo, course.title, isEditing]);

  const handleCancel = () => {
    setDraftTitle(course.title);
    setDraftMemo(course.memo ?? "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    const title = draftTitle.trim();
    if (!title) return;

    const updated = await onUpdate(course.id, {
      title,
      memo: draftMemo.trim() ? draftMemo.trim() : null,
      isBookmarked: course.isBookmarked,
    });

    if (updated) setIsEditing(false);
  };

  const handleBookmarkToggle = async () => {
    await onUpdate(course.id, { isBookmarked: !course.isBookmarked });
  };

  const handleDelete = async () => {
    if (!window.confirm("저장한 코스를 삭제할까요?")) return;
    await onDelete(course.id);
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {course.isBookmarked && (
              <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-bold text-forest-700">
                북마크
              </span>
            )}
            <span className="text-xs font-medium text-text-tertiary">
              {formatSavedCourseDate(course.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-2">
              <input
                aria-label="저장 코스 제목"
                className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-forest-500"
                maxLength={80}
                onChange={(event) => setDraftTitle(event.target.value)}
                value={draftTitle}
              />
              <textarea
                aria-label="저장 코스 메모"
                className="min-h-20 w-full resize-none rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-secondary outline-none focus:border-forest-500"
                maxLength={300}
                onChange={(event) => setDraftMemo(event.target.value)}
                placeholder="메모를 입력하세요"
                value={draftMemo}
              />
            </div>
          ) : (
            <>
              <h3 className="mt-2 line-clamp-2 text-[15px] font-bold text-text-primary">
                {course.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{course.facilityName}</span>
              </p>
              {course.memo && (
                <p className="mt-2 line-clamp-2 text-xs text-text-tertiary">{course.memo}</p>
              )}
            </>
          )}
        </div>

        {course.recommendationId && !isEditing ? (
          <Link
            aria-label="저장 코스 결과 열기"
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-warm-bg"
            params={{ id: course.recommendationId }}
            to="/result/$id"
          >
            <ChevronRight className="size-5" />
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-forest-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              disabled={isBusy || !draftTitle.trim()}
              onClick={handleSave}
              type="button"
            >
              <Check className="size-3.5" />
              저장
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border-default px-3 py-2 text-xs font-bold text-text-secondary"
              disabled={isBusy}
              onClick={handleCancel}
              type="button"
            >
              <X className="size-3.5" />
              취소
            </button>
          </>
        ) : (
          <>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border-default px-3 py-2 text-xs font-bold text-text-secondary disabled:opacity-50"
              disabled={isBusy}
              onClick={handleBookmarkToggle}
              type="button"
            >
              <Bookmark className="size-3.5" />
              {course.isBookmarked ? "북마크 해제" : "북마크"}
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border-default px-3 py-2 text-xs font-bold text-text-secondary disabled:opacity-50"
              disabled={isBusy}
              onClick={() => setIsEditing(true)}
              type="button"
            >
              <Pencil className="size-3.5" />
              편집
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-coral/30 px-3 py-2 text-xs font-bold text-coral disabled:opacity-50"
              disabled={isBusy}
              onClick={handleDelete}
              type="button"
            >
              <Trash2 className="size-3.5" />
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MyPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { deleteCourse, fetchCourses, isLoading, error, updateCourse } = useSavedCourses();
  const [savedCourses, setSavedCourses] = React.useState<SavedCourse[]>([]);
  const savedCoursesRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSavedCourses([]);
      return;
    }

    let active = true;
    fetchCourses().then((courses) => {
      if (active) setSavedCourses(courses);
    });

    return () => {
      active = false;
    };
  }, [authLoading, fetchCourses, user]);

  const scrollToSavedCourses = () => {
    savedCoursesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleUpdateCourse = React.useCallback(
    async (id: string, updates: SavedCourseUpdates) => {
      const updated = await updateCourse(id, updates);
      if (updated) {
        setSavedCourses((courses) =>
          courses.map((course) => (course.id === updated.id ? updated : course)),
        );
      }
      return updated;
    },
    [updateCourse],
  );

  const handleDeleteCourse = React.useCallback(
    async (id: string) => {
      const deleted = await deleteCourse(id);
      if (deleted) {
        setSavedCourses((courses) => courses.filter((course) => course.id !== id));
      }
      return deleted;
    },
    [deleteCourse],
  );

  return (
    <div className="flex min-h-screen flex-col bg-warm-bg pb-24">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-center bg-warm-bg/90 backdrop-blur-md px-4 border-b border-border-subtle">
        <h1 className="text-base font-bold text-text-primary">마이페이지</h1>
      </header>

      <main className="flex-1 animate-in fade-in duration-500">
        <div className="mx-auto max-w-md px-4 py-6 space-y-6">
          <section className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-border-subtle">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <User className="size-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary">
                {user?.user_metadata?.full_name || "치유 여행자"}님
              </h2>
              <p className="text-sm text-text-secondary">{user?.email || "로그인이 필요합니다"}</p>
            </div>
            <Link
              to="/auth"
              className="text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              {user ? "수정" : "로그인"}
            </Link>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <button
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 shadow-sm border border-border-subtle active:bg-warm-bg transition-colors"
              onClick={scrollToSavedCourses}
              type="button"
            >
              <Bookmark className="size-6 text-text-secondary" />
              <span className="text-sm font-bold text-text-primary">저장한 코스</span>
              <span className="text-xs text-text-tertiary">{savedCourses.length}개</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 shadow-sm border border-border-subtle active:bg-warm-bg transition-colors">
              <Settings className="size-6 text-text-secondary" />
              <span className="text-sm font-bold text-text-primary">건강 프로필 관리</span>
              <span className="text-xs text-text-tertiary">준비 중</span>
            </button>
          </section>

          <section
            className="rounded-2xl bg-white p-4 shadow-sm border border-border-subtle"
            ref={savedCoursesRef}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary">저장한 코스</h2>
                <p className="mt-1 text-xs text-text-secondary">
                  저장한 추천 코스를 다시 열어 방문 계획에 재사용합니다.
                </p>
              </div>
              <Bookmark className="size-5 text-forest-700" />
            </div>

            {authLoading || isLoading ? (
              <div className="flex items-center gap-2 rounded-xl bg-warm-bg p-4 text-sm font-medium text-text-secondary">
                <Loader2 className="size-4 animate-spin" />
                저장한 코스를 불러오는 중입니다.
              </div>
            ) : !user ? (
              <div className="rounded-xl border border-dashed border-border-default bg-warm-bg p-4 text-sm text-text-secondary">
                로그인 후 저장한 코스를 확인할 수 있습니다.
              </div>
            ) : error ? (
              <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm font-medium text-coral">
                {error}
              </div>
            ) : savedCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-default bg-warm-bg p-4 text-sm text-text-secondary">
                저장된 코스가 없습니다. 추천 결과 화면에서 코스를 저장하세요.
              </div>
            ) : (
              <div className="space-y-3">
                {savedCourses.map((course) => (
                  <SavedCourseCard
                    course={course}
                    isBusy={isLoading}
                    key={course.id}
                    onDelete={handleDeleteCourse}
                    onUpdate={handleUpdateCourse}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white shadow-sm border border-border-subtle overflow-hidden">
            <ul className="divide-y divide-border-subtle">
              <li>
                <button className="flex w-full items-center justify-between p-4 active:bg-warm-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="size-5 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">알림 설정</span>
                  </div>
                  <ChevronRight className="size-5 text-text-tertiary" />
                </button>
              </li>
              <li>
                <Link
                  to="/records"
                  className="flex w-full items-center justify-between p-4 active:bg-warm-bg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-5 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">방문 기록</span>
                  </div>
                  <ChevronRight className="size-5 text-text-tertiary" />
                </Link>
              </li>
              <li>
                <button className="flex w-full items-center justify-between p-4 active:bg-warm-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="size-5 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">고객 센터</span>
                  </div>
                  <ChevronRight className="size-5 text-text-tertiary" />
                </button>
              </li>
            </ul>
          </section>

          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="w-full rounded-xl border border-border-default bg-white py-3 text-sm font-bold text-text-secondary active:bg-warm-bg"
          >
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}
