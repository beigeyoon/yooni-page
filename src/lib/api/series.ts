import { apiFetch } from '../apiClient';
import { Series, SeriesPayload } from '@/types';



export interface SeriesResponse {
  data: Series[];
}

export async function getSeries(): Promise<{ data: Series[] }> {
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

export async function updateSeries(payload: SeriesPayload) {
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

export async function updateSeriesPosts(
  seriesId: string,
  postIds: string[]
): Promise<{
  message?: string;
  data?: { seriesId: string; postIds: string[] };
  error?: string;
}> {
  return await apiFetch(`/api/series/posts?id=${seriesId}`, {
    method: 'PUT',
    body: JSON.stringify({ postIds })
  });
}
