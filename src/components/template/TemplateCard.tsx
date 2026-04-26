import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { Template } from '@/types/workout';

type TemplateCardProps = {
  template: Template;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TemplateCard({ template, onStart, onEdit, onDelete }: TemplateCardProps) {
  const theme = useTheme();

  const muscles = [
    ...new Set(
      template.exercises
        .map((e) => e.primaryMuscle)
        .filter(Boolean),
    ),
  ];
  const summary = `${template.exercises.length} exercise${template.exercises.length !== 1 ? 's' : ''}${
    muscles.length > 0 ? ' · ' + muscles.join(', ') : ''
  }`;

  const handleOverflow = () => {
    Alert.alert(template.name, undefined, [
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  // Build preview chips for first 2 exercises
  const previewExercises = template.exercises.slice(0, 2);
  const remaining = template.exercises.length - previewExercises.length;

  function formatExerciseChip(e: Template['exercises'][number]): string {
    const setCount = e.sets.length;
    if (setCount === 0) return e.name;
    const firstSet = e.sets[0];
    const reps = firstSet.targetReps;
    const weight = firstSet.targetWeight;
    let label = `${e.name} · ${setCount}`;
    if (reps != null) label += `×${reps}`;
    if (weight != null) label += ` @ ${weight}`;
    return label;
  }

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="headline">{template.name}</Text>
          <Text variant="caption" tone="secondary">
            {summary}
          </Text>
        </View>
        <IconButton
          icon="ellipsis-horizontal"
          size={34}
          variant="plain"
          onPress={handleOverflow}
        />
      </View>

      <View style={styles.chips}>
        {previewExercises.map((e) => (
          <View
            key={e.id}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {formatExerciseChip(e)}
            </Text>
          </View>
        ))}
        {remaining > 0 && (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text variant="caption" tone="muted">
              +{remaining} more
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.startBtn,
          {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="play" size={16} color={theme.colors.accent} />
        <Text variant="bodyStrong" tone="accent">
          Start Workout
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
