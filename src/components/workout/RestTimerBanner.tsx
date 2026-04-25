import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export function RestTimerBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isActive, formatted } = useRestTimer();
  const skipRestTimer = useWorkoutStore((s) => s.skipRestTimer);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const restEndAt = useWorkoutStore((s) => s.restEndAt);

  if (!isActive) return null;

  const handleExtend = () => {
    if (!restEndAt) return;
    const currentEnd = new Date(restEndAt).getTime();
    const remaining = Math.max(0, Math.floor((currentEnd - Date.now()) / 1000));
    startRestTimer(remaining + 30);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          marginHorizontal: theme.spacing.lg,
          marginBottom: Math.max(theme.spacing.md, insets.bottom),
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          shadowColor: theme.colors.shadow,
          shadowOpacity: theme.scheme === 'dark' ? 0 : 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.timerGroup}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="timer-outline" size={20} color={theme.colors.accent} />
          </View>
          <View>
            <Text variant="caption" tone="muted">
              Rest
            </Text>
            <Text variant="title">{formatted}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleExtend}
            style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.sm }]}
          >
            <Text variant="caption" tone="accent" style={{ fontWeight: '700' }}>
              +30s
            </Text>
          </Pressable>

          <Pressable
            onPress={skipRestTimer}
            style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.sm }]}
          >
            <Text variant="caption" style={{ fontWeight: '700' }}>
              Skip
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
