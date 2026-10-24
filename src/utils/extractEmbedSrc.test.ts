import { describe, expect, it } from 'vitest';
import extractEmbedSrc from './extractEmbedSrc';

const SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!2sFado%20na%20Baixa!5e0!3m2!1sko!2skr';

describe('extractEmbedSrc', () => {
  it('구글맵에서 복사한 iframe 태그 전체에서 src만 꺼낸다', () => {
    const html = `<iframe src="${SRC}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    expect(extractEmbedSrc(html)).toBe(SRC);
  });

  it('작은따옴표로 감싼 src도 읽는다', () => {
    expect(extractEmbedSrc(`<iframe width="600" src='${SRC}'></iframe>`)).toBe(SRC);
  });

  it('속성 안의 &amp;를 &로 되돌린다', () => {
    expect(
      extractEmbedSrc('<iframe src="https://example.com/embed?a=1&amp;b=2"></iframe>')
    ).toBe('https://example.com/embed?a=1&b=2');
  });

  it('src 주소만 붙여넣으면 그대로 쓴다', () => {
    expect(extractEmbedSrc(`  ${SRC}\n`)).toBe(SRC);
  });

  it('빈 입력이나 src 없는 iframe은 null이다', () => {
    expect(extractEmbedSrc('   ')).toBeNull();
    expect(extractEmbedSrc('<iframe width="600"></iframe>')).toBeNull();
  });
});
