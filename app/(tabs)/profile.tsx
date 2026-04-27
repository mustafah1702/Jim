import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { usePreferences } from '@/hooks/usePreferences';
import { useProfileStats } from '@/hooks/useProfileStats';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore, type ThemePreference, type WeightUnit } from '@/stores/preferencesStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

function SettingsRow({ icon, label, value, onPress, danger }: RowProps) {
  const theme = useTheme();
  const iconColor = danger ? theme.colors.danger : theme.colors.textSecondary;
  const labelColor = danger ? theme.colors.danger : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: theme.spacing.md,
          opacity: pressed && onPress ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor: danger
                ? theme.colors.dangerSoft
                : theme.colors.surfaceMuted,
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text variant="body" style={{ color: labelColor }}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value ? (
          <Text variant="caption" tone="muted">
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textMuted}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        variant="label"
        tone="muted"
        style={{
          paddingHorizontal: theme.spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      <Card style={{ paddingVertical: theme.spacing.xs }}>{children}</Card>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginLeft: 40,
      }}
    />
  );
}

const UNIT_OPTIONS: { label: string; value: WeightUnit }[] = [
  { label: 'Pounds (lbs)', value: 'lbs' },
  { label: 'Kilograms (kg)', value: 'kg' },
];

const REST_OPTIONS: { label: string; value: number }[] = [
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: '90 seconds', value: 90 },
  { label: '120 seconds', value: 120 },
  { label: '180 seconds', value: 180 },
  { label: '300 seconds', value: 300 },
];

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

// Update these URLs once the legal pages are hosted
const PRIVACY_POLICY_URL = 'https://mustafah1702.github.io/Jim/privacy-policy.html';
const TERMS_OF_SERVICE_URL = 'https://mustafah1702.github.io/Jim/terms-of-service.html';

function showPicker<T extends string | number>(
  title: string,
  options: { label: string; value: T }[],
  onSelect: (value: T) => void,
) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options.map((o) => o.label), 'Cancel'],
        cancelButtonIndex: options.length,
      },
      (index) => {
        if (index < options.length) {
          onSelect(options[index].value);
        }
      },
    );
  } else {
    // Android fallback using Alert
    Alert.alert(
      title,
      undefined,
      [
        ...options.map((o) => ({
          text: o.label,
          onPress: () => onSelect(o.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }
}

export default function ProfileScreen() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const { data: stats, isLoading: statsLoading } = useProfileStats();

  // Load preferences from Supabase into store
  usePreferences();
  const weightUnit = usePreferencesStore((s) => s.weightUnit);
  const restTimerSeconds = usePreferencesStore((s) => s.restTimerSeconds);
  const themePreference = usePreferencesStore((s) => s.theme);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);

  const email = session?.user.email ?? 'Not signed in';
  const initial = (email[0] ?? 'J').toUpperCase();
  const createdAt = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          useWorkoutStore.getState().discardWorkout();
          supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all workout data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-user');
            if (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              return;
            }
            useWorkoutStore.getState().discardWorkout();
            await supabase.auth.signOut();
          },
        },
      ],
    );
  };

  const themeLabelMap: Record<ThemePreference, string> = {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  };

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
        {/* Header */}
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.accentSoft,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <Text variant="display" tone="accent" style={{ fontSize: 28 }}>
              {initial}
            </Text>
          </View>
          <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
            <Text variant="headline">{email}</Text>
            {createdAt ? (
              <Text variant="caption" tone="muted">
                Member since {createdAt}
              </Text>
            ) : null}
          </View>
        </View>

        {/* KPIs */}
        {statsLoading && !stats ? (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <MetricTile
              label="Total Workouts"
              value={String(stats?.totalWorkouts ?? 0)}
              icon="barbell-outline"
              tone="accent"
            />
            <MetricTile
              label="Days Active"
              value={String(stats?.daysActive ?? 0)}
              icon="calendar-outline"
              tone="success"
            />
          </View>
        )}

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <SettingsRow
            icon="barbell-outline"
            label="Units"
            value={weightUnit}
            onPress={() =>
              showPicker('Weight Unit', UNIT_OPTIONS, (v) =>
                setPreferences({ weightUnit: v }),
              )
            }
          />
          <Divider />
          <SettingsRow
            icon="timer-outline"
            label="Default Rest Timer"
            value={`${restTimerSeconds}s`}
            onPress={() =>
              showPicker('Rest Timer', REST_OPTIONS, (v) =>
                setPreferences({ restTimerSeconds: v }),
              )
            }
          />
        </SettingsSection>

        {/* App */}
        <SettingsSection title="App">
          <SettingsRow
            icon="moon-outline"
            label="Appearance"
            value={themeLabelMap[themePreference]}
            onPress={() =>
              showPicker('Appearance', THEME_OPTIONS, (v) =>
                setPreferences({ theme: v }),
              )
            }
          />
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection title="Data & Privacy">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
          <Divider />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsRow
            icon="help-circle-outline"
            label="Help & Feedback"
            onPress={() =>
              Linking.openURL(
                'mailto:mustafahasan1702@gmail.com?subject=Jim%20App%20Feedback',
              )
            }
          />
          <Divider />
          <SettingsRow
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
          />
        </SettingsSection>

        {/* Sign Out */}
        <View style={{ gap: theme.spacing.md }}>
          <Button
            label="Sign Out"
            icon="log-out-outline"
            variant="secondary"
            onPress={handleSignOut}
          />
          <Pressable
            onPress={handleDeleteAccount}
            style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}
          >
            <Text variant="caption" tone="danger">
              Delete Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
