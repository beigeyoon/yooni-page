# 시리즈 기반 강화 + 검색 노출 설계

작성일: 2026-08-03
대상: yooni-page (https://yooni.seoul.kr)

## 배경

블로그 유입을 늘리기 위한 콘텐츠 전략으로 **시리즈 몰아쓰기(토픽 클러스터)** 방향을 선택했다.
불규칙하게 몰아서 쓰는 집필 패턴에 맞고, 시리즈 하나가 그 자체로 포트폴리오 조각이 된다.

글을 쓰기 전에, 시리즈를 제대로 쓰고 제대로 노출시킬 수 있는 기반을 코드에 먼저 마련한다.

## 현재 상태 진단

### 잘 되어 있는 것

메타데이터·OG·canonical이 페이지 타입별로 갖춰져 있고, `robots.ts`/`sitemap.ts`가 정상 동작한다.
홈에 `WebSite`+`Person` JSON-LD, 글에 `BlogPosting` JSON-LD가 있다.
이미지 최적화와 보안 헤더도 설정되어 있다.

### 치명적 문제: 내부 링크가 존재하지 않는다

전수 조사 결과, 크롤 가능한 내부 링크는 `NavBar`와 글 상단 해시태그 두 곳뿐이다.

| 위치 | 현재 마크업 | 크롤 가능 |
| --- | --- | --- |
| `src/components/NavBar/index.tsx` | `<Link>` | 가능 |
| `src/containers/PostContent/index.tsx:92,94` (해시태그) | `<Link>` | 가능 |
| `src/components/RecentPosts/index.tsx:67` | `<TableRow onClick>` | 불가 |
| `src/components/SeriesGroup/index.tsx:84` | `<Button onClick>` | 불가 |
| `src/components/PostPreview/index.tsx` | `<div onClick>` | 불가 |
| `src/containers/PostList/index.tsx:132` (시리즈 버튼) | `<Button onClick>` | 불가 |
| `src/containers/PostContent/index.tsx:145,155` (이전/다음) | `<button onClick>` | 불가 |

크롤러가 개별 글에 도달하는 경로가 `sitemap.xml` 하나뿐이다.
색인 자체는 되지만, 내부 링크는 "어떤 페이지가 중요한지"를 검색엔진에 알리는 신호이므로
현재는 모든 글이 아무도 링크하지 않는 고아 페이지로 동률이다.
링크를 따라다니는 성향이 강한 AI 크롤러(GPTBot, ClaudeBot 등)에는 사실상 노출되지 않는다.

이 문제는 시리즈 전략과 정면으로 충돌한다.
시리즈의 SEO 가치는 여러 편이 서로를 촘촘히 링크해 하나의 권위 있는 덩어리를 이루는 데서 나오는데,
그 링크가 하나도 존재하지 않는다.

### 시리즈가 시리즈로 동작하지 않는다

1. **순서 개념이 없다.** `post` 모델에 순번 필드가 없다.
   `getPostsBySeriesForServer` (`src/lib/api/posts.server.ts:41`)에 `.order()` 절이 없어 Postgres가 주는 순서를 그대로 받는다.
   `PostList`의 `flex-col-reverse` (`src/containers/PostList/index.tsx:142`) 때문에 최신 글이 맨 위에 온다.
   즉 8편짜리 연재를 열면 8편부터 보인다.

2. **시리즈 내 이전/다음이 없다.** `useAdjacentPosts(id, category)` (`src/hooks/useAdjacentPosts.ts:5`)는
   카테고리 전체 기준이라, 시리즈 3편에서 "다음 글"을 누르면 무관한 글로 이동한다.

### SSR 누락

| 페이지 | 초기 HTML 상태 |
| --- | --- |
| 홈 최신글 | 제목 텍스트 있음 (링크 없음) |
| 홈 시리즈 목록 | **없음** — `SeriesGroup`이 클라이언트 `useQuery`인데 prefetch 없음 |
| 카테고리 | 글 목록 있음 / `h1` 없음 |
| 시리즈 | 글 목록 있음 / **시리즈 제목 `h1` 없음** (`['series']` 미prefetch) |
| 개별 글 | 본문 있음 |

### 기타

- `extractKeywords` (`src/app/[category]/[id]/page.tsx:15`)가 본문 앞 10개 단어를 키워드로 삽입한다.
  검색 순위에 도움이 되지 않고 오히려 스팸 신호로 작용할 수 있다.
- OG 이미지가 모든 글·시리즈에서 동일하다.
- sitemap에서 시리즈 priority가 0.6으로 개별 글(0.7)보다 낮고,
  `lastModified`가 시리즈 생성일로 고정되어 글이 추가돼도 갱신되지 않는다.

## 목표

1. 크롤 가능한 내부 링크 그래프를 만든다.
2. 시리즈를 순서 있는 연재물로 동작시키고, 독자가 다음 편으로 이동할 경로를 만든다.
3. URL과 구조화 데이터가 콘텐츠를 설명하게 한다.

## 범위에서 제외

조회수, 태그 시스템, 사이트 검색, 댓글 개선, 드래그 정렬, 다크모드, 예약 발행(`publishedAt`),
동적 OG 이미지 생성, 홈 `h1` 문구 변경.

예약 발행과 동적 OG 이미지는 유효한 개선이지만, 아직 시리즈 글이 없는 시점에서는 불필요하다.
홈 `h1`("Hello, there!")은 키워드가 없어 SEO상 낭비지만 디자인 요소이고,
실제 유입은 개별 글로 들어오므로 우선순위가 낮다.

---

# 1단계 — 링크 그래프와 시리즈 순서

## 1-1. 데이터 모델

`prisma/schema.prisma`의 `post` 모델에 필드를 추가한다.

```prisma
seriesOrder Int?
```

시리즈 내 순번. 시리즈에 속하지 않는 글은 `null`.

**필드명이 `order`가 아닌 이유:** `order`는 Postgres 예약어라 쿼리마다 따옴표가 필요하고,
Supabase 클라이언트의 `.order()` 메서드와 이름이 겹쳐 코드 가독성을 해친다.

## 1-2. 정렬 규칙

시리즈 페이지는 1편부터 오름차순, 카테고리 페이지는 최신순을 유지한다.

`getPostsBySeriesForServer` (`src/lib/api/posts.server.ts`)에 정렬을 추가한다.

```ts
.order('seriesOrder', { ascending: true, nullsFirst: false })
.order('createdAt', { ascending: true })
```

`src/containers/PostList/index.tsx:142`의 `flex-col-reverse`를 제거하고
정렬을 데이터 계층으로 옮긴다. CSS로 순서를 뒤집으면 DOM 순서와 시각 순서가 어긋나
크롤러와 스크린리더가 반대 순서로 읽는다.

`src/utils/getPostsList.ts`는 현재 `createdAt` 오름차순으로 정렬한다.
**이 함수에서 정렬을 완전히 제거하고 매핑·필터링만 담당하게 한다.**
정렬 책임은 데이터를 가져오는 쪽(`posts.server.ts`의 각 조회 함수)이 진다.

- 카테고리 조회: `createdAt` 내림차순 (최신순)
- 시리즈 조회: `seriesOrder` 오름차순, `createdAt` 오름차순 (1편부터)

정렬 기준이 한 곳에만 존재하게 되어 CSS·유틸·쿼리 세 군데에 흩어진 현재 상태가 정리된다.

## 1-3. 링크 전환

아래 다섯 곳의 `onClick` 라우팅을 모두 `<Link>`로 바꾼다. `onClick` 핸들러와 `useRouteWithLoading` 호출은 제거한다.

### `src/components/PostPreview/index.tsx`

`onClick: () => void` prop을 `href: string`으로 교체하고 루트 요소를 `<Link>`로 감싼다.
`<div onClick>`을 유지한 채 내부만 링크로 만들면 클릭 영역이 좁아지므로 카드 전체를 링크로 만든다.

### `src/components/RecentPosts/index.tsx`

현재 shadcn `Table`로 렌더한다. `<tr>` 안에 `<a>`를 넣어야 하는 구조라 `<tr>` 자체를 링크로 만들 수 없다.
최신글 목록은 표 데이터가 아니므로 `Table`을 걷어내고 `<ul>` / `<li>` + `<Link>`로 교체한다.
시맨틱이 맞고 링크 문제도 함께 해결된다. 시각적 결과는 기존과 동일하게 유지한다.

### `src/components/SeriesGroup/index.tsx`

`<Button onClick={handleSeriesClick}>` → `<Button asChild><Link href={...}>`.
shadcn `Button`이 `asChild`를 지원한다. `useRouter` 의존을 제거한다.

### `src/containers/PostList/index.tsx` 시리즈 필터 버튼

위와 동일하게 `<Button asChild><Link>`로 교체.

### `src/containers/PostContent/index.tsx` 이전/다음

1-4에서 서버 컴포넌트로 대체한다.

## 1-4. 시리즈 네비게이션 (서버 컴포넌트)

새 컴포넌트 두 개를 만든다. 둘 다 서버 컴포넌트로, 링크가 초기 HTML에 포함되어야 한다.

### `src/components/SeriesToc`

글 본문 아래에 표시할 시리즈 목차.
시리즈 전체 편 목록을 순서대로 보여주고 현재 편을 시각적으로 구분한다.
각 항목은 `<Link>`. 현재 편은 링크 없이 텍스트로 렌더한다(자기 자신 링크 방지).
`<nav>` 안에 `<ol>`로 마크업한다.

### `src/components/SeriesNav`

시리즈 내부 기준 이전 편 / 다음 편. `<Link>`로 렌더.
시리즈 첫 편에는 이전 편이 없고, 마지막 편에는 다음 편이 없다.

### 연결 방식

`src/app/[category]/[id]/page.tsx`(2단계에서 `[slug]`로 변경)가 서버에서
해당 글이 속한 시리즈의 글 목록을 한 번 조회하고, 두 컴포넌트를 렌더해
`PostContent`에 `ReactNode` prop으로 내려준다.

```tsx
<PostContent
  toc={series ? <SeriesToc ... /> : null}
  nav={series ? <SeriesNav ... /> : <AdjacentNav ... />}
/>
```

`PostContent`는 관리자 버튼과 댓글 때문에 `'use client'`로 유지하되,
받은 노드를 그대로 배치만 한다. 클라이언트 컴포넌트에 서버 컴포넌트를 prop으로 전달하는 것은
Next.js App Router에서 지원되는 패턴이다.

시리즈에 속하지 않는 글은 기존처럼 카테고리 기준 인접 글을 보여주되,
이것도 서버에서 계산해 `<Link>`로 렌더한다. `useAdjacentPosts` 훅은 제거한다.
현재 이 훅은 카테고리 전체 글을 클라이언트에서 다시 가져오므로 불필요한 요청이기도 하다.

## 1-5. 에디터

`src/app/editor/page.tsx`에 `seriesOrder` 숫자 입력 필드를 추가한다.
시리즈가 선택된 경우에만 노출한다.

`src/types.ts`의 `PostFormValues`, `PostPayload`, `Post`에 `seriesOrder?: number`를 추가한다.
`src/app/api/posts/route.ts`의 `getPostPayload`가 `seriesOrder`를 받아 정수로 변환한다
(값이 없거나 유효하지 않으면 `null`).

드래그 정렬은 만들지 않는다.

---

# 2단계 — 슬러그와 검색 노출

## 2-1. 슬러그 데이터 모델

```prisma
// post
slug String @unique

// series
slug String @unique
```

**마이그레이션 순서가 중요하다.** `@unique` NOT NULL 컬럼을 바로 추가하면 기존 행 때문에 실패한다.

1. `slug String?` (nullable, unique 없음)으로 추가 → 마이그레이션
2. 백필 스크립트 실행 (2-3)
3. `slug String @unique` (NOT NULL)로 변경 → 마이그레이션

## 2-2. 슬러그 생성 규칙

`src/utils/generateSlug.ts`를 새로 만든다.

```ts
function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 문자·숫자·공백·하이픈 외 제거
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}
```

`\p{L}`은 한글을 포함하므로 한글이 그대로 남는다.

**예약어 처리.** 슬러그가 아래 값과 정확히 일치하면 `-post`(시리즈는 `-series`)를 덧붙인다.
`/dev/series`가 시리즈 라우트와 충돌하는 것을 막기 위함이다.

```
series, admin, editor, about, project, api, sitemap.xml, robots.txt
```

**빈 결과 처리.** 제목이 전부 특수문자여서 결과가 빈 문자열이면
`post-<uuid 앞 8자>` (시리즈는 `series-<uuid 앞 8자>`)로 대체한다.

**중복 처리.** 동일 슬러그가 이미 존재하면 `-2`, `-3` 순으로 접미사를 붙인다.
50회까지 시도하고 그래도 실패하면 uuid 접미사를 붙인다.

**불변 정책.** 슬러그는 글/시리즈 생성 시 한 번 확정하고 이후 변경하지 않는다.
제목을 수정해도 슬러그는 그대로다. 색인된 URL이 조용히 깨지는 것을 막기 위함이다.
에디터에 슬러그 수정 UI는 만들지 않는다.

## 2-3. 백필 스크립트

`scripts/backfill-slugs.js`를 만든다. `scripts/backup-db.js`와 같은 방식으로 실행한다.

기존 `post`와 `series` 전체를 순회하며 제목으로 슬러그를 생성하고 채운다.
중복은 2-2 규칙대로 해소한다. 이미 슬러그가 있는 행은 건너뛴다(재실행 안전).

**실행 전 `scripts/backup-db.js`로 백업한다.**

## 2-4. 라우트 변경

디렉터리 두 개의 이름을 바꾼다. 파라미터가 더 이상 id가 아니므로 이름을 맞춘다.

- `src/app/[category]/[id]/` → `src/app/[category]/[slug]/`
- `src/app/[category]/series/[seriesId]/` → `src/app/[category]/series/[seriesSlug]/`

두 디렉터리 모두 `params` 타입과 구조 분해 이름을 함께 수정해야 한다.

### 조회 함수

`src/lib/api/posts.server.ts`에 추가한다.

- `getPostBySlugForServer(slug: string)`
- `getSeriesBySlugForServer(slug: string)`

### UUID 접근 시 301 리다이렉트

각 페이지 컴포넌트 최상단에서 파라미터가 UUID 형식인지 검사한다.

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (UUID_RE.test(slug)) {
  const post = await getPostForServer(slug); // id로 조회
  if (post?.data?.slug) {
    permanentRedirect(`/${category}/${post.data.slug}`);
  }
  notFound();
}
```

`generateMetadata`와 페이지 컴포넌트 양쪽에서 동일하게 처리해야 한다.

### 클라이언트 캐시 키

`PostContent`는 `useParams()`로 받은 값을 `useQuery` 키로 쓴다.
서버가 `queryClient.setQueryData(['posts', slug], ...)`로 넣고
클라이언트가 `['posts', slug]`로 꺼내도록 키를 슬러그 기준으로 통일한다.
캐시가 채워져 있으므로 추가 네트워크 요청은 발생하지 않는다.

캐시 미스 대비로 `src/app/api/posts/route.ts` GET이 `?slug=` 파라미터를 받도록 추가한다.

### canonical

모든 `canonical`과 JSON-LD의 URL을 슬러그 기준으로 통일한다.
UUID URL이 canonical로 남으면 중복 콘텐츠가 된다.

## 2-5. SSR 보강

### 홈 시리즈 목록

`src/app/page.tsx`에서 `['series']` 쿼리를 prefetch한다.
이를 위해 `src/lib/api/posts.server.ts`(또는 별도 `series.server.ts`)에
전체 시리즈를 조회하는 `getAllSeriesForServer()`를 추가한다.

### 시리즈 페이지 `h1`

`src/app/[category]/series/[seriesSlug]/page.tsx`는 이미 서버에서 시리즈를 조회한다.
시리즈 제목·설명 블록(현재 `src/containers/PostList/index.tsx:98-115`)을
서버 컴포넌트로 분리해 `PostList` 바깥, 페이지 레벨에서 렌더한다.
제목은 `<h1>`으로 마크업한다.

### 카테고리 페이지 `h1`

`src/app/[category]/page.tsx`에 카테고리명 `<h1>`을 추가한다
(개발 / 여행 / 이야기 / 사진). 현재 이 페이지에는 `h1`이 없다.

카테고리 페이지의 시리즈 필터 버튼도 서버 컴포넌트로 옮겨
링크가 초기 HTML에 포함되게 한다.

## 2-6. 구조화 데이터

### 시리즈 페이지

`CollectionPage` + `ItemList`를 추가한다. 현재 이 페이지에는 JSON-LD가 없다.

```json
{
  "@type": "CollectionPage",
  "name": "<시리즈 제목>",
  "description": "<시리즈 설명>",
  "url": "<시리즈 URL>",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 8,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "url": "...", "name": "..." }
    ]
  }
}
```

### 개별 글

기존 `BlogPosting`에 시리즈 소속을 추가한다.

```json
{
  "isPartOf": {
    "@type": "CreativeWorkSeries",
    "name": "<시리즈 제목>",
    "url": "<시리즈 URL>"
  },
  "position": 3
}
```

### BreadcrumbList

글 페이지와 시리즈 페이지에 `BreadcrumbList`를 추가한다
(홈 → 카테고리 → 시리즈 → 글). 검색 결과에 경로가 표시되고 구현 비용이 낮다.

### keywords 제거

`src/app/[category]/[id]/page.tsx:15`의 `extractKeywords` 함수를 삭제하고,
`generateMetadata`의 `keywords` 필드와 JSON-LD의 `keywords` 필드를 제거한다.

`generateDescription`은 유지한다. 다만 HTML 태그 제거 후 연속 공백·개행을 하나로 정리하는 처리를 추가한다.

카테고리 페이지와 루트 레이아웃의 정적 `keywords`는 손대지 않는다(수동 작성이라 스팸 신호가 아니다).

## 2-7. sitemap

`src/app/sitemap.ts`를 수정한다.

- 시리즈 priority `0.6` → `0.9` (개별 글보다 높게)
- 시리즈 `lastModified`를 해당 시리즈 소속 글 중 최신 `createdAt`으로 계산.
  이미 같은 함수에서 posts를 조회하므로 `seriesId`로 그룹핑해 구할 수 있다
  (현재 `select`에 `seriesId`를 추가해야 함).
- URL을 슬러그 기준으로 변경

---

# 검증

테스트 프레임워크가 없으므로 빌드·린트와 수동 확인으로 검증한다.

## 자동

```
pnpm lint
pnpm build
```

## 수동 (배포 전 로컬에서)

브라우저 "페이지 소스 보기"(개발자도구 Elements 탭이 아님 — 초기 HTML을 봐야 한다)로 확인한다.

1. 홈 소스에 최신글 제목이 `<a href>`로 들어 있다
2. 홈 소스에 시리즈 목록이 `<a href>`로 들어 있다
3. 카테고리 페이지 소스에 `<h1>`과 글 목록 `<a href>`가 있다
4. 시리즈 페이지 소스에 시리즈 제목이 `<h1>`으로 있고, 글이 1편부터 순서대로 나온다
5. 시리즈 글 소스에 목차와 이전/다음 편이 `<a href>`로 있다
6. 기존 UUID URL 접속 시 슬러그 URL로 301 이동한다
7. `/sitemap.xml`의 URL이 전부 슬러그이고 시리즈 priority가 0.9다
8. JSON-LD를 Google Rich Results Test에 넣어 오류가 없다

## 배포 후

서치콘솔에서 sitemap 재제출, 색인 상태와 리다이렉트 처리를 몇 주간 관찰한다.

---

# 작업 순서

1단계와 2단계는 순서대로 진행한다. 1단계만으로도 체감 변화가 크고,
2단계의 슬러그 마이그레이션은 되돌리기 번거로우므로 1단계가 안정된 뒤 시작한다.

슬러그 마이그레이션은 색인된 글이 적을수록 비용이 싸므로,
새 시리즈 글을 쓰기 전에 끝내는 것이 좋다.
