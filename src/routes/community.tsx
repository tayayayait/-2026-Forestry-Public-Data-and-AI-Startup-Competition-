import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Bookmark,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  Video,
  Heart,
  MessageSquareText,
  PenSquare,
  User,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCommunityPostsByHotness } from "@/lib/community-hot-issues";
import { useAppStore } from "@/stores/appStore";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const [activeTab, setActiveTab] = React.useState("실시간");
  const [isWriteModalOpen, setWriteModalOpen] = React.useState(false);
  const [writeText, setWriteText] = React.useState("");
  const [activeCommentPostId, setActiveCommentPostId] = React.useState<number | null>(null);
  const [commentText, setCommentText] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortType, setSortType] = React.useState("최신순");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = React.useState(false);

  const posts = useAppStore((state) => state.posts);
  const addPost = useAppStore((state) => state.addPost);
  const toggleLike = useAppStore((state) => state.toggleLike);
  const addComment = useAppStore((state) => state.addComment);

  const handlePostSubmit = () => {
    if (!writeText.trim()) return;
    addPost({
      id: Date.now(),
      author: "산림지기",
      location: "내 위치",
      date: new Date().toISOString().split("T")[0],
      content: writeText,
      likes: 0,
      comments: 0,
      avatar: null,
      isLiked: false,
      commentList: [],
    });
    setWriteText("");
    setWriteModalOpen(false);
  };

  const handleLikeToggle = (postId: number) => {
    toggleLike(postId);
  };

  const handleCommentSubmit = (postId: number) => {
    if (!commentText.trim()) return;
    addComment(postId, {
      id: Date.now(),
      author: "산림지기",
      text: commentText,
      date: new Date().toISOString().split("T")[0],
    });
    setCommentText("");
  };

  const filteredPosts = React.useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchingPosts = posts.filter(
      (post) =>
        post.content.toLowerCase().includes(normalizedQuery) ||
        post.author.toLowerCase().includes(normalizedQuery) ||
        (post.tag && post.tag.toLowerCase().includes(normalizedQuery)),
    );

    if (sortType === "인기순") {
      return sortCommunityPostsByHotness(matchingPosts);
    }

    return [...matchingPosts].sort((left, right) => right.id - left.id);
  }, [posts, searchQuery, sortType]);

  return (
    <div className="flex w-full flex-col bg-slate-50 min-h-screen pb-[80px]">
      {/* 상단 헤더 영역 */}
      <header className="sticky top-[56px] lg:top-[64px] z-10 bg-white px-4 py-3 flex items-center justify-between min-h-[56px]">
        {!isSearchOpen ? (
          <>
            <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
            <div className="flex items-center text-gray-700">
              <button
                aria-label="검색"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="size-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="size-4 text-gray-400" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-sm font-medium text-gray-600 px-2 shrink-0"
            >
              취소
            </button>
          </div>
        )}
      </header>

      {/* 서브 탭 */}
      <div className="bg-white px-4 border-b border-gray-100 flex gap-6">
        {["실시간", "Q&A", "등산일지"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-3 text-[15px] font-medium border-b-2 transition-colors",
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 필터 영역 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-gray-600 text-sm font-medium mr-1 transition-colors hover:text-gray-900">
            <SlidersHorizontal className="size-4" /> 필터
          </button>
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none",
                isSortDropdownOpen
                  ? "bg-gray-100 text-gray-900 border border-transparent"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
              )}
            >
              {sortType}{" "}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isSortDropdownOpen ? "rotate-180 text-gray-700" : "text-gray-400",
                )}
              />
            </button>

            {isSortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-28 bg-white/95 backdrop-blur-md border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 p-1.5 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setSortType("최신순");
                      setIsSortDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-xl transition-all",
                      sortType === "최신순"
                        ? "bg-emerald-50 text-emerald-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium",
                    )}
                  >
                    최신순
                  </button>
                  <button
                    onClick={() => {
                      setSortType("인기순");
                      setIsSortDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-xl transition-all mt-0.5",
                      sortType === "인기순"
                        ? "bg-emerald-50 text-emerald-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium",
                    )}
                  >
                    인기순
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 피드 리스트 */}
      <div className="flex flex-col gap-3 p-0 md:p-4">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="bg-white px-4 py-5 md:rounded-xl shadow-sm border-y border-gray-100 md:border animate-in fade-in duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 overflow-hidden">
                {post.avatar ? (
                  <img src={post.avatar} loading="lazy" decoding="async" alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-6" />
                )}
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">{post.author}</h3>
                <p className="text-xs text-gray-400">
                  {post.location} · {post.date}
                </p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[15px] leading-relaxed text-gray-800 font-medium whitespace-pre-wrap mb-3">
                {post.content}
              </p>
              {post.tag && <p className="mt-2 text-sm text-emerald-500">{post.tag}</p>}

              {/* 이미지 그리드 (있을 경우) */}
              {post.images && post.images.length > 0 && <PostImageGrid images={post.images} />}
            </div>

            <div className="flex items-center justify-between mt-4 text-gray-400 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLikeToggle(post.id)}
                  className="flex items-center gap-1.5 hover:text-gray-600 transition-colors"
                >
                  <Heart
                    className={cn("size-5", post.isLiked ? "fill-rose-500 text-rose-500" : "")}
                  />
                  <span className={cn("text-sm font-medium", post.isLiked ? "text-gray-700" : "")}>
                    {post.likes}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                    if (activeCommentPostId !== post.id) setCommentText("");
                  }}
                  className="flex items-center gap-1.5 hover:text-gray-600 transition-colors"
                >
                  <MessageSquareText
                    className={cn(
                      "size-5",
                      activeCommentPostId === post.id ? "text-emerald-500" : "",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      post.comments > 0 || activeCommentPostId === post.id ? "text-gray-700" : "",
                    )}
                  >
                    {post.comments}
                  </span>
                </button>
              </div>
              <button className="hover:text-gray-600 transition-colors">
                <Bookmark className="size-5" />
              </button>
            </div>

            {/* 댓글 섹션 */}
            {activeCommentPostId === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                {/* 댓글 목록 */}
                {post.commentList && post.commentList.length > 0 && (
                  <div className="flex flex-col gap-3 mb-4">
                    {post.commentList.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="size-4 text-gray-400" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2 text-[14px]">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-gray-900">{comment.author}</span>
                            <span className="text-[11px] text-gray-400">{comment.date}</span>
                          </div>
                          <p className="text-gray-800">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* 댓글 입력창 */}
                <div className="flex gap-2 items-center">
                  <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <User className="size-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="댓글을 남겨보세요..."
                      className="w-full bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-full py-2 pl-4 pr-16 text-sm outline-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          handleCommentSubmit(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={!commentText.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 disabled:text-gray-300 font-bold text-sm px-2 py-1"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* 플로팅 작성 버튼 (FAB) */}
      <div className="fixed bottom-[80px] right-4 flex flex-col items-end z-20">
        <div className="mb-2 relative rounded-lg bg-black text-white text-xs font-bold px-3 py-1.5 shadow-lg animate-bounce">
          +100포인트 적립!
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-black rotate-45"></div>
        </div>
        <button
          onClick={() => setWriteModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
        >
          <PenSquare className="size-5" />
          <span className="font-bold">작성하기</span>
        </button>
      </div>

      {/* 작성하기 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">새로운 게시글 작성</h2>
              <button
                onClick={() => setWriteModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="mb-4">
              <textarea
                value={writeText}
                onChange={(e) => setWriteText(e.target.value)}
                placeholder="산행 후기나 팁, 질문을 자유롭게 남겨보세요!"
                className="w-full h-32 md:h-40 bg-gray-50 rounded-xl p-4 text-[15px] text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-gray-400 border border-transparent transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between">
              <button className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium">
                <ImageIcon className="size-5" />
                <span className="hidden sm:inline">사진 추가</span>
              </button>
              <button
                onClick={handlePostSubmit}
                disabled={!writeText.trim()}
                className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-full disabled:bg-gray-200 disabled:text-gray-400 hover:bg-emerald-600 transition-colors shadow-sm"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostImageGrid({ images }: { images: string[] }) {
  return (
    <div className="mt-3 grid aspect-[4/3] grid-cols-2 gap-1 overflow-hidden rounded-xl">
      {images.slice(0, 4).map((img, idx) => {
        const optimizedImg = img.includes("unsplash.com") && !img.includes("?")
          ? `${img}?auto=format&fit=crop&w=400&q=60`
          : img;
          
        return (
          <div key={`${img}-${idx}`} className="relative h-full w-full bg-gray-200">
            <img
              src={optimizedImg}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-80"
              alt={`첨부이미지 ${idx + 1}`}
            />
            {idx === 3 && images.length > 4 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="text-lg font-bold text-white">+{images.length - 4}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

