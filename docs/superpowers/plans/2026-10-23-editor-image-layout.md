# 에디터 이미지 레이아웃 배치와 업로드 전 압축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장수(1~4)와 레이아웃을 고른 뒤 각 칸에 파인더에서 사진을 끌어다 놓아 이미지 묶음을 넣고, 업로드 전에 사진을 긴 변 2048px WebP로 줄여 Vercel 4.5MB 한도에 걸리지 않게 한다.

**Architecture:** 레이아웃은 `imageGroup` 노드의 `data-layout` 속성으로 저장하고 배치는 `globals.css`의 grid가 맡는다(에디터와 상세가 공유). 배치 창은 Radix Dialog + HTML5 DnD로 만들고, 칸 배열 조작은 순수 함수로 분리한다. 압축은 canvas로 직접 구현해 `uploadImage` 안에서 항상 거친다.

**Tech Stack:** Next.js 15.5, React 19, Tiptap 2, Radix Dialog, Tailwind, Vitest(jsdom)

**설계 문서:** `docs/superpowers/specs/2026-10-23-editor-image-layout-design.md`

---

## 사전 지식

- 테스트 기본 환경은 node다. DOM이 필요한 테스트는 파일 첫 줄에 `// @vitest-environment jsdom`.
- `@testing-library`는 없다. 컴포넌트 테스트는 `createRoot` + `act`로 직접 렌더한다(`src/app/editor/page.test.tsx` 참고).
- 렌더 순서는 `optimizePostHtml(sanitizePostHtml(post.content))`다. sanitize가 먼저이므로 `data-layout`은 sanitize 허용 목록에 있어야 한다.
- 포트 3000은 다른 프로젝트가 쓴다. 검증 서버는 3210. `curl`은 `127.0.0.1`로.
- 기준선: `pnpm test` → 20 files, 128 tests 통과.

## File Structure

| 파일 | 역할 |
| --- | --- |
| `src/utils/imageLayouts.ts` (신규) | 15개 레이아웃 목록과 조회 함수 |
| `src/utils/compressImage.ts` (신규) | 디코딩(HEIC 대체 포함)·리사이즈·WebP/JPEG 인코딩 |
| `src/constants/upload.ts` (신규) | 업로드 용량 한도 상수(클라이언트·라우트 공유) |
| `src/utils/uploadImage.ts` | 압축 후 업로드, `{ url } \| { error }` 반환 |
| `src/app/api/upload/route.ts` | 한도를 4MB로 |
| `src/extensions/ImageGroup.ts` | `layout` 속성 ↔ `data-layout` |
| `src/utils/sanitizePostHtml.ts` | `div`에 `data-layout` 허용 |
| `src/app/globals.css` | `[data-layout]` grid 규칙, 썸네일 규칙 |
| `src/components/ImageLayoutDialog/slots.ts` (신규) | 칸 배열 순수 함수 |
| `src/components/ImageLayoutDialog/SlotCell.tsx` (신규) | 칸 하나: 드롭·클릭·자리 바꾸기·상태 표시 |
| `src/components/ImageLayoutDialog/LayoutPicker.tsx` (신규) | 장수 버튼과 레이아웃 썸네일 |
| `src/components/ImageLayoutDialog/index.tsx` (신규) | 배치 창: 상태, 업로드, 삽입 |
| `src/components/TiptapEditor/Toolbar.tsx` | 이미지 버튼이 배치 창을 연다 |

---

### Task 1: 레이아웃 목록

**Files:**
- Create: `src/utils/imageLayouts.ts`
- Test: `src/utils/imageLayouts.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { IMAGE_LAYOUTS, LAYOUT_COUNTS, getLayout, getLayoutsByCount } from './imageLayouts';

describe('IMAGE_LAYOUTS', () => {
  it('id가 겹치지 않는다', () => {
    const ids = IMAGE_LAYOUTS.map(layout => layout.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('칸 수가 장수와 같다', () => {
    for (const layout of IMAGE_LAYOUTS) {
      expect(layout.cells.length, layout.id).toBe(layout.count);
    }
  });

  it('장수별 레이아웃 개수는 1/3/5/5다', () => {
    expect(LAYOUT_COUNTS.map(count => getLayoutsByCount(count).length)).toEqual([1, 3, 5, 5]);
  });

  it('원본 비율 칸은 1장 레이아웃에만 있다', () => {
    for (const layout of IMAGE_LAYOUTS) {
      expect(layout.cells.includes('original'), layout.id).toBe(layout.count === 1);
    }
  });
});

describe('getLayout', () => {
  it('id로 찾는다', () => {
    expect(getLayout('3-c')?.cells).toEqual(['portrait', 'landscape', 'landscape']);
  });

  it('없는 id는 undefined다', () => {
    expect(getLayout('9-z')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/utils/imageLayouts.test.ts` → 모듈 없음으로 FAIL

- [ ] **Step 3: 구현**

```ts
// 에디터 이미지 묶음의 레이아웃 목록. 실제 칸 배치는 globals.css의 [data-layout] 규칙이 맡는다.
// 여기에 레이아웃을 추가하면 globals.css에도 같은 id의 규칙을 넣어야 한다(테스트가 확인한다).

export type CellRatio = 'original' | 'square' | 'landscape' | 'portrait';
export type LayoutCount = 1 | 2 | 3 | 4;

export type ImageLayout = {
  id: string;
  count: LayoutCount;
  label: string;
  cells: CellRatio[];
};

export const LAYOUT_COUNTS: LayoutCount[] = [1, 2, 3, 4];

export const CELL_RATIO_LABEL: Record<CellRatio, string> = {
  original: '원본',
  square: '정',
  landscape: '가',
  portrait: '세'
};

const S = 'square';
const L = 'landscape';
const P = 'portrait';

export const IMAGE_LAYOUTS: ImageLayout[] = [
  { id: '1-a', count: 1, label: '원본 비율', cells: ['original'] },
  { id: '2-a', count: 2, label: '정방형 나란히', cells: [S, S] },
  { id: '2-b', count: 2, label: '세로형 나란히', cells: [P, P] },
  { id: '2-c', count: 2, label: '가로형 위아래', cells: [L, L] },
  { id: '3-a', count: 3, label: '정방형 3열', cells: [S, S, S] },
  { id: '3-b', count: 3, label: '세로형 3열', cells: [P, P, P] },
  { id: '3-c', count: 3, label: '세로1 + 가로2', cells: [P, L, L] },
  { id: '3-d', count: 3, label: '가로2 + 세로1', cells: [L, L, P] },
  { id: '3-e', count: 3, label: '위 가로1 + 아래 정방형2', cells: [L, S, S] },
  { id: '4-a', count: 4, label: '정방형 2×2', cells: [S, S, S, S] },
  { id: '4-b', count: 4, label: '정방형 4열', cells: [S, S, S, S] },
  { id: '4-c', count: 4, label: '위 가로1 + 아래 정방형3', cells: [L, S, S, S] },
  { id: '4-d', count: 4, label: '세로1 + 가로3', cells: [P, L, L, L] },
  { id: '4-e', count: 4, label: '세로형 4열', cells: [P, P, P, P] }
];

export function getLayoutsByCount(count: LayoutCount) {
  return IMAGE_LAYOUTS.filter(layout => layout.count === count);
}

export function getLayout(id: string) {
  return IMAGE_LAYOUTS.find(layout => layout.id === id);
}
```

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS

- [ ] **Step 5: 커밋** — `feat: add the image layout catalog for the editor`

---

### Task 2: 업로드 전 압축

**Files:**
- Create: `src/utils/compressImage.ts`
- Test: `src/utils/compressImage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import compressImage, { getTargetSize } from './compressImage';

const heic2any = vi.hoisted(() => vi.fn());
vi.mock('heic2any', () => ({ default: heic2any }));

describe('getTargetSize', () => {
  it('가로 사진은 긴 변을 2048로 줄인다', () => {
    expect(getTargetSize(4032, 3024)).toEqual({ width: 2048, height: 1536 });
  });

  it('세로 사진은 긴 변을 2048로 줄인다', () => {
    expect(getTargetSize(3024, 4032)).toEqual({ width: 1536, height: 2048 });
  });

  it('정사각형도 줄인다', () => {
    expect(getTargetSize(3000, 3000)).toEqual({ width: 2048, height: 2048 });
  });

  it('작은 사진은 키우지 않는다', () => {
    expect(getTargetSize(1000, 800)).toEqual({ width: 1000, height: 800 });
  });
});

describe('compressImage', () => {
  const createImageBitmap = vi.fn();
  const drawImage = vi.fn();
  let encodable: string[];

  beforeEach(() => {
    encodable = ['image/webp', 'image/jpeg'];
    createImageBitmap.mockResolvedValue({ width: 4032, height: 3024, close: vi.fn() });
    vi.stubGlobal('createImageBitmap', createImageBitmap);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage
    } as unknown as CanvasRenderingContext2D);
    // 인코딩을 지원하지 않는 타입을 요청하면 브라우저처럼 PNG를 돌려준다.
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type
    ) {
      const actual = type && encodable.includes(type) ? type : 'image/png';
      callback(new Blob([`${this.width}x${this.height}`], { type: actual }));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    createImageBitmap.mockReset();
    drawImage.mockReset();
    heic2any.mockReset();
  });

  it('GIF와 SVG는 그대로 돌려준다', async () => {
    for (const type of ['image/gif', 'image/svg+xml']) {
      const file = new File(['x'], 'a', { type });
      expect(await compressImage(file)).toBe(file);
    }
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('줄인 크기로 그려 WebP로 저장한다', async () => {
    const out = await compressImage(new File(['x'], 'IMG_1.JPG', { type: 'image/jpeg' }));
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2048, 1536);
    expect(out.type).toBe('image/webp');
    expect(out.name).toBe('IMG_1.webp');
  });

  it('WebP 인코딩이 안 되면 JPEG로 저장한다', async () => {
    encodable = ['image/jpeg'];
    const out = await compressImage(new File(['x'], 'a.png', { type: 'image/png' }));
    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('a.jpg');
  });

  it('HEIC를 직접 읽지 못하면 heic2any로 변환해 다시 읽는다', async () => {
    const converted = new Blob(['jpeg'], { type: 'image/jpeg' });
    createImageBitmap
      .mockRejectedValueOnce(new Error('unsupported'))
      .mockResolvedValueOnce({ width: 100, height: 100, close: vi.fn() });
    heic2any.mockResolvedValue(converted);

    const out = await compressImage(new File(['x'], 'IMG_2.HEIC', { type: '' }));

    expect(heic2any).toHaveBeenCalledOnce();
    expect(createImageBitmap).toHaveBeenLastCalledWith(converted);
    expect(out.name).toBe('IMG_2.webp');
  });

  it('HEIC가 아닌데 읽지 못하면 실패한다', async () => {
    createImageBitmap.mockRejectedValue(new Error('broken'));
    await expect(
      compressImage(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    ).rejects.toThrow('broken');
    expect(heic2any).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/utils/compressImage.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// 업로드 전에 브라우저에서 사진을 줄인다.
// Vercel 함수의 요청 본문 한도(4.5MB)를 넘지 않게 하고, 재인코딩으로 EXIF(GPS 포함)도 지운다.

const MAX_EDGE = 2048;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

// 재인코딩하면 애니메이션과 벡터가 깨진다.
const PASSTHROUGH_TYPES = ['image/gif', 'image/svg+xml'];

export function getTargetSize(width: number, height: number, maxEdge = MAX_EDGE) {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };

  const scale = maxEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function isHeic(file: File) {
  return /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

// Safari는 HEIC를 직접 디코딩하므로 실패할 때만 heic2any로 변환한다.
async function decode(file: File) {
  try {
    return await createImageBitmap(file);
  } catch (error) {
    if (!isHeic(file)) throw error;
    const { default: heic2any } = await import('heic2any');
    const converted = (await heic2any({ blob: file, toType: 'image/jpeg' })) as Blob;
    return createImageBitmap(converted);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

async function compressImage(file: File): Promise<File> {
  if (PASSTHROUGH_TYPES.includes(file.type)) return file;

  const bitmap = await decode(file);
  const { width, height } = getTargetSize(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas를 사용할 수 없습니다.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP 인코딩을 지원하지 않는 브라우저(Safari 일부)는 조용히 PNG를 돌려준다.
  let blob = await toBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (blob?.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  }
  if (!blob) throw new Error('이미지를 압축하지 못했습니다.');

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${extension}`, {
    type: blob.type,
    lastModified: Date.now()
  });
}

export default compressImage;
```

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS

- [ ] **Step 5: 커밋** — `feat: resize and re-encode images before upload`

---

### Task 3: 업로드가 압축을 거치고 실패 사유를 돌려주게

**Files:**
- Create: `src/constants/upload.ts`
- Modify: `src/utils/uploadImage.ts` (전체 교체)
- Modify: `src/app/api/upload/route.ts:6`, `:50-55`
- Test: `src/utils/uploadImage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import uploadImage from './uploadImage';

const compressImage = vi.hoisted(() => vi.fn());
vi.mock('./compressImage', () => ({ default: compressImage }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
  compressImage.mockReset();
});

const original = new File(['original'], 'a.jpg', { type: 'image/jpeg' });
const compressed = new File(['small'], 'a.webp', { type: 'image/webp' });

describe('uploadImage', () => {
  it('압축한 파일을 올리고 URL을 돌려준다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(Response.json({ url: 'https://x/a.webp' }));

    expect(await uploadImage(original)).toEqual({ url: 'https://x/a.webp' });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect((body.get('file') as File).name).toBe('a.webp');
  });

  it('압축에 실패하면 올리지 않는다', async () => {
    compressImage.mockRejectedValue(new Error('broken'));

    expect(await uploadImage(original)).toEqual({ error: '이미지를 읽을 수 없습니다.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('압축 후에도 4MB를 넘으면 올리지 않는다', async () => {
    compressImage.mockResolvedValue(
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.webp', { type: 'image/webp' })
    );

    expect(await uploadImage(original)).toEqual({ error: '용량이 너무 큽니다.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('JSON이 아닌 413 응답을 용량 초과로 처리한다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(new Response('Request Entity Too Large', { status: 413 }));

    expect(await uploadImage(original)).toEqual({ error: '용량이 너무 큽니다.' });
  });

  it('API 에러 메시지를 그대로 돌려준다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(
      Response.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 })
    );

    expect(await uploadImage(original)).toEqual({ error: '파일 업로드에 실패했습니다.' });
  });

  it('네트워크 오류를 처리한다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await uploadImage(original)).toEqual({
      error: '네트워크 오류로 업로드하지 못했습니다.'
    });
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/utils/uploadImage.test.ts` → FAIL

- [ ] **Step 3: 구현**

`src/constants/upload.ts`:

```ts
// Vercel 서버리스 함수의 요청 본문 한도는 4.5MB다. 넘으면 라우트가 실행되기 전에 413이 난다.
// 그보다 조금 낮춰 우리 쪽에서 먼저 거부하고 메시지를 보여준다.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
```

`src/utils/uploadImage.ts`:

```ts
import { MAX_UPLOAD_BYTES } from '@/constants/upload';
import compressImage from './compressImage';

export type UploadResult = { url: string } | { error: string };

const TOO_LARGE = '용량이 너무 큽니다.';

async function uploadImage(file: File): Promise<UploadResult> {
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } catch (error) {
    console.error('❌ 이미지 압축 실패:', error);
    return { error: '이미지를 읽을 수 없습니다.' };
  }

  if (compressed.size > MAX_UPLOAD_BYTES) return { error: TOO_LARGE };

  const formData = new FormData();
  formData.append('file', compressed);

  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: formData });
  } catch {
    return { error: '네트워크 오류로 업로드하지 못했습니다.' };
  }

  // Vercel이 본문 한도로 거부한 413은 JSON이 아니다.
  if (res.status === 413) return { error: TOO_LARGE };

  const result = await res.json().catch(() => null);
  if (!res.ok || !result?.url) {
    console.error('❌ 이미지 업로드 실패:', result?.error);
    return { error: result?.error ?? '업로드에 실패했습니다.' };
  }

  return { url: result.url };
}

export default uploadImage;
```

`src/app/api/upload/route.ts`: `const MAX_FILE_SIZE = 10 * 1024 * 1024;`를 지우고
`import { MAX_UPLOAD_BYTES } from '@/constants/upload';`를 추가한 뒤 크기 검사를 바꾼다.

```ts
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: '4MB 이하의 이미지만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }
```

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS. `pnpm tsc --noEmit`은 Toolbar가 아직 옛 반환형(`string | null`)을 쓰므로 Task 9 전까지 에러가 날 수 있다. Toolbar의 `if (url) uploadedUrls.push(url)`는 객체도 truthy라 타입 에러가 난다 — Task 9에서 이 코드 전체를 제거한다.

- [ ] **Step 5: 커밋** — `feat: compress before upload and report why an upload failed`

---

### Task 4: ImageGroup에 layout 속성

**Files:**
- Modify: `src/extensions/ImageGroup.ts`
- Test: `src/extensions/ImageGroup.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// @vitest-environment jsdom
import { Editor, type Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { describe, expect, it } from 'vitest';
import ImageGroup from './ImageGroup';

function render(content: Content) {
  const editor = new Editor({ extensions: [StarterKit, Image, ImageGroup], content });
  const html = editor.getHTML();
  editor.destroy();
  return html;
}

describe('ImageGroup', () => {
  it('data-layout을 읽어 그대로 다시 쓴다', () => {
    const html = render(
      '<div class="image-album" data-layout="3-c"><img src="a"><img src="b"><img src="c"></div>'
    );
    expect(html).toContain('data-layout="3-c"');
    expect(html).toContain('data-count="3"');
  });

  it('data-layout이 없는 예전 묶음에는 속성을 붙이지 않는다', () => {
    const html = render('<div class="image-album"><img src="a"><img src="b"></div>');
    expect(html).not.toContain('data-layout');
    expect(html).toContain('data-count="2"');
  });

  it('layout 속성을 data-layout으로 렌더한다', () => {
    const html = render({
      type: 'doc',
      content: [
        {
          type: 'imageGroup',
          attrs: { layout: '1-a' },
          content: [{ type: 'image', attrs: { src: 'a' } }]
        }
      ]
    });
    expect(html).toContain('data-layout="1-a"');
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/extensions/ImageGroup.test.ts` → 첫째·셋째 FAIL

- [ ] **Step 3: 구현** — `content: 'image+',` 다음에 추가

```ts
  addAttributes() {
    return {
      // 배치 창에서 고른 레이아웃 id. 예전 묶음은 없고, 그때는 data-count 규칙으로 배치된다.
      layout: {
        default: null,
        parseHTML: element => element.getAttribute('data-layout'),
        renderHTML: attributes =>
          attributes.layout ? { 'data-layout': attributes.layout } : {}
      }
    };
  },
```

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS

- [ ] **Step 5: 커밋** — `feat: store the chosen layout on image groups`

---

### Task 5: sanitizer가 data-layout을 남기게

**Files:**
- Modify: `src/utils/sanitizePostHtml.ts:65`
- Test: `src/utils/sanitizePostHtml.test.ts` ('보존해야 하는 것' describe 안)

- [ ] **Step 1: 실패하는 테스트 작성** — `--count` 테스트 바로 뒤에 추가

```ts
  it('이미지 그룹의 data-layout을 유지한다', () => {
    const out = sanitizePostHtml(
      '<div class="image-album" data-count="3" data-layout="3-c"><img src="https://x.com/a.jpg"></div>'
    );
    expect(out).toContain('data-layout="3-c"');
  });
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/utils/sanitizePostHtml.test.ts` → FAIL

- [ ] **Step 3: 구현** — `div: ['class', 'data-count', 'style'],` → `div: ['class', 'data-count', 'data-layout', 'style'],`

- [ ] **Step 4: 통과 확인** — PASS

- [ ] **Step 5: 커밋** — `fix: keep the image group layout through sanitizing`

---

### Task 6: 레이아웃 CSS

**Files:**
- Modify: `src/app/globals.css` (파일 끝에 추가)
- Test: `src/utils/imageLayouts.test.ts` (describe 추가)

열 폭과 전체 비율 계산(gap 무시, 폭 1 기준):

| id | 칸 배치(areas) | 열 / 행 | 전체 비율 |
| --- | --- | --- | --- |
| 2-a | `a b` | 1:1 | 2/1 |
| 2-b | `a b` | 1:1 | 3/2 |
| 2-c | `a` / `b` | 행 1:1 | 2/3 |
| 3-a | `a b c` | 1:1:1 | 3/1 |
| 3-b | `a b c` | 1:1:1 | 9/4 |
| 3-c | `a b` / `a c` | 9:8 | 17/12 |
| 3-d | `a c` / `b c` | 8:9 | 17/12 |
| 3-e | `a a` / `b c` | 행 3:2 | 4/5 |
| 4-a | `a b` / `c d` | 1:1 | 1/1 |
| 4-b | `a b c d` | 1:1:1:1 | 4/1 |
| 4-c | `a a a` / `b c d` | 행 9:4 | 12/13 |
| 4-d | `a b` / `a c` / `a d` | 27:16 | 43/36 |
| 4-e | `a b c d` | 1:1:1:1 | 3/1 |

- [ ] **Step 1: 실패하는 테스트 작성** — `imageLayouts.test.ts`에 추가

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('globals.css', () => {
  const css = readFileSync(
    fileURLToPath(new URL('../app/globals.css', import.meta.url)),
    'utf8'
  );

  it('모든 레이아웃에 배치 규칙이 있다', () => {
    for (const { id } of IMAGE_LAYOUTS) {
      expect(css, id).toContain(`.image-album[data-layout='${id}']`);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/utils/imageLayouts.test.ts` → FAIL

- [ ] **Step 3: 구현** — `globals.css` 끝에 추가

```css
/* 배치 창에서 레이아웃을 고른 묶음(data-layout). 레이아웃 목록은 src/utils/imageLayouts.ts.
   640px 이하에서는 위의 모바일 규칙대로 세로로 풀어 원본 비율로 보여준다. */
@media (min-width: 641px) {
  .image-album[data-layout] {
    display: grid;
    gap: 10px;
  }

  .image-album[data-layout] > * {
    min-width: 0;
    min-height: 0;
  }

  .image-album[data-layout] > :nth-child(1) { grid-area: a; }
  .image-album[data-layout] > :nth-child(2) { grid-area: b; }
  .image-album[data-layout] > :nth-child(3) { grid-area: c; }
  .image-album[data-layout] > :nth-child(4) { grid-area: d; }

  /* .post-content img의 height: auto보다 우선해야 칸을 채운다. */
  .image-album[data-layout] img {
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    object-fit: cover;
  }

  /* 묶음끼리 바로 붙으면 사진 사이 간격(10px)만 남겨 하나처럼 보이게 한다. */
  .image-album[data-layout] + .image-album[data-layout] {
    margin-top: -10px;
    padding-top: 0;
  }

  .image-album[data-layout='1-a'] {
    grid-template-areas: 'a';
    grid-template-columns: minmax(0, 1fr);
  }
  .image-album[data-layout='1-a'] img {
    height: auto;
    object-fit: contain;
  }

  .image-album[data-layout='2-a'] {
    grid-template-areas: 'a b';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    aspect-ratio: 2 / 1;
  }
  .image-album[data-layout='2-b'] {
    grid-template-areas: 'a b';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    aspect-ratio: 3 / 2;
  }
  .image-album[data-layout='2-c'] {
    grid-template-areas: 'a' 'b';
    grid-template-rows: repeat(2, minmax(0, 1fr));
    aspect-ratio: 2 / 3;
  }

  .image-album[data-layout='3-a'] {
    grid-template-areas: 'a b c';
    grid-template-columns: repeat(3, minmax(0, 1fr));
    aspect-ratio: 3 / 1;
  }
  .image-album[data-layout='3-b'] {
    grid-template-areas: 'a b c';
    grid-template-columns: repeat(3, minmax(0, 1fr));
    aspect-ratio: 9 / 4;
  }
  /* 세로형(3:4) 1칸과 가로형(4:3) 2칸의 높이가 같아지는 열 폭은 9:8이다. */
  .image-album[data-layout='3-c'] {
    grid-template-areas: 'a b' 'a c';
    grid-template-columns: minmax(0, 9fr) minmax(0, 8fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    aspect-ratio: 17 / 12;
  }
  .image-album[data-layout='3-d'] {
    grid-template-areas: 'a c' 'b c';
    grid-template-columns: minmax(0, 8fr) minmax(0, 9fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    aspect-ratio: 17 / 12;
  }
  .image-album[data-layout='3-e'] {
    grid-template-areas: 'a a' 'b c';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: minmax(0, 3fr) minmax(0, 2fr);
    aspect-ratio: 4 / 5;
  }

  .image-album[data-layout='4-a'] {
    grid-template-areas: 'a b' 'c d';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    aspect-ratio: 1 / 1;
  }
  .image-album[data-layout='4-b'] {
    grid-template-areas: 'a b c d';
    grid-template-columns: repeat(4, minmax(0, 1fr));
    aspect-ratio: 4 / 1;
  }
  .image-album[data-layout='4-c'] {
    grid-template-areas: 'a a a' 'b c d';
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: minmax(0, 9fr) minmax(0, 4fr);
    aspect-ratio: 12 / 13;
  }
  /* 세로형 1칸과 가로형 3칸의 높이가 같아지는 열 폭은 27:16이다. */
  .image-album[data-layout='4-d'] {
    grid-template-areas: 'a b' 'a c' 'a d';
    grid-template-columns: minmax(0, 27fr) minmax(0, 16fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
    aspect-ratio: 43 / 36;
  }
  .image-album[data-layout='4-e'] {
    grid-template-areas: 'a b c d';
    grid-template-columns: repeat(4, minmax(0, 1fr));
    aspect-ratio: 3 / 1;
  }

  /* 배치 창의 레이아웃 썸네일 */
  .image-album.image-album--thumb {
    gap: 2px;
    padding: 0;
  }
  .image-album.image-album--thumb[data-layout='1-a'] {
    aspect-ratio: 4 / 3;
  }
}
```

- [ ] **Step 4: 통과 확인** — PASS

- [ ] **Step 5: 커밋** — `feat: lay out image groups by their chosen layout`

---

### Task 7: 칸 배열 순수 함수

**Files:**
- Create: `src/components/ImageLayoutDialog/slots.ts`
- Test: `src/components/ImageLayoutDialog/slots.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { isImageFile, placeItems, resizeSlots, swapSlots } from './slots';

describe('resizeSlots', () => {
  it('늘리면 빈 칸을 붙인다', () => {
    expect(resizeSlots(['a'], 3)).toEqual(['a', null, null]);
  });

  it('줄이면 앞에서부터 남긴다', () => {
    expect(resizeSlots(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
});

describe('placeItems', () => {
  it('드롭한 칸부터 빈 칸에 차례로 채운다', () => {
    expect(placeItems([null, null, null], 0, ['a', 'b'])).toEqual(['a', 'b', null]);
  });

  it('드롭한 칸은 차 있어도 덮어쓰고, 뒤의 찬 칸은 건너뛴다', () => {
    expect(placeItems(['x', 'y', null], 0, ['a', 'b'])).toEqual(['a', 'y', 'b']);
  });

  it('남는 항목은 버리고 앞쪽 빈 칸은 건드리지 않는다', () => {
    expect(placeItems([null, null, null], 1, ['a', 'b', 'c'])).toEqual([null, 'a', 'b']);
  });
});

describe('swapSlots', () => {
  it('두 칸을 바꾼다', () => {
    expect(swapSlots(['a', 'b', null], 0, 2)).toEqual([null, 'b', 'a']);
  });
});

describe('isImageFile', () => {
  it('이미지 MIME 타입을 받는다', () => {
    expect(isImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe(true);
  });

  it('타입이 비어 있는 HEIC를 확장자로 받는다', () => {
    expect(isImageFile(new File([], 'IMG.HEIC', { type: '' }))).toBe(true);
  });

  it('이미지가 아닌 파일은 거른다', () => {
    expect(isImageFile(new File([], 'a.pdf', { type: 'application/pdf' }))).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/components/ImageLayoutDialog/slots.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// 배치 창의 칸 배열을 다루는 순수 함수들. 빈 칸은 null이다.

export type Slots<T> = (T | null)[];

export function resizeSlots<T>(slots: Slots<T>, count: number): Slots<T> {
  return Array.from({ length: count }, (_, i) => slots[i] ?? null);
}

// 드롭한 칸은 차 있어도 덮어쓰고, 나머지 항목은 그 뒤의 빈 칸에 순서대로 채운다.
export function placeItems<T>(slots: Slots<T>, startIndex: number, items: T[]): Slots<T> {
  const next = [...slots];
  let itemIndex = 0;
  for (let i = startIndex; i < next.length && itemIndex < items.length; i++) {
    if (i === startIndex || next[i] === null) next[i] = items[itemIndex++];
  }
  return next;
}

export function swapSlots<T>(slots: Slots<T>, from: number, to: number): Slots<T> {
  const next = [...slots];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// 브라우저에 따라 HEIC의 MIME 타입이 비어 있어 확장자도 본다.
export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.hei[cf]$/i.test(file.name);
}
```

- [ ] **Step 4: 통과 확인** — PASS

- [ ] **Step 5: 커밋** — `feat: add slot helpers for the image layout dialog`

---

### Task 8: 배치 창

**Files:**
- Create: `src/components/ImageLayoutDialog/SlotCell.tsx`
- Create: `src/components/ImageLayoutDialog/LayoutPicker.tsx`
- Create: `src/components/ImageLayoutDialog/index.tsx`
- Test: `src/components/ImageLayoutDialog/index.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageLayoutDialog from '.';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const uploadImage = vi.hoisted(() => vi.fn());
vi.mock('@/utils/uploadImage', () => ({ default: uploadImage }));

let container: HTMLDivElement;
let root: Root;
const onInsert = vi.fn();
const onOpenChange = vi.fn();

beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn()
  }));
  uploadImage.mockImplementation(async (file: File) => ({ url: `https://x/${file.name}` }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ImageLayoutDialog open onOpenChange={onOpenChange} onInsert={onInsert} />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  uploadImage.mockReset();
  onInsert.mockReset();
  onOpenChange.mockReset();
});

const image = (name: string) => new File(['x'], name, { type: 'image/jpeg' });
const slots = () => [...document.querySelectorAll<HTMLElement>('[data-slot]')];
const button = (name: string) =>
  [...document.querySelectorAll('button')].find(b => b.textContent === name)!;

function drop(target: HTMLElement, data: { files?: File[]; slot?: number }) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: data.files ?? [],
      getData: (type: string) =>
        type === 'application/x-image-slot' && data.slot !== undefined ? String(data.slot) : ''
    }
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

async function click(target: HTMLElement) {
  await act(async () => {
    target.click();
  });
}

describe('ImageLayoutDialog', () => {
  it('기본은 2장 정방형 나란히이고, 칸이 다 차야 삽입할 수 있다', () => {
    expect(slots()).toHaveLength(2);
    expect(button('삽입').disabled).toBe(true);

    drop(slots()[0], { files: [image('a.jpg')] });
    expect(button('삽입').disabled).toBe(true);

    drop(slots()[1], { files: [image('b.jpg')] });
    expect(button('삽입').disabled).toBe(false);
  });

  it('여러 장을 한 칸에 놓으면 이어지는 빈 칸을 채우고, 이미지가 아닌 파일은 거른다', async () => {
    drop(slots()[0], {
      files: [image('a.jpg'), new File(['x'], 'memo.txt', { type: 'text/plain' }), image('b.jpg')]
    });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(['https://x/a.jpg', 'https://x/b.jpg'], '2-a');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('칸끼리 끌어 놓으면 자리가 바뀐다', async () => {
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    drop(slots()[1], { slot: 0 });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(['https://x/b.jpg', 'https://x/a.jpg'], '2-a');
  });

  it('장수와 레이아웃을 바꿔도 넣어 둔 사진은 순서대로 남는다', async () => {
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    await click(button('3장'));
    expect(slots()).toHaveLength(3);

    await click(document.querySelector<HTMLElement>('[aria-label="세로1 + 가로2"]')!);
    drop(slots()[2], { files: [image('c.jpg')] });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      ['https://x/a.jpg', 'https://x/b.jpg', 'https://x/c.jpg'],
      '3-c'
    );
  });

  it('실패한 칸은 사유를 보여주고, 다시 시도하면 그 칸만 올린다', async () => {
    uploadImage.mockImplementationOnce(async () => ({ url: 'https://x/a.jpg' }));
    uploadImage.mockImplementationOnce(async () => ({ error: '용량이 너무 큽니다.' }));
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });

    await click(button('삽입'));
    expect(onInsert).not.toHaveBeenCalled();
    expect(slots()[1].textContent).toContain('용량이 너무 큽니다.');

    await click(button('다시 시도'));
    expect(uploadImage).toHaveBeenCalledTimes(3);
    expect(uploadImage.mock.calls[2][0].name).toBe('b.jpg');
    expect(onInsert).toHaveBeenCalledWith(['https://x/a.jpg', 'https://x/b.jpg'], '2-a');
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/components/ImageLayoutDialog/index.test.tsx` → 모듈 없음으로 FAIL

- [ ] **Step 3: SlotCell 구현**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CELL_RATIO_LABEL, type CellRatio } from '@/utils/imageLayouts';

// 칸끼리 자리를 바꿀 때 쓰는 드래그 타입. 파인더에서 끌어온 파일과 구분한다.
export const SLOT_DRAG_TYPE = 'application/x-image-slot';

export type SlotItem = {
  file: File;
  status: 'idle' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
};

interface Props {
  index: number;
  ratio: CellRatio;
  item: SlotItem | null;
  disabled: boolean;
  onFiles: (index: number, files: File[]) => void;
  onSwap: (from: number, to: number) => void;
}

function useObjectUrl(file: File | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

export default function SlotCell({ index, ratio, item, disabled, onFiles, onSwap }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = useObjectUrl(item?.file);

  // Chrome은 HEIC를 미리보기로 그리지 못한다. 그때는 파일 이름을 보여준다.
  useEffect(() => setPreviewFailed(false), [previewUrl]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);
    if (disabled) return;

    const from = event.dataTransfer.getData(SLOT_DRAG_TYPE);
    if (from !== '') {
      onSwap(Number(from), index);
      return;
    }
    onFiles(index, Array.from(event.dataTransfer.files));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      data-slot={index}
      draggable={!!item && !disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={event => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragStart={event => {
        event.dataTransfer.setData(SLOT_DRAG_TYPE, String(index));
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={event => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-400',
        item && 'border-solid border-transparent',
        isOver && 'border-blue-500 bg-blue-50',
        ratio === 'original' && !item && 'min-h-60',
        disabled && 'cursor-default'
      )}>
      {item && previewUrl && !previewFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          onError={() => setPreviewFailed(true)}
          className="pointer-events-none"
        />
      ) : item ? (
        <span className="break-all px-2 text-neutral-600">{item.file.name}</span>
      ) : (
        <span>+ 사진 놓기</span>
      )}
      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">
        {CELL_RATIO_LABEL[ratio]}
      </span>
      {item?.status === 'uploading' && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="animate-spin text-neutral-600" />
        </span>
      )}
      {item?.status === 'error' && (
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-red-600/90 px-1.5 py-0.5 text-xs text-white">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {item.error}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onClick={event => event.stopPropagation()}
        onChange={event => {
          onFiles(index, Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: LayoutPicker 구현**

```tsx
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { LAYOUT_COUNTS, getLayoutsByCount, type LayoutCount } from '@/utils/imageLayouts';

interface Props {
  count: LayoutCount;
  layoutId: string;
  disabled: boolean;
  onCountChange: (count: LayoutCount) => void;
  onLayoutChange: (id: string) => void;
}

export default function LayoutPicker({
  count,
  layoutId,
  disabled,
  onCountChange,
  onLayoutChange
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {LAYOUT_COUNTS.map(n => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={n === count ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => onCountChange(n)}>
            {n}장
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {getLayoutsByCount(count).map(layout => (
          <button
            key={layout.id}
            type="button"
            title={layout.label}
            aria-label={layout.label}
            aria-pressed={layout.id === layoutId}
            disabled={disabled}
            onClick={() => onLayoutChange(layout.id)}
            className={cn(
              'w-20 rounded border p-1',
              layout.id === layoutId
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-neutral-200 hover:border-neutral-400'
            )}>
            <div className="image-album image-album--thumb" data-layout={layout.id}>
              {layout.cells.map((_, i) => (
                <span key={i} className="rounded-sm bg-neutral-300" />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 배치 창 구현**

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import uploadImage from '@/utils/uploadImage';
import { getLayout, getLayoutsByCount, type LayoutCount } from '@/utils/imageLayouts';
import LayoutPicker from './LayoutPicker';
import SlotCell, { type SlotItem } from './SlotCell';
import { isImageFile, placeItems, resizeSlots, swapSlots, type Slots } from './slots';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (urls: string[], layoutId: string) => void;
}

const DEFAULT_COUNT: LayoutCount = 2;
const firstLayoutId = (count: LayoutCount) => getLayoutsByCount(count)[0].id;

export default function ImageLayoutDialog({ open, onOpenChange, onInsert }: Props) {
  const [count, setCount] = useState<LayoutCount>(DEFAULT_COUNT);
  const [layoutId, setLayoutId] = useState(firstLayoutId(DEFAULT_COUNT));
  const [slots, setSlots] = useState<Slots<SlotItem>>(() => resizeSlots([], DEFAULT_COUNT));
  const [isUploading, setIsUploading] = useState(false);
  const layout = getLayout(layoutId)!;

  const reset = () => {
    setCount(DEFAULT_COUNT);
    setLayoutId(firstLayoutId(DEFAULT_COUNT));
    setSlots(resizeSlots([], DEFAULT_COUNT));
  };

  const handleOpenChange = (next: boolean) => {
    if (isUploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCountChange = (next: LayoutCount) => {
    setCount(next);
    setLayoutId(firstLayoutId(next));
    setSlots(prev => resizeSlots(prev, next));
  };

  const handleFiles = (index: number, files: File[]) => {
    const items = files.filter(isImageFile).map(file => ({ file, status: 'idle' as const }));
    if (items.length === 0) return;
    setSlots(prev => placeItems(prev, index, items));
  };

  const updateSlot = (index: number, patch: Partial<SlotItem>) =>
    setSlots(prev => prev.map((slot, i) => (i === index && slot ? { ...slot, ...patch } : slot)));

  // 이미 올라간 칸은 URL을 재사용하고, 나머지만 병렬로 올린다.
  const handleInsert = async () => {
    setIsUploading(true);
    const urls = await Promise.all(
      slots.map(async (slot, index) => {
        if (!slot) return null;
        if (slot.url) return slot.url;

        updateSlot(index, { status: 'uploading', error: undefined });
        const result = await uploadImage(slot.file);
        if ('url' in result) {
          updateSlot(index, { status: 'done', url: result.url });
          return result.url;
        }
        updateSlot(index, { status: 'error', error: result.error });
        return null;
      })
    );
    setIsUploading(false);

    if (urls.some(url => url === null)) return;
    onInsert(urls as string[], layoutId);
    reset();
    onOpenChange(false);
  };

  const isComplete = slots.every(Boolean);
  const hasError = slots.some(slot => slot?.status === 'error');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        // 칸 밖에 떨어뜨린 파일을 브라우저가 열어버리지 않게 막는다.
        onDragOver={event => event.preventDefault()}
        onDrop={event => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>이미지 배치</DialogTitle>
          <DialogDescription>
            레이아웃을 고르고 각 칸에 사진을 끌어다 놓으세요. 칸끼리 끌면 자리가 바뀝니다.
          </DialogDescription>
        </DialogHeader>
        <LayoutPicker
          count={count}
          layoutId={layoutId}
          disabled={isUploading}
          onCountChange={handleCountChange}
          onLayoutChange={setLayoutId}
        />
        <div className="image-album" data-layout={layoutId}>
          {layout.cells.map((ratio, index) => (
            <SlotCell
              key={index}
              index={index}
              ratio={ratio}
              item={slots[index]}
              disabled={isUploading}
              onFiles={handleFiles}
              onSwap={(from, to) => setSlots(prev => swapSlots(prev, from, to))}
            />
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button type="button" disabled={!isComplete || isUploading} onClick={handleInsert}>
            {isUploading ? '업로드 중…' : hasError ? '다시 시도' : '삽입'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: 통과 확인** — `pnpm vitest run src/components/ImageLayoutDialog` → PASS

- [ ] **Step 7: 커밋** — `feat: add the image layout dialog with drop-in slots`

---

### Task 9: 툴바 연결

**Files:**
- Modify: `src/components/TiptapEditor/Toolbar.tsx`

- [ ] **Step 1: 교체**

- import에서 `useRef`, `uploadImage`, `heic2any`를 지우고 `useState`, `ImageLayoutDialog`를 추가한다.
- `fileInputRef`와 `handleMultipleImageUpload` 전체를 지우고 아래로 바꾼다.

```tsx
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const handleInsertImages = (urls: string[], layout: string) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageGroup',
        attrs: { layout },
        content: urls.map(src => ({ type: 'image', attrs: { src } }))
      })
      .run();
  };
```

- image 버튼의 `onClick`을 `() => setIsImageDialogOpen(true)`로 바꾼다.
- 버튼 렌더에서 `{type === 'image' && (<input … />)}` 블록을 지운다.
- 반환을 fragment로 감싸고 툴바 `div` 뒤에 추가한다.

```tsx
      <ImageLayoutDialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onInsert={handleInsertImages}
      />
```

- [ ] **Step 2: 전체 검증**

Run: `pnpm test && pnpm tsc --noEmit && pnpm lint`
Expected: 모두 통과(기존 128 + 신규), 타입·린트 에러 없음

- [ ] **Step 3: 커밋** — `feat: open the image layout dialog from the editor toolbar`

---

### Task 10: 실제 브라우저 확인

- [ ] `set -a && . ./.env.development && set +a && pnpm dev -p 3210` (로그에 `EADDRINUSE` 없는지)
- [ ] 에디터에서: 장수·레이아웃 전환, 칸 클릭 선택, 칸 간 자리 바꾸기, 업로드 후 삽입
- [ ] 큰 JPEG(>4.5MB)와 HEIC 업로드 → 업로드된 파일이 webp이고 1MB 안팎인지 네트워크 탭으로 확인
- [ ] 15개 레이아웃이 에디터 본문에서 칸을 채우는지(빈 띠·넘침 없음), 묶음 두 개를 붙였을 때 간격 10px
- [ ] 저장 후 상세 페이지에서 같은 모양인지(`data-layout`이 남는지), 640px 이하 폭에서 세로로 풀리는지
- [ ] 예전 글(`data-layout` 없음)의 모양이 그대로인지
- 파인더에서의 실제 드래그는 자동화 도구로 재현할 수 없어 사용자 확인으로 남긴다.
