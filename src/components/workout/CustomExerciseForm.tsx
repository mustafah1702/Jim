import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceElevated,
      borderRadius: theme.radius.pill,
      borderColor: selected ? theme.colors.accent : theme.colors.border,
    },
  ];

  return (
    <View style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.lg }]}>
      <Text variant="headline">Create Custom Exercise</Text>

      <TextField
        label="Exercise Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cable Lateral Raise"
      />

      {/* Primary Muscle */}
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
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
                    fontWeight: '600',
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
        <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
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
                    fontWeight: '600',
                  }}
                >
                  {eq}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Create button */}
      <Pressable
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !name.trim() || !muscle || !equipment}
        style={({ pressed }) => [
          styles.createBtn,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            opacity: createMutation.isPending || !name.trim() || !muscle || !equipment
              ? 0.5
              : pressed ? 0.85 : 1,
          },
        ]}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text variant="bodyStrong" style={{ color: '#FFFFFF', textAlign: 'center' }}>
            Create & Add
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  createBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
