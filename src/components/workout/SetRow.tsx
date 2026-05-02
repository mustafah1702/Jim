import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WorkoutSet } from '@/types/workout';

export type SetRowRef = {
  focusWeight: () => void;
  focusReps: () => void;
};

type SetRowProps = {
  set: WorkoutSet;
  index: number;
  isPR: boolean;
  isLastSet: boolean;
  onUpdate: (updates: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'isWarmup' | 'completed'>>) => void;
  onRemove: () => void;
  onSubmitLastField: () => void;
};

export const SetRow = forwardRef<SetRowRef, SetRowProps>(function SetRow(
  { set, index, isPR, isLastSet, onUpdate, onRemove, onSubmitLastField },
  ref,
) {
  const theme = useTheme();
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [weightText, setWeightText] = useState(set.weight != null ? String(set.weight) : '');
  const [repsText, setRepsText] = useState(set.reps != null ? String(set.reps) : '');

  const prevCompletedRef = useRef(set.completed);

  useImperativeHandle(ref, () => ({
    focusWeight: () => weightRef.current?.focus(),
    focusReps: () => repsRef.current?.focus(),
  }));

  useEffect(() => {
    if (isPR && set.completed && !prevCompletedRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    prevCompletedRef.current = set.completed;
  }, [set.completed, isPR]);

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
    if (!set.completed) {
      const w = Number(weightText.trim());
      const r = Number(repsText.trim());
      const hasWeight = weightText.trim().length > 0 && Number.isFinite(w);
      const hasReps = repsText.trim().length > 0 && Number.isInteger(r);

      if (!hasWeight || !hasReps) {
        Alert.alert('Missing Set Values', 'Enter both weight and reps before completing a set.');
        if (!hasWeight) {
          weightRef.current?.focus();
        } else {
          repsRef.current?.focus();
        }
        return;
      }

      onUpdate({ weight: w, reps: r, completed: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
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
          borderColor: set.completed ? theme.colors.success : theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      <Pressable
        onPress={toggleWarmup}
        style={[
          styles.setLabel,
          {
            backgroundColor: set.isWarmup ? theme.colors.accentSoft : theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text
          variant="caption"
          tone={set.isWarmup ? 'accent' : 'muted'}
          style={{ fontWeight: '600', textAlign: 'center' }}
        >
          {set.isWarmup ? 'W' : index + 1}
        </Text>
      </Pressable>

      <TextInput
        ref={weightRef}
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={weightText}
        onChangeText={setWeightText}
        onBlur={handleWeightBlur}
        onSubmitEditing={() => repsRef.current?.focus()}
        placeholder="lbs"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
        ×
      </Text>

      <TextInput
        ref={repsRef}
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={repsText}
        onChangeText={setRepsText}
        onBlur={handleRepsBlur}
        onSubmitEditing={onSubmitLastField}
        placeholder="reps"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="number-pad"
        returnKeyType={isLastSet ? 'done' : 'next'}
      />

      {isPR && (
        <Ionicons name="trophy" size={20} color={theme.colors.warning} />
      )}

      <Pressable onPress={toggleCompleted} hitSlop={8}>
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={26}
          color={set.completed ? theme.colors.success : theme.colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  setLabel: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
});
