import { Alert } from 'react-native';
import { MutationCache, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show alert if the mutation doesn't have its own onError handler
      if (!mutation.options.onError) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
      }
    },
  }),
});
