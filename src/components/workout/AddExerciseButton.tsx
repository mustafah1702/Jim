import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export function AddExerciseButton() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/exercise-picker')}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name="add-circle-outline" size={20} color={theme.colors.accent} />
      <Text variant="bodyStrong" tone="accent">
        Add Exercise
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
});
