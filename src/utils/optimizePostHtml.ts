// 본문 HTML의 <img> 태그에 로딩 힌트와 대체 텍스트를 채워 넣는다.
//
// DOM API(DOMParser)를 쓰지 않는 이유:
// 이 함수는 서버 렌더링 중에도 실행되는데 Node에는 DOMParser가 없다.
// 예전 구현은 여기서 예외를 던졌고, React가 본문 영역을 통째로 버려서
// 초기 HTML에 글 내용이 아예 실리지 않았다(크롤러에게 빈 페이지).
// 문자열 치환만 쓰면 서버와 브라우저가 같은 결과를 내므로
// 하이드레이션 불일치도 생기지 않는다.

import {
  buildOptimizedSrc,
  buildSrcSet,
  DEFAULT_IMAGE_WIDTH,
  isOptimizableImageSrc
} from './postImageSrc';

const IMG_TAG = /<img\b([^>]*)>/gi;

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

function attrPattern(name: string) {
  return new RegExp(
    `\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`,
    'gi'
  );
}

// alt가 없거나 비어 있으면 대체 문구를 넣는다.
// (빈 alt는 "장식용 이미지"라는 뜻이지만, 에디터가 자동으로 넣은 빈 값이라
//  의도된 장식 표시로 보기 어렵다. 기존 동작을 그대로 유지한다.)
function hasMeaningfulAlt(attrs: string) {
  const match = attrs.match(/\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!match) return false;
  const value = match[1] ?? match[2] ?? match[3] ?? '';
  return value.trim().length > 0;
}

function optimizePostHtml(html: string) {
  let index = 0;

  return html.replace(IMG_TAG, (_match, rawAttrs: string) => {
    const isPriorityImage = index === 0;
    index += 1;

    // <img ... /> 표기를 보존한다
    const trimmed = rawAttrs.trimEnd();
    const selfClosing = trimmed.endsWith('/');
    const base = selfClosing ? trimmed.slice(0, -1) : trimmed;

    const keepAlt = hasMeaningfulAlt(base);
    const src = readAttr(base, 'src');
    const optimizable = isOptimizableImageSrc(src);

    let attrs = base
      .replace(attrPattern('decoding'), '')
      .replace(attrPattern('loading'), '')
      .replace(attrPattern('fetchpriority'), '');

    if (optimizable) {
      attrs = attrs
        .replace(attrPattern('src'), '')
        .replace(attrPattern('srcset'), '')
        .replace(attrPattern('sizes'), '');
    }

    if (!keepAlt) {
      attrs = attrs.replace(attrPattern('alt'), '');
    }

    const added = [
      'decoding="async"',
      `loading="${isPriorityImage ? 'eager' : 'lazy'}"`,
      `fetchpriority="${isPriorityImage ? 'high' : 'low'}"`
    ];

    if (optimizable) {
      added.unshift(
        `src="${escapeAttr(buildOptimizedSrc(src, DEFAULT_IMAGE_WIDTH))}"`,
        `srcset="${escapeAttr(buildSrcSet(src))}"`,
        `sizes="${SIZES}"`
      );
    }

    if (!keepAlt) {
      added.push(`alt="본문 이미지 ${index}"`);
    }

    const normalized = attrs.replace(/\s+/g, ' ').trim();
    const body = [normalized, ...added].filter(Boolean).join(' ');

    return `<img ${body}${selfClosing ? ' /' : ''}>`;
  });
}

export default optimizePostHtml;
