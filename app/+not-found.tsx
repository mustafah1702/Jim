import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md }}>
          <Text variant="title">This screen doesn't exist.</Text>
          <Link href="/">
            <Text variant="bodyStrong" tone="accent">
              Go to home
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
