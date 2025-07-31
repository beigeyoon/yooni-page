import { apiFetch } from '../apiClient';
import { PostPayload } from '@/types';
import { Category } from '@/types';

export async function getPosts(category: Category) {
  return await apiFetch(`/api/posts?category=${category}`, {
    method: 'GET',
  });
};

export async function getPostsForServer(category: Category) {
  let BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
  if (!BASE_URL) {
    if (process.env.VERCEL_URL) {
      BASE_URL = `https://${process.env.VERCEL_URL}`;
    } else BASE_URL = 'http://localhost:3000';
  };
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

export async function getPostForServer(id: string) {
  let BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
  if (!BASE_URL) {
    if (process.env.VERCEL_URL) {
      BASE_URL = `https://${process.env.VERCEL_URL}`;
    } else BASE_URL = 'http://localhost:3000';
  };
  return await fetch(`${BASE_URL}/api/posts?id=${id}`, {
    method: 'GET',
    cache: 'no-store',
  }).then((res) => res.json());
};

export async function createPost(payload: PostPayload) {
  return await apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export async function updatePost(payload: PostPayload) {
  return await apiFetch(`/api/posts?id=${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export async function deletePost(id: string) {
  return await apiFetch(`/api/posts?id=${id}`, {
    method: 'DELETE',
  });
};

export async function getPostsBySeries(seriesId: string) {
  return await apiFetch(`/api/posts?seriesId=${seriesId}`, {
    method: 'GET',
  });
}

export async function getPostsBySeriesForServer(seriesId: string) {
  let BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
  if (!BASE_URL) {
    if (process.env.VERCEL_URL) {
      BASE_URL = `https://${process.env.VERCEL_URL}`;
    } else BASE_URL = 'http://localhost:3000';
  };
  return await fetch(`${BASE_URL}/api/posts?seriesId=${seriesId}`, {
    method: 'GET',
    cache: 'no-store',
  }).then((res) => res.json());
}