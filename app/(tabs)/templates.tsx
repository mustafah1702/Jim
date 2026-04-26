import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TemplateCard } from '@/components/template/TemplateCard';
import { useDeleteTemplate } from '@/hooks/useDeleteTemplate';
import { useTemplates } from '@/hooks/useTemplates';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { Template } from '@/types/workout';

export default function TemplatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const loadTemplate = useTemplateFormStore((s) => s.loadTemplate);

  const handleCreate = () => {
    useTemplateFormStore.getState().startNewTemplate();
    router.push('/template-form');
  };

  const handleStart = (template: Template) => {
    startFromTemplate(template);
    router.push('/workout');
  };

  const handleEdit = (template: Template) => {
    loadTemplate(template);
    router.push('/template-form');
  };

  const handleDelete = (templateId: string) => {
    deleteMutation.mutate(templateId, {
      onError: (error) => {
        Alert.alert('Error', `Failed to delete template: ${error.message}`);
      },
    });
  };

  const hasTemplates = templates && templates.length > 0;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="display">Templates</Text>
            <Text variant="body" tone="secondary">
              Save and reuse your favorite workouts.
            </Text>
          </View>
          {hasTemplates && (
            <Button
              label="+ New"
              size="sm"
              fullWidth={false}
              onPress={handleCreate}
            />
          )}
        </View>

        {!hasTemplates ? (
          <EmptyState
            icon="clipboard-outline"
            title={isLoading ? 'Loading templates...' : 'No templates yet'}
            description={
              isLoading
                ? 'Pulling your templates.'
                : 'Create a template to save your go-to exercises and start workouts faster.'
            }
            action={
              !isLoading ? (
                <Button
                  label="Create Template"
                  icon="add"
                  fullWidth={false}
                  onPress={handleCreate}
                />
              ) : undefined
            }
          />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onStart={() => handleStart(template)}
                onEdit={() => handleEdit(template)}
                onDelete={() => handleDelete(template.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
