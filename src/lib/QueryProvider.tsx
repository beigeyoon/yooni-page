'use client';

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000, // 5분
        retry: 1,
        refetchOnWindowFocus: false,
      }
    }
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration queryClient={queryClient}>
        {children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}