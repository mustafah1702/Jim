import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { TemplateSet } from '@/types/workout';

type TemplateSetRowProps = {
  set: TemplateSet;
  index: number;
  onUpdate: (updates: Partial<Pick<TemplateSet, 'targetReps' | 'targetWeight'>>) => void;
  onRemove: () => void;
};

export function TemplateSetRow({ set, index, onUpdate, onRemove }: TemplateSetRowProps) {
  const theme = useTheme();
  const [weightText, setWeightText] = useState(
    set.targetWeight != null ? String(set.targetWeight) : '',
  );
  const [repsText, setRepsText] = useState(
    set.targetReps != null ? String(set.targetReps) : '',
  );

  const handleWeightBlur = () => {
    const val = parseFloat(weightText);
    onUpdate({ targetWeight: isNaN(val) ? null : val });
  };

  const handleRepsBlur = () => {
    const val = parseInt(repsText, 10);
    onUpdate({ targetReps: isNaN(val) ? null : val });
  };

  return (
    <View style={[styles.row, { paddingHorizontal: theme.spacing.sm }]}>
      <View
        style={[
          styles.setLabel,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text variant="caption" tone="muted" style={{ fontWeight: '600', textAlign: 'center' }}>
          {index + 1}
        </Text>
      </View>

      <TextInput
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
        placeholder="reps"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="number-pad"
        returnKeyType="done"
      />

      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
