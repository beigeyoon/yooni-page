import { describe, expect, it, vi } from 'vitest';

// 정적 페이지의 lastModified가 실제 글 날짜에서 나오는지만 본다.
// 매번 "지금"을 넣으면 구글이 lastmod를 믿지 않아 글의 수정일 신호까지 무시된다.
const fixtures = vi.hoisted(() => ({
  // DB가 돌려주는 순서(게시일 최신순)를 그대로 따른다.
  post: [
    {
      slug: 'hidden-photo',
      category: 'photo',
      createdAt: '2026-10-21T00:00:00',
      publishedAt: '2026-10-21T00:00:00',
      seriesId: null
    },
    {
      slug: 'newest-dev',
      category: 'dev',
      createdAt: '2026-10-01T00:00:00',
      publishedAt: '2026-10-20T00:00:00',
      seriesId: null
    },
    {
      slug: 'travel-post',
      category: 'travel',
      createdAt: '2026-09-01T00:00:00',
      publishedAt: '2026-09-10T00:00:00',
      seriesId: null
    },
    {
      slug: 'older-dev',
      category: 'dev',
      createdAt: '2026-08-01T00:00:00',
      publishedAt: '2026-08-05T00:00:00',
      seriesId: null
    }
  ],
  series: [] as unknown[]
}));

vi.mock('@/lib/supabasePublic', () => {
  function builder(table: keyof typeof fixtures) {
    const b: Record<string, unknown> = {};
    const chain = () => b;
    b.select = chain;
    b.eq = chain;
    b.order = chain;
    let rows = fixtures[table] as Record<string, unknown>[];
    b.in = (column: string, values: unknown[]) => {
      rows = rows.filter(row => values.includes(row[column]));
      return b;
    };
    b.then = (resolve: (value: unknown) => void) =>
      resolve({ data: rows, error: null });
    return b;
  }
  return {
    getSupabasePublic: () => ({
      from: (table: keyof typeof fixtures) => builder(table)
    })
  };
});

import sitemap from './sitemap';

const SITE_URL = 'https://yooni.seoul.kr';

async function entry(url: string) {
  const entries = await sitemap();
  const found = entries.find(e => e.url === url);
  expect(found).toBeDefined();
  return found!;
}

describe('sitemap 정적 페이지 lastModified', () => {
  it('메인은 가장 최근 글의 게시일을 쓴다', async () => {
    const home = await entry(SITE_URL);
    expect(home.lastModified).toEqual(
      new Date(Date.parse('2026-10-20T00:00:00Z'))
    );
  });

  it('카테고리는 그 카테고리의 가장 최근 글 게시일을 쓴다', async () => {
    const travel = await entry(`${SITE_URL}/travel`);
    expect(travel.lastModified).toEqual(
      new Date(Date.parse('2026-09-10T00:00:00Z'))
    );
  });

  it('글이 없는 카테고리는 lastModified를 넣지 않는다', async () => {
    const talk = await entry(`${SITE_URL}/talk`);
    expect(talk.lastModified).toBeUndefined();
  });

  it('about과 project는 근거가 되는 날짜가 없으므로 넣지 않는다', async () => {
    expect((await entry(`${SITE_URL}/about`)).lastModified).toBeUndefined();
    expect((await entry(`${SITE_URL}/project`)).lastModified).toBeUndefined();
  });
});

describe('sitemap 닫아둔 카테고리', () => {
  it('photo 카테고리 페이지와 그 글을 싣지 않는다', async () => {
    const urls = (await sitemap()).map(e => e.url);
    expect(urls).not.toContain(`${SITE_URL}/photo`);
    expect(urls).not.toContain(`${SITE_URL}/photo/hidden-photo`);
  });

  it('메인 날짜도 닫아둔 카테고리의 글로 정하지 않는다', async () => {
    // photo 글(10-21)이 가장 최근이지만 공개되지 않으므로 dev 글(10-20)이 기준이다.
    const home = await entry(SITE_URL);
    expect(home.lastModified).toEqual(
      new Date(Date.parse('2026-10-20T00:00:00Z'))
    );
  });
});
