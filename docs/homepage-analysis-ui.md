# 공식 홈페이지 Gemini 분석 UI

## 동작 범위

- 시설 상세 `기본 정보` 영역에 `공식 홈페이지 분석하기` 버튼을 제공한다.
- 버튼 클릭 시 `POST /api/facility-homepage-analysis`가 먼저 URL 기준 고정 저장소를 확인한다.
- 고정 분석 결과가 있으면 Gemini를 다시 호출하지 않고 저장된 결과를 반환한다.
- 고정 결과가 없을 때만 Gemini URL Context 또는 서버 수집 텍스트 기반 분석을 실행한다.
- 성공한 Gemini 분석 결과는 Supabase `facility_homepage_analyses`에 저장한다.
- 다른 사용자가 같은 공식 홈페이지 URL을 조회하면 저장된 분석 결과를 그대로 볼 수 있다.

## 표시 정책

- 화면에는 `summary`, `usage`, `hours`, `fees`, `reservation`, `cautions` 카드만 표시한다.
- `status: "not_found"`이거나 `items`가 비어 있는 섹션은 표시하지 않는다.
- `출처`와 `분석시각` 카드는 사용자 화면에 표시하지 않는다.
- `sourceUrls`, `analyzedAt`, `missingSections`는 응답 데이터에는 남겨 검증과 저장 용도로만 사용한다.
- `retrievalStatus`가 `success`가 아니면 부분 분석 경고만 표시한다.

## 캐시와 고정 저장

- 클라이언트는 같은 브라우저에서 중복 호출을 줄이기 위해 URL 기준 `localStorage` 캐시를 유지한다.
- 브라우저 캐시 TTL은 6시간이다.
- 서버는 Supabase 고정 저장소를 우선한다. 따라서 브라우저 캐시가 없어도 이미 생성된 분석은 Gemini를 재호출하지 않는다.
- 기존 `다시 분석하기` 동작은 제거했다. 결과가 이미 있으면 버튼 문구는 `공식 홈페이지 분석 결과 보기`로 표시한다.

## 대체 경로

- 분석 실패 시 오류 메시지 아래에 `공식 홈페이지 열기`, `검색으로 찾기` 링크를 유지한다.
- Supabase 설정이 없거나 저장 실패가 발생해도 Gemini 분석 응답 자체는 차단하지 않는다.
