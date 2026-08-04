import { describe, expect, it } from 'vitest';
import sanitizePostHtml from './sanitizePostHtml';

describe('보존해야 하는 것', () => {
  it('에디터가 쓰는 기본 태그를 유지한다', () => {
    const html =
      '<h1>제목</h1><h2>소제목</h2><h3>소소제목</h3>' +
      '<p>본문 <strong>굵게</strong> <em>기울임</em> <u>밑줄</u></p>' +
      '<ul><li>하나</li></ul><ol><li>둘</li></ol>' +
      '<blockquote>인용</blockquote><hr><br>';
    const out = sanitizePostHtml(html);
    for (const tag of ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br']) {
      expect(out, `${tag} 유실`).toContain(`<${tag}`);
    }
  });

  it('코드 블록의 하이라이팅 class를 유지한다', () => {
    const out = sanitizePostHtml(
      '<pre class="language-ts"><code class="hljs-keyword">const</code></pre>'
    );
    expect(out).toContain('class="language-ts"');
    expect(out).toContain('class="hljs-keyword"');
  });

  it('글자색 style을 유지한다', () => {
    const out = sanitizePostHtml('<span style="color: #ff0000">빨강</span>');
    expect(out).toContain('color');
    expect(out).toContain('#ff0000');
  });

  it('이미지 그룹의 --count 커스텀 속성을 유지한다', () => {
    const out = sanitizePostHtml(
      '<div class="image-group" data-count="3" style="--count: 3"><img src="https://x.com/a.jpg"></div>'
    );
    expect(out).toContain('data-count="3"');
    expect(out).toContain('--count');
  });

  it('이미지의 최적화 속성을 유지한다', () => {
    const out = sanitizePostHtml(
      '<img src="https://x.com/a.jpg" alt="설명" loading="lazy" decoding="async" fetchpriority="low">'
    );
    for (const attr of ['src', 'alt', 'loading', 'decoding', 'fetchpriority']) {
      expect(out, `${attr} 유실`).toContain(attr);
    }
  });

  it('허용 도메인의 iframe 임베드를 유지한다', () => {
    const google = sanitizePostHtml(
      '<iframe src="https://www.google.com/maps/embed?pb=abc" width="600" height="450" frameborder="0"></iframe>'
    );
    expect(google).toContain('<iframe');
    expect(google).toContain('www.google.com/maps/embed');

    const youtube = sanitizePostHtml(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>'
    );
    expect(youtube).toContain('<iframe');
  });

  it('링크의 href와 target을 유지한다', () => {
    const out = sanitizePostHtml(
      '<a href="https://example.com" target="_blank" rel="noopener">링크</a>'
    );
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
  });
});

describe('제거해야 하는 것', () => {
  it('script 태그와 그 내용을 제거한다', () => {
    const out = sanitizePostHtml('<p>앞</p><script>alert(1)</script><p>뒤</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('앞');
    expect(out).toContain('뒤');
  });

  it('이벤트 핸들러 속성을 제거한다', () => {
    const out = sanitizePostHtml('<p onclick="alert(1)">글</p><img src="x" onerror="alert(1)">');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onerror');
  });

  it('javascript: 링크를 제거한다', () => {
    const out = sanitizePostHtml('<a href="javascript:alert(1)">클릭</a>');
    expect(out).not.toContain('javascript:');
  });

  it('허용하지 않은 도메인의 iframe을 제거한다', () => {
    const out = sanitizePostHtml('<iframe src="https://evil.example.com/x"></iframe>');
    expect(out).not.toContain('<iframe');
  });

  it('상대 경로 iframe을 제거한다', () => {
    const out = sanitizePostHtml('<iframe src="/internal"></iframe>');
    expect(out).not.toContain('<iframe');
  });

  it('style 태그를 제거한다', () => {
    const out = sanitizePostHtml('<style>body{display:none}</style><p>글</p>');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('display:none');
  });

  it('허용 목록에 없는 태그를 제거한다', () => {
    const out = sanitizePostHtml('<form><input name="x"><button>보내기</button></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
  });
});
