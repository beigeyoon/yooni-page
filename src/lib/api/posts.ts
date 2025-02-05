import { apiFetch } from '../apiClient';
import { PostPayload } from '@/types';

export async function createPost(payload: PostPayload) {
  return await apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};