import { View } from 'react-native';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WeekFrequency } from '@/hooks/useProgressStats';

type FrequencyGridProps = {
  data: WeekFrequency[];
};

export function FrequencyGrid({ data }: FrequencyGridProps) {
  const theme = useTheme();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Consistency" />
      <Card style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {data.map((week) => {
            const intensity = week.count / maxCount;
            const bg =
              week.count === 0
                ? theme.colors.surfaceMuted
                : intensity > 0.6
                  ? theme.colors.accent
                  : theme.colors.accentSoft;

            return (
              <View key={week.weekLabel} style={{ flex: 1, alignItems: 'center', gap: theme.spacing.xs }}>
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: theme.radius.sm,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {week.count > 0 && (
                    <Text
                      variant="caption"
                      style={{
                        fontWeight: '700',
                        color: intensity > 0.6 ? theme.colors.textInverse : theme.colors.accent,
                        fontSize: 13,
                      }}
                    >
                      {week.count}
                    </Text>
                  )}
                </View>
                <Text variant="caption" tone="muted" style={{ fontSize: 10 }}>
                  {week.weekLabel}
                </Text>
              </View>
            );
          })}
        </View>
        <Text variant="caption" tone="muted">
          Workouts per week over the last 8 weeks
        </Text>
      </Card>
    </View>
  );
}
