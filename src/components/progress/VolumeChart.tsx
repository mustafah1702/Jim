import { View } from 'react-native';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WeekVolume } from '@/hooks/useProgressStats';

type VolumeChartProps = {
  data: WeekVolume[];
};

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

const CHART_HEIGHT = 140;

export function VolumeChart({ data }: VolumeChartProps) {
  const theme = useTheme();
  const maxVolume = Math.max(...data.map((d) => d.volume), 1);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Weekly Volume" />
      <Card style={{ gap: theme.spacing.md }}>
        <View
          style={{
            height: CHART_HEIGHT,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.spacing.sm,
          }}
        >
          {data.map((week, i) => {
            const height = Math.max((week.volume / maxVolume) * CHART_HEIGHT, week.volume > 0 ? 4 : 0);
            const isLatest = i === data.length - 1;
            return (
              <View key={week.weekLabel} style={{ flex: 1, alignItems: 'center', gap: theme.spacing.xs }}>
                <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                  {week.volume > 0 && (
                    <Text
                      variant="caption"
                      tone="muted"
                      style={{ textAlign: 'center', fontSize: 10, marginBottom: 2 }}
                    >
                      {formatVolume(week.volume)}
                    </Text>
                  )}
                  <View
                    style={{
                      width: '100%',
                      height,
                      borderRadius: theme.radius.sm,
                      backgroundColor: isLatest ? theme.colors.accent : theme.colors.surfaceMuted,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {data.map((week) => (
            <View key={week.weekLabel} style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="caption" tone="muted" style={{ fontSize: 10 }}>
                {week.weekLabel}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
