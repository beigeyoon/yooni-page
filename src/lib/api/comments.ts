import { apiFetch } from '../apiClient';
import { CommentPayload } from '@/types';

export async function getComments(postId: string) {
  return await apiFetch(`/api/comments?postId=${postId}`, {
    method: 'GET',
  });
};

export async function createComment(payload: CommentPayload) {
  return await apiFetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export async function updateComment(payload: CommentPayload) {
  return await apiFetch(`/api/comments?id=${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export async function deleteComment(id: string) {
  return await apiFetch(`/api/comments?id=${id}`, {
    method: 'DELETE',
  });
};