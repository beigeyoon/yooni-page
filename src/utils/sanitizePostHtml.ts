import sanitizeHtml from 'sanitize-html';

// 본문 HTML 정화.
//
// isomorphic-dompurify(내부적으로 jsdom)를 쓰지 않는 이유:
// jsdom은 실행 중에 default-stylesheet.css를 디스크에서 읽는데, Vercel 배포본에는
// 그 파일이 없어 ENOENT로 죽는다. 클라이언트 컴포넌트에 두면 글 본문이 초기 HTML에서
// 사라지고, 서버 컴포넌트로 옮기면 라우트 전체가 500이 된다.
// sanitize-html은 파서 기반이라 DOM이 필요 없고 어느 환경에서든 동일하게 동작한다.
//
// 허용 목록은 추측이 아니라 실제 DB에 저장된 글 60편(약 29만 자)에서 추출한
// 태그·속성 목록을 기준으로 만들었다. 에디터(Tiptap)가 새로운 태그를 만들어내기
// 시작하면 이 목록도 함께 갱신해야 한다.

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'hr',
  'iframe',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'u',
  'ul'
];

// 임베드 허용 도메인. iframe은 위험한 태그이므로 출처를 좁혀둔다.
// 현재 본문에 실제로 쓰이는 건 www.google.com(지도 27개)과 www.youtube.com(1개)뿐이다.
// 하위 도메인까지 함께 허용하려고 allowedIframeDomains를 쓰되,
// 정확 일치 목록도 같이 둬서 www 접두사 처리에 기대지 않는다.
const ALLOWED_IFRAME_DOMAINS = [
  'google.com',
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com'
];

const ALLOWED_IFRAME_HOSTS = [
  'google.com',
  'www.google.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vimeo.com'
];

export const postHtmlPolicy: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'class', 'rel', 'target'],
    code: ['class'],
    div: ['class', 'data-count', 'style'],
    iframe: ['src', 'width', 'height', 'frameborder', 'style', 'allow', 'allowfullscreen', 'title'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority'],
    pre: ['class'],
    span: ['class', 'style']
  },
  // 글자색(Color 확장)과 ImageGroup의 --count 커스텀 속성을 살리기 위한 최소 허용치.
  // --count가 빠지면 이미지 그룹 레이아웃이 깨진다.
  allowedStyles: {
    '*': {
      '--count': [/^\d+$/],
      color: [/^[#a-zA-Z0-9(),.%\s-]+$/],
      'background-color': [/^[#a-zA-Z0-9(),.%\s-]+$/],
      'text-align': [/^(left|right|center|justify)$/],
      width: [/^\d+(?:px|%|em|rem)?$/],
      height: [/^\d+(?:px|%|em|rem)?$/],
      'aspect-ratio': [/^[\d\s./]+$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  },
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
  allowedIframeDomains: ALLOWED_IFRAME_DOMAINS,
  allowIframeRelativeUrls: false,
  // sanitize-html은 기본적으로 빈 태그를 유지한다. 본문 레이아웃(빈 <p>로 만든 여백)이
  // 그대로 보존되어야 하므로 이 동작을 바꾸지 않는다.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  // 허용하지 않은 출처의 iframe은 src만 지워지고 빈 <iframe></iframe>이 남는다.
  // 보안상 위험하진 않지만 레이아웃에 빈 상자가 생기므로 통째로 걷어낸다.
  exclusiveFilter: frame => frame.tag === 'iframe' && !frame.attribs.src
};

export default function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, postHtmlPolicy);
}
