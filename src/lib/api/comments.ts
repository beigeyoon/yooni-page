import { apiFetch } from '../apiClient';
import { CommentPayload, Comment } from '@/types';

export async function getComments(postId: string): Promise<{ data: Comment[] }> {
  return await apiFetch(`/api/comments?postId=${postId}`, {
    method: 'GET',
  });
};

export async function createComment(payload: CommentPayload): Promise<{ message?: string; data?: any; error?: string }> {
  return await apiFetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export async function updateComment(payload: CommentPayload): Promise<{ message?: string; data?: any; error?: string }> {
  return await apiFetch(`/api/comments?id=${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export async function deleteComment(id: string): Promise<{ message?: string; error?: string }> {
  return await apiFetch(`/api/comments?id=${id}`, {
    method: 'DELETE',
  });
};