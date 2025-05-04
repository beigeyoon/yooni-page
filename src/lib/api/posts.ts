import { apiFetch } from '../apiClient';
import { PostPayload } from '@/types';
import { Category } from '@/types';

export async function getPosts(category: Category) {
  return await apiFetch(`/api/posts?category=${category}`, {
    method: 'GET',
  });
};

export async function getPostsForServer(category: Category) {
  const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
  return await fetch(`${BASE_URL}/api/posts?category=${category}`, {
    method: 'GET',
    cache: 'no-store',
  }).then((res) => res.json());
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