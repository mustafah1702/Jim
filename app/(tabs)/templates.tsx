import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export default function TemplatesScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ paddingTop: theme.spacing.lg, gap: theme.spacing.xs }}>
        <Text variant="display">Templates</Text>
        <Text variant="body" tone="secondary">
          Saved workout templates and programs.
        </Text>
      </View>
    </Screen>
  );
}
