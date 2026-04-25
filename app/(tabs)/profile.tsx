import { ScrollView, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">Profile</Text>
          <Text variant="body" tone="secondary">
            {session?.user.email ?? 'Not signed in'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <MetricTile label="Workouts" value="0" icon="barbell-outline" tone="accent" />
          <MetricTile label="Sets" value="0" icon="checkmark-circle-outline" />
          <MetricTile label="Custom" value="0" icon="create-outline" tone="success" />
        </View>

        <Card style={{ gap: theme.spacing.md }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="title" tone="accent">
              {(session?.user.email?.[0] ?? 'J').toUpperCase()}
            </Text>
          </View>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="headline">Jim Account</Text>
            <Text variant="body" tone="secondary">
              Training preferences and account settings will live here.
            </Text>
          </View>
        </Card>

        <Card muted style={{ gap: theme.spacing.md }}>
          <Text variant="headline">Settings</Text>
          {['Units: pounds', 'Theme: system', 'Rest timer: 90 seconds'].map((row) => (
            <View
              key={row}
              style={{
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: row === 'Rest timer: 90 seconds' ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text variant="bodyStrong">{row}</Text>
            </View>
          ))}
        </Card>

        <View>
          <Button
            label="Sign out"
            icon="log-out-outline"
            variant="danger"
            onPress={() => supabase.auth.signOut()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
