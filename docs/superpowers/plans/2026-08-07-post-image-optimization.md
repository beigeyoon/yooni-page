# 본문 이미지 최적화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문 `<img>`의 `src`를 Next.js 이미지 최적화 경로로 돌려, 방문자 전송량을 장당 2.96MB에서 300KB 수준으로 줄인다.

**Architecture:** Supabase 스토리지 URL을 `/_next/image` URL로 바꾸는 순수 함수를 새 모듈로 분리하고, 기존 `optimizePostHtml`이 `<img>` 태그를 조립할 때 그 함수를 써서 `src`·`srcset`·`sizes`를 채운다. 원본 URL은 `url=` 파라미터에 그대로 남는다.

**Tech Stack:** Next.js 15.5 이미지 최적화, Vitest

**설계 문서:** `docs/superpowers/specs/2026-08-07-post-image-optimization-design.md`

---

## 사전 지식 (이 저장소에서 모르면 시간 낭비하는 것)

- `.env`가 없고 `.env.development`만 있다. 빌드 전에 반드시:
  `set -a && . ./.env.development && set +a`
- 포트 3000은 다른 프로젝트가 쓰고 있다. 절대 죽이지 말 것. 검증 서버는 3210에 띄우고
  로그에 `EADDRINUSE`가 없는지 확인한다.
- `curl localhost:PORT`는 로컬 프록시가 가로채 401을 준다. `127.0.0.1:PORT`를 쓴다.
- 페이지 HTML이 한 줄이라 `grep -c`는 항상 1을 반환한다. `grep -o ... | wc -l`을 쓴다.
- 렌더 순서는 `optimizePostHtml(sanitizePostHtml(post.content))`이다
  (`src/app/[category]/[slug]/page.tsx:362`). optimize가 나중이므로 새로 붙이는
  `srcset`·`sizes`는 sanitize 허용 목록에 걸리지 않는다. **이 순서를 뒤집으면 안 된다.**
- 본문 원본 태그는 `<img src="https://…supabase.co/storage/v1/object/public/images/….jpg">`
  하나뿐이다. `width`/`height`는 없다.

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/utils/postImageSrc.ts` (신규) | Supabase 스토리지 URL → `/_next/image` URL 변환 규칙 |
| `src/utils/postImageSrc.test.ts` (신규) | 위 순수 함수 단위 테스트 |
| `src/utils/optimizePostHtml.ts` | `<img>` 태그 조립에 `src`·`srcset`·`sizes` 추가 |
| `src/utils/optimizePostHtml.test.ts` (신규) | 태그 조립 단위 테스트 (현재 테스트 없음) |

---

### Task 1: 이미지 URL 변환 유틸

`process.env`는 모듈 최상단이 아니라 함수 안에서 읽는다.
최상단에서 읽으면 테스트가 `vi.stubEnv`로 바꿔도 이미 평가된 값이 남는다.

**Files:**
- Create: `src/utils/postImageSrc.ts`
- Test: `src/utils/postImageSrc.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/postImageSrc.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildOptimizedSrc,
  buildSrcSet,
  isOptimizableImageSrc,
  IMAGE_WIDTHS
} from './postImageSrc';

const SUPABASE = 'https://pkcsbguvrcjetmuabppk.supabase.co';
const IMAGE = `${SUPABASE}/storage/v1/object/public/images/photo.jpg`;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

describe('isOptimizableImageSrc', () => {
  it('Supabase 스토리지 이미지는 변환 대상이다', () => {
    expect(isOptimizableImageSrc(IMAGE)).toBe(true);
  });

  it('외부 이미지는 건드리지 않는다', () => {
    expect(isOptimizableImageSrc('https://example.com/a.jpg')).toBe(false);
  });

  it('data URI는 건드리지 않는다', () => {
    expect(isOptimizableImageSrc('data:image/png;base64,AAAA')).toBe(false);
  });

  it('같은 호스트라도 스토리지 경로가 아니면 제외한다', () => {
    expect(isOptimizableImageSrc(`${SUPABASE}/rest/v1/post`)).toBe(false);
  });

  it('환경변수가 없으면 아무것도 변환하지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(isOptimizableImageSrc(IMAGE)).toBe(false);
  });
});

describe('buildOptimizedSrc', () => {
  it('원본 URL을 인코딩해 넣고 폭과 품질을 붙인다', () => {
    expect(buildOptimizedSrc(IMAGE, 828)).toBe(
      `/_next/image?url=${encodeURIComponent(IMAGE)}&w=828&q=75`
    );
  });
});

describe('buildSrcSet', () => {
  it('후보 폭마다 항목을 만든다', () => {
    const srcset = buildSrcSet(IMAGE);
    expect(srcset.split(', ')).toHaveLength(IMAGE_WIDTHS.length);
    expect(srcset).toContain('&w=640&q=75 640w');
    expect(srcset).toContain('&w=1080&q=75 1080w');
  });

  it('레티나가 고를 1920px 후보는 넣지 않는다', () => {
    expect(buildSrcSet(IMAGE)).not.toContain('1920w');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/utils/postImageSrc.test.ts`
Expected: FAIL — `Failed to resolve import "./postImageSrc"`

- [ ] **Step 3: 최소 구현 작성**

`src/utils/postImageSrc.ts`:

```ts
// 본문 이미지를 Next.js 이미지 최적화 경로로 돌린다.
//
// 원본은 아이폰 카메라 그대로(3024x4032, 평균 2.96MB)인데 본문 컨테이너는 780px이라,
// 그대로 내려보내면 표시 폭의 4배 해상도를 전송하게 된다.
// 변환은 Vercel이 하고 결과만 CDN에 캐시되므로 원본은 그대로 남는다.

// next.config.ts의 deviceSizes 부분집합.
// 1920은 일부러 뺐다. srcset에 있으면 레티나 화면이 그걸 고르는데,
// 실측 결과 998KB로 절감이 4배까지 떨어진다. 1080이면 467KB다.
export const IMAGE_WIDTHS = [640, 828, 1080] as const;

// 본문 폭(max-w-[780px])에 가장 가까운 후보. srcset을 못 읽는 환경의 기본값이다.
export const DEFAULT_IMAGE_WIDTH = 828;

const QUALITY = 75;

// 모듈 최상단이 아니라 호출 시점에 읽는다. 최상단이면 테스트가 환경변수를
// 바꿔도 이미 평가된 값이 남는다.
function storagePrefix(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/` : '';
}

export function isOptimizableImageSrc(src: string): boolean {
  const prefix = storagePrefix();
  return prefix.length > 0 && src.startsWith(prefix);
}

export function buildOptimizedSrc(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;
}

export function buildSrcSet(src: string): string {
  return IMAGE_WIDTHS.map(
    width => `${buildOptimizedSrc(src, width)} ${width}w`
  ).join(', ');
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/utils/postImageSrc.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/utils/postImageSrc.ts src/utils/postImageSrc.test.ts
git commit -m "feat: add body image URL optimizer"
```

---

### Task 2: optimizePostHtml에 연결

`src`·`srcset`·`sizes`를 채운다.
`&`는 HTML 속성에 들어가므로 `&amp;`로 이스케이프한다. URL 빌더는 순수 URL을 반환하고
이스케이프는 태그를 조립하는 이쪽에서 한다.

**Files:**
- Modify: `src/utils/optimizePostHtml.ts`
- Test: `src/utils/optimizePostHtml.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/optimizePostHtml.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import optimizePostHtml from './optimizePostHtml';

const SUPABASE = 'https://pkcsbguvrcjetmuabppk.supabase.co';
const IMAGE = `${SUPABASE}/storage/v1/object/public/images/photo.jpg`;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

describe('optimizePostHtml', () => {
  it('첫 이미지는 eager, 나머지는 lazy로 둔다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}"><img src="${IMAGE}">`);
    const tags = html.match(/<img[^>]*>/g) ?? [];

    expect(tags[0]).toContain('loading="eager"');
    expect(tags[0]).toContain('fetchpriority="high"');
    expect(tags[1]).toContain('loading="lazy"');
    expect(tags[1]).toContain('fetchpriority="low"');
  });

  it('alt가 없으면 채워 넣는다', () => {
    expect(optimizePostHtml(`<img src="${IMAGE}">`)).toContain(
      'alt="본문 이미지 1"'
    );
  });

  it('의미 있는 alt는 보존한다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}" alt="톨레도 성당">`);
    expect(html).toContain('alt="톨레도 성당"');
    expect(html).not.toContain('본문 이미지');
  });

  it('Supabase 이미지는 최적화 경로로 바꾼다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);

    expect(html).toContain('src="/_next/image?url=');
    expect(html).toContain('&amp;w=828&amp;q=75"');
    expect(html).not.toContain(`src="${IMAGE}"`);
  });

  it('srcset과 sizes를 붙인다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);

    expect(html).toContain('srcset="');
    expect(html).toContain('640w');
    expect(html).toContain('1080w');
    expect(html).toContain('sizes="(max-width: 780px) 100vw, 780px"');
  });

  it('원본 URL을 url 파라미터에 보존한다', () => {
    const html = optimizePostHtml(`<img src="${IMAGE}">`);
    expect(html).toContain(encodeURIComponent(IMAGE));
  });

  it('외부 이미지는 src를 그대로 둔다', () => {
    const html = optimizePostHtml('<img src="https://example.com/a.jpg">');

    expect(html).toContain('src="https://example.com/a.jpg"');
    expect(html).not.toContain('_next/image');
    expect(html).not.toContain('srcset');
  });

  it('자기닫힘 표기를 보존한다', () => {
    expect(optimizePostHtml(`<img src="${IMAGE}" />`)).toContain('/>');
  });

  it('이미지가 없으면 원문을 그대로 돌려준다', () => {
    expect(optimizePostHtml('<p>글자만</p>')).toBe('<p>글자만</p>');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/utils/optimizePostHtml.test.ts`
Expected: FAIL — 3건이 실패한다.
"Supabase 이미지는 최적화 경로로 바꾼다", "srcset과 sizes를 붙인다",
"원본 URL을 url 파라미터에 보존한다".

나머지 6건(`loading`, `alt` 2건, 외부 이미지, 자기닫힘, 이미지 없음)은 기존 동작이라 통과한다.
외부 이미지 테스트가 지금도 통과하는 것은 정상이다 — 변환이 없으니 `srcset`도 없다.
이 테스트는 Task 2 구현 후에도 계속 통과해야 회귀를 잡는다.

- [ ] **Step 3: import와 상수 추가**

`src/utils/optimizePostHtml.ts` 최상단(주석 블록 아래)에 추가한다:

```ts
import {
  buildOptimizedSrc,
  buildSrcSet,
  DEFAULT_IMAGE_WIDTH,
  isOptimizableImageSrc
} from './postImageSrc';
```

`const IMG_TAG = ...` 아래에 추가한다:

```ts
// 본문 컨테이너는 max-w-[780px]이다. 이미지 그룹(--count)에서는 실제 표시 폭이
// 더 작아 과다 다운로드가 생기지만, 그룹별 폭을 계산하는 복잡도에 비해 이득이 작다.
const SIZES = '(max-width: 780px) 100vw, 780px';

// URL의 &가 HTML 속성 안에서 엔티티로 해석되지 않도록 막는다.
function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;');
}

function readAttr(attrs: string, name: string): string {
  const match = attrs.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  if (!match) return '';
  return match[1] ?? match[2] ?? match[3] ?? '';
}
```

- [ ] **Step 4: 태그 조립에 이미지 변환 연결**

`optimizePostHtml` 함수 안에서 `const keepAlt = hasMeaningfulAlt(base);` 아래에 추가한다:

```ts
    const src = readAttr(base, 'src');
    const optimizable = isOptimizableImageSrc(src);
```

`let attrs = base` 체인 뒤에 추가한다:

```ts
    if (optimizable) {
      attrs = attrs
        .replace(attrPattern('src'), '')
        .replace(attrPattern('srcset'), '')
        .replace(attrPattern('sizes'), '');
    }
```

`const added = [...]` 배열 선언 뒤, `if (!keepAlt)` 앞에 추가한다:

```ts
    if (optimizable) {
      added.unshift(
        `src="${escapeAttr(buildOptimizedSrc(src, DEFAULT_IMAGE_WIDTH))}"`,
        `srcset="${escapeAttr(buildSrcSet(src))}"`,
        `sizes="${SIZES}"`
      );
    }
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/utils/optimizePostHtml.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 6: 타입체크·린트·전체 테스트**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 타입 오류 없음, ESLint 0건, 테스트 전부 통과 (44 + 8 + 9 = 61개)

- [ ] **Step 7: 커밋**

```bash
git add src/utils/optimizePostHtml.ts src/utils/optimizePostHtml.test.ts
git commit -m "perf: serve body images through the image optimizer"
```

---

### Task 3: 로컬 검증

단위 테스트는 문자열만 본다. 변환된 URL이 실제로 이미지를 돌려주는지는 서버로 확인해야 한다.

**Files:** 없음 (검증만)

- [ ] **Step 1: 빌드 후 서버 기동**

Run:
```bash
set -a && . ./.env.development && set +a && npm run build
set -a && . ./.env.development && set +a && PORT=3210 npm run start > /tmp/img-verify.log 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null 127.0.0.1:3210/ && break; sleep 1; done
grep -i eaddrinuse /tmp/img-verify.log || echo "(no bind errors)"
```
Expected: `(no bind errors)`

- [ ] **Step 2: 본문 HTML에 최적화 URL이 들어갔는지 확인**

Run:
```bash
cd /tmp && curl -s --path-as-is "127.0.0.1:3210/travel/신혼여행-톨레도" -o img-post.html
echo "본문 img:        $(grep -o '<img' img-post.html | wc -l)"
echo "_next/image:     $(grep -o '_next/image' img-post.html | wc -l)"
echo "srcset:          $(grep -o 'srcset=' img-post.html | wc -l)"
echo "원본 직접 참조:   $(grep -o 'supabase.co/storage/v1/object/public/images/[^\"&]*\.jpg\"' img-post.html | wc -l)"
```
Expected: `_next/image`가 여러 건, `srcset`이 본문 이미지 수만큼,
**원본 직접 참조는 0건**이어야 한다.

- [ ] **Step 3: 변환된 이미지가 실제로 응답하는지 확인**

Run:
```bash
cd /tmp
python3 - <<'PY'
import re, urllib.parse, urllib.request, html
page = open('img-post.html', encoding='utf-8').read()
urls = re.findall(r'src="(/_next/image\?[^"]+)"', page)
urls = [html.unescape(u) for u in urls]
body = [u for u in urls if 'storage%2Fv1%2Fobject' in u]
print(f'본문 최적화 이미지: {len(body)}개')
total = 0
for u in body[:5]:
    req = urllib.request.Request('http://127.0.0.1:3210' + u,
                                 headers={'Accept': 'image/avif,image/webp,*/*'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    total += len(data)
    print(f'  {r.status}  {r.headers.get("Content-Type")}  {len(data)/1024:.0f} KB')
print(f'앞 5장 합계: {total/1024/1024:.2f} MB (원본이었다면 약 15 MB)')
PY
```
Expected: 5장 모두 `200`, `image/avif` 또는 `image/webp`, 장당 200~500KB.

- [ ] **Step 4: 회귀 확인**

Run:
```bash
for p in "/talk/no-such-post-xyz" "/nosuchcategory/whatever" "/totally-random-path-xyz" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "127.0.0.1:3210$p")" "$p"
done
for p in "/" "/travel" "/travel/신혼여행-톨레도" "/travel/series/신혼여행" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "127.0.0.1:3210$p")" "$p"
done
```
Expected: 앞 3개 `404`, 뒤 4개 `200`

- [ ] **Step 5: 스크린샷으로 이미지가 실제로 보이는지 확인**

`example-skills:webapp-testing`으로 글 페이지를 찍어 사진이 정상 표시되는지 눈으로 확인한다.
`wait_until='domcontentloaded'`를 쓴다 — 이 사이트는 이미지가 많아 `load`/`networkidle`이 타임아웃난다.

**이미지가 깨져 보이면 멈추고 보고한다.** `/_next/image`가 400을 내는 경우
`next.config.ts`의 `remotePatterns`와 실제 URL이 어긋난 것이다.

- [ ] **Step 6: 서버 정리**

3210 서버를 종료한다. 3000은 건드리지 않는다.

---

### Task 4: 프로덕션 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 배포**

main에 머지·푸시하기 전에 사용자에게 보고하고 승인을 받는다 (`/code-work` 규칙 1).
배포 후 `gh api repos/beigeyoon/yooni-page/deployments`로 Production 배포 sha가
푸시한 커밋과 일치하는지 확인한다.

- [ ] **Step 2: 실제 전송량 측정**

Run:
```bash
cd /tmp
curl -s --path-as-is "https://yooni.seoul.kr/travel/신혼여행-톨레도" -o prod-img.html
python3 - <<'PY'
import re, urllib.request, html, concurrent.futures as cf
page = open('prod-img.html', encoding='utf-8').read()
urls = [html.unescape(u) for u in re.findall(r'src="(/_next/image\?[^"]+)"', page)]
body = [u for u in urls if 'storage%2Fv1%2Fobject' in u]

def fetch(u):
    req = urllib.request.Request('https://yooni.seoul.kr' + u,
                                 headers={'Accept': 'image/avif,image/webp,*/*'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.status, r.headers.get('Content-Type'), len(r.read())

with cf.ThreadPoolExecutor(max_workers=8) as ex:
    results = list(ex.map(fetch, body))

ok = [r for r in results if r[0] == 200]
total = sum(r[2] for r in ok)
print(f'본문 이미지: {len(body)}개, 200 응답: {len(ok)}개')
print(f'전송 합계: {total/1024/1024:.2f} MB')
print(f'개선 전 추정: {len(body) * 2.96:.1f} MB')
PY
```
Expected: 전부 `200`, 합계가 개선 전의 10분의 1 수준.

**200이 아닌 응답이 있으면 멈추고 보고한다.** Vercel 이미지 최적화 한도에 걸렸을 수 있다.

- [ ] **Step 3: 404 매트릭스와 정상 페이지 재확인**

Run:
```bash
B=https://yooni.seoul.kr
for p in "/talk/no-such-post-xyz" "/nosuchcategory/whatever" "/totally-random-path-xyz" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "$B$p")" "$p"
done
for p in "/" "/travel" "/travel/신혼여행-톨레도" "/travel/series/신혼여행" ; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "$B$p")" "$p"
done
```
Expected: 앞 3개 `404`, 뒤 4개 `200`

- [ ] **Step 4: 결과 보고**

개선 전후 전송량을 표로 정리해 보고한다. 추정이 빗나갔다면 그 사실을 함께 적는다.

---

## 롤백

`optimizePostHtml`에서 `if (optimizable)` 두 블록만 지우면 이전 동작으로 돌아간다.
원본 URL은 `url=` 파라미터에 그대로 남아 있으므로 데이터 손실이 없다.
