import { Category, Post } from '@/types';
import { getSupabaseForServer } from '@/lib/supabaseForServer';

export async function getPostsForServer(
  category: Category
): Promise<{ data: Post[] }> {
  const supabaseForServer = getSupabaseForServer();
  const { data, error } = await supabaseForServer
    .from('post')
    .select('*')
    .eq('category', category)
    .eq('isPublished', true);

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}

export async function getPostForServer(id: string): Promise<{ data: Post | null }> {
  const supabaseForServer = getSupabaseForServer();
  const { data, error } = await supabaseForServer
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
  const supabaseForServer = getSupabaseForServer();
  const { data, error } = await supabaseForServer
    .from('post')
    .select('*')
    .eq('seriesId', seriesId)
    .eq('isPublished', true);

  if (error) {
    throw new Error('게시글 목록을 불러오는데 실패했습니다.');
  }

  return { data: data ?? [] };
}
