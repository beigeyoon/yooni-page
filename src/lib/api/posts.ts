import { apiFetch } from '../apiClient';
import { PostPayload } from '@/types';
import { Category } from '@/types';

export async function getPosts(category: Category) {
  return await apiFetch(`/api/posts?category=${category}`, {
    method: 'GET',
  });
};

export async function getPost(id: string) {
  return await apiFetch(`/api/posts?id=${id}`, {
    method: 'GET',
  });
};

export async function createPost(payload: PostPayload) {
  return await apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};