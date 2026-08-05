// DB의 createdAt 컬럼은 `timestamp without time zone`이고, DB 세션 타임존은 UTC다.
// 즉 저장되는 값은 UTC 벽시계 시각인데, Supabase REST는 이를
// "2026-08-05T02:45:51.881"처럼 타임존 표시 없이 돌려준다.
//
// 그대로 new Date()에 넣으면 자바스크립트가 실행 환경의 로컬 시간으로 해석한다.
// 한국에서 돌리면 9시간 이르게 읽혀 날짜가 하루 빨라지고,
// 서버(Vercel, UTC)와 브라우저(한국)가 서로 다른 값을 만들어 하이드레이션도 어긋난다.
//
// 그래서 읽을 때 UTC임을 명시하고, 보여줄 때 한국 시간으로 변환한다.

export const DISPLAY_TIME_ZONE = 'Asia/Seoul';

const HAS_TIME_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * DB에서 온 타임스탬프를 정확한 시각으로 해석한다.
 * 타임존 표시가 없으면 UTC로 간주한다. 이미 붙어 있으면 그대로 존중한다.
 */
export function parseDbTimestamp(value: string | Date): Date {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  // 날짜만 있는 경우(2026-08-05)는 이미 UTC 자정으로 해석되므로 손대지 않는다.
  const needsUtcMarker = trimmed.includes('T') && !HAS_TIME_ZONE.test(trimmed);

  return new Date(needsUtcMarker ? `${trimmed}Z` : trimmed);
}

/**
 * 구조화 데이터·OG 태그·sitemap에 넣을 ISO 8601 문자열.
 * 타임존이 명시되어야 크롤러가 모호하게 해석하지 않는다.
 */
export function toIsoString(value: string | Date): string {
  return parseDbTimestamp(value).toISOString();
}

/**
 * 화면에 보여줄 날짜. 항상 한국 시간 기준이라
 * 서버에서 렌더하든 브라우저에서 렌더하든 같은 값이 나온다.
 */
export function formatDisplayDate(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(parseDbTimestamp(value));

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  return `${get('year')}. ${get('month')}. ${get('day')}.`;
}
