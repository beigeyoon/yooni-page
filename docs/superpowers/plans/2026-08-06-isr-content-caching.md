# 콘텐츠 페이지 ISR 도입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 콘텐츠 페이지를 ISR로 전환해 프로덕션 TTFB를 1–2초에서 CDN 서빙 수준으로 낮추면서, 정확한 404와 즉시 반영을 함께 유지한다.

**Architecture:** 네 개 콘텐츠 라우트에 `revalidate`를 선언하고 글·시리즈를 `generateStaticParams`로 빌드 시 생성한다. 글·시리즈가 바뀌면 API 핸들러에서 영향받는 경로를 무효화한다. 무효화 경로 계산은 순수 함수로 분리해 단위 테스트한다.

**Tech Stack:** Next.js 15.5 App Router, Supabase (supabase-js), Vitest

**설계 문서:** `docs/superpowers/specs/2026-08-06-isr-content-caching-design.md`

---

## 사전 지식 (이 저장소에서 모르면 시간 낭비하는 것)

- `.env`가 없고 `.env.development`만 있다. 빌드·prisma 전에 반드시:
  `set -a && . ./.env.development && set +a`
  안 하면 sitemap 프리렌더가 Supabase 환경변수 오류로 실패한다. 코드 문제가 아니다.
- 포트 3000은 다른 프로젝트가 쓰고 있다. 절대 죽이지 말 것. 검증 서버는 3210 같은 빈 포트에 띄우고
  로그에 `EADDRINUSE`가 없는지 확인한다.
- `curl localhost:PORT`는 로컬 프록시가 가로채 401을 준다. `127.0.0.1:PORT`를 쓴다.
- 페이지 HTML이 한 줄이라 `grep -c`는 항상 1을 반환한다. `grep -o ... | wc -l`을 쓴다.
- HTML을 쉘 `echo`로 넘기면 zsh가 RSC 페이로드의 `\uXXXX`를 디코딩해 오탐이 난다. 파일로 저장한 뒤 grep한다.
- 슬러그는 한글이며 라우트 params에서 퍼센트 인코딩되어 온다. `src/utils/decodeSlugParam.ts`로 디코딩한다.
- 로컬 빌드는 Vercel의 캐싱·리전 동작을 재현하지 못한다. **프로덕션 검증이 필수다.**

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/lib/revalidateContent.ts` (신규) | 바뀐 글·시리즈로부터 무효화할 경로 목록을 계산하고 실행 |
| `src/lib/revalidateContent.test.ts` (신규) | 경로 계산 순수 함수의 단위 테스트 |
| `src/app/page.tsx` | `revalidate` 선언, 무의미한 `dynamic = 'auto'` 제거 |
| `src/app/[category]/page.tsx` | `revalidate` 선언 |
| `src/app/[category]/[slug]/page.tsx` | `revalidate` 선언, `generateStaticParams` 추가 |
| `src/app/[category]/series/[seriesSlug]/page.tsx` | `revalidate` 선언, `generateStaticParams` 추가 |
| `src/app/api/posts/route.ts` | POST·PUT·DELETE에서 무효화 호출 (수정 전 조회 포함) |
| `src/app/api/series/route.ts` | POST·PUT·DELETE에서 무효화 호출 |

---

### Task 1: 무효화 경로 계산 함수

바뀐 글 하나는 그 글 페이지뿐 아니라 그 글을 나열하는 페이지도 낡게 만든다.
홈, 카테고리 목록, 소속 시리즈 목차가 모두 해당한다.
시리즈를 옮긴 수정은 이전 시리즈와 새 시리즈 양쪽을 무효화해야 하므로,
함수는 여러 위치를 한꺼번에 받아 중복을 제거한다.

**Files:**
- Create: `src/lib/revalidateContent.ts`
- Test: `src/lib/revalidateContent.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/revalidateContent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildContentPaths } from './revalidateContent';

describe('buildContentPaths', () => {
  it('홈은 항상 포함한다', () => {
    expect(buildContentPaths()).toEqual(['/']);
  });

  it('글 하나가 바뀌면 홈·카테고리·글을 무효화한다', () => {
    expect(buildContentPaths({ category: 'travel', slug: '톨레도' })).toEqual([
      '/',
      '/travel',
      '/travel/톨레도'
    ]);
  });

  it('시리즈 소속이면 시리즈 목차도 포함한다', () => {
    expect(
      buildContentPaths({
        category: 'travel',
        slug: '톨레도',
        seriesSlug: '신혼여행'
      })
    ).toEqual(['/', '/travel', '/travel/톨레도', '/travel/series/신혼여행']);
  });

  it('시리즈를 옮기면 양쪽 시리즈를 모두 무효화한다', () => {
    const paths = buildContentPaths(
      { category: 'travel', slug: '톨레도', seriesSlug: '신혼여행' },
      { category: 'travel', slug: '톨레도', seriesSlug: '치앙마이' }
    );

    expect(paths).toContain('/travel/series/신혼여행');
    expect(paths).toContain('/travel/series/치앙마이');
  });

  it('같은 경로를 두 번 넣지 않는다', () => {
    const paths = buildContentPaths(
      { category: 'travel', slug: '톨레도' },
      { category: 'travel', slug: '톨레도' }
    );

    expect(paths).toEqual(['/', '/travel', '/travel/톨레도']);
  });

  it('카테고리가 없으면 그 위치는 건너뛴다', () => {
    expect(buildContentPaths({ category: '', slug: '톨레도' })).toEqual(['/']);
  });

  it('slug나 seriesSlug가 없어도 카테고리는 무효화한다', () => {
    expect(buildContentPaths({ category: 'dev' })).toEqual(['/', '/dev']);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/lib/revalidateContent.test.ts`
Expected: FAIL — `Failed to resolve import "./revalidateContent"`

- [ ] **Step 3: 최소 구현 작성**

`src/lib/revalidateContent.ts`:

```ts
import { revalidatePath } from 'next/cache';

export type ContentLocation = {
  category: string;
  slug?: string | null;
  seriesSlug?: string | null;
};

// 글 하나가 바뀌면 그 글을 나열하는 페이지도 같이 낡는다.
// 수정으로 시리즈를 옮긴 경우처럼 위치가 둘 이상일 수 있어 가변 인자로 받는다.
export function buildContentPaths(...locations: ContentLocation[]): string[] {
  const paths = new Set<string>(['/']);

  for (const { category, slug, seriesSlug } of locations) {
    if (!category) continue;

    paths.add(`/${category}`);
    if (slug) paths.add(`/${category}/${slug}`);
    if (seriesSlug) paths.add(`/${category}/series/${seriesSlug}`);
  }

  return [...paths];
}

export function revalidateContent(...locations: ContentLocation[]): void {
  for (const path of buildContentPaths(...locations)) {
    revalidatePath(path);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/revalidateContent.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/revalidateContent.ts src/lib/revalidateContent.test.ts
git commit -m "feat: add content revalidation path builder"
```

---

### Task 2: 콘텐츠 라우트에 revalidate 선언

**Files:**
- Modify: `src/app/page.tsx:1`
- Modify: `src/app/[category]/page.tsx`
- Modify: `src/app/[category]/[slug]/page.tsx`
- Modify: `src/app/[category]/series/[seriesSlug]/page.tsx`

- [ ] **Step 1: 현재 라우트 유형 기록**

Run:
```bash
set -a && . ./.env.development && set +a && npm run build 2>&1 | sed -n '/Route (app)/,/Middleware/p'
```
Expected: `/`, `/[category]`, `/[category]/[slug]`, `/[category]/series/[seriesSlug]` 모두 `ƒ`이고 Revalidate 열이 비어 있다. 이 출력을 비교 기준으로 남긴다.

- [ ] **Step 2: 홈에 revalidate 선언**

`src/app/page.tsx`의 1행 `export const dynamic = 'auto';`를 아래로 교체한다.
`'auto'`는 기본값이라 아무 효과가 없으므로 남겨두면 혼란만 준다.

```ts
export const revalidate = 3600;
```

- [ ] **Step 3: 나머지 세 라우트에 선언 추가**

`src/app/[category]/page.tsx`, `src/app/[category]/[slug]/page.tsx`,
`src/app/[category]/series/[seriesSlug]/page.tsx` 각각의 import 블록 바로 아래에 추가한다:

```ts
// 즉시 무효화(revalidateContent)가 평소 갱신을 담당하고,
// 이 주기는 무효화가 실패했을 때를 위한 백스톱이다.
export const revalidate = 3600;
```

- [ ] **Step 4: 빌드해서 전환 확인**

Run:
```bash
set -a && . ./.env.development && set +a && npm run build 2>&1 | sed -n '/Route (app)/,/Middleware/p'
```
Expected: 네 라우트의 Revalidate 열에 `1h`가 표시된다.
`/[category]/[slug]`와 `/[category]/series/[seriesSlug]`는 `generateStaticParams`가 아직 없으므로
`ƒ`로 남아 있을 수 있다. Task 3에서 바뀐다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/page.tsx 'src/app/[category]/page.tsx' 'src/app/[category]/[slug]/page.tsx' 'src/app/[category]/series/[seriesSlug]/page.tsx'
git commit -m "perf: declare revalidate on content routes"
```

---

### Task 3: 글·시리즈 프리렌더

크롤러가 어떤 글의 첫 방문자가 되더라도 캐시된 응답을 받게 한다.
`dynamicParams`는 기본값 `true`로 둔다. `false`로 하면 빌드 이후에 쓴 글이 404가 되는데,
`revalidatePath`는 기존 경로를 무효화할 뿐 params 목록에 새 경로를 추가하지 못해 구제할 수 없다.

**Files:**
- Modify: `src/app/[category]/[slug]/page.tsx`
- Modify: `src/app/[category]/series/[seriesSlug]/page.tsx`

- [ ] **Step 1: 글 프리렌더 추가**

`src/app/[category]/[slug]/page.tsx`의 `revalidate` 선언 아래에 추가한다.
`getSupabasePublic`은 이 파일에 아직 import되어 있지 않으므로 import도 함께 추가한다:

```ts
import { getSupabasePublic } from '@/lib/supabasePublic';
```

```ts
export async function generateStaticParams() {
  const supabasePublic = getSupabasePublic();
  const { data } = await supabasePublic
    .from('post')
    .select('slug, category')
    .eq('isPublished', true);

  return (data ?? []).map(post => ({
    category: post.category,
    slug: post.slug
  }));
}
```

- [ ] **Step 2: 시리즈 프리렌더 추가**

`src/app/[category]/series/[seriesSlug]/page.tsx`에 같은 방식으로 추가한다:

```ts
import { getSupabasePublic } from '@/lib/supabasePublic';
```

```ts
export async function generateStaticParams() {
  const supabasePublic = getSupabasePublic();
  const { data } = await supabasePublic
    .from('series')
    .select('slug, category');

  return (data ?? []).map(series => ({
    category: series.category,
    seriesSlug: series.slug
  }));
}
```

- [ ] **Step 3: 빌드해서 정적 생성 확인**

Run:
```bash
set -a && . ./.env.development && set +a && npm run build 2>&1 | sed -n '/Route (app)/,/Middleware/p'
```
Expected: `/[category]/[slug]`와 `/[category]/series/[seriesSlug]`가 `●`(SSG)로 바뀌고
생성된 경로 수가 표시된다.

- [ ] **Step 4: 한글 슬러그 프리렌더 실측 확인**

`generateStaticParams`가 raw 한글 슬러그를 반환하는데 라우트 params는 퍼센트 인코딩되어 온다.
이 조합이 실제로 맞물리는지는 추론하지 말고 확인한다.

Run:
```bash
set -a && . ./.env.development && set +a && PORT=3210 npm run start > /tmp/isr.log 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null 127.0.0.1:3210/ && break; sleep 1; done
grep -i eaddrinuse /tmp/isr.log || echo "(no bind errors)"
curl -s -o /dev/null -w '%{http_code}\n' --path-as-is "127.0.0.1:3210/travel/신혼여행-톨레도"
curl -s -o /dev/null -w '%{http_code}\n' --path-as-is "127.0.0.1:3210/travel/series/신혼여행"
```
Expected: 둘 다 `200`.

`404`가 나오면 슬러그 인코딩이 어긋난 것이다. 그 경우 `generateStaticParams`에서
`encodeURIComponent(post.slug)`를 반환하도록 바꿔 다시 확인한다.
어느 쪽이 맞는지는 이 실측으로만 정한다.

- [ ] **Step 5: 커밋**

```bash
git add 'src/app/[category]/[slug]/page.tsx' 'src/app/[category]/series/[seriesSlug]/page.tsx'
git commit -m "perf: prerender published posts and series"
```

---

### Task 4: 글 API에서 무효화

POST는 slug를 직접 계산하므로 위치를 알고 있다.
PUT과 DELETE는 `id`만 받으므로 **바꾸기 전에 조회해야** 무효화할 경로를 알 수 있다.
PUT은 시리즈를 옮겼을 수 있어 수정 전 위치와 수정 후 위치를 모두 무효화한다.

**Files:**
- Modify: `src/app/api/posts/route.ts`

- [ ] **Step 1: import 추가**

`src/app/api/posts/route.ts` 상단에 추가한다:

```ts
import { revalidateContent } from '@/lib/revalidateContent';
```

- [ ] **Step 2: seriesId를 시리즈 슬러그로 바꾸는 헬퍼 추가**

무효화 경로에는 시리즈 슬러그가 필요한데 글 레코드는 `seriesId`만 갖고 있다.
`getPostPayload` 아래에 추가한다:

```ts
async function findSeriesSlug(seriesId: string | null): Promise<string | null> {
  if (!seriesId) return null;

  const { data } = await getSupabasePublic()
    .from('series')
    .select('slug')
    .eq('id', seriesId)
    .maybeSingle();

  return data?.slug ?? null;
}
```

- [ ] **Step 3: POST에 무효화 연결**

`route.ts`의 POST에서 insert가 성공한 뒤, `return NextResponse.json({ message: '✅ Post created successfully' ... })` 바로 앞에 추가한다:

```ts
    revalidateContent({
      category: payload.category,
      slug,
      seriesSlug: await findSeriesSlug(payload.seriesId)
    });
```

- [ ] **Step 4: PUT에 무효화 연결**

`const { data, error } = await supabaseAdmin.from('post').update(payload).eq('id', id);`
**앞에** 수정 전 위치를 조회하는 코드를 넣는다:

```ts
    const { data: before } = await getSupabasePublic()
      .from('post')
      .select('slug, category, seriesId')
      .eq('id', id)
      .maybeSingle();
```

그리고 update 성공 후 `return NextResponse.json({ message: '✅ Post updated successfully' ... })`
앞에 양쪽 위치를 무효화하는 코드를 넣는다:

```ts
    revalidateContent(
      {
        category: before?.category ?? payload.category,
        slug: before?.slug,
        seriesSlug: await findSeriesSlug(before?.seriesId ?? null)
      },
      {
        category: payload.category,
        slug: before?.slug,
        seriesSlug: await findSeriesSlug(payload.seriesId)
      }
    );
```

슬러그는 배정 후 불변이므로 수정 전후가 같다. `before?.slug`를 양쪽에 쓰는 이유다.

- [ ] **Step 5: DELETE에 무효화 연결**

`const { data, error } = await supabaseAdmin.from('post').delete().eq('id', postId);`
**앞에** 삭제 대상을 조회한다:

```ts
    const { data: target } = await getSupabasePublic()
      .from('post')
      .select('slug, category, seriesId')
      .eq('id', postId)
      .maybeSingle();
```

삭제 성공 후 `return NextResponse.json({ message: '✅ Post deleted successfully' ... })` 앞에 추가한다:

```ts
    if (target) {
      revalidateContent({
        category: target.category,
        slug: target.slug,
        seriesSlug: await findSeriesSlug(target.seriesId)
      });
    }
```

- [ ] **Step 6: 타입체크·린트·테스트**

Run:
```bash
npx tsc --noEmit && npm run lint && npm test
```
Expected: 타입 오류 없음, ESLint 0건, 테스트 전부 통과

- [ ] **Step 7: 커밋**

```bash
git add src/app/api/posts/route.ts
git commit -m "feat: revalidate affected paths when posts change"
```

---

### Task 5: 시리즈 API에서 무효화

시리즈 제목·설명은 시리즈 페이지와 홈의 시리즈 목록에 나타난다.
시리즈 삭제는 소속 글들의 페이지에도 영향을 준다.

**Files:**
- Modify: `src/app/api/series/route.ts`

- [ ] **Step 1: import 추가**

`src/app/api/series/route.ts` 상단에 추가한다.
`getSupabasePublic`은 3행에 이미 import되어 있으므로 추가하지 않는다.

```ts
import { revalidateContent } from '@/lib/revalidateContent';
```

- [ ] **Step 2: POST에 무효화 연결**

POST는 `slug`를 직접 계산하고 `payload.category`를 갖고 있다.
`return NextResponse.json({ message: '✅ Series created successfully', data }, { status: 201 });`
바로 앞에 추가한다:

```ts
    revalidateContent({ category: payload.category, seriesSlug: slug });
```

- [ ] **Step 3: PUT에 무효화 연결**

PUT은 `id`만 받아 `slug`를 모른다. 카테고리도 바뀔 수 있으므로 수정 전후를 모두 무효화한다.

`const { data, error } = await supabaseAdmin.from('series').update(payload).eq('id', id);`
**앞에** 추가한다:

```ts
    const { data: before } = await getSupabasePublic()
      .from('series')
      .select('slug, category')
      .eq('id', id)
      .maybeSingle();
```

`return NextResponse.json({ message: '✅ Series updated successfully', data }, { status: 200 });`
앞에 추가한다:

```ts
    if (before) {
      revalidateContent(
        { category: before.category, seriesSlug: before.slug },
        { category: payload.category, seriesSlug: before.slug }
      );
    }
```

시리즈 슬러그도 배정 후 불변이므로 양쪽에 `before.slug`를 쓴다.

- [ ] **Step 4: DELETE에 무효화 연결**

시리즈를 지우면 그 시리즈 페이지뿐 아니라 **소속 글들의 페이지도 낡는다.**
각 글에 붙은 시리즈 목차와 이전/다음 편 네비게이션이 사라지기 때문이다.

`const { data, error } = await supabaseAdmin.from('series').delete().eq('id', id);`
**앞에** 추가한다:

```ts
    const supabasePublic = getSupabasePublic();

    const [{ data: target }, { data: seriesPosts }] = await Promise.all([
      supabasePublic
        .from('series')
        .select('slug, category')
        .eq('id', id)
        .maybeSingle(),
      supabasePublic.from('post').select('slug, category').eq('seriesId', id)
    ]);
```

`return NextResponse.json({ message: '✅ Series deleted successfully', data }, { status: 200 });`
앞에 추가한다:

```ts
    if (target) {
      revalidateContent(
        { category: target.category, seriesSlug: target.slug },
        ...(seriesPosts ?? []).map(post => ({
          category: post.category,
          slug: post.slug
        }))
      );
    }
```

- [ ] **Step 5: 타입체크·린트·테스트**

Run:
```bash
npx tsc --noEmit && npm run lint && npm test
```
Expected: 전부 통과

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/series/route.ts
git commit -m "feat: revalidate affected paths when series change"
```

---

### Task 6: 로컬 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 빌드 후 서버 기동**

Run:
```bash
set -a && . ./.env.development && set +a && npm run build
set -a && . ./.env.development && set +a && PORT=3210 npm run start > /tmp/isr-verify.log 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null 127.0.0.1:3210/ && break; sleep 1; done
grep -i eaddrinuse /tmp/isr-verify.log || echo "(no bind errors)"
```
Expected: `(no bind errors)`

- [ ] **Step 2: 404 매트릭스 재실행**

방금 고친 404가 ISR로 깨지지 않았는지 확인한다.

Run:
```bash
for p in "/talk/no-such-post-xyz" "/nosuchcategory/whatever" "/talk/series/no-such-series-xyz" \
         "/totally-random-path-xyz" "/talk/00000000-0000-0000-0000-000000000000" \
         "/talk/series/00000000-0000-0000-0000-000000000000" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "127.0.0.1:3210$p")" "$p"
done
```
Expected: 6개 모두 `404`

**하나라도 200이면 멈추고 보고한다.** ISR과 `notFound()`가 충돌한다는 뜻이고,
설계의 전제가 틀린 것이므로 임의로 우회하지 말 것.

- [ ] **Step 3: 정상 페이지 확인**

Run:
```bash
for p in "/" "/talk" "/travel" "/about" "/project" "/travel/신혼여행-톨레도" "/travel/series/신혼여행" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "127.0.0.1:3210$p")" "$p"
done
```
Expected: 7개 모두 `200`

- [ ] **Step 4: SSR 콘텐츠 확인**

Run:
```bash
cd /tmp && curl -s --path-as-is "127.0.0.1:3210/travel/신혼여행-톨레도" -o isr-post.html
echo "h1: $(grep -o '<h1' isr-post.html | wc -l)"
echo "iframe: $(grep -o '<iframe' isr-post.html | wc -l)"
echo "json-ld: $(grep -o 'application/ld+json' isr-post.html | wc -l)"
```
Expected: h1 `1`, iframe `2`, json-ld `4`

- [ ] **Step 5: 전체 테스트·스크린샷**

Run: `npm test`
Expected: 전부 통과 (Task 1에서 7개 추가되어 44개)

스크린샷은 `example-skills:webapp-testing`으로 홈·글·카테고리·시리즈·404 5종을 찍어
레이아웃 회귀가 없는지 눈으로 확인한다.

- [ ] **Step 6: 서버 정리**

띄운 3210 서버를 종료한다. 3000은 건드리지 않는다.

---

### Task 7: 프로덕션 검증

로컬 빌드는 Vercel의 캐싱·리전 동작을 재현하지 못한다.
직전 작업에서 로컬 TTFB(73–110ms)로 프로덕션(0.8–2.7초)을 예측했다가 10–20배 빗나갔다.

**Files:** 없음 (검증만)

- [ ] **Step 1: 배포**

main에 머지·푸시하기 전에 사용자에게 보고하고 승인을 받는다 (`/code-work` 규칙 1).

- [ ] **Step 2: 배포 반영 확인**

Run:
```bash
gh api repos/beigeyoon/yooni-page/deployments --jq '.[0:2][] | "\(.created_at)  \(.sha[0:7])  \(.environment)"'
git log --oneline -1 origin/main
```
Expected: 최신 Production 배포의 sha가 방금 푸시한 커밋과 일치

- [ ] **Step 3: TTFB 측정**

Run:
```bash
for p in "/" "/travel" "/travel/신혼여행-톨레도"; do
  curl -s -o /dev/null --path-as-is "https://yooni.seoul.kr$p"
  tot=0
  for i in 1 2 3 4 5; do
    t=$(curl -s -o /dev/null -w '%{time_starttransfer}' --path-as-is "https://yooni.seoul.kr$p")
    tot=$(echo "$tot + $t" | bc -l)
  done
  printf '%-28s %.0f ms\n' "$p" "$(echo "$tot/5*1000" | bc -l)"
done
```
Expected: 개선 전 1140–2690ms에서 크게 낮아진다.
목표는 수십 ms지만, 첫 요청이 캐시 미스일 수 있으니 warm-up 후 값으로 판단한다.
**개선이 없으면 정적화가 실제로 적용되지 않은 것이므로 멈추고 보고한다.**

- [ ] **Step 4: 프로덕션 404 매트릭스**

Run:
```bash
for p in "/talk/no-such-post-xyz" "/nosuchcategory/whatever" "/talk/series/no-such-series-xyz" \
         "/totally-random-path-xyz" "/talk/00000000-0000-0000-0000-000000000000" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "https://yooni.seoul.kr$p")" "$p"
done
```
Expected: 전부 `404`

- [ ] **Step 5: 옛 UUID 리다이렉트 확인**

Run:
```bash
for u in "/travel/ba0766c4-3553-4489-aef2-e351940fff13" "/travel/series/6b24bed8-65e7-4d21-9225-aec20f8004e0" ; do
  printf '%s -> %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "https://yooni.seoul.kr$u")" \
                      "$(curl -s -o /dev/null -w '%{http_code}' -L --path-as-is "https://yooni.seoul.kr$u")"
done
```
Expected: `308 -> 200` 두 줄

- [ ] **Step 6: 즉시 반영 확인**

관리자로 로그인해 글 하나의 부제를 고치고 저장한 뒤, 그 글 페이지와 카테고리 목록, 홈에
변경이 바로 보이는지 확인한다. 이 단계는 관리자 로그인이 필요하므로 사용자에게 요청한다.

**반영되지 않으면** `revalidatePath`가 한글 슬러그 경로를 처리하지 못한 것일 수 있다.
그 경우 경로를 `encodeURIComponent`로 감싼 버전과 raw 버전 중 어느 쪽이 동작하는지 실측으로 확인한다.

- [ ] **Step 7: 결과 보고**

측정치를 표로 정리해 보고한다. 개선 전후 TTFB, 404 매트릭스, 즉시 반영 여부.
예측이 빗나갔다면 그 사실을 숨기지 않고 함께 보고한다.

---

## 롤백

문제가 생기면 되돌리기는 단순하다. `revalidate` 선언과 `generateStaticParams`를 제거하면
동적 렌더링으로 즉시 복귀하며, 404 동작은 `loading.tsx` 삭제(커밋 85c413e)에 달려 있으므로
영향받지 않는다.
