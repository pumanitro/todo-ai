import { QueryClient } from '@tanstack/react-query';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

const IDB_KEY = 'REACT_QUERY_OFFLINE_CACHE';

// Create a custom persister using IndexedDB via idb-keyval
export const indexedDBPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, client);
  },
  restoreClient: async () => {
    return await get<PersistedClient>(IDB_KEY);
  },
  removeClient: async () => {
    await del(IDB_KEY);
  },
};

// Create the query client with offline-friendly defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 24 hours
      staleTime: 1000 * 60 * 60 * 24,
      // Keep data in cache for 7 days
      gcTime: 1000 * 60 * 60 * 24 * 7,
      // Show cached data while fetching
      refetchOnWindowFocus: true,
      // Retry failed requests
      retry: 3,
      // Network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry failed mutations when back online
      retry: 3,
      // Network mode for offline support
      networkMode: 'offlineFirst',
    },
  },
});

// Persistence options
export const persistOptions = {
  persister: indexedDBPersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  buster: 'v1', // Change this to bust the cache
};
