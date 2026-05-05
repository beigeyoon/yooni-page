import { Category, Post } from '@/types';
import { getSupabasePublic } from '@/lib/supabasePublic';

export async function getPostsForServer(
  category: Category
): Promise<{ data: Post[] }> {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('category', category)
    .eq('isPublished', true);

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
  const { data, error } = await supabasePublic
    .from('post')
    .select('*')
    .eq('seriesId', seriesId)
    .eq('isPublished', true);

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
