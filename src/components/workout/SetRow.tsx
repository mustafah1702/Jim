import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WorkoutSet } from '@/types/workout';

type SetRowProps = {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'isWarmup' | 'completed'>>) => void;
  onRemove: () => void;
};

export function SetRow({ set, index, onUpdate, onRemove }: SetRowProps) {
  const theme = useTheme();
  const [weightText, setWeightText] = useState(set.weight != null ? String(set.weight) : '');
  const [repsText, setRepsText] = useState(set.reps != null ? String(set.reps) : '');

  const handleWeightBlur = () => {
    const val = parseFloat(weightText);
    onUpdate({ weight: isNaN(val) ? null : val });
  };

  const handleRepsBlur = () => {
    const val = parseInt(repsText, 10);
    onUpdate({ reps: isNaN(val) ? null : val });
  };

  const handleLongPress = () => {
    Alert.alert('Delete Set', 'Remove this set?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onRemove },
    ]);
  };

  const toggleWarmup = () => onUpdate({ isWarmup: !set.isWarmup });

  const toggleCompleted = () => {
    // Parse current values before completing
    if (!set.completed) {
      const w = parseFloat(weightText);
      const r = parseInt(repsText, 10);
      if (!isNaN(w)) onUpdate({ weight: w });
      if (!isNaN(r)) onUpdate({ reps: r });
    }
    onUpdate({ completed: !set.completed });
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[
        styles.row,
        {
          backgroundColor: set.completed
            ? theme.colors.success + '18'
            : theme.colors.surfaceElevated,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      {/* Set number / warmup toggle */}
      <Pressable onPress={toggleWarmup} style={styles.setLabel}>
        <Text
          variant="caption"
          tone={set.isWarmup ? 'accent' : 'muted'}
          style={{ fontWeight: '600', textAlign: 'center' }}
        >
          {set.isWarmup ? 'W' : index + 1}
        </Text>
      </Pressable>

      {/* Weight input */}
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={weightText}
        onChangeText={setWeightText}
        onBlur={handleWeightBlur}
        placeholder="lbs"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
        ×
      </Text>

      {/* Reps input */}
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={repsText}
        onChangeText={setRepsText}
        onBlur={handleRepsBlur}
        placeholder="reps"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="number-pad"
        returnKeyType="done"
      />

      {/* Complete toggle */}
      <Pressable onPress={toggleCompleted} hitSlop={8}>
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={26}
          color={set.completed ? theme.colors.success : theme.colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabel: {
    width: 28,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
});
