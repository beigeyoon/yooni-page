import { Category, Post, Series } from '@/types';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { orderByNewest, orderBySeriesSequence } from '@/lib/api/postOrder';

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
): Promise<{ data: Post[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await orderByNewest(
    supabasePublic
      .from('post')
      .select('*')
      .eq('category', category)
      .eq('isPublished', true)
  );

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
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

export async function getPostsBySeriesForServer(
  seriesId: string
): Promise<{ data: Post[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await orderBySeriesSequence(
    supabasePublic
      .from('post')
      .select('*')
      .eq('seriesId', seriesId)
      .eq('isPublished', true)
  );

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}

export async function getSeriesForServer(seriesId: string) {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('series')
    .select('id, title, description, category')
    .eq('id', seriesId)
    .maybeSingle();

  if (error) {
    throw new Error('시리즈 정보를 불러오는데 실패했습니다.');
  }

  return data as {
    id: string;
    title: string;
    description?: string;
    category: string;
  } | null;
}
