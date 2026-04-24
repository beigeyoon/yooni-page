import { apiFetch } from '../apiClient';
import { PostPayload, Post } from '@/types';
import { Category } from '@/types';

export async function getPosts(category: Category): Promise<{ data: Post[] }> {
  return await apiFetch(`/api/posts?category=${category}`, {
    method: 'GET',
  });
};

export async function getPost(id: string): Promise<{ data: Post }> {
  return await apiFetch(`/api/posts?id=${id}`, {
    method: 'GET',
  });
};

export async function getPostForPreview(id: string): Promise<{ data: Post }> {
  return await apiFetch(`/api/posts?id=${id}&preview=true`, {
    method: 'GET',
  });
};

export async function getAllPostsForPreview(): Promise<{ data: Post[] }> {
  return await apiFetch('/api/posts?preview=true', {
    method: 'GET',
  });
};

export async function createPost(payload: PostPayload): Promise<{ message?: string; data?: Post; error?: string }> {
  return await apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export async function updatePost(payload: PostPayload): Promise<{ message?: string; data?: Post; error?: string }> {
  return await apiFetch(`/api/posts?id=${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export async function deletePost(id: string): Promise<{ message?: string; error?: string }> {
  return await apiFetch(`/api/posts?id=${id}`, {
    method: 'DELETE',
  });
};

export async function getPostsBySeries(seriesId: string): Promise<{ data: Post[] }> {
  return await apiFetch(`/api/posts?seriesId=${seriesId}`, {
    method: 'GET',
  });
}
