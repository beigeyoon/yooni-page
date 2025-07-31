import { apiFetch } from '../apiClient';
import { ThoughtPayload, Thought } from '@/types';

export async function getThoughts(): Promise<{ data: Thought[] }> {
  return await apiFetch('/api/thoughts', {
    method: 'GET',
  });
};

export async function createThought(payload: ThoughtPayload): Promise<{ message?: string; data?: Thought; error?: string }> {
  return await apiFetch('/api/thoughts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};