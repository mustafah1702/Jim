import { Stack, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <Card muted style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <EmptyState
            icon="compass-outline"
            title="Screen not found"
            description="This route does not exist in Jim."
            action={<Button label="Go Home" icon="home-outline" fullWidth={false} onPress={() => router.replace('/')} />}
          />
        </Card>
      </Screen>
    </>
  );
}
