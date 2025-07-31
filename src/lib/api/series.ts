import { apiFetch } from '../apiClient';

export interface Series {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface SeriesPayload {
  title: string;
  description?: string;
  category: string;
}

export async function getSeries() {
  return await apiFetch('/api/series', {
    method: 'GET',
  });
}

export async function createSeries(payload: SeriesPayload) {
  return await apiFetch('/api/series', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSeries(payload: SeriesPayload & { id: string }) {
  return await apiFetch(`/api/series?id=${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteSeries(id: string) {
  return await apiFetch(`/api/series?id=${id}`, {
    method: 'DELETE',
  });
} 