import { Category, Post, PostListItem, Series } from '@/types';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { orderByNewest, orderBySeriesSequence } from '@/lib/api/postOrder';

// 목록 조회에 싣는 컬럼. 본문(content)만 뺀다.
// Record로 묶어 두면 Post에 필드가 늘 때 여기서 컴파일 에러가 나므로,
// 새 필드가 목록에서 조용히 빠지는 일을 막는다.
const POST_LIST_COLUMN_SET: Record<keyof Omit<Post, 'content'>, true> = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  category: true,
  seriesId: true,
  seriesOrder: true,
  isPublished: true,
  userId: true,
  createdAt: true,
  publishedAt: true
};
const POST_LIST_COLUMNS = Object.keys(POST_LIST_COLUMN_SET).join(', ');

// 목록 페이지는 조회 결과를 통째로 dehydrate해 HTML에 싣는다. 본문까지 실으면
// 카테고리 페이지 하나가 수백 KB가 된다. 본문은 대표 이미지를 본문에서 뽑는
// 사진 목록에만 필요하므로 그때만 포함한다.
function listColumns(withContent: boolean): string {
  return withContent ? '*' : POST_LIST_COLUMNS;
}

// select 컬럼을 문자열로 조립하므로 supabase-js의 타입 추론이 닿지 않는다.
// 결과 형태는 POST_LIST_COLUMN_SET이 보장하므로 여기서 한 번만 단언한다.
function asListItems(rows: unknown): PostListItem[] {
  return (rows ?? []) as PostListItem[];
}

// 클라이언트의 ['series'] 쿼리(getSeries)와 같은 형태를 반환해야
// 서버에서 prefetch한 결과를 그대로 캐시에 심을 수 있다.
export async function getAllSeriesForServer(): Promise<{ data: Series[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic.from('series').select('*');

  if (error) {
    throw new Error('시리즈 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}

export async function getPostsForServer(
  category: Category
): Promise<{ data: PostListItem[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await orderByNewest(
    supabasePublic
      .from('post')
      .select(listColumns(category === 'photo'))
      .eq('category', category)
      .eq('isPublished', true)
  );

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: asListItems(data) };
}

export async function getPostForServer(
  id: string
): Promise<{ data: Post | null }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('id', id)
    .eq('isPublished', true)
    .maybeSingle();

  if (error) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  return { data: data ?? null };
}

// withContent는 사진 카테고리 시리즈 목록에서만 켠다. 글 페이지의 목차·이전/다음처럼
// 제목과 슬러그만 쓰는 곳은 기본값(본문 없음)으로 부른다.
export async function getPostsBySeriesForServer(
  seriesId: string,
  { withContent = false }: { withContent?: boolean } = {}
): Promise<{ data: PostListItem[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await orderBySeriesSequence(
    supabasePublic
      .from('post')
      .select(listColumns(withContent))
      .eq('seriesId', seriesId)
      .eq('isPublished', true)
  );

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: asListItems(data) };
}

export async function getSeriesForServer(seriesId: string) {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('series')
    .select('id, slug, title, description, category')
    .eq('id', seriesId)
    .maybeSingle();

  if (error) {
    throw new Error('시리즈 정보를 불러오는데 실패했습니다.');
  }

  return data as {
    id: string;
    slug: string;
    title: string;
    description?: string;
    category: string;
  } | null;
}

export async function getPostBySlugForServer(
  slug: string
): Promise<{ data: Post | null }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('slug', slug)
    .eq('isPublished', true)
    .maybeSingle();

  if (error) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  return { data: data ?? null };
}

export async function getSeriesBySlugForServer(slug: string) {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('series')
    .select('id, slug, title, description, category')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error('시리즈 정보를 불러오는데 실패했습니다.');
  }

  return data as {
    id: string;
    slug: string;
    title: string;
    description?: string;
    category: string;
  } | null;
}
