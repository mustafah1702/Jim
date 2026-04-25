import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export function RestTimerBanner() {
  const theme = useTheme();
  const { isActive, formatted } = useRestTimer();
  const skipRestTimer = useWorkoutStore((s) => s.skipRestTimer);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const restEndAt = useWorkoutStore((s) => s.restEndAt);

  if (!isActive) return null;

  const handleExtend = () => {
    if (!restEndAt) return;
    const currentEnd = new Date(restEndAt).getTime();
    const newEnd = new Date(currentEnd + 30 * 1000).toISOString();
    // Directly set restEndAt by calling startRestTimer with remaining + 30
    const remaining = Math.max(0, Math.floor((currentEnd - Date.now()) / 1000));
    startRestTimer(remaining + 30);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radius.md,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <View style={styles.content}>
        <View>
          <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.8 }}>
            Rest Timer
          </Text>
          <Text variant="title" style={{ color: '#FFFFFF' }}>
            {formatted}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleExtend}
            style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.sm }]}
          >
            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              +30s
            </Text>
          </Pressable>

          <Pressable
            onPress={skipRestTimer}
            style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.sm }]}
          >
            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
