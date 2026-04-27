import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
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
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
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

        {isLoading && !templates ? (
          <View style={{ gap: theme.spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Card key={i} style={{ gap: theme.spacing.md }}>
                <Skeleton width="50%" height={18} />
                <Skeleton width="80%" height={14} />
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <Skeleton width={80} height={32} borderRadius={theme.radius.sm} />
                  <Skeleton width={80} height={32} borderRadius={theme.radius.sm} />
                </View>
              </Card>
            ))}
          </View>
        ) : !hasTemplates ? (
          <EmptyState
            icon="clipboard-outline"
            title="Save time with templates"
            description="Templates let you pre-build workouts so you can start training with one tap."
            action={
              <Button
                label="Create Template"
                icon="add"
                fullWidth={false}
                onPress={handleCreate}
              />
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
