export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
};

async function getErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }
    if (payload && typeof payload.message === 'string') {
      return payload.message;
    }
  }

  const text = await response.text().catch(() => '');
  return text || `Request failed with status ${response.status}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(errorMessage);
    };

    return await response.json();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    throw new Error(error.message || 'Unknown error occurred');
  }
}
