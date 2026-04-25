import { View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);

  return (
    <Screen>
      <View style={{ flex: 1, paddingTop: theme.spacing.lg, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">Profile</Text>
          <Text variant="body" tone="secondary">
            {session?.user.email ?? 'Not signed in'}
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Button
            label="Sign out"
            variant="secondary"
            onPress={() => supabase.auth.signOut()}
          />
        </View>
      </View>
    </Screen>
  );
}
