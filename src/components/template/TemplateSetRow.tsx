import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { TemplateSet } from '@/types/workout';

export type TemplateSetRowRef = {
  focusWeight: () => void;
  focusReps: () => void;
};

type TemplateSetRowProps = {
  set: TemplateSet;
  index: number;
  isLastSet: boolean;
  onUpdate: (updates: Partial<Pick<TemplateSet, 'targetReps' | 'targetWeight'>>) => void;
  onRemove: () => void;
  onSubmitLastField: () => void;
};

export const TemplateSetRow = forwardRef<TemplateSetRowRef, TemplateSetRowProps>(
  function TemplateSetRow({ set, index, isLastSet, onUpdate, onRemove, onSubmitLastField }, ref) {
    const theme = useTheme();
    const weightRef = useRef<TextInput>(null);
    const repsRef = useRef<TextInput>(null);
    const [weightText, setWeightText] = useState(
      set.targetWeight != null ? String(set.targetWeight) : '',
    );
    const [repsText, setRepsText] = useState(
      set.targetReps != null ? String(set.targetReps) : '',
    );

    useImperativeHandle(ref, () => ({
      focusWeight: () => weightRef.current?.focus(),
      focusReps: () => repsRef.current?.focus(),
    }));

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

        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
        </Pressable>
      </View>
    );
  },
);

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
