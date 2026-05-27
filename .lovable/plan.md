
## 1차 빌드 범위

상세서 v1.0 중 **디자인 시스템 전체 + Screen 01(홈)**을 구현합니다. 나머지 화면(설문/추천결과/지도/기록/마이)은 라우트 스텁만 만들어서 하단 탭바가 동작하도록 합니다. Lovable Cloud를 활성화하고 이메일 + Google 로그인을 붙입니다.

## 산출물

### 1) 디자인 토큰 & 글로벌 스타일
- `src/index.css` — 상세서 §1.2 CSS 변수 전체(색상, 간격, 모서리, 그림자, 트랜지션, z-index) 등록
- `tailwind.config.ts` — `forest-*`, `sage-*`, `earth-*`, `warm-*`, semantic 색상, `space-*`, `radius-*`, `shadow-*`를 HSL 토큰으로 매핑
- Pretendard + Noto Serif KR 웹폰트 로드, `index.html`에 `lang="ko"` 및 viewport meta
- `prefers-reduced-motion`, 포커스 링, 스킵 링크 글로벌 규칙 (§10)

### 2) 공통 컴포넌트 (`src/components/ui/forest/`)
- `Button` — variant: primary/secondary/ghost/danger, size: sm/md/lg/xl, loading prop (§5.1)
- `Card` — variant: default/highlight/ai/compact, interactive 호버 효과 (§5.2)
- `Badge` — 환경(좋음/보통/나쁨), AI 추천, 난이도 (§5.5)
- `SkeletonRow`, `SkeletonCard` — shimmer 애니메이션 (§5.8)
- `Header` (상단 56/64px, fixed) (§5.7)
- `BottomTabBar` (5개 탭, safe-area 대응) (§5.7)
- `AppLayout` — Header + main(상하단 패딩) + BottomTabBar

### 3) Home 페이지 `src/pages/Home.tsx` (§6.1)
Section A~E를 모두 구현 (초기엔 정적 mock 데이터):
- **A. 환경 카드** — Highlight 카드, 날씨/대기질/UV + "10분 전 업데이트"
- **B. AI CTA 카드** — Highlight, Sparkles 아이콘, "건강 설문 시작하기" → `/survey/step-1` 이동
- **C. 계절 큐레이션** — 가로 스크롤 (`snap-x mandatory`), 카드 140×180
- **D. 내 주변 치유 시설** — 240px placeholder 영역 + "지도 전체보기" Ghost 버튼 → `/map`
- **E. 나의 치유 기록** — Compact 카드 + "상세 보기 →"

비로그인 사용자에게는 Section B 카드가 "로그인하고 시작하기"로 표시됨.

### 4) 라우트 스텁
`/`(Home), `/auth`, `/survey/step-1`, `/result/:id`, `/map`, `/recommend`, `/records`, `/mypage` — 스텁 화면은 제목 + "준비 중" 메시지만 표시해서 탭바·CTA 흐름이 깨지지 않게 합니다.

### 5) Lovable Cloud 인증
- Cloud 활성화 → `auth.users` + `profiles` 테이블 (id, display_name, created_at) + RLS + 트리거
- `/auth` 페이지: 이메일/비밀번호 + Google 로그인 (탭 UI)
- `useAuth()` 훅 + `onAuthStateChange` 리스너
- Header 우측 프로필 아이콘 → 로그인 시 아바타, 비로그인 시 "로그인" 링크

## 기술 메모

- React + Vite + TypeScript + Tailwind + shadcn 기본 스택 유지. 상세서의 토큰은 shadcn 토큰과 충돌하지 않도록 별도 `forest-*` 네임스페이스로 추가.
- Lucide 아이콘만 사용 (§13). 이모지 금지.
- 색상은 HSL 변수로 등록 후 Tailwind에서 `hsl(var(--...))` 패턴.
- `font-variant-numeric: tabular-nums` 유틸 클래스 추가.

## 다음 단계(이번 빌드 이후)

- Screen 02 설문 7스텝 + 상태 관리
- Screen 03 AI 추천 결과 (Lovable AI Gateway / Gemini, Edge Function)
- Screen 04 지도 (Naver Maps API 키 발급 후)
- Screen 05/06 기록·마이페이지

승인하시면 위 1차 범위로 바로 구현 시작합니다.
