import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WorkoutHistory } from '@/hooks/useRecentWorkouts';

type WorkoutHistoryCardProps = {
  workout: WorkoutHistory;
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '--';
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  const theme = useTheme();

  // Group sets by exercise
  const exerciseMap = new Map<string, string>();
  let totalSets = 0;
  let totalVolume = 0;

  for (const s of workout.sets) {
    if (!exerciseMap.has(s.exercise_id)) {
      exerciseMap.set(s.exercise_id, s.exercise_name);
    }
    totalSets++;
    totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
  }

  const exerciseNames = [...exerciseMap.values()];
  const displayNames = exerciseNames.slice(0, 3);
  const remaining = exerciseNames.length - displayNames.length;

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={styles.topRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {displayNames.join(', ')}
          </Text>
          {remaining > 0 && (
            <Text variant="caption" tone="muted">
              +{remaining} more
            </Text>
          )}
        </View>
        <Text variant="caption" tone="muted">
          {timeAgo(workout.started_at)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatDuration(workout.started_at, workout.ended_at)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {totalSets} sets
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="barbell-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatVolume(totalVolume)} vol
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
