# API Integration

## 2026-05-26 Forest Plant CSV Migration

- The plant guide no longer calls the public Forest Service plant API at runtime.
- The app reads `api가이드파일/산림청_숲에 사는 식물 정보_20240826_정제.csv` on the server and maps it to `ForestPlantStoryList`.
- `/api/forest-plants` is now an internal CSV-backed route. It does not require `FOREST_SERVICE_KEY` or `PUBLIC_DATA_SERVICE_KEY`.
- `/api/forest-plant-images` remains compatibility-only and returns `NO_IMAGE_FIELDS` because the cleaned CSV has no image fields.

## Visit records and effect analysis

- External API: none. Visit records are stored through the Supabase Edge Function `visit-records`.
- Client entry points:
  - `apiClient.saveVisitRecord(record)`
  - `apiClient.getVisitRecords()`
  - `useVisitRecords()`
  - `/records`
- Request fields submitted by the `/records` form:
  - `facilityName`: visit facility name
  - `visitDate`: visit date
  - `durationMinutes`: visit duration in minutes
  - `activities`: comma-separated UI input normalized to a string array
  - `preStress`, `postStress`: integer score from 1 to 10
  - `preSleep`, `postSleep`: `good`, `normal`, or `poor`
  - `moodChange`, `memo`: optional text
  - `photos`: currently submitted as an empty array
- Response mapping:
  - The Edge Function response is normalized by `mapVisitRecord()` into `VisitRecord`.
  - Loaded and newly created records are stored in `appStore.visitHistory.records`.
  - Summary metrics are derived in the store.
- Effect analysis:
  - `buildEffectAnalysis(records)` requires at least 3 visit records.
  - The current implementation is deterministic local analysis from visit records.
  - Gemini-based effect analysis is not wired yet.

## Saved courses

- External API: none. Saved courses are stored through the Supabase Edge Function `saved-courses`.
- Client entry points:
  - `apiClient.saveCourse(courseData)`
  - `apiClient.getSavedCourses()`
  - `apiClient.updateSavedCourse(id, updates)`
  - `apiClient.deleteSavedCourse(id)`
  - `useSavedCourses()`
  - `/result/$id`
  - `/mypage`
- Save request fields:
  - `recommendationId`: persisted recommendation id, when available
  - `title`: course title
  - `facilityName`: selected facility name
  - `memo`: optional user memo
  - `isBookmarked`: bookmark flag
- Response mapping:
  - The Edge Function response is normalized by `mapSavedCourse()` into `SavedCourse`.
  - Nested `recommendations` rows are normalized into `SavedCourse.recommendation`.
- Update/delete:
  - `PUT /functions/v1/saved-courses?id={savedCourseId}` updates `title`, `memo`, and `isBookmarked`.
  - `DELETE /functions/v1/saved-courses?id={savedCourseId}` deletes only the authenticated user's row.
- Duplicate prevention:
  - `POST /functions/v1/saved-courses` first checks the authenticated user's existing row by `recommendationId`.
  - If a matching row exists, the function returns the existing row instead of inserting another row.
- UI behavior:
  - `/result/$id` saves the current recommendation through `useSavedCourses().createCourse`.
  - `/mypage` fetches saved courses through `useSavedCourses().fetchCourses`.
  - `/mypage` can edit title/memo/bookmark state and delete saved courses.
  - Saved courses with `recommendationId` link back to `/result/$id`.

## Traditional village forests

- Target API: Forest Service `cultureInfoService/traVllgFrstOpenAPI`
- Request URL: `http://api.forest.go.kr/openapi/service/cultureInfoService/traVllgFrstOpenAPI`
- Server proxy: `GET /api/traditional-village-forests`
- Client entry point: `apiClient.getTraditionalVillageForests(params)`
- Request parameters:
  - `searchVllgNm`: traditional village forest name
  - `searchPlcNm`: location keyword
  - `pageNo`: page number
  - `numOfRows`: rows per page
  - `ServiceKey`: server-side public data service key
- Response fields normalized:
  - `travllgfrstnm` -> `name`
  - `matrlnmplc` -> `address`
  - `mainfoftrnm` -> `mainTreeSpecies`
  - `mainfrtpnm` -> `mainForestType`
  - `histrexmnncont` -> `historyContent`
  - `clturexmnncont` -> `cultureContent`
  - `zonearea` -> `zoneAreaSquareMeters`
- Map integration:
  - The live API does not provide coordinates and the `/openapi` service path returned timeout/503 responses in local checks.
  - Traditional village forest markers are not included in map startup data.
  - The downloaded `api가이드파일/traVllg_20141202` source folder is retained for reference only.
- Current limitation:
  - The XML API remains available in code for direct lookup tests, but it is not exposed as a user-facing map category.

## Facility detail view

- Route: `GET /facilities/$facilityId`
- UI entry point: map marker overlay `상세정보`
- External detail API: none. The detail page reuses the map facility corpus already loaded by `apiClient.getFacilities()`.
- Supported user-facing categories:
  - `healing_forest`: detail fields come from `/api/healing-forests` plus the local coordinate registry.
  - `recreation_forest`: detail fields come from `/api/recreation-forests`.
  - `arboretum`: detail fields come from the converted SHP/DBF source `api가이드파일/TB_FGDI_FS_HS`.
- Category source profiles shown on the page:
  - Healing forest request parameters: `page`, `perPage`.
  - Healing forest output fields used: `region`, `facilityName`, `address`, `telephoneNumber`, `homepage`, `participationMethod`, `operator`.
  - Recreation forest request parameters: `pageNo`, `numOfRows`, `rcrfrstNm`, `ctprvnNm`, `rcrfrstType`, `rcrfrstAr`, `aceptncCo`, `admfee`, `stayngPosblYn`, `mainFcltyNm`, `rdnmadr`, `institutionNm`, `telephoneNumber`, `homepageUrl`, `latitude`, `longitude`, `referenceDate`, `instt_code`.
  - Recreation forest output fields used: `rcrfrstNm`, `ctprvnNm`, `rcrfrstType`, `rcrfrstAr`, `aceptncCo`, `admfee`, `stayngPosblYn`, `mainFcltyNm`, `rdnmadr`, `institutionNm`, `telephoneNumber`, `homepageUrl`, `latitude`, `longitude`, `referenceDate`, `instt_code`.
  - Arboretum runtime request parameters: none.
  - Arboretum source fields used: `OBJ_ID`, `OWNER_NM`, `RCAR_SCTIN`, `RCAR_NM`, `DTADD`, `SITE_URL`, `EMNDN_CD`, `EMNDN_NM`, `TEL_NO`, converted coordinates.
- Current limitation:
  - The detail page does not call Tourism `detailWithTour2`, because current facility records do not have Tourism `contentId`/`contentTypeId`.
  - Arboretum data is static source-file data; operating hours, admission fees, and real-time status are not available from the bundled SHP/DBF fields.

## Facility detail image curation

- Routes:
  - `GET /api/facility-image-curation?facilityId={facilityId}` reads the pinned Supabase result.
  - `POST /api/facility-image-curation` runs Gemini curation when no pinned Supabase result exists.
- Client entry points:
  - `apiClient.getPinnedFacilityImages(facilityId)`
  - `apiClient.curateFacilityImages(facilityId, facilityName, images)`
- Search query basis: facility name only for healing forests, recreation forests, and arboretums. Region/address text is no longer prepended for those types because regional terms can pull news, land-ownership, map, or administrative-document images unrelated to the facility.
- Kids forest exception: `kids_forest` image lookup keeps the facility name as the primary query, then adds address-derived city/district scoped queries such as `{시} {시설명에서 선행 시명 제거}` and `{구} {시설명에서 선행 시명 제거}`. Full street addresses and lot numbers are not used as image queries.
- Candidate source order:
  - Naver Image Search official-domain query by facility type.
  - Naver Image Search general query with the facility name only.
  - Kakao Image Search fallback when Naver candidates are insufficient.
- Candidate cap:
  - Facility detail image collection and Gemini pixel analysis are capped at 15 candidates per facility to reduce initial detail-page latency.
- Gemini curation:
  - Runs server-side so Gemini keys are not exposed to the browser.
  - Downloads each candidate image URL, validates image MIME type and size, and sends the actual image bytes to Gemini as `inlineData`.
  - Uses caption/source metadata only as supporting context. The accept/reject decision is based on pixel analysis plus metadata.
  - Accepts only images scored at least 70 by Gemini and categorized as `scenery`, `facility`, or `experience`.
  - Rejects news screenshots, maps, drawings, documents, posters, banners, logos, people-centered event images, and land/real-estate related images.
- Pinned image cache:
  - Supabase table: `public.facility_image_curations`
  - Migration: `supabase/migrations/20260525061458_create_facility_image_curations.sql`
  - After Gemini successfully judges a facility gallery, the accepted image list is upserted by facility ID through the server route using the Supabase service-role key.
  - On later visits to the same facility, the detail hook asks the server for the pinned gallery first and skips Naver/Kakao image search plus Gemini pixel curation when Supabase has a record.
  - Gemini-key-missing and Gemini-error fallbacks are not pinned, because those responses contain unverified candidate images.
- Fallback behavior:
  - If Gemini key is missing or Gemini/image download fails before judgment, the original candidates are returned with `cached: true`.
  - If Gemini successfully judges all candidates as unsuitable, the gallery can be empty instead of showing unrelated images.

### 2026-05-24 Homepage URL normalization

- Root cause: facility homepage fields come from public-data/static source files and include stale organization URLs. Some still respond normally, but some return 404 pages or upstream application errors.
- Audit scope: healing forest static data, healing forest live odcloud response, recreation forest live response, and static arboretum data.
- Local audit result: 277 source rows produced 217 unique homepage URLs. 185 returned HTTP 200 without detected error body. 8 were confirmed broken by HTTP 404 or an explicit error body. 24 returned timeout/network errors from the local audit environment and were not treated as confirmed stale URLs without an official replacement.
- Confirmed Biseulsan behavior: the legacy `http://www.dssiseol.or.kr/gil/pages/course/page.html?mc=0148` page returns HTTP 200 with body `Failed connecting to MySQL DB`; this is an upstream website failure, not a failure of the app's public-data API proxy.
- All facilities now pass through `normalizeFacilityHomepages()` after the combined facility corpus is built. The function normalizes both `FacilityInfo.homepage` and homepage values repeated inside `detailSections`.
- Confirmed replacement URLs currently applied:
  - Biseulsan healing forest: `https://yeyak.dssiseol.or.kr/index.do?menu_id=00004765`
  - Daebongsan healing forest: `https://www.hygn.go.kr/02147/02178.web`
  - Korea National Arboretum: `https://kna.forest.go.kr/`
  - Bongsusan Arboretum: `https://www.yesan.go.kr/arbor/index.do`
  - Bucheon Mureungdowon Arboretum: `https://reserv.bucheon.go.kr/site/main/see/detail?program_seq=1392`
  - Garden of Morning Calm: `https://www.morningcalm.co.kr/`
  - Seoul National University Arboretum: `https://arbor.snu.ac.kr/`
  - Sandulsori Arboretum: `http://www.sandulsori.co.kr/default/01/menu01.php`

## Naver Maps REST APIs

- Target API: Naver Maps Geocoding REST API
- Request URL: `https://maps.apigw.ntruss.com/map-geocode/v2/geocode`
- Server proxy: `GET /api/geocode?query={address}`
- Client entry point: `apiClient.geocodeAddress(query)`
- Request headers sent server-side:
  - `x-ncp-apigw-api-key-id`: `NAVER_MAPS_CLIENT_ID`
  - `x-ncp-apigw-api-key`: `NAVER_MAPS_CLIENT_SECRET`
- Response fields normalized:
  - `roadAddress`
  - `jibunAddress`
  - `x` -> `lng`
  - `y` -> `lat`
- Current usage:
  - Traditional village forest address-to-coordinate conversion for map display.
- Target API: Naver Maps Directions 5 REST API
- Request URL: `https://maps.apigw.ntruss.com/map-direction/v1/driving`
- Server proxy: `GET /api/naver-direction?start={lng},{lat}&goal={lng},{lat}`
- Client entry point: `fetchNaverDrivingRoute(origin, destination)`
- Request headers sent server-side:
  - `x-ncp-apigw-api-key-id`: `NAVER_MAPS_CLIENT_ID`
  - `x-ncp-apigw-api-key`: `NAVER_MAPS_CLIENT_SECRET`
- Response fields normalized:
  - `summary.distance` -> `distance`
  - `summary.duration` milliseconds -> `duration` seconds
  - `summary.taxiFare` -> `taxiFare`
  - `summary.tollFare` -> `tollFare`
  - `path` `[lng, lat]` coordinates -> `{ lat, lng }[]`
  - `guide` entries -> route guidance points
- Current usage:
  - Facility detail transport map displays a Naver driving route polyline when the server proxy returns a valid route.
  - The same transport map exposes a driving mode that switches to a full-viewport navigation layout with black guidance text, map-first controls, and a bottom route summary.
  - If credentials are missing, the upstream API rejects access, or no route is found, the UI falls back to external Naver/Kakao route links.
- Not implemented:
  - Reverse geocoding.

## Supabase 환경 변수

`VITE_SUPABASE_URL`은 Supabase 프로젝트 루트 URL만 사용한다.
`/rest/v1` 같은 REST 엔드포인트 경로를 포함하면 `supabase.functions.invoke()`가
`/rest/v1/functions/v1/{functionName}` 형태의 잘못된 URL을 만들고 Edge Function 호출이 404로 실패한다.

```dotenv
VITE_SUPABASE_URL=https://cewvsyvlzovjelyyzkzv.supabase.co
```

## Google Gemini AI 추천 생성

- 대상 API: Google Gemini `generateContent`
- 모델: `gemini-3-flash-preview`
- 호출 URL: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- 서버 프록시: `POST /api/recommendation`
- 구현 파일:
  - `src/lib/gemini-recommendation.ts`
  - `src/lib/gemini-recommendation-api-route.ts`
  - `src/routes/api/recommendation.ts`
  - `src/lib/api-client.ts`
  - `src/hooks/useRecommendation.ts`

### 환경변수

Gemini API 키는 브라우저에 노출하지 않고 서버 환경에서만 사용한다.

```dotenv
GEMINI_API_KEY=Google_Gemini_API_KEY
GEMINI_MODEL=gemini-3-flash-preview
```

`GEMINI_MODEL`이 없으면 앱 기본값으로 `gemini-3-flash-preview`를 사용한다.

### 2026-05-23 위치 기반 추천 및 fallback 동작

- `/recommend`는 추천 생성 전에 브라우저 위치 권한을 요청한다. 사용자가 위치를 거부하거나 `위치 없이 추천`을 선택하면 좌표 없이 추천을 계속 생성한다.
- 좌표가 있으면 기존 서버 프록시를 통해 날씨, 대기질, 자외선 정보를 먼저 조회한 뒤 `useRecommendation`에 전달한다.
- `apiClient.generateRecommendation()`은 설문 응답, 환경 스냅샷과 함께 `location: { lat, lng }`를 `/api/recommendation` 본문에 포함한다.
- `/api/recommendation`은 사용자 좌표와 후보 시설 좌표의 직선거리 기반 이동시간 추정치를 후보 시설에 붙이고, `maxTravelTime` 점수에 반영한 뒤 Gemini에 선택 후보를 전달한다.
- Gemini 호출 실패는 더 이상 로컬 Mock 추천으로 숨기지 않는다. 서버는 공공데이터 기반으로 점수화한 기본 추천을 `cached: true`와 함께 반환한다.
- `GEMINI_API_KEY` 누락 같은 설정 오류와 추천 프록시의 무데이터 실패는 실패 응답으로 유지한다.

### 적용 기준

- 설문 응답은 `useSurveyStore`에서 읽어 `POST /api/recommendation` 본문으로 전달한다.
- 비로그인 사용자는 설문 완료 시 Supabase `health-profile` Edge Function을 호출하지 않고 로컬 `healthProfile` 상태만 만든다. 로그인 사용자는 기존처럼 `health-profile`에 저장한다.
- 비로그인 추천 생성은 Supabase `recommendations` 저장 호출을 생략하고 생성 결과를 앱 상태에만 보관한다.
- 서버는 공공 시설 후보군과 환경 정보를 신뢰 가능한 기본값으로 두고, Gemini가 생성한 `matchReason`, 코스 일정, 기대효과, 주의사항만 병합한다.
- Gemini 응답은 JSON만 허용하며, 일정 `type`은 앱 타입(`forest_bathing`, `meditation`, `walking`, `education`, `yoga`, `experience`, `observation`)으로 정규화한다.
- Gemini 호출 실패 시 `/api/recommendation`은 공공데이터 기반 기본 추천을 반환한다. 추천 프록시가 데이터 없이 실패하면 `apiClient.generateRecommendation()`은 실패 응답을 반환하고 Mock 추천으로 대체하지 않는다.

## 공식 홈페이지 Gemini 분석

- 대상 API: Google Gemini `generateContent`
- 서버 프록시: `GET /api/facility-homepage-analysis?homepageUrl={url}`, `POST /api/facility-homepage-analysis`
- 구현 파일:
  - `src/lib/facility-homepage-analysis.ts`
  - `src/lib/facility-homepage-analysis-api-route.ts`
  - `src/lib/facility-homepage-analysis-store.ts`
  - `src/routes/api/facility-homepage-analysis.ts`
  - `src/server.ts`
  - `supabase/migrations/20260525162000_create_facility_homepage_analyses.sql`
- 요청 본문:

```json
{
  "facilityName": "자굴산 자연휴양림",
  "homepageUrl": "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
  "facilityType": "recreation_forest",
  "address": "경상남도 의령군 가례면 자굴산휴양로 23"
}
```

### Phase 1 적용 기준

- 브라우저에서 Gemini API 키를 직접 사용하지 않는다. 서버 환경변수 `GEMINI_API_KEY`만 사용한다.
- `homepageUrl`은 공개 `http`/`https` URL만 허용한다. `localhost`, 사설 IPv4, 메타데이터 호스트, `file:` URL은 요청 단계에서 거부한다.
- 1차 분석은 Gemini URL Context 도구(`tools: [{ "url_context": {} }]`)로 수행한다.
- URL Context 호출 실패 시 서버가 공식 URL 본문을 직접 fetch하고, HTML을 텍스트로 정리해 Gemini에 다시 전달한다. 이 경우 `retrievalStatus`는 `partial`로 고정한다.
- `foresttrip.go.kr` URL에서 `hmpgId`가 확인되면 할인정책, 이용요금, 이용객준수사항 공식 하위 URL을 함께 분석 대상에 포함한다.
- 응답 섹션은 `summary`, `usage`, `hours`, `fees`, `reservation`, `cautions`만 허용한다.
- 공식 페이지에서 근거가 확인된 항목만 `sections`에 남긴다. 확인되지 않은 항목은 빈 카드로 만들지 않고 `missingSections`에 기록한다.
- 출처 URL이 없는 항목은 `found`로 처리하지 않고 `uncertain`으로 낮춘다.
- `GET`은 Supabase 고정 저장소에서 URL 기준 분석 결과만 조회한다. 고정 결과가 없으면 `data: null`, `cached: false`를 반환한다.
- `POST`는 Supabase 고정 저장소를 먼저 조회한다. 저장된 결과가 있으면 Gemini를 호출하지 않고 `cached: true`로 반환한다.
- 저장된 결과가 없고 Gemini 분석이 성공하면 `facility_homepage_analyses`에 결과를 고정 저장한다.
- 사용자 화면에는 `sourceUrls`, `analyzedAt` 기반의 출처/분석시각 카드를 표시하지 않는다.

### 응답 형태

```json
{
  "success": true,
  "data": {
    "facilityName": "자굴산 자연휴양림",
    "homepageUrl": "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
    "analyzedAt": "2026-05-25T00:00:00.000Z",
    "retrievalStatus": "success",
    "sections": [
      {
        "type": "fees",
        "title": "요금",
        "status": "found",
        "items": ["공식 홈페이지에서 확인된 요금 안내"],
        "sourceUrls": [
          "https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=ID02030113&menuId=004002005&ruleId=205"
        ]
      }
    ],
    "missingSections": ["hours", "reservation"],
    "sourceUrls": ["https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113"]
  }
}
```

## Naver Maps

- 대상 API: NAVER Cloud Platform Maps `Dynamic Map`
- 선택 권장 API:
  - 필수: `Dynamic Map`
  - 선택: `Geocoding`, `Reverse Geocoding`, `Directions 5`
- SDK URL: `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId={Client ID}`
- 구현 파일:
  - `src/lib/naver-maps.ts`
  - `src/lib/naver-maps.test.ts`
  - `src/components/forest/Map/NaverMap.tsx`

### 환경변수

```dotenv
VITE_NAVER_MAPS_CLIENT_ID=Naver_Maps_Client_ID
NAVER_MAPS_CLIENT_ID=Naver_Maps_Client_ID
NAVER_MAPS_CLIENT_SECRET=Naver_Maps_Client_Secret
```

- `VITE_NAVER_MAPS_CLIENT_ID`는 브라우저에서 Dynamic Map SDK를 로드하기 위한 공개 Client ID다.
- `NAVER_MAPS_CLIENT_SECRET`은 서버 전용 값이며 브라우저 번들에 넣지 않는다.
- Supabase Edge Functions에는 `NAVER_MAPS_CLIENT_ID`, `NAVER_MAPS_CLIENT_SECRET`만 secret으로 등록한다.
- Naver Cloud Platform Application의 Web 서비스 URL에는 로컬 개발 주소와 배포 주소를 등록해야 한다. 로컬 기준 `http://localhost:8080`, `http://127.0.0.1:8080`, 현재 개발 포트가 다르면 해당 `localhost`/`127.0.0.1` 포트를 함께 등록한다.

### 구현 기준

- 지도 화면은 Naver Maps SDK 로드 성공 시 실제 Naver 지도 위에 치유의숲 마커와 숲길 polyline을 표시한다.
- 지도 화면은 시설 밀집 지역도 클러스터 마커로 묶지 않고 개별 시설 핀을 그대로 표시한다.
- 지도 화면 진입 시 좌표가 없고 브라우저 Geolocation 권한이 아직 `prompt`이면 `requestLocation()`을 1회 자동 실행한다. 권한 거부 또는 로딩 중에는 반복 요청하지 않는다.
- Geolocation 실패 중 명시적 권한 거부만 `denied`로 저장한다. 위치 확인 불가 또는 timeout은 권한 상태를 `prompt`로 유지하고 콘솔 오류를 남기지 않는다.
- 지도 시설 목록은 브라우저 Geolocation으로 확보한 현재 좌표가 있으면 `src/lib/nearby-facilities.ts`의 거리 계산 결과로 정렬한다. 좌표가 없거나 거부된 경우에는 기존 시설 데이터 순서를 유지한다.
- 모바일 지도 하단 시설 목록은 Vaul/Radix Dialog 기반 Drawer가 아니라 일반 `section`으로 렌더링한다. 영구 노출 목록이 배경 화면을 `aria-hidden` 처리하지 않아 포커스 보존 경고가 발생하지 않는다.
- Naver 지도 인스턴스는 현재 좌표가 갱신될 때 사용자 마커만 추가하지 않고 `setCenter`로 지도 중심도 함께 이동한다.
- Client ID 누락, SDK 로딩 실패, Web 서비스 URL 미등록으로 인한 인증 실패처럼 SDK namespace가 있어도 `LatLng`/마커 생성자가 정상 동작하지 않는 경우 기존 정적 좌표 투영 지도를 fallback으로 표시한다.
- 마커 클릭 이벤트는 기존 `selectedFacilityId` 흐름을 유지한다.
- Naver SDK가 지도 컨테이너의 `position` inline style을 덮어쓰므로 SDK mount 대상에는 `h-full w-full`을 명시한다. 그렇지 않으면 타일 요청은 성공해도 컨테이너 높이가 0으로 접혀 지도가 회색으로 보인다.

## 기상청 단기예보 조회서비스

- 대상 API: `VilageFcstInfoService_2.0/getVilageFcst`
- 가이드 파일:
  - `api가이드파일/기상청41_단기예보 조회서비스_오픈API활용가이드_241128.docx`
  - `api가이드파일/기상청41_단기예보 조회서비스_오픈API활용가이드_격자_위경도(2510).xlsx`
- 서버 프록시: `GET /api/weather?lat={위도}&lng={경도}`
- 구현 파일:
  - `src/lib/kma-short-term-forecast.ts`
  - `src/lib/weather-api-route.ts`
  - `src/lib/api-client.ts`

### 환경변수

서버 런타임에 아래 값을 설정해야 실제 기상청 API가 호출된다.

```dotenv
KMA_SERVICE_KEY=공공데이터포털_단기예보_서비스키
```

Cloudflare 배포 시에는 `wrangler secret put KMA_SERVICE_KEY`로 등록한다.

### 구현 기준

- 브라우저는 기상청 API를 직접 호출하지 않는다.
- `apiClient.getWeather()`는 `/api/weather` 서버 프록시를 호출한다.
- 서버는 `lat/lng`를 기상청 격자 `nx/ny`로 변환한다.
- 단기예보 발표시각은 KST 기준 `0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300`이며, 각 발표시각 10분 이후부터 해당 `base_time`을 사용한다.
- 기상청 응답의 `TMP, TMN, TMX, SKY, PTY, POP, REH, WSD`를 앱의 `WeatherData`로 정규화한다.

### 아직 연결하지 않은 항목

- 초단기실황 `getUltraSrtNcst`
- 초단기예보 `getUltraSrtFcst`
- 예보버전 `getFcstVersion`

## 기상청 생활기상지수 조회서비스

- 대상 API: `LivingWthrIdxServiceV5/getUVIdxV5`
- 가이드 파일:
  - `api가이드파일/생활기상지수 조회서비스(3.0)_오픈API활용가이드★★.docx`
  - `api가이드파일/dfs-zone-tree_excel_20260325.xlsx`
- 참고: 제공된 문서 파일명은 생활기상지수 조회서비스(3.0)이지만, 공공데이터포털 현행 API 목록의 자외선지수 엔드포인트는 V5이므로 구현은 V5 URL을 기준으로 한다.
- 서버 프록시: `GET /api/uv-index?lat={위도}&lng={경도}`
- 구현 파일:
  - `src/lib/kma-living-weather.ts`
  - `src/lib/uv-index-api-route.ts`
  - `src/routes/api/uv-index.ts`
  - `src/lib/api-client.ts`

### 구현 기준

- 브라우저는 생활기상지수 API를 직접 호출하지 않는다.
- `apiClient.getUvIndex()`는 `/api/uv-index` 서버 프록시를 호출한다.
- 서버는 좌표와 가장 가까운 광역 행정구역 `areaNo`를 선택한다.
- `dfs-zone-tree_excel_20260325.xlsx`의 광역 행정구역 좌표를 기준으로 `areaNo`를 매핑한다.
- 자외선지수 발표시각은 문서 기준 `06시`, `18시`를 사용한다.
- V5 응답의 `h0`, `h3`, `h6` ... `h75` 예측값 중 가장 가까운 사용 가능 시각을 선택하고 `forecastHour`로 정규화한다.
- 지수 단계는 문서 기준 `0~2 낮음`, `3~5 보통`, `6~7 높음`, `8~10 매우높음`, `11+ 위험`으로 정규화한다.

## 한국환경공단 에어코리아 대기질/측정소정보

- 대상 API:
  - `MsrstnInfoInqireSvc/getMsrstnList`
  - `ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty`
- 가이드 파일:
  - `api가이드파일/한국환경공단 에어코리아 OpenAPI 기술문서_2026.02.12/한국환경공단_에어코리아_측정소정보_기술문서_v1.2.docx`
  - `api가이드파일/한국환경공단 에어코리아 OpenAPI 기술문서_2026.02.12/한국환경공단_에어코리아_대기오염정보_기술문서_v1.3.docx`
- 서버 프록시: `GET /api/air-quality?lat={위도}&lng={경도}`
- 구현 파일:
  - `src/lib/airkorea.ts`
  - `src/lib/air-quality-api-route.ts`
  - `src/routes/api/air-quality.ts`
  - `src/lib/api-client.ts`

### 환경변수

에어코리아 API 활용신청이 승인된 공공데이터포털 서비스키를 서버 환경에 설정한다.

```dotenv
AIRKOREA_SERVICE_KEY=공공데이터포털_에어코리아_서비스키
```

`AIRKOREA_SERVICE_KEY`가 없으면 `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서로 대체 사용한다. 단, 공공데이터포털은 API별 활용신청 상태에 따라 같은 키라도 특정 API에서 403을 반환할 수 있다.

### 구현 기준

- 브라우저에서 에어코리아 API를 직접 호출하지 않는다.
- `apiClient.getAirQuality()`는 `/api/air-quality` 서버 프록시를 호출한다.
- 서버는 입력 좌표와 가장 가까운 시도를 먼저 선택하고, `getMsrstnList`로 해당 시도 측정소 목록을 조회한다.
- 측정소정보 응답의 `dmX`, `dmY`는 문서/포털 표기에서 좌표 순서가 혼재하므로 한국 위경도 범위로 판별해 보정한다.
- 측정소 목록 중 입력 좌표와 가장 가까운 측정소를 선택한 뒤 `getMsrstnAcctoRltmMesureDnsty`로 실시간 측정값을 조회한다.
- 대기질 응답은 `PM10`, `PM2.5`, `O3`, `Khai`, 등급값, 측정소명/주소/거리로 정규화한다.

## 산림청 산림교육프로그램

- 대상 API: `cultureInfoService/frstEduInfoOpenAPI`
- 요청 URL: `http://api.forest.go.kr/openapi/service/cultureInfoService/frstEduInfoOpenAPI`
- 서버 프록시: `GET /api/forest-education-programs`
- 적용 상태: 사용자 상세 화면, 지도 시설 enrichment, 추천 후보 enrichment에서 사용하지 않는다.
- 구현 파일:
  - `src/lib/forest-education.ts`
  - `src/lib/forest-education-api-route.ts`
  - `src/routes/api/forest-education-programs.ts`
  - `src/lib/api-client.ts`
  - `src/components/forest/ProgramInfoSection.tsx`
  - `src/routes/programs.tsx` (`/map` redirect only)

### 요청 파라미터

- `eduType`: 데이터 구분 값
- `searchTitl`: 제목 검색어
- `searchCont`: 내용 검색어
- `pageNo`: 페이지 번호
- `numOfRows`: 표시 항목 수
- `ServiceKey`: 산림청 서비스 인증키

### 구현 기준

- 브라우저에서 산림청 API를 직접 호출하지 않는다.
- `apiClient.getFacilities()`는 산림교육프로그램 API를 호출하지 않는다. `eduType=4`의 `period`, `tel` 값이 시설 대표 운영기간/대표전화 또는 실제 예약 문의처와 다르게 확인되는 사례가 있어 사용자 상세 화면에서 제거했다.
- `/api/kids-forests`도 산림교육프로그램 `eduType=1` 설명 후보를 추가 병합하지 않는다. 유아숲체험원은 별도 유아숲체험원 ODCloud API와 좌표 seed 기준의 운영기간/전화번호만 사용한다.
- 사용자용 `/programs` 검색 화면은 제거했다. 직접 접근 시 `/map`으로 리다이렉트한다.
- 시설 상세 페이지의 프로그램 탭은 산림교육프로그램 API 카드를 렌더링하지 않는다. 치유의숲은 `FacilityInfo.programs`, `operatingHours`, `address`, `tel` 기반의 시설 프로그램 카드만 표시하고, 자연휴양림은 공식 채널 예약 안내만 표시한다.
- 산림교육프로그램 응답은 검증용 프록시와 파서 테스트만 유지한다. 사용자에게 프로그램 운영기간/전화번호로 노출하지 않는다.
- 산림교육 운영정보 실시간 API가 로컬 검증에서 timeout/502/503 계열로 정상 XML을 반환하지 않아, 사용자 UI에는 전체 조회와 조건 검색을 모두 노출하지 않는다.
- `/api/forest-education-programs` 프록시는 향후 재검증을 위해 남겨둔다.
- 산림청 API는 XML 응답만 제공하므로 서버에서 JSON으로 정규화한다. HTML 리다이렉트 등 `<response>` XML이 아닌 응답은 빈 정상 목록으로 처리하지 않고 오류로 처리한다.
- 가이드 표기 기준 응답 필드 `rgdt`, `facnm`, `mnagnnm`을 앱 필드 `registeredAt`, `facilityName`, `managementAgency`로 정규화한다. `eduType=4` 응답은 `title`, `cont`가 필수가 아니므로 `facnm`을 카드 제목 대체값으로 사용한다.
- 외부 API 응답이 느린 편이므로 프록시에 `max-age=21600` 캐시 헤더를 설정한다.
- 키는 `FOREST_SERVICE_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서로 사용한다.
- 서비스키는 따옴표만 제거하고 원문 패딩(`=`)은 보존한다.
- 프록시 호출은 실시간 API를 먼저 호출한다. 실시간 API 연결 실패, 타임아웃, 비XML 응답이 발생하면 HTTP 200의 `{ success: false, data: null, error }` payload로 정규화해 선택적 enrichment 실패가 브라우저 네트워크 오류로 노출되지 않게 한다. 서비스키 미설정은 서버 구성 오류이므로 HTTP 500으로 유지한다.
- 2026-05-23 로컬 검증에서 산림청 공식 개방목록 표기 기준인 `api.forest.go.kr` 호스트의 TCP 연결은 성공했지만, API HTTP 응답은 timeout으로 재현됐다. 비XML 응답은 빈 정상 목록으로 오인하지 않고 오류로 처리한다.

## 산림청 숲에 사는 식물정보

- 데이터 소스:
  - `api가이드파일/산림청_숲에 사는 식물 정보_20240826_정제.csv`
  - 원본: `api가이드파일/산림청_숲에 사는 식물 정보_20240826.csv`
  - 정제 기준: `docs/forest-plants-csv-cleaning.md`
- 서버 프록시:
  - `GET /api/forest-plants?searchWrd={식물명}&pageNo=1&numOfRows=10`
  - `GET /api/forest-plant-images`는 하위 호환 라우트만 유지하며 항상 빈 목록을 반환한다.
- 구현 파일:
  - `src/lib/forest-plants.ts`
  - `src/lib/forest-plants-api-route.ts`
  - `src/routes/api/forest-plants.ts`
  - `src/routes/api/forest-plant-images.ts`
  - `src/lib/api-client.ts`
  - `src/hooks/usePlants.ts`
  - `src/routes/plants.tsx`

### 응답 정규화 필드

- 식물 목록: `숲이야기순번`, `구분`, `식물명`, `영문명`, `안내`, `학명`, `식물분류군명`, `서식장소`, `식물의일생`, `식물이야기설명`, `식물자료제공`, `등록일`
- 이미지 필드: 없음. 정제 CSV에는 `이미지`, `사진`, `img`, `image`, `file`, `파일` 계열 필드가 없다.

### 구현 기준

- 브라우저에서 산림청 식물 외부 API를 직접 호출하지 않는다.
- 식물 목록 조회는 TanStack file-route `src/routes/api/forest-plants.ts`에서 서버 파일 데이터를 읽어 처리한다.
- `apiClient.getPlants(searchWrd)`는 내부 `/api/forest-plants` route를 호출한 뒤 앱의 `PlantInfo[]`로 매핑한다.
- `apiClient.getPlantImages(storyId)` 및 `/api/forest-plant-images`는 기존 호출부 호환을 위해 유지하지만, 정제 CSV에 이미지 필드가 없으므로 `resultCode: "NO_IMAGE_FIELDS"`, `items: []`를 반환한다.
- `/plants` 화면은 검색어를 `usePlants(searchQuery)`로 전달해 서버 프록시 검색을 수행한다.
- `/plants` 화면의 상단 산림청 식물 도감 검색은 식물 항목이 선택되면 정제 CSV 기반 설명, 서식장소, 안내문을 같은 박스 안에 표시한다.
- `식물이야기설명`은 정제 CSV에서 문장 마무리된 값을 우선 사용한다. 더 이상 `식물의일생`을 `식물이야기설명` 대체문으로 복사하지 않는다.
- `/plants` 화면은 CSV 조회 결과가 비어 있거나 실패할 경우 로컬 예시 식물 카드를 표시하지 않고 오류/빈 상태를 표시한다.
- `/plants` 화면은 산림청 식물 도감 상세에 `정제 CSV에는 이미지 필드가 없습니다.`를 표시한다.
- `/plants`의 식물 목록 조회는 12초 client timeout을 적용하고, 실패 시 React Query 재시도를 하지 않는다.
- 현재 홈 화면은 Template-style 랜딩 페이지이며 데이터 기반 추천 카드를 직접 렌더링하지 않는다. 홈의 주요 진입점은 `/survey/step-1`, `/map`, `/plants`다.
- 지도 화면은 `curation` 쿼리를 계속 지원한다. `/map?curation={id}`로 진입하면 시설 유형과 조건 필터를 초기화하고 관련 마커와 하단 시설 목록만 표시한다. 검색창은 사용자 직접 검색 전용이며 큐레이션 기본 문구를 넣지 않는다.
- 지원하는 큐레이션 ID는 `registered-healing-forest`, `activity-recreation-forest`, `small-capacity-recreation-forest`, `lodging-recreation-forest`이다. 조건은 `src/lib/curation-map-filters.ts`에서 산림청\_치유의숲 현황의 시설 유형과 전국휴양림표준데이터의 `mainFcltyNm`, `aceptncCo`, `stayngPosblYn` 기반으로 판정한다.
- 지도 화면은 큐레이션이 적용된 경우 필터 제목, 데이터 기준, 추천 기준, 추천 후보 수를 상단 요약으로 표시한다.
- 2026-05-26 정제 CSV 기준 총 179건이다.
- 서버는 CSV 전체를 읽은 뒤 식물명/영문명/학명/분류/서식지/안내문/이야기 기준으로 로컬 필터링한다.
- 정제 CSV는 서버에서 앱 표준 `ForestPlantStoryList`로 정규화한다.
- 프록시에 `max-age=21600` 캐시 헤더를 설정한다.
- 식물 도감 조회에는 공공데이터포털 서비스키를 사용하지 않는다.

## 전국휴양림표준데이터

- 대상 API: `tn_pubr_public_rcrfrst_api`
- 요청 URL: `https://api.data.go.kr/openapi/tn_pubr_public_rcrfrst_api`
- 서버 프록시: `GET /api/recreation-forests`
- 구현 파일:
  - `src/lib/recreation-forest.ts`
  - `src/lib/recreation-forest-api-route.ts`
  - `src/routes/api/recreation-forests.ts`
  - `src/lib/api-client.ts`

### 요청 파라미터

- `pageNo`: 페이지 번호
- `numOfRows`: 한 페이지 결과 수. 공공데이터 설명 기준 최대 1000
- `rcrfrstNm`: 휴양림명
- `ctprvnNm`: 시도명
- `rcrfrstType`: 휴양림구분
- `rcrfrstAr`: 휴양림면적
- `aceptncCo`: 수용인원수
- `admfee`: 입장료
- `stayngPosblYn`: 숙박가능여부
- `mainFcltyNm`: 주요시설명
- `rdnmadr`: 소재지도로명주소
- `institutionNm`: 관리기관명
- `telephoneNumber`: 휴양림전화번호
- `homepageUrl`: 홈페이지주소
- `latitude`: 위도
- `longitude`: 경도
- `referenceDate`: 데이터기준일자
- `instt_code`: 제공기관코드

### 구현 기준

- 브라우저에서 공공데이터포털 API를 직접 호출하지 않고 `apiClient.getRecreationForests()`가 `/api/recreation-forests` 서버 프록시를 호출한다.
- 서버는 `type=json`으로 표준데이터 API를 호출하고 응답을 `RecreationForestList`로 정규화한다.
- `serviceKey`는 서버 환경변수에서만 읽는다. 우선순위는 `RECREATION_FOREST_SERVICE_KEY`, `FOREST_SERVICE_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서다.
- 로컬 프록시 기준 `GET /api/recreation-forests?numOfRows=1` 및 `numOfRows=1000` 호출에서 `resultCode=00`, `totalCount=183` 정상 응답을 확인했다.

## 산림청 치유의숲 현황

- 대상 API: `15107928/v1/uddi:bb6d1462-c89b-4007-9eaa-a0ced9e50fd9`
- 요청 URL: `https://api.odcloud.kr/api/15107928/v1/uddi:bb6d1462-c89b-4007-9eaa-a0ced9e50fd9`
- 서버 프록시: `GET /api/healing-forests`
- 구현 파일:
  - `src/lib/healing-forest.ts`
  - `src/lib/healing-forest-api-route.ts`
  - `src/routes/api/healing-forests.ts`
  - `src/lib/api-client.ts`

### 요청 파라미터

- `page`: 페이지 번호
- `perPage`: 페이지 크기

### 응답 정규화 필드

- `serialNumber`: 연번
- `region`: 지역
- `facilityName`: 시설명
- `address`: 주소
- `telephoneNumber`: 전화번호
- `homepage`: 홈페이지
- `participationMethod`: 참여방법
- `operator`: 관리주체

### 구현 기준

- 브라우저에서 odcloud API를 직접 호출하지 않고 `apiClient.getHealingForests()`가 `/api/healing-forests` 서버 프록시를 호출한다.
- 서버는 `returnType=JSON`으로 odcloud API를 호출하고 응답을 `HealingForestList`로 정규화한다.
- `serviceKey`는 서버 환경변수에서만 읽는다. 우선순위는 `HEALING_FOREST_SERVICE_KEY`, `FOREST_SERVICE_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서다.
- 로컬 프록시 기준 `GET /api/healing-forests?page=1&perPage=1` 호출에서 `totalCount=38`, 첫 데이터 `산음 치유의숲` 정상 응답을 확인했다.

## 산림청 전국 치유의숲 좌표

- 원본 파일: `api가이드파일/산림청_전국 치유의숲 좌표_20230922`
- 파일 형식: Esri Shapefile 시도별 분할 파일
- 좌표계: `PCS_ITRF2000_UTM(K)`
- 원본 속성 인코딩: CP949
- 전체 점 데이터: 38개
- 구현 파일:
  - `src/lib/healing-forest-facilities.ts`
  - `src/lib/healing-forest-facilities.test.ts`
  - `src/lib/api-client.ts`

### 적용 방식

- SHP 파일을 브라우저 런타임에서 직접 읽지 않는다.
- SHP 점 좌표는 WGS84 `lat/lng`로 변환한 뒤 `HEALING_FOREST_COORDINATES` 정적 데이터로 보관한다.
- `apiClient.getFacilities()`는 치유의숲, 전국휴양림, 수목원 정적 좌표 데이터를 조회해 지도용 `FacilityInfo[]`를 만든다.
- 치유의숲 응답은 `시설명` 또는 `주소` 기준으로 정적 좌표 데이터와 병합한다. 외부 API 호출 실패 또는 병합 결과가 0건이면 정적 좌표 데이터 38건을 fallback으로 사용한다.
- 전국휴양림 응답은 `latitude`, `longitude`, 도로명주소가 있는 항목만 지도 시설 후보로 변환한다.
- 전국휴양림 프록시는 공공데이터 API의 일시적인 `fetch failed` 실패를 줄이기 위해 동일 요청을 최대 3회 재시도한다.
- 수목원은 `api가이드파일/TB_FGDI_FS_HS/TB_FGDI_FS_HS` SHP 점 데이터 중 `RCAR_SCTIN=수목원`인 51건을 WGS84 좌표로 변환해 지도 시설 후보로 사용한다.
- 산림교육프로그램 응답은 사용자 화면과 추천 후보에 결합하지 않는다. `eduType=4`의 운영기간/전화번호가 실제 시설 대표정보와 다르게 확인되는 사례가 있어 지도 enrichment에서 제거했다.
- 지도 필터는 현재 지도 마커로 안정적으로 표시되는 `전체`, `치유의숲`, `자연휴양림`, `수목원`을 노출한다. `전통마을숲`은 사용자 요청으로 제거됐고, `산림교육`은 별도 좌표 마커로 사용하지 않는다.
- 추천 API는 공공데이터 서비스키가 있으면 전국휴양림 후보만 추가한다. 산림교육프로그램 정보는 추천 후보에 병합하지 않는다.
- 지도 화면의 `useFacilities()`는 이 다중 소스 시설 후보군을 사용한다.
- `useFacilities()`는 전체 지도 후보군을 조회하고, 지도 하단 목록은 현재 사용자 좌표 기준 거리순으로 클라이언트에서 재정렬한다.
- 지도 화면은 Naver Maps SDK를 우선 사용하고, SDK 로딩 실패 또는 인증 실패로 SDK 객체 생성자가 비정상 동작할 때 `lat/lng`를 화면 비율로 투영한 fallback 지도를 사용한다.

## 산림청 숲길(산림문화·휴양정보)

- 데이터 성격: OpenAPI가 아니라 산림청 공개 파일데이터 SHP 다운로드 자료
- 원본 위치:
  - `api가이드파일/dule/jirisanDule_all.{shp,shx,dbf,prj}`
  - `api가이드파일/pineDule/fineDule_all.{shp,shx,dbf,prj}`
  - `api가이드파일/dmzDule/dmzDule_all.{shp,shx,dbf,prj}`
- 원본 좌표계: Korea 2000 Korea Unified Coordinate System 계열 TM 좌표
- 적용 방식: SHP 선형 좌표를 WGS84 `lat/lng`로 변환해 정적 데이터로 저장
- 구현 파일:
  - `src/lib/forest-trails-data.ts`
  - `src/lib/forest-trails.ts`
  - `src/lib/forest-trails.test.ts`
  - `src/lib/api-client.ts`
  - `src/components/forest/Map/NaverMap.tsx`
  - `src/components/forest/Map/MapOverlay.tsx`
  - `src/routes/map.tsx`

### 적용 기준

- 산림청 페이지의 세 탭을 기준으로 지리산둘레길 21개, 금강소나무길 4개, 펀치볼둘레길 3개, 총 28개 공식 구간 메타데이터를 앱 코스 데이터로 등록했다.
- SHP 파일은 지도 선형 표시용으로 사용한다. 지리산둘레길 SHP는 선형 레코드가 26개이고, 산림청 화면의 공식 구간 표는 21개이므로 두 데이터를 강제로 1:1 매칭하지 않는다.
- `apiClient.getFacilities()`가 지도 시설 후보군을 만든 뒤 인근 숲길 구간을 `FacilityInfo.trails`에 추가한다.
- 지도 화면은 세 숲길 시스템의 선형을 SVG polyline 레이어로 표시하고, 시설 선택 오버레이에서 연결된 숲길 구간명, 거리, 난이도를 보여준다.
- 이 데이터는 실시간 호출 대상이 아니므로 배치 적재 또는 정적 번들 데이터로 유지한다. SHP 원본이 갱신되면 동일 변환 절차로 `forest-trails-data.ts`를 재생성해야 한다.

## 한국관광공사 TourAPI 4.0 주변 관광정보

- 대상 API: `KorService2/locationBasedList2`
- 요청 URL: `https://apis.data.go.kr/B551011/KorService2/locationBasedList2`
- 가이드 파일:
  - `api가이드파일/한국관광공사_개방데이터_활용매뉴얼(국문)_v4.4.docx`
  - `api가이드파일/신분류체계정보 관광타입정보 연계 정의서.xlsx`
- 서버 프록시: `GET /api/tourism?lat={위도}&lng={경도}&radius={반경m}&limit={개수}`
- 구현 파일:
  - `src/lib/tourapi.ts`
  - `src/lib/tourapi-api-route.ts`
  - `src/routes/api/tourism.ts`
  - `src/lib/api-client.ts`

### 환경변수

TourAPI 활용신청이 승인된 공공데이터포털 서비스 키를 서버 환경에 설정한다.

```dotenv
TOUR_API_SERVICE_KEY=공공데이터포털_TourAPI_서비스키
```

`TOUR_API_SERVICE_KEY`가 없으면 `TOURISM_SERVICE_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서로 대체 사용한다. 같은 공공데이터포털 키라도 TourAPI 활용신청이 승인되지 않았으면 API에서 인증 오류가 날 수 있다.

### 적용 기준

- 브라우저에서 TourAPI를 직접 호출하지 않고 `apiClient.getNearbyPlaces()`가 `/api/tourism` 서버 프록시를 호출한다.
- 좌표는 WGS84 기준 `mapX=경도`, `mapY=위도`로 전달한다.
- 반경은 TourAPI 문서 기준 최대값인 20,000m로 제한한다.
- 현재 결과 화면 목적에 맞춰 음식점, 카페/찻집, 관광지 후보를 조회한다.
- 카페는 신분류체계 `FD05`, 음식점은 관광타입 `39`, 관광지는 관광타입 `12`를 기준으로 분류한다.
- `apiClient.generateRecommendation()`은 추천 프록시 응답을 먼저 사용하고, 이후 주변 장소 목록을 TourAPI 실데이터로 교체한다. TourAPI 응답이 실패하면 추천 본문은 유지하고 주변 장소만 비워 둔다. 추천 프록시가 데이터 없이 실패하면 Mock 데이터로 대체하지 않는다.
- 로컬 프록시 기준 `GET /api/tourism?lat=37.60455927717994&lng=127.5784207834287&radius=20000&limit=3` 호출에서 `국립 산음자연휴양림` 등 주변 관광정보 정상 응답을 확인했다.

## 한국관광공사 무장애 여행 정보

### 연결 대상

- 서비스: 한국관광공사 무장애여행 `KorWithService2`
- 상세기능: `detailWithTour2`
- 호출 URL: `https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2`
- 서버 프록시: `GET /api/barrier-free-tourism?contentId={TourAPI_contentId}`
- 구현 파일:
  - `src/lib/barrier-free-tourism.ts`
  - `src/lib/barrier-free-tourism-api-route.ts`
  - `src/routes/api/barrier-free-tourism.ts`
  - `src/lib/tourapi-api-route.ts`
  - `src/components/forest/Result/NearbyPlaces.tsx`

### 적용 기준

- 주변 관광지 추천은 기존 `GET /api/tourism` 응답의 `contentId`를 사용해 무장애여행 상세정보를 자동 보강한다.
- 별도 상세 확인이 필요하면 `GET /api/barrier-free-tourism?contentId=...`를 직접 호출한다.
- 앱 표준 접근성 필드에는 다음처럼 매핑한다.
  - `parking` -> 장애인 주차
  - `wheelchair`, `route`, `exit` -> 휠체어 접근
  - `restroom` -> 장애인 화장실
  - `elevator` -> 엘리베이터
  - `helpdog` -> 보조견 동반
  - `stroller`, `lactationroom`, `babysparechair` -> 유모차/영유아 편의
- 결과 화면의 `함께 방문하기 좋은 곳` 카드에는 확인된 접근성 항목만 최대 3개 배지로 표시한다.

### 환경변수

```dotenv
BARRIER_FREE_TOUR_SERVICE_KEY=공공데이터포털_무장애여행_서비스키
```

`BARRIER_FREE_TOUR_SERVICE_KEY`가 없으면 `TOUR_API_SERVICE_KEY`, `TOURISM_SERVICE_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `KMA_SERVICE_KEY` 순서로 대체 사용한다. 같은 공공데이터포털 키라도 해당 무장애여행 API 활용신청이 승인되어 있어야 정상 응답한다.

## 산림청 유아숲체험원 현황

### 연결 대상

- 데이터명: 산림청\_유아숲체험원 현황
- ODCloud 문서: `https://infuser.odcloud.kr/oas/docs?namespace=15081674/v1`
- 요청 URL: `https://api.odcloud.kr/api/15081674/v1/uddi:37fa76de-6a65-4535-8275-e8548b33a053`
- 서버 프록시: `GET /api/kids-forests`
- 전용 화면: `/kids-map`

### 응답 필드

- `시설명`
- `주소`
- `운영기간`
- `전화번호`
- `참여방법`

API 응답에는 지도 마커에 필요한 위도/경도가 없다. 좌표는 유아숲체험원 UTM-K SHP/DBF 파일에서 추출한 뒤 WGS84 `lat/lng`로 변환한 정적 시드(`src/lib/kids-forest-coordinate-seeds.ts`)와 병합한다.

### 적용 기준

- 아이 전용 지도는 기존 `/map`에 섞지 않고 `/kids-map`으로 분리한다.
- `FOREST_SERVICE_KEY` 또는 `PUBLIC_DATA_SERVICE_KEY`를 서버 환경변수로 읽고, 브라우저에 인증키를 노출하지 않는다.
- API 499건 중 SHP/DBF 시설명 또는 주소와 매칭되는 시설은 1차 좌표로 표시한다.
- 1차 좌표가 없는 시설은 네이버 Geocoding 보정 좌표를 정적 데이터로 병합해 표시한다.
- API에 이미지 필드가 없으므로 시설 이미지는 상세 화면 단계에서 외부 이미지 검색 또는 기본 이미지 fallback으로 처리한다.
- API `운영기간` 값은 `2025-03~2025-11`처럼 연월 범위로 내려올 수 있지만, 유아숲체험원 운영 공고 관례상 실제 사용자 표시값은 월 운영 범위이므로 앱에서는 `3월~11월` 형식으로 정규화한다. 원본 연도는 해당 데이터 기준연도 의미로만 취급한다.

### 구현 파일

- `src/lib/kids-forest.ts`
- `src/lib/kids-forest-coordinate-seeds.ts`
- `src/lib/kids-forest-api-route.ts`
- `src/routes/api/kids-forests.ts`
- `src/hooks/useKidsForestFacilities.ts`
- `src/routes/kids-map.tsx`
- `src/components/forest/KidsForestMapOverlay.tsx`

### 유아숲체험원 좌표 보강 업데이트 (2026-05-25)

- ODCloud 유아숲체험원 API는 시설명, 주소, 운영기간, 전화번호, 참여방법만 제공하고 위도/경도는 제공하지 않는다.
- 1차 좌표는 `유아숲체험원_UTM-K` SHP/DBF를 WGS84로 변환한 `src/lib/kids-forest-coordinate-seeds.ts`를 사용한다.
- 1차 좌표로 매칭되지 않던 178건은 네이버 Geocoding으로 주소를 좌표화해 `src/lib/kids-forest-coordinate-supplements.ts`에 정적 보정 데이터로 저장했다.
- 원본 주소 오탈자 3건은 보정 쿼리로 좌표를 확인했다.
  - `전남남도 구례군 구례읍 봉서리 산10` -> `전라남도 구례군 구례읍 봉서리 산10`
  - `전북특별자치도 전주시 송천동 산1-1` -> `전북특별자치도 전주시 덕진구 송천동 산1-1`
  - `전라남도 곡성군 옥괴면 옥괴리 산10-3` -> `전라남도 곡성군 옥과면 옥과리 산10-3`
- `/api/kids-forests`는 기본 SHP 좌표와 Geocoding 보정 좌표를 함께 병합한다. 현재 API 499건 모두 지도 표시 가능한 좌표를 가진다.
- 보정 좌표는 런타임마다 네이버 API를 다시 호출하지 않는다. API 비용, 응답 지연, 호출 제한을 피하기 위해 생성 결과를 소스 데이터로 고정한다.
- 좌표 병합은 주소 매칭을 시설명 매칭보다 우선한다. `봉화산 유아숲체험원`, `남산 유아숲체험원`처럼 전국에 같은 시설명이 있는 경우에는 명칭 fallback을 사용하지 않아 다른 권역 좌표가 현재 지역 필터에 섞이지 않도록 한다.
- 지도 지역 필터는 주소 문자열 전체 검색이 아니라 행정구역 접두어 기준으로 판정한다. 예를 들어 `대전광역시`는 충청권으로 포함하지만 `경상북도 ... 대전리`, `전라남도 ... 대전면`은 충청권으로 포함하지 않는다.

### 유아숲체험원 상세/이미지 업데이트 (2026-05-25)

- `/kids-map` 마커 오버레이에 `상세정보` 진입점을 추가해 기존 공용 상세 화면(`/facilities/$facilityId`)으로 연결한다.
- `/facilities/$facilityId`는 기존 치유의숲, 자연휴양림, 수목원 데이터와 함께 `/api/kids-forests` 응답을 병합해 유아숲체험원 상세를 조회한다.
- 유아숲체험원은 통합 공식 이미지 API 필드가 없으므로 상세 화면의 이미지 검색어를 `src/lib/kids-forest-image-search.ts`에서 구성한다. 이미 `유아숲체험`이 포함된 시설명에는 키워드를 중복 추가하지 않는다.
- 유아숲체험원 이미지 검색은 시설명을 1순위로 사용하고, 주소에서 추출한 시/구 단위 보조 검색어를 추가한다. 예: `창원 현동 유아숲체험원`, `창원시 현동 유아숲체험원`, `마산합포구 현동 유아숲체험원`.
- 유아숲체험원 상세 히어로 이미지는 `scenery`만 쓰지 않고 `facility`, `experience` 카테고리까지 후보로 사용한다. 놀이시설/체험 사진이 많은 데이터 특성을 반영하기 위한 예외다.
- `/api/naver-images`는 `facilityType=kids_forest`를 허용한다. 지자체별 운영 시설이라 공식 사이트 고정 도메인은 적용하지 않는다.
- 이미지 결과는 네이버 이미지 검색과 기존 상세 이미지 보강 로직의 best-effort 결과다. 시설별 확정 대표사진이 필요하면 별도 수동 큐레이션 데이터가 필요하다.
