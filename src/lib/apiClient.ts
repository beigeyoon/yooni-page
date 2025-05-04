export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
};

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    };

    const data = await response.json();
    return { success: true, data };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}