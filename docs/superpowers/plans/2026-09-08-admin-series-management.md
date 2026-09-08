# 관리자 시리즈 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 페이지에 시리즈 관리 메뉴를 추가해 시리즈를 만들고·고치고·지우며, 시리즈 상세에서 소속 글의 순서와 소속을 편집하고 다른 글을 넣을 수 있게 한다.

**Architecture:** 화면은 `/admin/series`(목록)와 `/admin/series/[id]`(상세) 두 클라이언트 화면이고, 데이터는 기존 시리즈 조회와 초안 포함 전체 글 조회를 재사용한다. 상세 화면은 글 id 순서 배열 하나를 로컬 상태로 편집하다가 새 엔드포인트 `PUT /api/series/posts?id=`에 한 번에 보내고, 서버는 Prisma 트랜잭션으로 소속·순번을 다시 매긴 뒤 영향받은 공개 페이지를 무효화한다. 시리즈 삭제는 소속 글이 있으면 화면과 서버 양쪽에서 막는다.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma + Supabase(Postgres), TanStack Query, Tailwind, shadcn/ui, vitest

**설계 문서:** `docs/superpowers/specs/2026-09-08-admin-series-management-design.md`

---

## 시작 전 필독

### 환경변수

이 프로젝트에는 `.env`가 없고 `.env.development`만 있다. `next build`와 Prisma CLI는 이 파일을 자동으로 읽지 않는다.
계획에서 `pnpm build`가 나오면 아래처럼 실행한다. `pnpm lint`와 `pnpm test`는 환경변수가 필요 없다.

```bash
set -a && . ./.env.development && set +a && pnpm build
```

### 테스트 파일의 import 규칙

vitest 설정 파일이 없어서 `@/` 경로 별칭이 테스트 실행 시 풀리지 않는다.
**테스트에서 import하는 모듈은 상대 경로로 import해야 하고, 그 모듈 자체도 값 import는 상대 경로를 써야 한다.**
타입만 쓰는 import(`import type`, 또는 타입으로만 쓰이는 값 import)는 빌드 시 지워지므로 `@/`를 써도 된다.
이 계획의 `src/utils/seriesEditor.ts`와 `src/lib/api/seriesPosts.ts`가 여기에 해당한다.

### 커밋 형식

Conventional Commits, 영어 제목, 본문은 "왜"를 적는다. 매 커밋 끝에 아래 두 줄을 붙인다.

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YC7BhNrEebmvPKbGmoPz45
```

### 기존 코드에서 알아둘 것

- `src/hooks/useAuth.ts`: `{ session, status, isAdmin }`. `status`는 next-auth의 `'loading' | 'authenticated' | 'unauthenticated'`.
- `src/hooks/useRouteWithLoading.ts`: `{ push(url) }`. 전환 중 전역 로딩 표시를 켠다.
- `src/components/Loading/PageReady.tsx`: 마운트되면 전역 로딩 표시를 끈다. 관리자 화면이 내용을 그릴 때 함께 렌더한다.
- `src/lib/api/series.ts`: `getSeries()`, `createSeries()`, `updateSeries()`, `deleteSeries(id)`. 모두 `apiFetch`를 쓰고 실패하면 서버 메시지를 담은 `Error`를 던진다.
- `src/lib/api/posts.ts`: `getAllPostsForPreview()`는 초안 포함 전체 글. 쿼리 키는 `['posts', 'preview', 'all']`.
- `src/components/SeriesModal/index.tsx`: `trigger`와 선택적 `series`를 받는 생성·수정 모달. 저장하면 `['series']`를 무효화한다.
- `src/types.ts`: `Post`(`seriesId?: string`, `seriesOrder?: number | null`, `publishedAt: string | null`, `createdAt: string`), `Series`(`createdAt: Date` 타입이지만 JSON이라 실제로는 문자열).
- `src/utils/postDate.ts`: `getPostDate(post)` = `publishedAt ?? createdAt`.
- `src/utils/dbTimestamp.ts`: `parseDbTimestamp(string | Date)`, `formatDisplayDate(string | Date)`.
- `src/utils/handleTimeStirng.ts`: `handleTimeStirng(string)` = 화면용 날짜 문자열.
- `src/lib/revalidateContent.ts`: `revalidateContent(...locations)`. `ContentLocation = { category, slug?, seriesSlug? }`. 홈은 항상 포함되고 경로는 중복 제거된다.
- `src/lib/prisma.ts`: 기본 export가 Prisma 클라이언트. comments·thoughts 라우트가 쓴다.
- `src/utils/isUuid.ts`: 기본 export `isUuid(value)`.

---

## 파일 구조

| 파일 | 역할 |
| --- | --- |
| Create `src/hooks/useAdminGate.ts` | 관리자 화면 공통 게이트 |
| Create `src/components/Admin/AdminNav.tsx` | 관리자 탭 (현재 탭 강조) |
| Modify `src/app/admin/page.tsx` | AdminNav 사용 |
| Modify `src/components/Admin/AdminPostsManager.tsx` | useAdminGate 사용 |
| Create `src/utils/seriesEditor.ts` (+ `.test.ts`) | 목록 조작 순수 함수 |
| Create `src/lib/api/seriesPosts.ts` (+ `.test.ts`) | 본문 검증, 무효화 위치 계산 |
| Create `src/app/api/series/posts/route.ts` | `PUT` 소속·순번 일괄 저장 |
| Modify `src/app/api/series/route.ts` | `DELETE` 소속 글 있으면 409 |
| Modify `src/lib/api/series.ts` | `updateSeriesPosts()` |
| Create `src/components/Admin/AdminSeriesList.tsx` | 시리즈 목록 표, 삭제 |
| Create `src/app/admin/series/page.tsx` | 목록 페이지 껍데기 |
| Create `src/components/Admin/SeriesPostPicker.tsx` | 글 추가 대화상자 |
| Create `src/components/Admin/AdminSeriesDetail.tsx` | 상세 편집 화면 |
| Create `src/app/admin/series/[id]/page.tsx` | 상세 페이지 껍데기 |

---

### Task 1: 관리자 게이트 훅과 탭 내비게이션

`AdminPostsManager`에 박힌 게이트 로직을 훅으로 꺼내고, 탭 두 개짜리 내비게이션을 만든다.
순수 로직이 없는 UI·훅이라 단위 테스트 대신 타입 검사와 개발 서버로 확인한다.

**Files:**
- Create: `src/hooks/useAdminGate.ts`
- Create: `src/components/Admin/AdminNav.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/Admin/AdminPostsManager.tsx`

- [ ] **Step 1: 게이트 훅 작성**

`src/hooks/useAdminGate.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';

// 관리자 화면 공통 게이트.
// 세션 확인이 끝났는데 관리자가 아니면 홈으로 보낸다.
// 로딩 중에는 아무것도 하지 않으므로, 호출한 쪽은 canAccessAdmin이 false인 동안 빈 화면을 그린다.
export function useAdminGate() {
  const { isAdmin, status } = useAuth();
  const router = useRouteWithLoading();
  const canAccessAdmin = status === 'authenticated' && isAdmin;

  useEffect(() => {
    if (status === 'loading') return;
    if (!canAccessAdmin) router.push('/');
  }, [canAccessAdmin, router, status]);

  return { canAccessAdmin, status };
}
```

- [ ] **Step 2: 탭 내비게이션 작성**

`src/components/Admin/AdminNav.tsx`:

```tsx
import Link from 'next/link';

export const ADMIN_TABS = [
  { href: '/admin', label: '비공개 글 관리' },
  { href: '/admin/series', label: '시리즈 관리' }
] as const;

export type AdminTabHref = (typeof ADMIN_TABS)[number]['href'];

// 현재 탭만 강조한다. /admin/series/[id]에서는 '/admin/series'를 current로 넘긴다.
export default function AdminNav({ current }: { current: AdminTabHref }) {
  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex gap-2 pb-3">
      {ADMIN_TABS.map(tab => {
        const isCurrent = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={
              isCurrent
                ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100'
            }>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: `/admin` 페이지가 AdminNav를 쓰도록 교체**

`src/app/admin/page.tsx` 전체를 아래로 바꾼다.

```tsx
import AdminNav from '@/components/Admin/AdminNav';
import AdminPostsManager from '@/components/Admin/AdminPostsManager';

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin" />
      <AdminPostsManager />
    </div>
  );
}
```

- [ ] **Step 4: AdminPostsManager가 훅을 쓰도록 수정**

`src/components/Admin/AdminPostsManager.tsx`에서:

import 세 줄을 지운다.

```ts
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
```

import 한 줄을 추가한다.

```ts
import { useAdminGate } from '@/hooks/useAdminGate';
```

함수 본문 첫 세 줄을

```ts
  const { isAdmin, status } = useAuth();
  const router = useRouteWithLoading();
  const canAccessAdmin = status === 'authenticated' && !!isAdmin;
```

아래 한 줄로 바꾼다.

```ts
  const { canAccessAdmin } = useAdminGate();
```

그리고 `useEffect` 블록 전체를 지운다.

```ts
  useEffect(() => {
    if (status === 'loading') return;
    if (!canAccessAdmin) {
      router.push('/');
    }
  }, [canAccessAdmin, router, status]);
```

나머지(`useQuery`의 `enabled: canAccessAdmin`, `if (!canAccessAdmin) return <></>;`)는 그대로 둔다.

- [ ] **Step 5: 타입·린트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음. `AdminPostsManager`에 남은 미사용 import가 있으면 린트가 알려주니 지운다.

- [ ] **Step 6: 개발 서버에서 확인**

`pnpm dev`가 떠 있는 상태에서 로그인된 브라우저로 `http://localhost:3000/admin`을 연다.
Expected: 탭이 두 개 보이고 "비공개 글 관리"만 검정 배경. "시리즈 관리"를 누르면 404가 뜬다(다음 태스크에서 만든다). 로그아웃 상태에서 `/admin`에 들어가면 홈으로 돌아간다.

- [ ] **Step 7: 커밋**

```bash
git add src/hooks/useAdminGate.ts src/components/Admin/AdminNav.tsx src/app/admin/page.tsx src/components/Admin/AdminPostsManager.tsx
git commit -m "refactor: extract the admin gate hook and add tabbed admin nav

The gate logic lived inside AdminPostsManager; the series screens need the
same behaviour, so move it into a hook. The nav gains a second tab and
highlights only the current one."
```

---

### Task 2: 목록 조작 순수 함수

시리즈 상세 화면이 쓰는 정렬·이동·추가·제거·비교 함수. 전부 TDD.

**Files:**
- Create: `src/utils/seriesEditor.ts`
- Test: `src/utils/seriesEditor.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/seriesEditor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  appendItem,
  isSameOrder,
  moveItem,
  removeItem,
  sortSeriesPosts
} from './seriesEditor';

describe('sortSeriesPosts', () => {
  it('순번 있는 글은 순번 순, 없는 글은 뒤에 게시일 순으로 놓는다', () => {
    const posts = [
      { id: 'c', seriesOrder: null, createdAt: '2026-01-03T00:00:00', publishedAt: '2026-01-03T00:00:00' },
      { id: 'b', seriesOrder: 2, createdAt: '2026-01-01T00:00:00', publishedAt: '2026-01-01T00:00:00' },
      { id: 'd', seriesOrder: null, createdAt: '2026-01-02T00:00:00', publishedAt: null },
      { id: 'a', seriesOrder: 1, createdAt: '2026-01-05T00:00:00', publishedAt: '2026-01-05T00:00:00' }
    ];
    expect(sortSeriesPosts(posts).map(p => p.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const posts = [
      { id: 'b', seriesOrder: 2, createdAt: '2026-01-01T00:00:00', publishedAt: null },
      { id: 'a', seriesOrder: 1, createdAt: '2026-01-01T00:00:00', publishedAt: null }
    ];
    sortSeriesPosts(posts);
    expect(posts.map(p => p.id)).toEqual(['b', 'a']);
  });
});

describe('moveItem', () => {
  it('위로 옮기면 바로 앞 항목과 자리를 바꾼다', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 'up')).toEqual(['a', 'c', 'b']);
  });

  it('아래로 옮기면 바로 뒤 항목과 자리를 바꾼다', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'down')).toEqual(['b', 'a', 'c']);
  });

  it('첫 항목을 위로, 마지막 항목을 아래로 옮기면 그대로다', () => {
    const ids = ['a', 'b', 'c'];
    expect(moveItem(ids, 0, 'up')).toBe(ids);
    expect(moveItem(ids, 2, 'down')).toBe(ids);
  });
});

describe('appendItem', () => {
  it('끝에 붙인다', () => {
    expect(appendItem(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('이미 있으면 그대로다', () => {
    const ids = ['a', 'b'];
    expect(appendItem(ids, 'a')).toBe(ids);
  });
});

describe('removeItem', () => {
  it('해당 id를 뺀다', () => {
    expect(removeItem(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
});

describe('isSameOrder', () => {
  it('같은 순서면 true', () => {
    expect(isSameOrder(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('원소가 같아도 순서가 다르면 false', () => {
    expect(isSameOrder(['a', 'b'], ['b', 'a'])).toBe(false);
  });

  it('길이가 다르면 false', () => {
    expect(isSameOrder(['a'], ['a', 'b'])).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/utils/seriesEditor.test.ts`
Expected: FAIL. `./seriesEditor` 모듈을 찾을 수 없다는 오류.

- [ ] **Step 3: 구현**

`src/utils/seriesEditor.ts` (테스트에서 불러오므로 값 import는 상대 경로):

```ts
import { parseDbTimestamp } from './dbTimestamp';
import { getPostDate } from './postDate';

type OrderablePost = {
  seriesOrder?: number | null;
  createdAt: string;
  publishedAt?: string | null;
};

// 공개 시리즈 페이지(lib/api/postOrder.ts)와 같은 규칙.
// 순번 오름차순, 순번 없는 글은 뒤로, 그 안에서는 게시일(초안은 저장일) 오름차순.
export function sortSeriesPosts<T extends OrderablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const ao = a.seriesOrder ?? null;
    const bo = b.seriesOrder ?? null;
    if (ao !== null && bo !== null && ao !== bo) return ao - bo;
    if (ao !== null && bo === null) return -1;
    if (ao === null && bo !== null) return 1;
    return (
      parseDbTimestamp(getPostDate(a)).getTime() -
      parseDbTimestamp(getPostDate(b)).getTime()
    );
  });
}

// 경계를 넘는 이동은 같은 배열을 그대로 돌려준다. 호출한 쪽은 참조 비교로 변화 여부를 알 수 있다.
export function moveItem(
  ids: string[],
  index: number,
  direction: 'up' | 'down'
): string[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= ids.length) return ids;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function appendItem(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function removeItem(ids: string[], id: string): string[] {
  return ids.filter(item => item !== id);
}

export function isSameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec vitest run src/utils/seriesEditor.test.ts`
Expected: 11 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/utils/seriesEditor.ts src/utils/seriesEditor.test.ts
git commit -m "feat: add pure helpers for editing a series post list"
```

---

### Task 3: 요청 본문 검증과 무효화 위치 계산

새 엔드포인트가 쓰는 순수 함수 두 개. TDD.

**Files:**
- Create: `src/lib/api/seriesPosts.ts`
- Test: `src/lib/api/seriesPosts.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/api/seriesPosts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildContentPaths } from '../revalidateContent';
import { buildSeriesPostLocations, parseSeriesPostIds } from './seriesPosts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('parseSeriesPostIds', () => {
  it('UUID 문자열 배열이면 그대로 돌려준다', () => {
    expect(parseSeriesPostIds({ postIds: [A, B] })).toEqual({
      ok: true,
      postIds: [A, B]
    });
  });

  it('빈 배열도 허용한다 (전부 뺀다는 뜻)', () => {
    expect(parseSeriesPostIds({ postIds: [] })).toEqual({ ok: true, postIds: [] });
  });

  it('배열이 아니면 거부한다', () => {
    const result = parseSeriesPostIds({ postIds: A });
    expect(result.ok).toBe(false);
  });

  it('문자열이 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, 3] }).ok).toBe(false);
  });

  it('UUID가 아닌 항목이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: ['abc'] }).ok).toBe(false);
  });

  it('중복이 있으면 거부한다', () => {
    expect(parseSeriesPostIds({ postIds: [A, A] }).ok).toBe(false);
  });

  it('본문이 null이어도 터지지 않고 거부한다', () => {
    expect(parseSeriesPostIds(null).ok).toBe(false);
  });
});

describe('buildSeriesPostLocations', () => {
  it('시리즈, 글 전부, 글을 빼앗긴 다른 시리즈 위치를 만든다', () => {
    expect(
      buildSeriesPostLocations(
        { category: 'dev', slug: '블록체인' },
        [
          { category: 'dev', slug: '지갑' },
          { category: 'dev', slug: '노드' }
        ],
        [{ category: 'dev', slug: '개발학습' }]
      )
    ).toEqual([
      { category: 'dev', seriesSlug: '블록체인' },
      { category: 'dev', slug: '지갑' },
      { category: 'dev', slug: '노드' },
      { category: 'dev', seriesSlug: '개발학습' }
    ]);
  });

  it('buildContentPaths에 넘기면 홈·카테고리·시리즈·글 경로가 중복 없이 나온다', () => {
    const locations = buildSeriesPostLocations(
      { category: 'dev', slug: '블록체인' },
      [
        { category: 'dev', slug: '지갑' },
        { category: 'dev', slug: '노드' }
      ],
      [{ category: 'dev', slug: '개발학습' }]
    );
    expect(buildContentPaths(...locations)).toEqual([
      '/',
      '/dev',
      '/dev/series/블록체인',
      '/dev/지갑',
      '/dev/노드',
      '/dev/series/개발학습'
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/lib/api/seriesPosts.test.ts`
Expected: FAIL. `./seriesPosts` 모듈을 찾을 수 없다는 오류.

- [ ] **Step 3: 구현**

`src/lib/api/seriesPosts.ts` (값 import는 상대 경로):

```ts
import isUuid from '../../utils/isUuid';
import type { ContentLocation } from '../revalidateContent';

export type ParsedSeriesPostIds =
  | { ok: true; postIds: string[] }
  | { ok: false; error: string };

// PUT /api/series/posts 본문의 형식 검사.
// 글의 존재 여부와 카테고리는 DB가 필요하므로 라우트에서 본다.
export function parseSeriesPostIds(body: unknown): ParsedSeriesPostIds {
  const postIds = (body as { postIds?: unknown } | null)?.postIds;

  if (!Array.isArray(postIds) || !postIds.every(id => typeof id === 'string')) {
    return { ok: false, error: 'postIds는 문자열 배열이어야 합니다.' };
  }
  if (!postIds.every(id => isUuid(id))) {
    return { ok: false, error: '올바르지 않은 글 id가 있습니다.' };
  }
  if (new Set(postIds).size !== postIds.length) {
    return { ok: false, error: '같은 글이 두 번 들어 있습니다.' };
  }
  return { ok: true, postIds };
}

type SeriesRef = { category: string; slug: string };
type PostRef = { category: string; slug: string };

// 저장 후 낡는 페이지: 이 시리즈(홈·카테고리 포함), 영향받은 글 전부, 글을 빼앗긴 다른 시리즈.
// 경로 중복은 buildContentPaths가 걸러내므로 여기서는 신경 쓰지 않는다.
export function buildSeriesPostLocations(
  series: SeriesRef,
  posts: PostRef[],
  otherSeries: SeriesRef[]
): ContentLocation[] {
  return [
    { category: series.category, seriesSlug: series.slug },
    ...posts.map(post => ({ category: post.category, slug: post.slug })),
    ...otherSeries.map(other => ({
      category: other.category,
      seriesSlug: other.slug
    }))
  ];
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec vitest run src/lib/api/seriesPosts.test.ts`
Expected: 9 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/seriesPosts.ts src/lib/api/seriesPosts.test.ts
git commit -m "feat: add validation and revalidation helpers for series post updates"
```

---

### Task 4: `PUT /api/series/posts` 엔드포인트와 클라이언트 함수

**Files:**
- Create: `src/app/api/series/posts/route.ts`
- Modify: `src/lib/api/series.ts`

- [ ] **Step 1: 라우트 작성**

`src/app/api/series/posts/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAppSession, isAdminEmail } from '@/lib/auth';
import {
  buildSeriesPostLocations,
  parseSeriesPostIds
} from '@/lib/api/seriesPosts';
import { revalidateContent } from '@/lib/revalidateContent';
import isUuid from '@/utils/isUuid';

// 시리즈의 소속 글과 순번을 한 번에 저장한다. 본문 배열의 순서가 곧 순번(1부터)이다.
// 목록에서 빠진 기존 소속 글은 시리즈에서 분리되고, 다른 시리즈에 있던 글은 이 시리즈로 옮겨진다.
// 여러 행을 원자적으로 바꿔야 해서 Supabase REST 대신 Prisma 트랜잭션을 쓴다.
export async function PUT(request: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const seriesId = new URL(request.url).searchParams.get('id');
    if (!seriesId) {
      return NextResponse.json(
        { error: '시리즈 id가 필요합니다.' },
        { status: 400 }
      );
    }
    // UUID가 아니면 Postgres 캐스팅 오류로 500이 나므로 먼저 거른다.
    const series = isUuid(seriesId)
      ? await prisma.series.findUnique({
          where: { id: seriesId },
          select: { id: true, slug: true, category: true }
        })
      : null;
    if (!series) {
      return NextResponse.json(
        { error: '시리즈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const parsed = parseSeriesPostIds(await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { postIds } = parsed;

    const memberSelect = {
      id: true,
      slug: true,
      category: true,
      seriesId: true
    } as const;
    type MemberRow = {
      id: string;
      slug: string;
      category: string;
      seriesId: string | null;
    };

    const [previousMembers, nextMembers] = await Promise.all([
      prisma.post.findMany({
        where: { seriesId: series.id },
        select: memberSelect
      }),
      postIds.length > 0
        ? prisma.post.findMany({
            where: { id: { in: postIds } },
            select: memberSelect
          })
        : Promise.resolve<MemberRow[]>([])
    ]);

    if (nextMembers.length !== postIds.length) {
      return NextResponse.json(
        { error: '존재하지 않는 글이 있습니다.' },
        { status: 400 }
      );
    }
    if (nextMembers.some(post => post.category !== series.category)) {
      return NextResponse.json(
        { error: '시리즈와 카테고리가 다른 글은 넣을 수 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.post.updateMany({
        where: { seriesId: series.id, id: { notIn: postIds } },
        data: { seriesId: null, seriesOrder: null }
      }),
      ...postIds.map((id, index) =>
        prisma.post.update({
          where: { id },
          data: { seriesId: series.id, seriesOrder: index + 1 }
        })
      )
    ]);

    // 글을 빼앗긴 다른 시리즈의 페이지도 낡는다.
    const otherSeriesIds = [
      ...new Set(
        nextMembers
          .map(post => post.seriesId)
          .filter((id): id is string => !!id && id !== series.id)
      )
    ];
    const otherSeries =
      otherSeriesIds.length > 0
        ? await prisma.series.findMany({
            where: { id: { in: otherSeriesIds } },
            select: { slug: true, category: true }
          })
        : [];

    revalidateContent(
      ...buildSeriesPostLocations(
        series,
        [...previousMembers, ...nextMembers],
        otherSeries
      )
    );

    return NextResponse.json(
      {
        message: '✅ Series posts updated successfully',
        data: { seriesId: series.id, postIds }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 클라이언트 함수 추가**

`src/lib/api/series.ts` 끝에 추가한다.

```ts
export async function updateSeriesPosts(
  seriesId: string,
  postIds: string[]
): Promise<{
  message?: string;
  data?: { seriesId: string; postIds: string[] };
  error?: string;
}> {
  return await apiFetch(`/api/series/posts?id=${seriesId}`, {
    method: 'PUT',
    body: JSON.stringify({ postIds })
  });
}
```

- [ ] **Step 3: 타입·린트·테스트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: 오류 없음, 테스트 전부 통과.

- [ ] **Step 4: 권한 없는 호출이 401인지 확인**

개발 서버가 떠 있는 상태에서:

```bash
curl -s -X PUT "http://localhost:3000/api/series/posts?id=00000000-0000-4000-8000-000000000000" \
  -H "Content-Type: application/json" -d '{"postIds":[]}'
```

Expected: `{"error":"❌ 업로드 권한이 없습니다."}`

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/series/posts/route.ts src/lib/api/series.ts
git commit -m "feat: add an endpoint that saves a series' posts and order in one transaction

The existing post PUT requires the full post body, which is too heavy and
too risky for reordering. This endpoint takes the ordered post ids, renumbers
them 1..n, detaches posts that were removed, and revalidates every affected
page including series the posts were moved from."
```

---

### Task 5: 소속 글이 있는 시리즈 삭제 차단

**Files:**
- Modify: `src/app/api/series/route.ts`

- [ ] **Step 1: import 추가**

파일 상단 import에 두 줄을 더한다.

```ts
import prisma from '@/lib/prisma';
import isUuid from '@/utils/isUuid';
```

- [ ] **Step 2: DELETE 핸들러에 가드 추가**

`DELETE` 안에서 아래 블록

```ts
    if (!id) {
      return NextResponse.json(
        { error: '시리즈 id가 필요합니다.' },
        { status: 400 }
      );
    }
```

바로 다음에 이 블록을 넣는다.

```ts
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: '시리즈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소속 글이 있으면 지우지 않는다. 화면에서도 막지만 서버가 최종 방어선이다. 초안도 센다.
    const memberCount = await prisma.post.count({ where: { seriesId: id } });
    if (memberCount > 0) {
      return NextResponse.json(
        { error: '소속 글이 있어 삭제할 수 없습니다. 글을 먼저 시리즈에서 빼세요.' },
        { status: 409 }
      );
    }
```

기존의 `Promise.all` 조회와 삭제, 무효화 코드는 그대로 둔다.

- [ ] **Step 3: 타입·린트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/series/route.ts
git commit -m "fix: refuse to delete a series that still has posts

Deleting a series silently detached its posts via ON DELETE SET NULL, which
wiped the table of contents with no warning. The admin UI disables the
button, and the server now returns 409 as the final guard."
```

---

### Task 6: 시리즈 목록 화면

**Files:**
- Create: `src/components/Admin/AdminSeriesList.tsx`
- Create: `src/app/admin/series/page.tsx`

- [ ] **Step 1: 목록 컴포넌트 작성**

`src/components/Admin/AdminSeriesList.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileWarning, LoaderCircle, Plus, SquarePen, Trash2 } from 'lucide-react';
import PageReady from '@/components/Loading/PageReady';
import SeriesModal from '@/components/SeriesModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAdminGate } from '@/hooks/useAdminGate';
import { getAllPostsForPreview } from '@/lib/api/posts';
import { deleteSeries, getSeries } from '@/lib/api/series';
import { Post, Series } from '@/types';
import { formatDisplayDate } from '@/utils/dbTimestamp';

const CATEGORY_ORDER = ['dev', 'travel', 'talk', 'photo'];

// 카테고리 순, 그 안에서 제목 가나다순.
function sortSeries(list: Series[]): Series[] {
  return [...list].sort((a, b) => {
    const byCategory =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return byCategory !== 0 ? byCategory : a.title.localeCompare(b.title, 'ko');
  });
}

function DeleteSeriesButton({
  series,
  memberCount
}: {
  series: Series;
  memberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const blocked = memberCount > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSeries(series.id);
      await queryClient.invalidateQueries({ queryKey: ['series'] });
      setOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '시리즈 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={blocked}>
            <Trash2 />
            삭제
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>시리즈 삭제</DialogTitle>
            <DialogDescription>
              &quot;{series.title}&quot; 시리즈를 삭제합니다. 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}>
              {isDeleting ? <LoaderCircle className="animate-spin" /> : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {blocked && (
        <span className="text-xs text-neutral-400">
          글 {memberCount}건. 먼저 빼야 삭제할 수 있습니다.
        </span>
      )}
    </div>
  );
}

export default function AdminSeriesList() {
  const { canAccessAdmin } = useAdminGate();

  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    enabled: canAccessAdmin,
    select: (data: { data: Series[] }) => sortSeries(data.data)
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'preview', 'all'],
    queryFn: getAllPostsForPreview,
    enabled: canAccessAdmin,
    select: (data: { data: Post[] }) => data.data
  });

  // 시리즈별 글 수. 초안도 센다.
  const countBySeries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts ?? []) {
      if (!post.seriesId) continue;
      counts.set(post.seriesId, (counts.get(post.seriesId) ?? 0) + 1);
    }
    return counts;
  }, [posts]);

  if (!canAccessAdmin) return <></>;

  const isLoading = seriesLoading || postsLoading;

  return (
    <>
      <PageReady />
      <div className="flex items-center justify-between gap-4 pb-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">시리즈 관리</h1>
          <p className="mt-2 text-sm text-neutral-500">
            시리즈를 만들고 고치고, 상세에서 소속 글과 순서를 편집합니다.
          </p>
        </div>
        <SeriesModal
          trigger={
            <Button>
              <Plus />
              새 시리즈
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col items-center gap-4 py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
          <p className="text-sm text-neutral-500">시리즈를 불러오는 중입니다.</p>
        </div>
      ) : !seriesList || seriesList.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <FileWarning width={40} />
          <p>시리즈가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">글 수</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">동작</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seriesList.map(series => {
                const count = countBySeries.get(series.id) ?? 0;
                return (
                  <TableRow key={series.id}>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/admin/series/${series.id}`}
                        className="hover:underline">
                        {series.title}
                      </Link>
                    </TableCell>
                    <TableCell>{series.category}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                    <TableCell>{formatDisplayDate(series.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-start justify-end gap-2">
                        <SeriesModal
                          series={series}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm">
                              <SquarePen />
                              편집
                            </Button>
                          }
                        />
                        <DeleteSeriesButton
                          series={series}
                          memberCount={count}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 페이지 껍데기 작성**

`src/app/admin/series/page.tsx`:

```tsx
import AdminNav from '@/components/Admin/AdminNav';
import AdminSeriesList from '@/components/Admin/AdminSeriesList';

export default function AdminSeriesPage() {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin/series" />
      <AdminSeriesList />
    </div>
  );
}
```

- [ ] **Step 3: 타입·린트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음.

- [ ] **Step 4: 개발 서버에서 확인**

로그인된 브라우저로 `http://localhost:3000/admin/series`를 연다.
Expected:
- 시리즈 5개가 카테고리 순(dev → travel)으로 보이고 글 수가 각각 4, 36, 3, 4, 4다.
- 모든 행의 삭제 버튼이 비활성화되고 "글 N건. 먼저 빼야 삭제할 수 있습니다."가 보인다.
- "새 시리즈"로 테스트 시리즈를 하나 만들면 표에 글 수 0으로 나타나고, 삭제 버튼이 활성화된다. 삭제하면 사라진다.
- 편집을 눌러 설명을 고치면 표에 반영된다.

- [ ] **Step 5: 커밋**

```bash
git add src/components/Admin/AdminSeriesList.tsx src/app/admin/series/page.tsx
git commit -m "feat: add the admin series list with create, edit and guarded delete"
```

---

### Task 7: 글 추가 대화상자

**Files:**
- Create: `src/components/Admin/SeriesPostPicker.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/components/Admin/SeriesPostPicker.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Post, Series } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { getPostDate } from '@/utils/postDate';

// 후보는 부모가 이미 걸러서 넘긴다(같은 카테고리, 목록에 없는 글, 게시일 내림차순).
// 추가해도 대화상자를 닫지 않아 여러 개를 이어서 넣을 수 있다.
export default function SeriesPostPicker({
  candidates,
  seriesById,
  onAdd
}: {
  candidates: Post[];
  seriesById: Map<string, Series>;
  onAdd: (postId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          글 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>글 추가</DialogTitle>
          <DialogDescription>
            같은 카테고리의 글만 보입니다. 추가한 글은 목록 맨 끝에 붙습니다.
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            추가할 수 있는 글이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {candidates.map(post => {
              const otherSeries = post.seriesId
                ? seriesById.get(post.seriesId)
                : undefined;
              return (
                <li
                  key={post.id}
                  className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.title}</p>
                    <p className="text-xs text-neutral-500">
                      <span
                        className={
                          post.isPublished ? 'text-emerald-700' : 'text-amber-700'
                        }>
                        {post.isPublished ? '공개' : '비공개'}
                      </span>
                      {' · '}
                      {handleTimeStirng(getPostDate(post))}
                      {otherSeries && <> · 다른 시리즈: {otherSeries.title}</>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAdd(post.id)}>
                    추가
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 타입·린트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음. (아직 쓰는 곳이 없어도 미사용 파일은 린트 대상이 아니다.)

- [ ] **Step 3: 커밋**

```bash
git add src/components/Admin/SeriesPostPicker.tsx
git commit -m "feat: add a dialog for picking posts to add to a series"
```

---

### Task 8: 시리즈 상세 화면

**Files:**
- Create: `src/components/Admin/AdminSeriesDetail.tsx`
- Create: `src/app/admin/series/[id]/page.tsx`

- [ ] **Step 1: 상세 컴포넌트 작성**

`src/components/Admin/AdminSeriesDetail.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  LoaderCircle,
  SquarePen,
  X
} from 'lucide-react';
import PageReady from '@/components/Loading/PageReady';
import SeriesModal from '@/components/SeriesModal';
import SeriesPostPicker from '@/components/Admin/SeriesPostPicker';
import { Button } from '@/components/ui/button';
import { useAdminGate } from '@/hooks/useAdminGate';
import { getAllPostsForPreview } from '@/lib/api/posts';
import { getSeries, updateSeriesPosts } from '@/lib/api/series';
import { Post, Series } from '@/types';
import { parseDbTimestamp } from '@/utils/dbTimestamp';
import handleTimeStirng from '@/utils/handleTimeStirng';
import { getPostDate } from '@/utils/postDate';
import {
  appendItem,
  isSameOrder,
  moveItem,
  removeItem,
  sortSeriesPosts
} from '@/utils/seriesEditor';

export default function AdminSeriesDetail({ seriesId }: { seriesId: string }) {
  const { canAccessAdmin } = useAdminGate();
  const queryClient = useQueryClient();

  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    enabled: canAccessAdmin,
    select: (data: { data: Series[] }) => data.data
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'preview', 'all'],
    queryFn: getAllPostsForPreview,
    enabled: canAccessAdmin,
    select: (data: { data: Post[] }) => data.data
  });

  const series = seriesList?.find(item => item.id === seriesId);

  const postById = useMemo(
    () => new Map((posts ?? []).map(post => [post.id, post])),
    [posts]
  );
  const seriesById = useMemo(
    () => new Map((seriesList ?? []).map(item => [item.id, item])),
    [seriesList]
  );

  // 기준선 = 서버에 저장된 순서. 공개 시리즈 페이지와 같은 규칙으로 정렬한다.
  const baseline = useMemo(
    () =>
      sortSeriesPosts((posts ?? []).filter(post => post.seriesId === seriesId)).map(
        post => post.id
      ),
    [posts, seriesId]
  );

  // 로컬 편집 상태는 글 id의 순서 배열 하나다.
  // 기준선의 내용이 바뀔 때(처음 불러올 때, 저장 후 다시 받아올 때)만 로컬 상태를 기준선으로 맞춘다.
  // 참조가 아니라 내용(key)으로 비교해야, 같은 데이터를 다시 받아왔을 때 편집 중인 상태가 날아가지 않는다.
  const baselineKey = baseline.join('|');
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  if (syncedKey !== baselineKey) {
    setSyncedKey(baselineKey);
    setOrder(baseline);
  }

  const [isSaving, setIsSaving] = useState(false);

  const isDirty = !isSameOrder(order, baseline);
  const rows = order
    .map(id => postById.get(id))
    .filter((post): post is Post => !!post);

  const candidates = useMemo(() => {
    if (!series) return [];
    const inList = new Set(order);
    return (posts ?? [])
      .filter(post => post.category === series.category && !inList.has(post.id))
      .sort(
        (a, b) =>
          parseDbTimestamp(getPostDate(b)).getTime() -
          parseDbTimestamp(getPostDate(a)).getTime()
      );
  }, [posts, series, order]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSeriesPosts(seriesId, order);
      // 글 목록(모든 카테고리·시리즈·미리보기)과 시리즈 목록이 함께 낡는다.
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['series'] });
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canAccessAdmin) return <></>;

  if (seriesLoading || postsLoading) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-700"></div>
        <p className="text-sm text-neutral-500">시리즈를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!series) {
    return (
      <>
        <PageReady />
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 py-20 text-neutral-500">
          <p>시리즈를 찾을 수 없습니다.</p>
          <Button
            asChild
            variant="outline">
            <Link href="/admin/series">시리즈 목록으로</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageReady />
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/series"
          className="flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="size-4" />
          시리즈 목록
        </Link>

        <div className="flex items-start justify-between gap-4 max-sm:flex-col">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                {series.category}
              </span>
              <span className="text-neutral-400">글 {rows.length}건</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-800">{series.title}</h1>
            {series.description && (
              <p className="mt-2 text-sm text-neutral-600">{series.description}</p>
            )}
          </div>
          <SeriesModal
            series={series}
            trigger={
              <Button variant="outline">
                <SquarePen />
                편집
              </Button>
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <SeriesPostPicker
            candidates={candidates}
            seriesById={seriesById}
            onAdd={id => setOrder(prev => appendItem(prev, id))}
          />
          <div className="flex items-center gap-2 max-sm:justify-end">
            {isDirty && (
              <span className="text-xs text-amber-700">저장되지 않은 변경</span>
            )}
            <Button
              variant="outline"
              disabled={!isDirty || isSaving}
              onClick={() => setOrder(baseline)}>
              되돌리기
            </Button>
            <Button
              disabled={!isDirty || isSaving}
              onClick={handleSave}>
              {isSaving ? <LoaderCircle className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-500">
            이 시리즈에 글이 없습니다. &quot;글 추가&quot;로 넣으세요.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((post, index) => (
              <li
                key={post.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <span className="w-6 text-right text-sm text-neutral-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/editor?id=${post.id}`}
                    className="block truncate font-semibold hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    <span
                      className={
                        post.isPublished ? 'text-emerald-700' : 'text-amber-700'
                      }>
                      {post.isPublished ? '공개' : '비공개'}
                    </span>
                    {' · '}
                    {handleTimeStirng(getPostDate(post))}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="위로"
                    disabled={index === 0}
                    onClick={() =>
                      setOrder(prev => moveItem(prev, prev.indexOf(post.id), 'up'))
                    }>
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="아래로"
                    disabled={index === rows.length - 1}
                    onClick={() =>
                      setOrder(prev => moveItem(prev, prev.indexOf(post.id), 'down'))
                    }>
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="시리즈에서 제거"
                    onClick={() => setOrder(prev => removeItem(prev, post.id))}>
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: 페이지 껍데기 작성**

`src/app/admin/series/[id]/page.tsx`:

```tsx
import AdminNav from '@/components/Admin/AdminNav';
import AdminSeriesDetail from '@/components/Admin/AdminSeriesDetail';

export default async function AdminSeriesDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin/series" />
      <AdminSeriesDetail seriesId={id} />
    </div>
  );
}
```

- [ ] **Step 3: 타입·린트·테스트 확인**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: 오류 없음, 테스트 전부 통과.

- [ ] **Step 4: 개발 서버에서 흐름 확인**

로그인된 브라우저로 `/admin/series`에서 "Fetch Diff"를 연다.
Expected, 순서대로:
1. 글 3건이 "AI 냄새 빼기(1)", "크롤링됨(2)", "월 1달러(3)" 순으로 보인다. 순번 없던 "월 1달러"가 맨 뒤다.
2. "월 1달러" 행의 ▲를 두 번 누르면 맨 위로 가고 "저장되지 않은 변경"이 뜨며 저장·되돌리기가 활성화된다.
3. "되돌리기"를 누르면 원래 순서로 돌아가고 표시가 사라진다.
4. 다시 맨 위로 올린 뒤 "저장"을 누르면 표시가 사라지고 순서가 유지된다.
5. 새 탭에서 `http://localhost:3000/dev/series/fetch-diff`를 열면 "월 1달러"가 1편이다.
6. "글 추가"를 누르면 dev 카테고리의 다른 글들이 보이고, 블록체인 시리즈 글에는 "다른 시리즈: 블록체인"이 붙어 있다. 하나를 추가하면 목록 끝에 붙고 후보에서 사라진다. 저장하지 말고 "되돌리기"로 취소한다.
7. 존재하지 않는 id로 `/admin/series/00000000-0000-4000-8000-000000000000`을 열면 "시리즈를 찾을 수 없습니다"와 목록 링크가 보인다.

- [ ] **Step 5: 커밋**

```bash
git add src/components/Admin/AdminSeriesDetail.tsx "src/app/admin/series/[id]/page.tsx"
git commit -m "feat: add the admin series detail screen for ordering and membership

Edits happen on a local ordered list of post ids and are saved in one
request. The list resyncs to the server order only when that order's
content changes, so a refetch of identical data does not discard edits."
```

---

### Task 9: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 검사**

Run:

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test
set -a && . ./.env.development && set +a && pnpm build
```

Expected: 전부 통과. 빌드 라우트 표에 `/admin/series`와 `/admin/series/[id]`가 보인다.

- [ ] **Step 2: 삭제 차단 확인**

로그인된 브라우저로 `/admin/series`에서 새 시리즈 "삭제 테스트"(dev)를 만든다.
상세에서 dev 글 하나를 추가해 저장한다 → 목록으로 돌아오면 글 수 1, 삭제 비활성화.
상세에서 그 글을 제거해 저장한다 → 목록에서 글 수 0, 삭제 활성화 → 삭제한다.
Expected: 시리즈가 사라지고, 잠깐 넣었던 글은 원래 시리즈 소속(있었다면)에서 빠진 상태이므로 그 글을 원래 시리즈에 다시 넣어 저장한다.

이 확인은 실제 데이터를 건드린다. 원래 시리즈에 속하지 않은 글(예: 시리즈 없는 dev 글)을 골라 쓰면 되돌릴 것이 없다.

- [ ] **Step 3: 순번 정리 (선택)**

기능이 동작하면 순번이 비어 있던 시리즈(개발학습, 블록체인, 치앙마이, 신혼여행)를 상세에서 열어 순서를 확인하고 저장 한 번으로 1..n을 채운다. 저장 전 순서는 게시일 순이라 대개 그대로 저장하면 된다.

---

## 자체 점검 결과

- 스펙 §1 라우팅·게이트·탭 → Task 1. §2 목록 → Task 6. §3 상세·글 추가 → Task 7, 8. §4 순수 함수 → Task 2. §5 새 엔드포인트·클라이언트 함수 → Task 4, DELETE 가드 → Task 5, 검증 헬퍼 → Task 3. §검증 → Task 9.
- 함수·타입 이름이 태스크 간에 일치하는지 확인함: `useAdminGate`, `AdminNav`/`AdminTabHref`, `sortSeriesPosts`/`moveItem`/`appendItem`/`removeItem`/`isSameOrder`, `parseSeriesPostIds`/`buildSeriesPostLocations`, `updateSeriesPosts`, `SeriesPostPicker` props(`candidates`, `seriesById`, `onAdd`).
