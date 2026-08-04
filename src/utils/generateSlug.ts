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
