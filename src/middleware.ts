import { NextResponse, type NextRequest } from 'next/server';
import isUuid from '@/utils/isUuid';

// 예전 글/시리즈 주소는 UUID였다. 슬러그로 옮기면서 그 주소들이 전부 바뀌므로,
// 검색 색인과 외부 링크를 잃지 않으려면 진짜 HTTP 308을 돌려줘야 한다.
//
// 왜 페이지 컴포넌트의 permanentRedirect가 아니라 미들웨어인가:
// 미들웨어는 응답이 시작되기 전에 조회를 끝내므로 라우트를 렌더하지 않고 헤더만으로
// 처리한다. 페이지 쪽 UUID 분기는 이 조회가 실패했을 때의 폴백으로 남아 있다.
//
// matcher가 UUID 모양 경로에만 걸리므로 일반 요청에는 이 코드가 아예 돌지 않는다.

// matcher는 빌드 시점에 정적으로 읽히므로 상수 조합이나 템플릿 리터럴을 쓸 수 없다.
export const config = {
  matcher: [
    '/:category/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})',
    '/:category/series/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'
  ]
};

async function lookupSlug(
  table: 'post' | 'series',
  id: string
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // supabase-js를 들이면 미들웨어 번들이 통째로 커진다. 단순 조회라 REST로 충분하다.
  const endpoint = `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=slug&limit=1`;

  try {
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as { slug?: string }[];
    return rows?.[0]?.slug ?? null;
  } catch {
    // 조회에 실패하면 리다이렉트하지 않고 그대로 흘려보낸다.
    // 페이지 컴포넌트가 같은 UUID를 받아 404를 내거나 자체 리다이렉트를 한다.
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);

  // /[category]/[uuid] 또는 /[category]/series/[uuid]
  const isSeries = segments.length === 3 && segments[1] === 'series';
  const isPost = segments.length === 2;
  if (!isPost && !isSeries) return NextResponse.next();

  const category = segments[0];
  const id = segments[segments.length - 1];
  if (!isUuid(id)) return NextResponse.next();

  const slug = await lookupSlug(isSeries ? 'series' : 'post', id);
  if (!slug) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = isSeries
    ? `/${category}/series/${slug}`
    : `/${category}/${slug}`;

  return NextResponse.redirect(target, 308);
}
