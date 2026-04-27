import { useRef, useEffect, createRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { TemplateSetRow, type TemplateSetRowRef } from '@/components/template/TemplateSetRow';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useTheme } from '@/theme';
import type { TemplateExercise } from '@/types/workout';

type TemplateExerciseCardProps = {
  exercise: TemplateExercise;
};

export function TemplateExerciseCard({ exercise }: TemplateExerciseCardProps) {
  const theme = useTheme();
  const addSet = useTemplateFormStore((s) => s.addSet);
  const removeSet = useTemplateFormStore((s) => s.removeSet);
  const updateSet = useTemplateFormStore((s) => s.updateSet);
  const removeExercise = useTemplateFormStore((s) => s.removeExercise);

  const setRefs = useRef<React.RefObject<TemplateSetRowRef | null>[]>([]);

  while (setRefs.current.length < exercise.sets.length) {
    setRefs.current.push(createRef<TemplateSetRowRef>());
  }
  if (setRefs.current.length > exercise.sets.length) {
    setRefs.current.length = exercise.sets.length;
  }

  const prevSetsCount = useRef(exercise.sets.length);

  useEffect(() => {
    if (exercise.sets.length > prevSetsCount.current) {
      const lastRef = setRefs.current[exercise.sets.length - 1];
      setTimeout(() => lastRef?.current?.focusWeight(), 50);
    }
    prevSetsCount.current = exercise.sets.length;
  }, [exercise.sets.length]);

  return (
    <Card style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="headline" numberOfLines={1}>
            {exercise.name}
          </Text>
          {(exercise.primaryMuscle || exercise.equipment) && (
            <Text variant="caption" tone="secondary">
              {[exercise.primaryMuscle, exercise.equipment].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
        <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8}>
          <Text variant="caption" style={{ color: theme.colors.danger, fontWeight: '600' }}>
            Remove
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.columnHeaders,
          { paddingHorizontal: theme.spacing.sm },
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.setLabelHeader}>
          SET
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          LBS
        </Text>
        <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
          {'  '}
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          REPS
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {exercise.sets.map((set, i) => {
        const isLastSet = i === exercise.sets.length - 1;

        return (
          <TemplateSetRow
            key={set.id}
            ref={setRefs.current[i]}
            set={set}
            index={i}
            isLastSet={isLastSet}
            onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
            onRemove={() => removeSet(exercise.id, set.id)}
            onSubmitLastField={() => {
              if (!isLastSet) {
                setRefs.current[i + 1]?.current?.focusWeight();
              }
            }}
          />
        );
      })}

      <Pressable
        onPress={() => addSet(exercise.id)}
        style={[
          styles.addSetBtn,
          {
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        <Ionicons name="add" size={16} color={theme.colors.accent} />
        <Text variant="caption" tone="accent" style={{ fontWeight: '600' }}>
          Add Set
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabelHeader: {
    width: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  colHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
