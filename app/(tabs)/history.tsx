import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export default function HistoryScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ paddingTop: theme.spacing.lg, gap: theme.spacing.xs }}>
        <Text variant="display">History</Text>
        <Text variant="body" tone="secondary">
          Past workouts will show up here.
        </Text>
      </View>
    </Screen>
  );
}
