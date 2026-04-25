import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { CustomExerciseForm } from '@/components/workout/CustomExerciseForm';
import { ExerciseListItem } from '@/components/workout/ExerciseListItem';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { Exercise } from '@/types/workout';

const MUSCLE_FILTERS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings',
  'Biceps', 'Triceps', 'Core', 'Calves', 'Rear Delts', 'Forearms', 'Glutes',
];

export default function ExercisePickerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: exercises, isLoading } = useExercises();
  const addExercise = useWorkoutStore((s) => s.addExercise);

  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    let list = exercises;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (muscleFilter !== 'All') {
      list = list.filter((e) => e.primary_muscle === muscleFilter);
    }
    return list;
  }, [exercises, search, muscleFilter]);

  const handleSelect = (exercise: Exercise) => {
    addExercise({
      id: exercise.id,
      name: exercise.name,
      primary_muscle: exercise.primary_muscle,
      equipment: exercise.equipment,
    });
    router.back();
  };

  return (
    <Screen edges={['top']} padded={false}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="title">Add Exercise</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <TextField
          placeholder="Search exercises..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Muscle filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: 8,
        }}
        style={{ flexGrow: 0 }}
      >
        {MUSCLE_FILTERS.map((m) => {
          const selected = muscleFilter === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMuscleFilter(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceElevated,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: selected ? '#FFFFFF' : theme.colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                {m}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Exercise list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseListItem exercise={item} onSelect={handleSelect} />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl }}>
            <Text variant="body" tone="muted">
              {isLoading ? 'Loading exercises...' : 'No exercises found'}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingVertical: theme.spacing.md }}>
            {!showCustomForm ? (
              <Pressable
                onPress={() => setShowCustomForm(true)}
                style={[
                  styles.createCustomBtn,
                  {
                    marginHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color={theme.colors.accent} />
                <Text variant="bodyStrong" tone="accent">
                  Create Custom Exercise
                </Text>
              </Pressable>
            ) : (
              <CustomExerciseForm onCreated={() => {
                setShowCustomForm(false);
                router.back();
              }} />
            )}
          </View>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  createCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
