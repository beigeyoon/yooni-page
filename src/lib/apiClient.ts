export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
};

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
      const error = await response.text();
      throw new Error(error);
    };

    return await response.json();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    throw new Error(error.message || 'Unknown error occurred');
  }
}