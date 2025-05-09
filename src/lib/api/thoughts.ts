import { apiFetch } from '../apiClient';
import { ThoughtPayload } from '@/types';

export async function getThoughts() {
  return await apiFetch('/api/thoughts', {
    method: 'GET',
  });
};

export async function createThought(payload: ThoughtPayload) {
  return await apiFetch('/api/thoughts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};