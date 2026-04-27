import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { initAuth, useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { OfflineBanner } from '@/components/OfflineBanner';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function formatTimeAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return new Date(isoDate).toLocaleDateString();
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();

  const splashHidden = useRef(false);
  const recoveryChecked = useRef(false);

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

  // Workout recovery prompt
  useEffect(() => {
    if (!hydrated || !session || recoveryChecked.current) return;
    recoveryChecked.current = true;

    // Wait a tick for navigation to settle
    const timer = setTimeout(() => {
      const workout = useWorkoutStore.getState().workout;
      if (!workout) return;

      const ms = Date.now() - new Date(workout.startedAt).getTime();
      const hoursOld = ms / (1000 * 60 * 60);

      if (hoursOld >= 24) {
        Alert.alert(
          'Discard Old Workout?',
          `You have a workout from ${new Date(workout.startedAt).toLocaleDateString()} that was never finished.`,
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => useWorkoutStore.getState().discardWorkout(),
            },
          ],
        );
      } else {
        Alert.alert(
          'Resume Workout?',
          `You have an unfinished workout from ${formatTimeAgo(workout.startedAt)}.`,
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => useWorkoutStore.getState().discardWorkout(),
            },
            {
              text: 'Resume',
              onPress: () => router.push('/workout'),
            },
          ],
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hydrated, session, router]);

  return (
    <>
      <OfflineBanner />
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
    </>
  );
}
