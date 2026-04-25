import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

const MUSCLES = [
  'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings',
  'Biceps', 'Triceps', 'Core', 'Calves', 'Rear Delts',
  'Forearms', 'Glutes',
];

const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine',
  'Bodyweight', 'Band', 'Kettlebell', 'Other',
];

type CustomExerciseFormProps = {
  onCreated: () => void;
};

export function CustomExerciseForm({ onCreated }: CustomExerciseFormProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const session = useAuthStore.getState().session;
      if (!session) throw new Error('Not signed in');
      if (!name.trim()) throw new Error('Name is required');
      if (!muscle) throw new Error('Primary muscle is required');
      if (!equipment) throw new Error('Equipment is required');

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: session.user.id,
          name: name.trim(),
          primary_muscle: muscle,
          equipment,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      useWorkoutStore.getState().addExercise({
        id: data.id,
        name: data.name,
        primary_muscle: data.primary_muscle,
        equipment: data.equipment,
      });
      setName('');
      setMuscle(null);
      setEquipment(null);
      onCreated();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const chipStyle = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      borderColor: selected ? theme.colors.accent : theme.colors.border,
    },
  ];

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="headline">Create Custom Exercise</Text>
        <Text variant="body" tone="secondary">
          Add it once and it joins your exercise library.
        </Text>
      </View>

      <TextField
        label="Exercise Name"
        icon="create-outline"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cable Lateral Raise"
      />

      {/* Primary Muscle */}
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="label" tone="secondary">
          Primary Muscle
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {MUSCLES.map((m) => (
              <Pressable key={m} onPress={() => setMuscle(m)} style={chipStyle(muscle === m)}>
                <Text
                  variant="caption"
                  style={{
                    color: muscle === m ? '#FFFFFF' : theme.colors.textPrimary,
                    fontWeight: '700',
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Equipment */}
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="label" tone="secondary">
          Equipment
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {EQUIPMENT.map((eq) => (
              <Pressable key={eq} onPress={() => setEquipment(eq)} style={chipStyle(equipment === eq)}>
                <Text
                  variant="caption"
                  style={{
                    color: equipment === eq ? '#FFFFFF' : theme.colors.textPrimary,
                    fontWeight: '700',
                  }}
                >
                  {eq}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <Button
        label="Create & Add"
        icon="add"
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !name.trim() || !muscle || !equipment}
        loading={createMutation.isPending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
});
