import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { initAuth, useAuthStore } from '@/stores/authStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AuthGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();

  const splashHidden = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, hydrated, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="workout"
        options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
      />
      <Stack.Screen
        name="exercise-picker"
        options={{ presentation: 'modal', gestureEnabled: true }}
      />
      <Stack.Screen
        name="template-form"
        options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
      />
    </Stack>
  );
}
