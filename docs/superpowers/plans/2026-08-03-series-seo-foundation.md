# 시리즈 기반 강화 + 검색 노출 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 크롤 가능한 내부 링크 그래프를 만들고, 시리즈를 순서 있는 연재물로 동작시키며, URL과 구조화 데이터가 콘텐츠를 설명하게 한다.

**Architecture:** 1단계는 `onClick` 라우팅을 `<Link>`로 전환하고 `seriesOrder` 필드로 시리즈 순서를 도입하며, 시리즈 목차·네비게이션을 서버 컴포넌트로 만들어 링크가 초기 HTML에 포함되게 한다. 2단계는 한글 슬러그를 도입하고(생성 시 확정, 이후 불변) 기존 UUID URL은 301로 승계하며, 구조화 데이터에 시리즈 관계를 표현한다.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma + Supabase(Postgres), TanStack Query, Tailwind, shadcn/ui

**설계 문서:** `docs/superpowers/specs/2026-08-03-series-seo-foundation-design.md`

---

## 시작 전 필독

### 환경변수 — 빌드와 prisma 명령 전에 반드시 읽을 것

이 프로젝트에는 `.env`가 없고 `.env.development`만 있다.
`next build`는 프로덕션 모드로 돌기 때문에 `.env.development`를 자동으로 읽지 않고,
Prisma CLI도 마찬가지다. 그냥 `pnpm build`를 돌리면 sitemap 프리렌더 단계에서
`Supabase 공개 환경변수가 설정되지 않았습니다`로 실패한다. **코드 문제가 아니다.**

계획 전체에서 `pnpm build` 또는 `prisma` 명령이 나오면 아래처럼 환경변수를 먼저 주입한다.

```bash
set -a && . ./.env.development && set +a && pnpm build
```

```bash
set -a && . ./.env.development && set +a && pnpm exec prisma db push
```

`pnpm lint`와 `pnpm test`는 환경변수가 필요 없다.

### 검증 방식

이 프로젝트에는 테스트 프레임워크가 없다. 대부분의 작업은 `pnpm lint` + `pnpm build` + 수동 확인으로 검증한다.

**예외: Task 8의 `generateSlug`만 vitest로 TDD한다.** 스펙에는 없던 추가지만 정당한 이유가 있다 —
슬러그는 **불변**이라 잘못 생성된 슬러그는 영구적으로 남고, `slugify`에는 예약어·중복·빈 문자열·80자 절단 등
분기가 8개쯤 된다. 여기만 테스트를 붙이는 것이 비용 대비 효과가 가장 크다.
다른 곳에는 테스트를 추가하지 않는다.

### 수동 확인은 반드시 "페이지 소스 보기"로

이 작업의 핵심은 **초기 HTML에 링크가 있느냐**다.
개발자도구 Elements 탭은 JS 실행 후의 DOM을 보여주므로 아무 의미가 없다.
반드시 `Cmd+Option+U`(페이지 소스 보기) 또는 `curl http://localhost:3000/... | grep ...`로 확인한다.

### DB 마이그레이션 방식

`prisma/migrations/` 디렉터리가 없다. 이 프로젝트는 `prisma db push`로 스키마를 동기화해 왔다.
`prisma migrate dev`를 쓰지 말 것 — 마이그레이션 히스토리가 없는 DB에 베이스라인을 만들려다
데이터를 날릴 수 있다. **항상 `pnpm exec prisma db push`를 쓴다.**

### 개발 서버

작업 중에는 `pnpm dev`를 띄워두고 수동 확인한다.

---

# 1단계 — 링크 그래프와 시리즈 순서

## Task 1: `seriesOrder` 필드 추가

시리즈 내 순번을 저장할 필드를 만든다.

**Files:**
- Modify: `prisma/schema.prisma` (post 모델)
- Modify: `src/types.ts`
- Modify: `src/app/api/posts/route.ts:7-20` (`getPostPayload`)

- [ ] **Step 1: 스키마에 필드 추가**

`prisma/schema.prisma`의 `post` 모델에서 `seriesId` 줄 아래에 추가한다.

```prisma
model post {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String    @db.VarChar(255)
  subtitle    String?
  content     String
  createdAt   DateTime  @default(now())
  userId      String    @db.Uuid
  category    String
  isPublished Boolean   @default(false)
  seriesId    String?   @db.Uuid
  seriesOrder Int?
  comments    comment[]
  series      series?   @relation("SeriesToPost", fields: [seriesId], references: [id])
  user        user      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

필드명이 `order`가 아닌 이유: `order`는 Postgres 예약어이고, Supabase 클라이언트의 `.order()` 메서드와 이름이 겹쳐 코드가 헷갈린다.

- [ ] **Step 2: DB에 반영**

Run: `pnpm exec prisma db push`

Expected: `Your database is now in sync with your Prisma schema.` 출력.
nullable 컬럼 추가이므로 데이터 손실 경고가 뜨지 않아야 한다. 경고가 뜨면 중단하고 원인을 확인할 것.

- [ ] **Step 3: 타입 추가**

`src/types.ts`의 세 곳을 수정한다.

```ts
export interface PostFormValues {
  title?: string;
  subtitle?: string;
  category?: Category;
  seriesId?: string;
  seriesOrder?: number | null;
  isPublished?: boolean;
  content?: string;
}
```

```ts
export interface Post {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  seriesId?: string;
  seriesOrder?: number | null;
  content: string;
  isPublished: boolean;
  userId: string;
  createdAt: string;
};
```

`PostPayload`는 `PostFormValues`를 상속하므로 따로 고치지 않아도 된다.

- [ ] **Step 4: API가 `seriesOrder`를 받도록 수정**

`src/app/api/posts/route.ts`의 `getPostPayload`를 수정한다.

```ts
function getPostPayload(body: Record<string, unknown>) {
  const rawOrder = body.seriesOrder;
  const parsedOrder =
    typeof rawOrder === 'number' && Number.isInteger(rawOrder)
      ? rawOrder
      : typeof rawOrder === 'string' && rawOrder.trim() !== '' && Number.isInteger(Number(rawOrder))
        ? Number(rawOrder)
        : null;

  const seriesId =
    typeof body.seriesId === 'string' && body.seriesId.length > 0
      ? body.seriesId
      : null;

  return {
    title: typeof body.title === 'string' ? body.title.trim() : '',
    subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : null,
    category: typeof body.category === 'string' ? body.category : '',
    seriesId,
    // 시리즈에 속하지 않으면 순번은 의미가 없다
    seriesOrder: seriesId ? parsedOrder : null,
    content: typeof body.content === 'string' ? body.content.trim() : '',
    isPublished: body.isPublished === true
  };
}
```

- [ ] **Step 5: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 6: 커밋**

```bash
git add prisma/schema.prisma src/types.ts src/app/api/posts/route.ts
git commit -m "feat: add seriesOrder field for series ordering"
```

---

## Task 2: 정렬 책임 일원화

현재 정렬이 세 군데(쿼리·유틸·CSS)에 흩어져 있고 서로 상쇄되어 시리즈가 역순으로 보인다.
정렬을 데이터 조회 계층 한 곳으로 모은다.

**Files:**
- Modify: `src/lib/api/posts.server.ts`
- Modify: `src/app/api/posts/route.ts` (GET 핸들러)
- Modify: `src/utils/getPostsList.ts`
- Modify: `src/containers/PostList/index.tsx:142`

- [ ] **Step 1: 서버 조회 함수에 정렬 추가**

`src/lib/api/posts.server.ts`의 두 함수를 수정한다.

```ts
export async function getPostsForServer(
  category: Category
): Promise<{ data: Post[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('category', category)
    .eq('isPublished', true)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}
```

```ts
export async function getPostsBySeriesForServer(
  seriesId: string
): Promise<{ data: Post[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('seriesId', seriesId)
    .eq('isPublished', true)
    .order('seriesOrder', { ascending: true, nullsFirst: false })
    .order('createdAt', { ascending: true });

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}
```

- [ ] **Step 2: API GET 핸들러에도 같은 정렬 적용**

클라이언트가 캐시 미스로 API를 직접 호출할 때 순서가 달라지면 안 된다.
`src/app/api/posts/route.ts`의 GET 핸들러에서 목록을 조회하는 `else` 분기를 수정한다.

```ts
    } else {
      let query = supabase.from('post').select('*');
      if (!canPreviewUnpublished) {
        query = query.eq('isPublished', true);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (seriesId) {
        query = query.eq('seriesId', seriesId);
      }

      // 시리즈 조회는 1편부터, 그 외에는 최신순
      query = seriesId
        ? query
            .order('seriesOrder', { ascending: true, nullsFirst: false })
            .order('createdAt', { ascending: true })
        : query.order('createdAt', { ascending: false });

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: '게시글 목록을 불러오는데 실패했습니다.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ data }, { status: 200 });
    }
```

- [ ] **Step 3: `getPostsList`에서 정렬 제거**

`src/utils/getPostsList.ts` 전체를 아래로 교체한다. 정렬을 없애고 매핑·필터링만 남긴다.

```ts
import { Category, Post } from "@/types";
import handleTimeStirng from "./handleTimeStirng";

// 정렬은 데이터 조회 계층(posts.server.ts / api/posts)에서 이미 끝난 상태로 들어온다.
// 여기서 다시 정렬하면 시리즈 순서가 깨진다.
function getPostsList(posts: Post[], category: Category) {
  return posts
    .filter((post) => post.category === category)
    .map((post) => {
    const { id, title, subtitle, content, createdAt, isPublished } = post;

    const result = {
      id,
      title,
      subtitle,
      createdAt: handleTimeStirng(createdAt),
      isPublished,
    }

    if (category !== 'photo') {
      return result;
    } else return { content, ...result };
  });
}

export default getPostsList;
```

- [ ] **Step 4: `flex-col-reverse` 제거**

`src/containers/PostList/index.tsx:142`를 수정한다.

변경 전:
```tsx
      <div className="flex flex-col-reverse justify-center">
```

변경 후:
```tsx
      <div className="flex flex-col justify-center">
```

CSS로 순서를 뒤집으면 DOM 순서와 시각 순서가 어긋나 크롤러와 스크린리더가 반대로 읽는다.

- [ ] **Step 5: 수동 확인**

`pnpm dev` 실행 후:
1. `/dev` 접속 → 최신 글이 맨 위에 있는지 확인
2. 시리즈가 있다면 시리즈 페이지 접속 → 오래된 글(1편)이 맨 위에 있는지 확인

시리즈 데이터가 없어 확인이 어려우면 이 단계는 Task 7 완료 후 함께 확인한다.

- [ ] **Step 6: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 7: 커밋**

```bash
git add src/lib/api/posts.server.ts src/app/api/posts/route.ts src/utils/getPostsList.ts src/containers/PostList/index.tsx
git commit -m "fix: consolidate post ordering into the data layer

Ordering was split across the query, getPostsList, and a flex-col-reverse
class, which cancelled out and rendered series in reverse. Series now sort
by seriesOrder ascending; other listings sort newest-first."
```

---

## Task 3: `PostPreview`를 링크로 전환

**Files:**
- Modify: `src/components/PostPreview/index.tsx`
- Modify: `src/containers/PostList/index.tsx`

- [ ] **Step 1: `PostPreview`를 `<Link>`로 교체**

`src/components/PostPreview/index.tsx` 전체를 아래로 교체한다.

```tsx
import * as React from 'react';
import Link from 'next/link';

export function PostPreview({
  post,
  href
}: {
  post: {
    id: string;
    title: string;
    subtitle: string;
    createdAt: string;
    isPublished: boolean;
  };
  href: string;
}) {
  const { title, subtitle, createdAt, isPublished } = post;
  return (
    <Link
      href={href}
      className={`flex w-full flex-col justify-between border-b p-4 hover:bg-neutral-100 ${!isPublished ? 'opacity-40' : ''}`}>
      <div className="mb-2 flex items-baseline justify-between gap-4 text-lg">
        <div className="min-w-0 flex-1 text-xl font-bold">
          {!isPublished && (
            <div className="mr-2 inline-block rounded-md border border-neutral-800 bg-neutral-200 px-2 py-[1px] text-sm">
              작성중
            </div>
          )}
          <span className="inline-block max-w-full truncate align-baseline">{title}</span>
        </div>
        <span className="min-w-[88px] text-sm">{createdAt}</span>
      </div>
      <div className="text-md">{subtitle}</div>
    </Link>
  );
}
```

`hover:cursor-pointer`는 `<a>`가 기본으로 제공하므로 제거했다.

- [ ] **Step 2: 호출부 수정**

`src/containers/PostList/index.tsx`에서 `PostPreview` 사용 부분을 수정한다.

변경 전:
```tsx
              <PostPreview
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post.id)}
              />
```

변경 후:
```tsx
              <PostPreview
                key={post.id}
                post={post}
                href={`/${category}/${post.id}`}
              />
```

- [ ] **Step 3: 죽은 코드 제거**

`src/containers/PostList/index.tsx`에서 더 이상 쓰이지 않는 `handlePostClick` 함수를 삭제한다.

```tsx
  const handlePostClick = (id: string) => {
    router.push(`/${category}/${id}`);
  };
```

`handleSeriesClick`은 Task 5에서 제거하므로 지금은 남겨둔다.

- [ ] **Step 4: 수동 확인**

Run: `curl -s http://localhost:3000/dev | grep -o 'href="/dev/[^"]*"' | head`
Expected: 글 URL이 여러 개 출력된다. 아무것도 안 나오면 실패다.

- [ ] **Step 5: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 6: 커밋**

```bash
git add src/components/PostPreview/index.tsx src/containers/PostList/index.tsx
git commit -m "fix: make post list items crawlable links"
```

---

## Task 4: `RecentPosts`를 목록 + 링크로 전환

홈의 최신글이 `<TableRow onClick>`이라 크롤되지 않는다.
`<tr>`을 `<a>`로 감쌀 수 없으므로 표 구조 자체를 걷어내고 목록으로 바꾼다.
최신글은 표 데이터가 아니라 목록이므로 시맨틱도 이쪽이 맞다.

**Files:**
- Modify: `src/components/RecentPosts/index.tsx`

- [ ] **Step 1: 컴포넌트 전체 교체**

`src/components/RecentPosts/index.tsx` 전체를 아래로 교체한다.
`'use client'`, `useRouteWithLoading`, shadcn `Table` 의존이 모두 사라져 서버 컴포넌트가 된다.

```tsx
import Link from 'next/link';
import { Post } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '얘기'
};

export function RecentPosts({
  category,
  posts
}: {
  category: string;
  posts: Post[];
}) {
  const filteredPosts = posts?.filter(post => post.isPublished) ?? [];

  return (
    <div className="flex-1">
      <h3 className="border-b border-b-zinc-400 px-4 py-3 text-[16px] font-medium">
        {CATEGORY_LABELS[category] ?? ''}
      </h3>
      {filteredPosts.length === 0 ? (
        <p className="py-6 text-center">최근 포스트가 없습니다.</p>
      ) : (
        <ul>
          {filteredPosts.map(post => (
            <li key={post.id}>
              <Link
                href={`/${category}/${post.id}`}
                className="flex w-full items-center justify-between gap-2 px-4 py-2 hover:bg-zinc-100">
                <span className="overflow-hidden truncate whitespace-nowrap font-semibold max-sm:max-w-[230px] md:max-w-[170px]">
                  {post.title}
                </span>
                <span className="text-[10px] sm:min-w-[82px]">
                  {handleTimeStirng(post.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 수동 확인 — 링크**

Run: `curl -s http://localhost:3000 | grep -o 'href="/dev/[^"]*"' | head`
Expected: 홈 초기 HTML에 글 링크가 출력된다.

- [ ] **Step 3: 수동 확인 — 레이아웃**

브라우저로 `http://localhost:3000` 접속.
최신 글 3열(개발/여행/얘기)이 기존과 비슷하게 보이는지 확인한다.
`page.tsx`의 감싸는 div가 `flex gap-8`이므로 각 열이 `flex-1`로 균등 분배된다.
어긋나면 여백 클래스를 조정한다.

- [ ] **Step 4: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 5: 커밋**

```bash
git add src/components/RecentPosts/index.tsx
git commit -m "fix: render recent posts as a semantic list of links

A table row cannot be wrapped in an anchor, so the shadcn Table is
replaced with ul/li. The component no longer needs to be a client
component."
```

---

## Task 5: 시리즈 버튼을 링크로 전환

**Files:**
- Modify: `src/components/SeriesGroup/index.tsx`
- Modify: `src/containers/PostList/index.tsx`

- [ ] **Step 1: `SeriesGroup` 수정**

`src/components/SeriesGroup/index.tsx`에서 세 곳을 고친다.

임포트에 `Link`를 추가하고 `useRouter`를 제거한다.

```tsx
import Link from 'next/link';
```

```tsx
import { useRouter } from 'next/navigation';
```
위 줄을 삭제한다.

컴포넌트 본문에서 아래 두 조각을 삭제한다.

```tsx
  const router = useRouter();
```

```tsx
  const handleSeriesClick = (series: Series) => {
    router.push(`/${series.category}/series/${series.id}`);
  };
```

버튼을 링크로 바꾼다.

변경 전:
```tsx
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSeriesClick(seriesItem)}
                          className="rounded-full border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          {seriesItem.title}
                        </Button>
```

변경 후:
```tsx
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          <Link href={`/${seriesItem.category}/series/${seriesItem.id}`}>
                            {seriesItem.title}
                          </Link>
                        </Button>
```

shadcn `Button`은 `asChild`를 지원한다(`@radix-ui/react-slot` 사용). 자식 요소에 스타일이 위임된다.

- [ ] **Step 2: `PostList`의 시리즈 필터 버튼 수정**

`src/containers/PostList/index.tsx`에서 `Link` 임포트를 추가한다.

```tsx
import Link from 'next/link';
```

버튼을 바꾼다.

변경 전:
```tsx
              <Button
                key={series.id}
                variant="outline"
                size="sm"
                onClick={() => handleSeriesClick(series.id)}
                className="rounded-full border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">
                {series.title}
              </Button>
```

변경 후:
```tsx
              <Button
                key={series.id}
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">
                <Link href={`/${category}/series/${series.id}`}>
                  {series.title}
                </Link>
              </Button>
```

- [ ] **Step 3: 죽은 코드 제거**

`src/containers/PostList/index.tsx`에서 `handleSeriesClick`을 삭제한다.

```tsx
  const handleSeriesClick = (seriesId: string) => {
    router.push(`/${category}/series/${seriesId}`);
  };
```

이 시점에 `router`(`useRouteWithLoading`)를 쓰는 곳이 남아 있지 않다면 해당 변수 선언과 임포트도 삭제한다.
Run: `grep -n "router" src/containers/PostList/index.tsx`로 확인 후 정리한다.

- [ ] **Step 4: 수동 확인**

Run: `curl -s http://localhost:3000/dev | grep -o 'href="/dev/series/[^"]*"' | head`
Expected: 시리즈 링크가 출력된다(시리즈가 하나 이상 있을 때).

주의: 홈의 `SeriesGroup`은 아직 클라이언트 렌더라 초기 HTML에 없다. Task 15에서 해결한다.

- [ ] **Step 5: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 6: 커밋**

```bash
git add src/components/SeriesGroup/index.tsx src/containers/PostList/index.tsx
git commit -m "fix: make series buttons crawlable links"
```

---

## Task 6: 시리즈 목차·네비게이션 서버 컴포넌트

글과 글 사이를 잇는 링크를 만든다. 이 작업이 계획 전체의 핵심이다.

**Files:**
- Create: `src/components/SeriesToc/index.tsx`
- Create: `src/components/SeriesNav/index.tsx`
- Modify: `src/app/[category]/[id]/page.tsx`
- Modify: `src/containers/PostContent/index.tsx`
- Delete: `src/hooks/useAdjacentPosts.ts`

- [ ] **Step 1: `SeriesToc` 생성**

Create `src/components/SeriesToc/index.tsx`:

```tsx
import Link from 'next/link';
import { Post, Series } from '@/types';

export default function SeriesToc({
  series,
  posts,
  currentPostId
}: {
  series: Pick<Series, 'id' | 'title' | 'category'>;
  posts: Pick<Post, 'id' | 'title'>[];
  currentPostId: string;
}) {
  if (posts.length === 0) return null;

  return (
    <nav
      aria-label="시리즈 목차"
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Series
      </p>
      <Link
        href={`/${series.category}/series/${series.id}`}
        className="text-lg font-bold text-neutral-800 hover:underline">
        {series.title}
      </Link>
      <ol className="mt-4 flex flex-col gap-1">
        {posts.map((post, index) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li
              key={post.id}
              className="flex gap-2 text-sm">
              <span className="min-w-[1.5rem] text-neutral-400">
                {index + 1}.
              </span>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="font-bold text-neutral-900">
                  {post.title}
                </span>
              ) : (
                <Link
                  href={`/${series.category}/${post.id}`}
                  className="text-neutral-600 hover:text-neutral-900 hover:underline">
                  {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

현재 글은 링크로 만들지 않는다(자기 자신을 가리키는 링크는 불필요한 신호다).

- [ ] **Step 2: `SeriesNav` 생성**

Create `src/components/SeriesNav/index.tsx`:

```tsx
import Link from 'next/link';
import { Post } from '@/types';

type NavPost = Pick<Post, 'id' | 'title' | 'category'>;

export default function SeriesNav({
  prevPost,
  nextPost,
  prevLabel = '이전 글',
  nextLabel = '다음 글'
}: {
  prevPost: NavPost | null;
  nextPost: NavPost | null;
  prevLabel?: string;
  nextLabel?: string;
}) {
  return (
    <nav
      aria-label="글 이동"
      className="flex justify-between gap-4 py-12 text-sm text-neutral-400">
      {prevPost ? (
        <Link
          href={`/${prevPost.category}/${prevPost.id}`}
          className="hover:text-neutral-700">
          ← {prevLabel}: {prevPost.title}
        </Link>
      ) : (
        <span />
      )}

      {nextPost ? (
        <Link
          href={`/${nextPost.category}/${nextPost.id}`}
          className="text-right hover:text-neutral-700">
          {nextLabel}: {nextPost.title} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
```

시리즈 글에서는 `prevLabel="이전 편"`, `nextLabel="다음 편"`으로 넘겨 쓴다.
시리즈가 아닌 글에서는 기본값(이전 글/다음 글)을 쓴다.

- [ ] **Step 3: `PostContent`를 슬롯 방식으로 변경**

`src/containers/PostContent/index.tsx`를 수정한다.

임포트에서 아래 두 줄을 삭제한다.

```tsx
import { useAdjacentPosts } from '@/hooks/useAdjacentPosts';
```
```tsx
import { Category } from '@/types';
```

주의: `Category`는 5번 줄 `import { Post, Series } from '@/types';`와 별개로 12번 줄에 또 임포트되어 있다.
12번 줄만 삭제한다. `Post`, `Series` 임포트는 유지한다.

컴포넌트 시그니처를 바꾼다.

변경 전:
```tsx
const PostContent = () => {
```

변경 후:
```tsx
const PostContent = ({
  toc,
  nav
}: {
  toc?: React.ReactNode;
  nav?: React.ReactNode;
}) => {
```

`useAdjacentPosts` 호출을 삭제한다.

```tsx
  const { prevPost, nextPost } = useAdjacentPosts(
    id,
    post?.category as Category
  );
```

본문 하단의 이전/다음 블록 전체를 삭제하고 슬롯으로 대체한다.

변경 전 (`:143-163`):
```tsx
      <div className="flex justify-between py-12 text-sm text-neutral-400">
        {prevPost ? (
          <button
            onClick={() => router.push(`/${prevPost.category}/${prevPost.id}`)}
            className="hover:text-neutral-700">
            ← 이전 글: {prevPost.title}
          </button>
        ) : (
          <span />
        )}

        {nextPost ? (
          <button
            onClick={() => router.push(`/${nextPost.category}/${nextPost.id}`)}
            className="hover:text-neutral-700">
            다음 글: {nextPost.title} →
          </button>
        ) : (
          <span />
        )}
      </div>
```

변경 후:
```tsx
      {nav}
```

그리고 목차를 본문과 댓글 사이에 넣는다.

변경 전:
```tsx
      <div
        className="post-content prose max-w-none py-16 text-base leading-relaxed text-neutral-700"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      <Comment
```

변경 후:
```tsx
      <div
        className="post-content prose max-w-none py-16 text-base leading-relaxed text-neutral-700"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {toc && <div className="mb-12">{toc}</div>}

      <Comment
```

`React` 타입을 쓰므로 파일 상단에 `import type { ReactNode } from 'react';`를 추가하거나
`React.ReactNode` 대신 `ReactNode`를 임포트해 쓴다. 기존 `import { useEffect } from 'react';`를
`import { useEffect, type ReactNode } from 'react';`로 바꾸고 시그니처의 `React.ReactNode`를 `ReactNode`로 쓴다.

- [ ] **Step 4: 페이지에서 서버 렌더링해 주입**

`src/app/[category]/[id]/page.tsx`의 `Post` 컴포넌트를 수정한다.

임포트를 추가한다.

```tsx
import SeriesToc from '@/components/SeriesToc';
import SeriesNav from '@/components/SeriesNav';
import {
  getPostsBySeriesForServer,
  getPostsForServer,
  getSeriesForServer
} from '@/lib/api/posts.server';
```

기존 `import { getPostForServer } from '@/lib/api/posts.server';` 줄과 합쳐서 한 번에 임포트한다.

`Post` 컴포넌트 본문을 수정한다.

변경 전:
```tsx
  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', id], { data: post });

  const dehydratedState = dehydrate(queryClient);
  const structuredData = post ? generateStructuredData(post, category) : null;

  return (
    <HydrationBoundary state={dehydratedState}>
      <PageReady />
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(structuredData)
          }}
        />
      )}
      <PostContent />
    </HydrationBoundary>
  );
```

변경 후:
```tsx
  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', id], { data: post });

  const dehydratedState = dehydrate(queryClient);
  const structuredData = generateStructuredData(post, category);

  // 시리즈 소속이면 목차 + 시리즈 내 이전/다음 편,
  // 아니면 카테고리 기준 이전/다음 글
  let toc: React.ReactNode = null;
  let nav: React.ReactNode = null;

  if (post.seriesId) {
    const [series, seriesPosts] = await Promise.all([
      getSeriesForServer(post.seriesId),
      getPostsBySeriesForServer(post.seriesId)
    ]);

    if (series) {
      const list = seriesPosts.data;
      const currentIndex = list.findIndex(p => p.id === post.id);

      toc = (
        <SeriesToc
          series={series}
          posts={list}
          currentPostId={post.id}
        />
      );
      nav = (
        <SeriesNav
          prevPost={currentIndex > 0 ? list[currentIndex - 1] : null}
          nextPost={
            currentIndex >= 0 && currentIndex < list.length - 1
              ? list[currentIndex + 1]
              : null
          }
          prevLabel="이전 편"
          nextLabel="다음 편"
        />
      );
    }
  }

  if (!nav) {
    // 카테고리 목록은 최신순이므로, 배열에서 뒤가 더 오래된 글이다
    const categoryPosts = await getPostsForServer(category);
    const list = categoryPosts.data;
    const currentIndex = list.findIndex(p => p.id === post.id);

    nav = (
      <SeriesNav
        prevPost={
          currentIndex >= 0 && currentIndex < list.length - 1
            ? list[currentIndex + 1]
            : null
        }
        nextPost={currentIndex > 0 ? list[currentIndex - 1] : null}
      />
    );
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <PageReady />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(structuredData)
        }}
      />
      <PostContent
        toc={toc}
        nav={nav}
      />
    </HydrationBoundary>
  );
```

`getSeriesForServer`는 `{ id, title, description, category }`를 반환하므로 `SeriesToc`의
`series` prop 타입(`Pick<Series, 'id' | 'title' | 'category'>`)을 만족한다.

`post`는 위에서 `notFound()`로 걸러졌으므로 이 시점에 항상 non-null이다.
따라서 `structuredData`의 `post ? ... : null` 삼항 연산자를 제거했다.

- [ ] **Step 5: `useAdjacentPosts` 훅 삭제**

Run: `grep -rn "useAdjacentPosts" src/`
Expected: 참조가 남아 있지 않다.

Run: `rm src/hooks/useAdjacentPosts.ts`

이 훅은 카테고리 전체 글을 클라이언트에서 다시 가져오는 불필요한 요청이기도 했다.

- [ ] **Step 6: 수동 확인 — 링크가 초기 HTML에 있는가**

`pnpm dev` 실행 후, 아무 글이나 열어 URL을 확인하고:

Run: `curl -s "http://localhost:3000/dev/<글_ID>" | grep -c '<nav aria-label'`
Expected: `1` 이상 (시리즈 글이면 `2`)

Run: `curl -s "http://localhost:3000/dev/<글_ID>" | grep -o 'aria-label="시리즈 목차"'`
Expected: 시리즈 글이면 출력됨.

- [ ] **Step 7: 수동 확인 — 동작**

브라우저에서:
1. 시리즈에 속한 글을 연다
2. 본문 아래에 목차가 보이고 현재 편이 굵게 표시되는지 확인
3. 하단 "이전 편 / 다음 편"이 시리즈 내 글을 가리키는지 확인
4. 시리즈에 속하지 않는 글을 열어 "이전 글 / 다음 글"이 같은 카테고리 글을 가리키는지 확인

- [ ] **Step 8: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 9: 커밋**

```bash
git add src/components/SeriesToc src/components/SeriesNav src/app/[category]/[id]/page.tsx src/containers/PostContent/index.tsx
git rm src/hooks/useAdjacentPosts.ts
git commit -m "feat: add server-rendered series table of contents and navigation

Post-to-post navigation was rendered client-side as buttons, so no
crawler could follow it. Navigation is now server-rendered anchors,
and series posts get an ordered table of contents."
```

---

## Task 7: 에디터에 순번 입력 추가

**Files:**
- Modify: `src/app/editor/page.tsx`

- [ ] **Step 1: 폼 기본값에 추가**

`src/app/editor/page.tsx`의 `useForm` 기본값을 수정한다.

```tsx
    defaultValues: {
      title: post?.title || '',
      subtitle: post?.subtitle || '',
      category: post?.category || undefined,
      seriesId: post?.seriesId || undefined,
      seriesOrder: post?.seriesOrder ?? undefined,
      isPublished: post?.isPublished || false
    }
```

`reset` 호출부도 수정한다.

```tsx
      reset({
        title: post.title,
        subtitle: post.subtitle,
        category: post.category,
        seriesId: post.seriesId || undefined,
        seriesOrder: post.seriesOrder ?? undefined,
        isPublished: post.isPublished
      });
```

- [ ] **Step 2: 입력 필드 추가**

`Input` 컴포넌트를 임포트한다.

```tsx
import { Input } from '@/components/ui/input';
```

`seriesId` `Controller` 블록 바로 다음, `임시저장` 버튼 앞에 추가한다.
`selectedSeries`를 계산하는 변수는 이미 `watch('category')` 패턴이 있으므로 같은 방식으로 만든다.

`const selectedCategory = watch('category');` 아래에 추가:

```tsx
  const selectedSeriesId = watch('seriesId');
```

그리고 JSX에 추가:

```tsx
          {selectedSeriesId && (
            <div className="space-y-1">
              <Label htmlFor="seriesOrder" className="text-sm text-neutral-600">
                시리즈 순번
              </Label>
              <Input
                id="seriesOrder"
                type="number"
                min={1}
                step={1}
                placeholder="1"
                className="w-[140px]"
                {...register('seriesOrder', {
                  setValueAs: value =>
                    value === '' || value === null || value === undefined
                      ? null
                      : Number(value)
                })}
              />
            </div>
          )}
```

`setValueAs`가 빈 값을 `null`로, 나머지를 숫자로 변환한다.
이 변환이 없으면 HTML input이 문자열을 넘겨 API에서 다시 파싱해야 한다
(Task 1에서 문자열도 처리하도록 만들었으므로 이중 안전장치다).

- [ ] **Step 3: 수동 확인**

`pnpm dev` 실행 후 `/editor` 접속(관리자 로그인 필요):
1. 시리즈를 선택하지 않으면 순번 필드가 안 보인다
2. 시리즈를 선택하면 순번 필드가 나타난다
3. 순번 `1`을 넣고 저장 → 다시 열었을 때 `1`이 채워져 있다

- [ ] **Step 4: 시리즈 순서 종합 확인**

시리즈 하나에 글 2~3개를 순번 1, 2, 3으로 넣고:
1. 시리즈 페이지에서 1편이 맨 위에 오는지 확인 (Task 2 검증)
2. 2편을 열어 목차에서 2번이 굵게 표시되는지 확인
3. "이전 편"이 1편, "다음 편"이 3편인지 확인

- [ ] **Step 5: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 6: 커밋**

```bash
git add src/app/editor/page.tsx
git commit -m "feat: add series order input to the editor"
```

---

**1단계 완료 지점.** 여기서 배포해도 안전하며, 체감 변화가 크다.
2단계로 넘어가기 전에 배포해서 며칠 관찰하는 것을 권장한다.

---

# 2단계 — 슬러그와 검색 노출

## Task 8: 슬러그 생성 유틸 (TDD)

이 계획에서 유일하게 테스트를 작성하는 작업이다.
슬러그는 불변이라 잘못 생성되면 영구히 남는다.

**Files:**
- Create: `src/utils/generateSlug.ts`
- Create: `src/utils/generateSlug.test.ts`
- Modify: `package.json`

- [ ] **Step 1: vitest 설치**

Run: `pnpm add -D vitest`

설정 파일은 만들지 않는다. 순수 TypeScript 함수를 상대 경로로 임포트해 테스트하므로
경로 별칭 설정이 필요 없고, vitest가 기본 설정으로 동작한다.

`package.json`의 `scripts`에 추가한다.

```json
    "test": "vitest run",
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `src/utils/generateSlug.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSlugCandidate, resolveUniqueSlug, slugify } from './generateSlug';

describe('slugify', () => {
  it('한글 제목을 하이픈으로 이어 붙인다', () => {
    expect(slugify('6개월 운영 비용')).toBe('6개월-운영-비용');
  });

  it('영문을 소문자로 바꾼다', () => {
    expect(slugify('Fetch Diff Cost')).toBe('fetch-diff-cost');
  });

  it('특수문자를 제거한다', () => {
    expect(slugify('LLM 운영기: 비용은?!')).toBe('llm-운영기-비용은');
  });

  it('연속 공백과 연속 하이픈을 하나로 합친다', () => {
    expect(slugify('a   b -- c')).toBe('a-b-c');
  });

  it('앞뒤 하이픈을 제거한다', () => {
    expect(slugify('-- 시작과 끝 --')).toBe('시작과-끝');
  });

  it('80자를 넘으면 자르고 꼬리 하이픈을 남기지 않는다', () => {
    const result = slugify('가'.repeat(50) + ' ' + '나'.repeat(50));
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result.endsWith('-')).toBe(false);
  });

  it('슬러그로 만들 수 없는 제목은 빈 문자열을 반환한다', () => {
    expect(slugify('!!! ???')).toBe('');
  });
});

describe('buildSlugCandidate', () => {
  it('정상 제목은 슬러그를 그대로 쓴다', () => {
    expect(buildSlugCandidate('운영 비용', 'post')).toBe('운영-비용');
  });

  it('예약어와 겹치면 종류 접미사를 붙인다', () => {
    expect(buildSlugCandidate('series', 'post')).toBe('series-post');
    expect(buildSlugCandidate('Admin', 'series')).toBe('admin-series');
  });

  it('빈 슬러그는 종류와 임의 문자열로 대체한다', () => {
    const result = buildSlugCandidate('!!!', 'post');
    expect(result).toMatch(/^post-[0-9a-f]{8}$/);
  });
});

describe('resolveUniqueSlug', () => {
  it('중복이 없으면 후보를 그대로 반환한다', async () => {
    const result = await resolveUniqueSlug('운영-비용', async () => false);
    expect(result).toBe('운영-비용');
  });

  it('중복이면 숫자 접미사를 붙인다', async () => {
    const taken = new Set(['운영-비용', '운영-비용-2']);
    const result = await resolveUniqueSlug('운영-비용', async s => taken.has(s));
    expect(result).toBe('운영-비용-3');
  });

  it('접미사를 50까지 시도해도 실패하면 임의 문자열을 붙인다', async () => {
    const result = await resolveUniqueSlug('중복', async () => true);
    expect(result).toMatch(/^중복-[0-9a-f]{8}$/);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./generateSlug"` (파일이 아직 없음)

- [ ] **Step 4: 구현 작성**

Create `src/utils/generateSlug.ts`:

```ts
// 라우트와 충돌하는 슬러그. /dev/series 가 시리즈 라우트로 잡히는 것을 막는다.
const RESERVED_SLUGS = new Set([
  'series',
  'admin',
  'editor',
  'about',
  'project',
  'api',
  'sitemap.xml',
  'robots.txt'
]);

const MAX_SLUG_LENGTH = 80;
const MAX_SUFFIX_ATTEMPTS = 50;

export type SlugKind = 'post' | 'series';

/**
 * 제목을 URL 슬러그로 변환한다. 한글은 그대로 남긴다.
 * 슬러그로 만들 수 없는 제목이면 빈 문자열을 반환한다.
 */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 문자·숫자·공백·하이픈만 남긴다
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, ''); // 잘라내면서 생긴 꼬리 하이픈 제거
}

function randomSuffix(): string {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * 중복 검사 전 단계의 슬러그 후보를 만든다.
 * 예약어 충돌과 빈 슬러그를 여기서 처리한다.
 */
export function buildSlugCandidate(title: string, kind: SlugKind): string {
  const base = slugify(title);
  if (!base) return `${kind}-${randomSuffix()}`;
  if (RESERVED_SLUGS.has(base)) return `${base}-${kind}`;
  return base;
}

/**
 * 후보 슬러그가 이미 존재하면 -2, -3 순으로 접미사를 붙여 고유한 값을 찾는다.
 * @param exists 해당 슬러그가 이미 쓰이고 있는지 확인하는 함수
 */
export async function resolveUniqueSlug(
  candidate: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(candidate))) return candidate;

  for (let i = 2; i <= MAX_SUFFIX_ATTEMPTS; i++) {
    const next = `${candidate}-${i}`;
    if (!(await exists(next))) return next;
  }

  return `${candidate}-${randomSuffix()}`;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS — 17개 테스트 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add package.json pnpm-lock.yaml src/utils/generateSlug.ts src/utils/generateSlug.test.ts
git commit -m "feat: add slug generation utility with tests

Slugs are immutable once assigned, so the generation rules get unit
tests even though the project has no test suite otherwise."
```

---

## Task 9: `slug` 컬럼 추가 (nullable)

`@unique` NOT NULL 컬럼을 한 번에 추가하면 기존 행 때문에 실패한다. 세 단계로 나눠 진행한다.

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 백업**

Run: `node scripts/backup-db.js`
Expected: `✅ Backup saved to .../scripts/backup.json`

- [ ] **Step 2: 백업 스크립트에 series 추가**

기존 `scripts/backup-db.js`는 `series`를 백업하지 않는데, 앞으로 series에도 슬러그를 쓴다.
`scripts/backup-db.js`의 `main` 함수를 수정한다.

```js
async function main() {
  const posts = await prisma.post.findMany();
  const users = await prisma.user.findMany();
  const comments = await prisma.comment.findMany();
  const thoughts = await prisma.thought.findMany();
  const series = await prisma.series.findMany();

  const backupData = { posts, users, comments, thoughts, series };

  const filePath = path.join(__dirname, 'backup.json');
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('✅ Backup saved to', filePath);
}
```

- [ ] **Step 3: 백업 다시 실행**

Run: `node scripts/backup-db.js`
Expected: 성공. `scripts/backup.json`에 `series` 키가 포함되었는지 확인한다.

Run: `node -e "const b=require('./scripts/backup.json'); console.log(Object.keys(b), 'posts:', b.posts.length, 'series:', b.series.length)"`
Expected: `[ 'posts', 'users', 'comments', 'thoughts', 'series' ] posts: N series: M`

- [ ] **Step 4: 스키마에 nullable 슬러그 추가**

`prisma/schema.prisma`의 `post` 모델과 `series` 모델에 각각 추가한다.

```prisma
model series {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String
  slug        String?
  description String?
  createdAt   DateTime @default(now())
  category    String
  posts       post[]   @relation("SeriesToPost")
}
```

`post` 모델에도 `title` 아래에 추가한다.

```prisma
  slug        String?
```

이 단계에서는 `@unique`를 붙이지 않는다.

- [ ] **Step 5: DB에 반영**

Run: `pnpm exec prisma db push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: 커밋**

```bash
git add prisma/schema.prisma scripts/backup-db.js
git commit -m "chore: add nullable slug columns and back up series"
```

---

## Task 10: 생성 시 슬러그 부여

백필 전에 이걸 먼저 해야 한다. 슬러그가 NOT NULL이 된 뒤에 API가 슬러그를 안 넣으면 글 작성이 깨진다.

**Files:**
- Modify: `src/app/api/posts/route.ts` (POST)
- Modify: `src/app/api/series/route.ts` (POST)

- [ ] **Step 1: 글 생성 시 슬러그 부여**

`src/app/api/posts/route.ts` 상단에 임포트를 추가한다.

```ts
import { buildSlugCandidate, resolveUniqueSlug } from '@/utils/generateSlug';
```

POST 핸들러에서 `insert` 직전에 슬러그를 만든다.

변경 전:
```ts
    const { data, error } = await supabaseAdmin
      .from('post')
      .insert([{ ...payload, userId }]);
```

변경 후:
```ts
    const slug = await resolveUniqueSlug(
      buildSlugCandidate(payload.title, 'post'),
      async candidate => {
        const { data: existing } = await supabaseAdmin
          .from('post')
          .select('id')
          .eq('slug', candidate)
          .maybeSingle();
        return existing !== null;
      }
    );

    const { data, error } = await supabaseAdmin
      .from('post')
      .insert([{ ...payload, userId, slug }]);
```

PUT 핸들러는 수정하지 않는다. **슬러그는 불변이므로 글을 수정해도 바뀌지 않는다.**
`getPostPayload`가 `slug`를 반환하지 않으므로 `update`에서 자동으로 제외된다.

- [ ] **Step 2: 시리즈 생성 시 슬러그 부여**

`src/app/api/series/route.ts` 상단에 임포트를 추가한다.

```ts
import { buildSlugCandidate, resolveUniqueSlug } from '@/utils/generateSlug';
```

POST 핸들러에서 유효성 검사 블록과 `insert` 사이를 아래로 교체한다.

변경 전:
```ts
    if (!payload.title || !isValidCategory(payload.category)) {
      return NextResponse.json(
        { error: '유효한 시리즈 제목과 카테고리가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('series')
      .insert([payload]);
```

변경 후:
```ts
    if (!payload.title || !isValidCategory(payload.category)) {
      return NextResponse.json(
        { error: '유효한 시리즈 제목과 카테고리가 필요합니다.' },
        { status: 400 }
      );
    }

    const slug = await resolveUniqueSlug(
      buildSlugCandidate(payload.title, 'series'),
      async candidate => {
        const { data: existing } = await supabaseAdmin
          .from('series')
          .select('id')
          .eq('slug', candidate)
          .maybeSingle();
        return existing !== null;
      }
    );

    const { data, error } = await supabaseAdmin
      .from('series')
      .insert([{ ...payload, slug }]);
```

시리즈 PUT 핸들러는 수정하지 않는다(슬러그 불변).
`getSeriesPayload`가 `slug`를 반환하지 않으므로 `update`에서 자동으로 제외된다.

- [ ] **Step 3: 수동 확인**

`pnpm dev` 실행 후 에디터에서 새 글을 하나 작성한다(임시저장으로 충분).

Supabase 대시보드나 아래 명령으로 슬러그가 채워졌는지 확인한다.

Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.post.findMany({select:{title:true,slug:true},orderBy:{createdAt:'desc'},take:3}).then(r=>{console.log(r);p.\$disconnect()})"`
Expected: 방금 만든 글에 슬러그가 채워져 있다.

- [ ] **Step 4: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/posts/route.ts src/app/api/series/route.ts
git commit -m "feat: assign an immutable slug when creating posts and series"
```

---

## Task 11: 기존 데이터 백필

**Files:**
- Create: `scripts/backfill-slugs.ts`
- Modify: `package.json`

- [ ] **Step 1: tsx 설치**

Run: `pnpm add -D tsx`

백필 스크립트를 TypeScript로 쓰기 위함이다.
슬러그 규칙을 JS로 다시 구현하면 런타임과 백필이 서로 다른 슬러그를 만들 수 있다.
`src/utils/generateSlug.ts`를 그대로 임포트해 규칙을 한 곳에만 둔다.

`package.json`의 `scripts`에 추가한다.

```json
    "backfill-slugs": "tsx scripts/backfill-slugs.ts",
```

- [ ] **Step 2: 백필 스크립트 작성**

Create `scripts/backfill-slugs.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import {
  buildSlugCandidate,
  resolveUniqueSlug,
  type SlugKind
} from '../src/utils/generateSlug';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

// 이미 배정된 슬러그를 메모리에 모아 중복을 검사한다.
// 한 번의 실행 안에서 새로 만든 슬러그끼리 충돌하는 것도 막아야 한다.
async function collectTakenSlugs(): Promise<Set<string>> {
  const [posts, series] = await Promise.all([
    prisma.post.findMany({ select: { slug: true } }),
    prisma.series.findMany({ select: { slug: true } })
  ]);

  const taken = new Set<string>();
  for (const row of [...posts, ...series]) {
    if (row.slug) taken.add(row.slug);
  }
  return taken;
}

async function assign(
  title: string,
  kind: SlugKind,
  taken: Set<string>
): Promise<string> {
  const slug = await resolveUniqueSlug(
    buildSlugCandidate(title, kind),
    async candidate => taken.has(candidate)
  );
  taken.add(slug);
  return slug;
}

async function main() {
  const taken = await collectTakenSlugs();

  const seriesRows = await prisma.series.findMany({
    where: { slug: null },
    select: { id: true, title: true }
  });
  const postRows = await prisma.post.findMany({
    where: { slug: null },
    select: { id: true, title: true }
  });

  console.log(
    `대상: 시리즈 ${seriesRows.length}건, 글 ${postRows.length}건` +
      (isDryRun ? ' (dry-run)' : '')
  );

  for (const row of seriesRows) {
    const slug = await assign(row.title, 'series', taken);
    console.log(`[series] ${row.title} → ${slug}`);
    if (!isDryRun) {
      await prisma.series.update({ where: { id: row.id }, data: { slug } });
    }
  }

  for (const row of postRows) {
    const slug = await assign(row.title, 'post', taken);
    console.log(`[post]   ${row.title} → ${slug}`);
    if (!isDryRun) {
      await prisma.post.update({ where: { id: row.id }, data: { slug } });
    }
  }

  console.log(isDryRun ? '✅ dry-run 완료 (변경 없음)' : '✅ 백필 완료');
}

main()
  .catch(e => {
    console.error('❌ 백필 실패:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

슬러그가 이미 있는 행은 `where: { slug: null }`로 걸러지므로 재실행해도 안전하다.

- [ ] **Step 3: dry-run으로 결과 미리 보기**

Run: `pnpm backfill-slugs --dry-run`
Expected: 각 글·시리즈의 제목과 생성될 슬러그가 출력되고, `dry-run 완료 (변경 없음)`으로 끝난다.

**출력을 눈으로 검토한다.** 이상한 슬러그(빈 값, `post-xxxxxxxx` 형태가 많음, 의도치 않은 중복 접미사)가
보이면 여기서 멈추고 `slugify` 규칙을 다시 본다. 슬러그는 배정 후 바꾸지 않기로 했으므로
이 검토가 마지막 기회다.

- [ ] **Step 4: 실제 백필 실행**

Run: `node scripts/backup-db.js` (직전 백업)

Run: `pnpm backfill-slugs`
Expected: `✅ 백필 완료`

- [ ] **Step 5: 누락 확인**

Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.post.count({where:{slug:null}}),p.series.count({where:{slug:null}})]).then(([a,b])=>{console.log('slug 없는 post:',a,'series:',b);p.\$disconnect()})"`
Expected: `slug 없는 post: 0 series: 0`

0이 아니면 Task 12로 넘어가지 말 것.

- [ ] **Step 6: 커밋**

```bash
git add package.json pnpm-lock.yaml scripts/backfill-slugs.ts
git commit -m "chore: add slug backfill script for existing posts and series"
```

---

## Task 12: `slug`를 NOT NULL + unique로 승격

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 스키마 수정**

`post` 모델과 `series` 모델의 슬러그 필드를 바꾼다.

```prisma
  slug        String   @unique
```

`?`를 제거하고 `@unique`를 추가한다.

- [ ] **Step 2: DB에 반영**

Run: `pnpm exec prisma db push`
Expected: `Your database is now in sync with your Prisma schema.`

실패한다면 슬러그가 비었거나 중복된 행이 남아 있다는 뜻이다.
Task 11 Step 5를 다시 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add prisma/schema.prisma
git commit -m "chore: enforce slug uniqueness"
```

---

## Task 13: 슬러그 조회 함수

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/api/posts.server.ts`
- Modify: `src/app/api/posts/route.ts` (GET)
- Modify: `src/lib/api/posts.ts`

- [ ] **Step 1: 타입에 slug 추가**

`src/types.ts`를 수정한다.

```ts
export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  seriesId?: string;
  seriesOrder?: number | null;
  content: string;
  isPublished: boolean;
  userId: string;
  createdAt: string;
};
```

```ts
export interface Series {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  createdAt: Date;
};
```

- [ ] **Step 2: 서버 조회 함수 추가**

`src/lib/api/posts.server.ts`에 두 함수를 추가한다.

```ts
export async function getPostBySlugForServer(
  slug: string
): Promise<{ data: Post | null }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('slug', slug)
    .eq('isPublished', true)
    .maybeSingle();

  if (error) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  return { data: data ?? null };
}

export async function getSeriesBySlugForServer(slug: string) {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('series')
    .select('id, slug, title, description, category')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error('시리즈 정보를 불러오는데 실패했습니다.');
  }

  return data as {
    id: string;
    slug: string;
    title: string;
    description?: string;
    category: string;
  } | null;
}
```

기존 `getSeriesForServer`의 `select`에도 `slug`를 추가한다.

```ts
    .select('id, slug, title, description, category')
```

그리고 반환 타입에도 `slug: string;`을 추가한다.

- [ ] **Step 3: 전체 시리즈 조회 함수 추가 (Task 15에서 사용)**

`src/lib/api/posts.server.ts`에 추가한다.

```ts
export async function getAllSeriesForServer(): Promise<{ data: Series[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('series')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error('시리즈 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}
```

`Series` 타입 임포트를 파일 상단에 추가한다.

```ts
import { Category, Post, Series } from '@/types';
```

- [ ] **Step 4: API GET에 `?slug=` 지원 추가**

`src/app/api/posts/route.ts`의 GET 핸들러를 수정한다.

`const postId = searchParams.get('id');` 아래에 추가한다.

```ts
    const postSlug = searchParams.get('slug');
```

`if (postId) { ... }` 블록 앞에 슬러그 분기를 추가한다.

```ts
    if (postSlug) {
      const { data, error } = await supabase
        .from('post')
        .select('*')
        .eq('slug', postSlug)
        .maybeSingle();
      if (error) {
        return NextResponse.json(
          { error: '게시글을 불러오는데 실패했습니다.' },
          { status: 500 }
        );
      }
      if (!data || (!data.isPublished && !canPreviewUnpublished)) {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data }, { status: 200 });
    }
```

- [ ] **Step 5: 클라이언트 API 함수 추가**

`src/lib/api/posts.ts`에 추가한다.

```ts
export async function getPostBySlug(slug: string): Promise<{ data: Post }> {
  return await apiFetch(`/api/posts?slug=${encodeURIComponent(slug)}`, {
    method: 'GET',
  });
};
```

한글 슬러그를 URL에 넣으므로 `encodeURIComponent`가 필수다.

- [ ] **Step 6: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 7: 커밋**

```bash
git add src/types.ts src/lib/api/posts.server.ts src/lib/api/posts.ts src/app/api/posts/route.ts
git commit -m "feat: add slug-based lookups for posts and series"
```

---

## Task 14: 라우트를 슬러그로 전환하고 UUID는 301 처리

이 계획에서 가장 조심해야 할 작업이다. 기존 색인 URL이 전부 바뀐다.

**Files:**
- Rename: `src/app/[category]/[id]/` → `src/app/[category]/[slug]/`
- Rename: `src/app/[category]/series/[seriesId]/` → `src/app/[category]/series/[seriesSlug]/`
- Create: `src/utils/isUuid.ts`
- Modify: 위 두 페이지, `src/containers/PostContent/index.tsx`, `src/containers/PostList/index.tsx`, `src/components/SeriesGroup/index.tsx`, `src/components/RecentPosts/index.tsx`, `src/components/SeriesToc/index.tsx`, `src/components/SeriesNav/index.tsx`

- [ ] **Step 1: UUID 판별 유틸 생성**

Create `src/utils/isUuid.ts`:

```ts
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
```

- [ ] **Step 2: 디렉터리 이름 변경**

```bash
git mv "src/app/[category]/[id]" "src/app/[category]/[slug]"
git mv "src/app/[category]/series/[seriesId]" "src/app/[category]/series/[seriesSlug]"
```

- [ ] **Step 3: 글 페이지 수정**

`src/app/[category]/[slug]/page.tsx`에서 `params` 타입과 구조 분해를 모두 바꾼다.

임포트를 추가한다.

```tsx
import { notFound, permanentRedirect } from 'next/navigation';
import isUuid from '@/utils/isUuid';
import { getPostBySlugForServer } from '@/lib/api/posts.server';
```

기존 `import { notFound } from 'next/navigation';`은 위 줄로 대체된다.

`generateMetadata`를 수정한다.

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;

  if (!isValidCategory(category)) {
    return { title: '페이지를 찾을 수 없음' };
  }

  // UUID로 들어온 경우 메타데이터는 최소한만 반환하고,
  // 실제 리다이렉트는 페이지 컴포넌트가 처리한다.
  if (isUuid(slug)) {
    return { title: '유니의 블로그' };
  }

  const postData = await getPostBySlugForServer(slug);
  const post = postData?.data;

  if (!post || post.category !== category) {
    return {
      title: '게시글을 찾을 수 없음',
      description: '존재하지 않는 게시글입니다.'
    };
  }

  const description = generateDescription(post.content, post.subtitle);
  const siteUrl = 'https://yooni.seoul.kr';
  const postUrl = `${siteUrl}/${category}/${post.slug}`;

  return {
    title: `${post.title} | 유니의 블로그`,
    description,
    authors: [{ name: '유니' }],
    category: category,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: postUrl,
      siteName: '유니의 블로그',
      locale: 'ko_KR',
      images: [
        {
          url: 'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png',
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      publishedTime: post.createdAt,
      modifiedTime: post.createdAt,
      authors: ['유니']
    },
    twitter: {
      title: post.title,
      description,
      card: 'summary_large_image',
      images: [
        'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png'
      ]
    },
    alternates: {
      canonical: postUrl
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'noarchive': false,
      },
    },
  };
}
```

`keywords` 필드를 제거했다. `extractKeywords` 함수 삭제는 Task 16에서 한다
(지금 지우면 `generateStructuredData`가 깨진다).

페이지 컴포넌트 상단을 수정한다.

```tsx
const Post = async ({
  params
}: {
  params: Promise<{ category: string; slug: string }>;
}) => {
  const { category, slug } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  // 기존 UUID URL로 들어오면 슬러그 URL로 301 이동시킨다
  if (isUuid(slug)) {
    const legacy = await getPostForServer(slug);
    if (legacy?.data?.slug) {
      permanentRedirect(`/${category}/${legacy.data.slug}`);
    }
    notFound();
  }

  const postData = await getPostBySlugForServer(slug);
  const post = postData?.data as Post | null;

  if (!post || post.category !== category) {
    notFound();
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', slug], { data: post });
  // ... 이하 Task 6에서 작성한 내용 유지
```

`queryClient.setQueryData`의 키가 `id`에서 `slug`로 바뀐 점이 중요하다.

주의: `permanentRedirect`는 내부적으로 예외를 던진다. `try/catch`로 감싸지 말 것.

- [ ] **Step 4: `PostContent`의 파라미터 이름 변경**

`src/containers/PostContent/index.tsx`를 수정한다.

변경 전:
```tsx
  const params = useParams();
  const { id } = params as { id: string };

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPost(id),
```

변경 후:
```tsx
  const params = useParams();
  const { slug } = params as { slug: string };

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', slug],
    queryFn: () => getPostBySlug(slug),
```

임포트를 바꾼다.

```tsx
import { deletePost, getPostBySlug } from '@/lib/api/posts';
```

시리즈 링크도 슬러그로 바꾼다.

변경 전:
```tsx
            <Link href={`/${post.category}/series/${currentSeries.id}`} className='hover:underline'>
```

변경 후:
```tsx
            <Link href={`/${post.category}/series/${currentSeries.slug}`} className='hover:underline'>
```

- [ ] **Step 5: 시리즈 페이지 수정**

`src/app/[category]/series/[seriesSlug]/page.tsx`를 수정한다.

임포트를 추가한다.

```tsx
import { notFound, permanentRedirect } from 'next/navigation';
import isUuid from '@/utils/isUuid';
import {
  getPostsBySeriesForServer,
  getSeriesForServer,
  getSeriesBySlugForServer
} from '@/lib/api/posts.server';
```

`generateMetadata` 전체를 아래로 교체한다.

```tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ category: Category; seriesSlug: string }>;
}): Promise<Metadata> {
  const { category, seriesSlug } = await params;

  // UUID로 들어온 경우 리다이렉트는 페이지 컴포넌트가 처리한다
  if (isUuid(seriesSlug)) {
    return { title: '유니의 블로그' };
  }

  const series = await getSeriesBySlugForServer(seriesSlug);

  if (!series) {
    return { title: '시리즈를 찾을 수 없음' };
  }

  const url = `${SITE_URL}/${category}/series/${series.slug}`;
  const title = `${series.title} | 유니의 블로그`;
  const description =
    series.description ?? `${series.title} 시리즈의 글 모음입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: '유니의 블로그',
      locale: 'ko_KR',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: series.title }]
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [OG_IMAGE]
    },
    alternates: { canonical: url }
  };
}
```

페이지 컴포넌트 상단을 아래로 교체한다.

```tsx
  const { category, seriesSlug } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  if (isUuid(seriesSlug)) {
    const legacy = await getSeriesForServer(seriesSlug);
    if (legacy?.slug) {
      permanentRedirect(`/${category}/series/${legacy.slug}`);
    }
    notFound();
  }

  const series = await getSeriesBySlugForServer(seriesSlug);
  if (!series) {
    notFound();
  }
```

`prefetchQuery`의 키와 조회는 `series.id`를 쓴다(DB 조회는 계속 id 기준).

```tsx
  await queryClient.prefetchQuery({
    queryKey: ['posts', series.id],
    queryFn: () => getPostsBySeriesForServer(series.id)
  });
```

`<PostList category={category} seriesId={series.id} />`도 그대로 id를 넘긴다.

- [ ] **Step 6: 모든 링크 생성부를 슬러그로 변경**

아래 파일에서 `post.id` / `series.id`로 URL을 만들던 부분을 `post.slug` / `series.slug`로 바꾼다.

| 파일 | 변경 |
| --- | --- |
| `src/containers/PostList/index.tsx` | `href={`/${category}/${post.slug}`}`, 시리즈 버튼 `href={`/${category}/series/${series.slug}`}` |
| `src/components/RecentPosts/index.tsx` | `href={`/${category}/${post.slug}`}` |
| `src/components/SeriesGroup/index.tsx` | `href={`/${seriesItem.category}/series/${seriesItem.slug}`}` |
| `src/components/SeriesToc/index.tsx` | `href={`/${series.category}/series/${series.slug}`}`, `href={`/${series.category}/${post.slug}`}` |
| `src/components/SeriesNav/index.tsx` | `href={`/${prevPost.category}/${prevPost.slug}`}` 등 |

`SeriesToc`과 `SeriesNav`의 prop 타입도 `slug`를 포함하도록 바꾼다.

`SeriesToc`:
```tsx
  series: Pick<Series, 'id' | 'slug' | 'title' | 'category'>;
  posts: Pick<Post, 'id' | 'slug' | 'title'>[];
```

`SeriesNav`:
```tsx
type NavPost = Pick<Post, 'id' | 'slug' | 'title' | 'category'>;
```

`getPostsList` (`src/utils/getPostsList.ts`)의 반환 객체에도 `slug`를 추가해야 한다.

```ts
    const { id, slug, title, subtitle, content, createdAt, isPublished } = post;

    const result = {
      id,
      slug,
      title,
      subtitle,
      createdAt: handleTimeStirng(createdAt),
      isPublished,
    }
```

`PostPreview`의 `post` prop 타입에도 `slug: string;`을 추가한다.

Run: `pnpm build`로 타입 에러를 잡아가며 누락을 찾는다. TypeScript가 대부분 잡아준다.

- [ ] **Step 7: 수동 확인 — 슬러그 URL**

Run: `curl -s http://localhost:3000/dev | grep -o 'href="/dev/[^"]*"' | head`
Expected: UUID가 아닌 한글/영문 슬러그 URL이 출력된다(퍼센트 인코딩된 형태일 수 있다).

- [ ] **Step 8: 수동 확인 — 301 리다이렉트**

기존 글의 UUID를 하나 알아낸다.

Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.post.findFirst({where:{isPublished:true},select:{id:true,slug:true,category:true}}).then(r=>{console.log(r);p.\$disconnect()})"`

Run: `curl -sI "http://localhost:3000/<category>/<uuid>" | head -5`
Expected: `HTTP/1.1 308 Permanent Redirect` 또는 `301`, 그리고 `location:` 헤더에 슬러그 URL.

참고: Next.js의 `permanentRedirect`는 개발 서버에서 308을 반환한다. 308도 301과 마찬가지로
영구 이동이며 검색엔진이 색인을 승계한다.

- [ ] **Step 9: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "feat: serve posts and series at slug URLs, redirect UUIDs

Legacy UUID URLs permanently redirect to their slug so existing search
index entries carry over. Canonical URLs now use slugs."
```

---

## Task 15: SSR 보강 — h1과 prefetch

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/[category]/page.tsx`
- Modify: `src/app/[category]/series/[seriesSlug]/page.tsx`
- Modify: `src/containers/PostList/index.tsx`
- Create: `src/components/SeriesFilter/index.tsx`

- [ ] **Step 1: 홈에서 시리즈 목록 prefetch**

`src/app/page.tsx`를 수정한다. `getAllSeriesForServer` 임포트를 추가한다.

```tsx
import { getAllSeriesForServer, getPostsForServer } from '@/lib/api/posts.server';
```

`Promise.all` 블록에 시리즈 prefetch를 추가한다.

```tsx
  await Promise.all([
    ...categories.map(category =>
      queryClient.prefetchQuery({
        queryKey: ['posts', category],
        queryFn: () => getPostsForServer(category)
      })
    ),
    queryClient.prefetchQuery({
      queryKey: ['series'],
      queryFn: getAllSeriesForServer
    })
  ]);
```

`SeriesGroup`이 쓰는 쿼리 키(`['series']`)와 일치해야 하고,
반환 형태도 `{ data: Series[] }`로 같아야 한다. `getAllSeriesForServer`가 그 형태를 반환한다.

- [ ] **Step 2: 카테고리 페이지에 h1 추가**

`src/app/[category]/page.tsx`의 페이지 컴포넌트를 수정한다.

카테고리 한글명 매핑을 파일 상단에 추가한다.

```tsx
const CATEGORY_HEADINGS: Record<Category, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기',
  photo: '사진'
};
```

반환 JSX를 수정한다.

```tsx
  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="mx-auto max-w-[780px] px-4 pt-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          {CATEGORY_HEADINGS[category]}
        </h1>
      </div>
      <PostList category={category} />
    </HydrationBoundary>
  );
```

- [ ] **Step 3: 시리즈 정보 블록을 서버로 옮기기**

`src/containers/PostList/index.tsx`에서 시리즈 정보 블록(`{seriesId && selectedSeriesInfo && (...)}`)을
통째로 삭제한다. `selectedSeriesInfo` `useMemo`도 삭제한다.

`src/app/[category]/series/[seriesSlug]/page.tsx`의 반환 JSX에 서버 렌더 헤더를 추가한다.

```tsx
  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="mx-auto max-w-[780px] pt-8 max-sm:px-4">
        <div className="mb-8 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
            <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Series
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-800">
            {series.title}
          </h1>
          {series.description && (
            <p className="leading-relaxed text-neutral-600">
              {series.description}
            </p>
          )}
        </div>
      </div>
      <PostList category={category} seriesId={series.id} />
    </HydrationBoundary>
  );
```

- [ ] **Step 4: 시리즈 필터 버튼을 서버 컴포넌트로 분리**

Create `src/components/SeriesFilter/index.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Category, Series } from '@/types';

export default function SeriesFilter({
  category,
  series
}: {
  category: Category;
  series: Series[];
}) {
  if (series.length === 0) return null;

  return (
    <div className="mx-4 mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-neutral-300"></div>
        <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Series
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {series.map(item => (
          <Button
            key={item.id}
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">
            <Link href={`/${category}/series/${item.slug}`}>{item.title}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

`src/containers/PostList/index.tsx`에서 시리즈 필터 버튼 블록과 `seriesByCategory` `useMemo`,
`seriesData` `useQuery`를 삭제한다. `PostList`는 이제 글 목록만 렌더한다.

`src/app/[category]/page.tsx`에서 서버 조회 후 렌더한다.

```tsx
  const allSeries = await getAllSeriesForServer();
  const categorySeries = allSeries.data.filter(s => s.category === category);
```

그리고 `<h1>` 아래에 넣는다.

```tsx
        <SeriesFilter category={category} series={categorySeries} />
```

시리즈 페이지에서는 필터를 렌더하지 않는다(기존 동작과 동일).

- [ ] **Step 5: 수동 확인**

Run: `curl -s http://localhost:3000 | grep -o 'href="/[a-z]*/series/[^"]*"' | head`
Expected: 홈 초기 HTML에 시리즈 링크가 나온다.

Run: `curl -s http://localhost:3000/dev | grep -o '<h1[^>]*>[^<]*</h1>'`
Expected: `<h1 ...>개발</h1>`

시리즈 페이지 URL을 확인한 뒤:

Run: `curl -s "http://localhost:3000/dev/series/<슬러그>" | grep -o '<h1[^>]*>[^<]*</h1>'`
Expected: 시리즈 제목이 나온다.

- [ ] **Step 6: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: server-render headings and series navigation

Category and series pages had no h1, and the home page series list was
client-only, so neither appeared in the initial HTML."
```

---

## Task 16: 구조화 데이터 정비

**Files:**
- Modify: `src/app/[category]/[slug]/page.tsx`
- Modify: `src/app/[category]/series/[seriesSlug]/page.tsx`

- [ ] **Step 1: `extractKeywords` 삭제**

`src/app/[category]/[slug]/page.tsx`에서 `extractKeywords` 함수 전체(`:15-27`)를 삭제한다.
`metaDataKeywords` 임포트도 이 파일에서 더 이상 쓰이지 않으면 함께 삭제한다.

Run: `grep -n "extractKeywords\|metaDataKeywords" "src/app/[category]/[slug]/page.tsx"`
Expected: 삭제 후 결과 없음.

이 함수는 본문 앞 10개 단어를 키워드로 넣었다. 검색 순위에 도움이 되지 않고 스팸 신호가 될 수 있다.

- [ ] **Step 2: `generateDescription` 개선**

같은 파일의 `generateDescription`에서 HTML 태그 제거 뒤 공백을 정리한다.

변경 전:
```tsx
  // HTML 태그 제거
  const cleanContent = content.replace(/<[^>]*>/g, '');
```

변경 후:
```tsx
  // HTML 태그 제거 후 연속 공백·개행을 하나로 합친다
  const cleanContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
```

- [ ] **Step 3: 글 JSON-LD에 시리즈 관계와 breadcrumb 추가**

`src/app/[category]/[slug]/page.tsx`의 `generateStructuredData`를 교체한다.

```tsx
const SITE_URL = 'https://yooni.seoul.kr';
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기',
  photo: '사진'
};

function generateStructuredData(
  post: Post,
  category: string,
  series: { slug: string; title: string } | null,
  position: number | null
) {
  const postUrl = `${SITE_URL}/${category}/${post.slug}`;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || generateDescription(post.content),
    author: {
      '@type': 'Person',
      name: '유니',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: '유니의 블로그',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: OG_IMAGE
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    image: {
      '@type': 'ImageObject',
      url: OG_IMAGE
    },
    articleSection: category
  };

  if (series) {
    data.isPartOf = {
      '@type': 'CreativeWorkSeries',
      name: series.title,
      url: `${SITE_URL}/${category}/series/${series.slug}`
    };
    if (position !== null) {
      data.position = position;
    }
  }

  return data;
}

function generateBreadcrumb(
  post: Post,
  category: string,
  series: { slug: string; title: string } | null
) {
  const items: { name: string; url: string }[] = [
    { name: '홈', url: SITE_URL },
    {
      name: CATEGORY_LABELS[category] ?? category,
      url: `${SITE_URL}/${category}`
    }
  ];

  if (series) {
    items.push({
      name: series.title,
      url: `${SITE_URL}/${category}/series/${series.slug}`
    });
  }

  items.push({
    name: post.title,
    url: `${SITE_URL}/${category}/${post.slug}`
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
```

`generateDescription`의 시그니처가 `(content: string, subtitle?: string)`이므로
`generateDescription(post.content)`로 호출하면 subtitle 없이 본문 발췌를 만든다.

페이지 컴포넌트에서 두 스크립트를 모두 렌더한다.
Task 6에서 만든 시리즈 조회 결과를 재사용한다.

```tsx
  let toc: React.ReactNode = null;
  let nav: React.ReactNode = null;
  let seriesInfo: { slug: string; title: string } | null = null;
  let position: number | null = null;

  if (post.seriesId) {
    const [series, seriesPosts] = await Promise.all([
      getSeriesForServer(post.seriesId),
      getPostsBySeriesForServer(post.seriesId)
    ]);

    if (series) {
      const list = seriesPosts.data;
      const currentIndex = list.findIndex(p => p.id === post.id);

      seriesInfo = { slug: series.slug, title: series.title };
      position = currentIndex >= 0 ? currentIndex + 1 : null;

      toc = (
        <SeriesToc
          series={series}
          posts={list}
          currentPostId={post.id}
        />
      );
      nav = (
        <SeriesNav
          prevPost={currentIndex > 0 ? list[currentIndex - 1] : null}
          nextPost={
            currentIndex >= 0 && currentIndex < list.length - 1
              ? list[currentIndex + 1]
              : null
          }
          prevLabel="이전 편"
          nextLabel="다음 편"
        />
      );
    }
  }
```

그리고 JSX에서:

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            generateStructuredData(post, category, seriesInfo, position)
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(generateBreadcrumb(post, category, seriesInfo))
        }}
      />
```

- [ ] **Step 4: 시리즈 페이지에 JSON-LD 추가**

`src/app/[category]/series/[seriesSlug]/page.tsx`에 추가한다.
이 페이지에는 현재 구조화 데이터가 없다.

**주의:** 이 파일에는 이미 `SITE_URL`과 `OG_IMAGE` 상수가 파일 상단에 선언되어 있다(15-17행).
아래 코드는 그 `SITE_URL`을 그대로 쓴다. 다시 선언하지 말 것.

```tsx
const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기',
  photo: '사진'
};

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function generateSeriesJsonLd(
  series: { slug: string; title: string; description?: string },
  category: string,
  posts: Post[]
) {
  const seriesUrl = `${SITE_URL}/${category}/series/${series.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: series.title,
    description: series.description ?? `${series.title} 시리즈의 글 모음입니다.`,
    url: seriesUrl,
    inLanguage: 'ko-KR',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: `${SITE_URL}/${category}/${post.slug}`
      }))
    }
  };
}

function generateSeriesBreadcrumb(
  series: { slug: string; title: string },
  category: string
) {
  const items = [
    { name: '홈', url: SITE_URL },
    {
      name: CATEGORY_LABELS[category] ?? category,
      url: `${SITE_URL}/${category}`
    },
    {
      name: series.title,
      url: `${SITE_URL}/${category}/series/${series.slug}`
    }
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
```

페이지 컴포넌트에서 prefetch한 글 목록을 재사용해 렌더한다.

```tsx
  const seriesPosts = await getPostsBySeriesForServer(series.id);

  const queryClient = new QueryClient();
  queryClient.setQueryData(['posts', series.id], seriesPosts);

  const dehydratedState = dehydrate(queryClient);
```

기존 `prefetchQuery` 호출을 위 코드로 대체한다(같은 데이터를 두 번 조회하지 않기 위함).

JSX 최상단에 스크립트를 넣는다.

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            generateSeriesJsonLd(series, category, seriesPosts.data)
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(generateSeriesBreadcrumb(series, category))
        }}
      />
```

`Post` 타입 임포트가 필요하다.

- [ ] **Step 5: 수동 확인 — JSON-LD 출력**

Run: `curl -s "http://localhost:3000/dev/series/<슬러그>" | grep -o '"@type":"[A-Za-z]*"' | sort -u`
Expected: `"@type":"CollectionPage"`, `"@type":"ItemList"`, `"@type":"ListItem"`, `"@type":"BreadcrumbList"`

Run: `curl -s "http://localhost:3000/dev/<슬러그>" | grep -o '"@type":"[A-Za-z]*"' | sort -u`
Expected: `"@type":"BlogPosting"`, `"@type":"BreadcrumbList"` 등. 시리즈 글이면 `"CreativeWorkSeries"`도 포함.

Run: `curl -s "http://localhost:3000/dev/<슬러그>" | grep -c 'keywords'`
Expected: `0`

- [ ] **Step 6: 수동 확인 — 유효성 검사**

배포 후 https://search.google.com/test/rich-results 에 글 URL과 시리즈 URL을 넣어
오류가 없는지 확인한다. 로컬에서는 이 검사를 할 수 없다.

- [ ] **Step 7: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: express series relationships in structured data

Series pages get CollectionPage + ItemList, posts get isPartOf and a
breadcrumb trail. The content-derived keywords field is removed."
```

---

## Task 17: sitemap 수정

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: sitemap 전체 교체**

`src/app/sitemap.ts`의 `sitemap` 함수 후반부를 수정한다.

Supabase 조회에 `slug`와 `seriesId`를 추가한다.

```ts
  const [postsResult, seriesResult] = await Promise.all([
    supabasePublic
      .from('post')
      .select('id, slug, category, createdAt, seriesId')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false }),
    supabasePublic.from('series').select('id, slug, category, createdAt')
  ]);

  const posts = postsResult.data ?? [];

  const postEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${SITE_URL}/${post.category}/${post.slug}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  // 시리즈의 최종 수정일은 소속 글 중 가장 최근 발행일로 본다.
  // 글이 추가되면 시리즈도 갱신된 것으로 취급해야 재크롤을 유도할 수 있다.
  const latestPostDateBySeries = new Map<string, Date>();
  for (const post of posts) {
    if (!post.seriesId) continue;
    const date = new Date(post.createdAt);
    const current = latestPostDateBySeries.get(post.seriesId);
    if (!current || date > current) {
      latestPostDateBySeries.set(post.seriesId, date);
    }
  }

  const seriesEntries: MetadataRoute.Sitemap =
    seriesResult.data?.map(series => ({
      url: `${SITE_URL}/${series.category}/series/${series.slug}`,
      lastModified:
        latestPostDateBySeries.get(series.id) ??
        (series.createdAt ? new Date(series.createdAt) : now),
      changeFrequency: 'weekly',
      // 시리즈를 토픽 허브로 밀기 위해 개별 글보다 높게 둔다
      priority: 0.9
    })) ?? [];

  return [...staticEntries, ...postEntries, ...seriesEntries];
```

- [ ] **Step 2: 수동 확인**

Run: `curl -s http://localhost:3000/sitemap.xml | head -40`
Expected: URL이 전부 슬러그 기반이고 UUID가 보이지 않는다.

Run: `curl -s http://localhost:3000/sitemap.xml | grep -c "0.9"`
Expected: 시리즈 개수와 같은 수(홈의 priority 1.0, 카테고리 0.9와 섞이므로 대략 확인).

Run: `curl -s http://localhost:3000/sitemap.xml | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head`
Expected: 출력 없음 (UUID가 남아 있지 않다).

- [ ] **Step 3: 빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 에러 없이 완료.

- [ ] **Step 4: 커밋**

```bash
git add src/app/sitemap.ts
git commit -m "fix: use slug URLs in sitemap and rank series above posts

Series lastModified now tracks the newest post in the series so adding
an entry marks the hub as updated."
```

---

# 배포 후 확인

- [ ] 배포 후 실제 URL로 아래를 확인한다

1. 기존 UUID URL 접속 → 슬러그 URL로 이동하는가
   `curl -sI "https://yooni.seoul.kr/dev/<uuid>" | head -5`
2. `https://yooni.seoul.kr/sitemap.xml` 이 슬러그 URL로 채워졌는가
3. Google Rich Results Test에 글 URL과 시리즈 URL을 넣어 오류가 없는가
4. 페이지 소스 보기로 홈·카테고리·시리즈·글에서 `<a href>` 링크와 `<h1>`이 보이는가

- [ ] 서치콘솔 작업

1. sitemap 재제출
2. 대표 글 몇 개를 URL 검사 → 색인 요청
3. 이후 몇 주간 "페이지" 리포트에서 리다이렉트 처리 상태를 관찰

색인이 슬러그 URL로 옮겨가는 데 보통 수 주가 걸린다. 그동안 순위가 흔들릴 수 있으나 정상이다.

---

# 참고

**되돌리기.** 2단계는 슬러그 컬럼 추가·백필을 포함하므로 되돌리기 번거롭다.
문제가 생기면 `scripts/backup.json`에서 복구할 수 있다.
1단계는 코드 변경만이므로 `git revert`로 충분하다.

**슬러그 수정이 필요해지면.** 슬러그는 불변으로 설계했지만, 정말 고쳐야 한다면
DB에서 직접 값을 바꾸고 `next.config.ts`의 `redirects()`에 기존 → 신규 경로를 수동으로 추가해야 한다.
이 계획에는 그 기능을 만들지 않는다.
