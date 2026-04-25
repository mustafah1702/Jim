import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export default function ProgressScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ paddingTop: theme.spacing.lg, gap: theme.spacing.xs }}>
        <Text variant="display">Progress</Text>
        <Text variant="body" tone="secondary">
          Charts per exercise will live here.
        </Text>
      </View>
    </Screen>
  );
}
