import { useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TemplateExerciseCard } from '@/components/template/TemplateExerciseCard';
import { useSaveTemplate } from '@/hooks/useSaveTemplate';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useTheme } from '@/theme';

export default function TemplateFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const template = useTemplateFormStore((s) => s.template);
  const editingId = useTemplateFormStore((s) => s.editingId);
  const setName = useTemplateFormStore((s) => s.setName);
  const startNewTemplate = useTemplateFormStore((s) => s.startNewTemplate);
  const discardTemplate = useTemplateFormStore((s) => s.discardTemplate);
  const saveMutation = useSaveTemplate();

  useEffect(() => {
    if (!template) startNewTemplate();
  }, []);

  const canSave =
    template != null &&
    template.name.trim().length > 0 &&
    template.exercises.length > 0;

  const handleCancel = () => {
    if (template && (template.name.trim() || template.exercises.length > 0)) {
      Alert.alert('Discard Template?', 'Your changes will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardTemplate();
            router.back();
          },
        },
      ]);
    } else {
      discardTemplate();
      router.back();
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    saveMutation.mutate(undefined, {
      onSuccess: () => router.back(),
      onError: (error) => {
        Alert.alert('Error', `Failed to save template: ${error.message}`);
      },
    });
  };

  if (!template) return null;

  return (
    <Screen edges={['top']} padded={false}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text variant="bodyStrong" style={{ color: theme.colors.danger }}>
            Cancel
          </Text>
        </Pressable>
        <Text variant="headline">
          {editingId ? 'Edit Template' : 'New Template'}
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave || saveMutation.isPending} hitSlop={8}>
          <Text
            variant="bodyStrong"
            style={{
              color: theme.colors.accent,
              opacity: canSave && !saveMutation.isPending ? 1 : 0.4,
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            placeholder="Template Name (e.g., Upper Body)"
            value={template.name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />

          {template.exercises.map((exercise) => (
            <TemplateExerciseCard key={exercise.id} exercise={exercise} />
          ))}

          <Pressable
            onPress={() => router.push('/exercise-picker?mode=template')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: theme.spacing.lg,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.accent} />
            <Text variant="bodyStrong" tone="accent">
              Add Exercise
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
