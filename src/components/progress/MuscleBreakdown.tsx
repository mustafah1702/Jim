import { View } from 'react-native';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { MuscleVolume } from '@/hooks/useProgressStats';

type MuscleBreakdownProps = {
  data: MuscleVolume[];
};

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

const BAR_COLORS = [
  '#F05A24', // accent
  '#FF8B5F', // accentMuted
  '#1F9D59', // success
  '#B7791F', // warning
  '#6366F1', // indigo
  '#EC4899', // pink
  '#14B8A6', // teal
  '#8B5CF6', // purple
];

export function MuscleBreakdown({ data }: MuscleBreakdownProps) {
  const theme = useTheme();

  if (data.length === 0) return null;

  const maxVolume = data[0]?.volume ?? 1;
  const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Muscle Split" />
      <Card style={{ gap: theme.spacing.lg }}>
        {data.map((item, i) => {
          const pct = totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0;
          const barWidth = maxVolume > 0 ? (item.volume / maxVolume) * 100 : 0;
          const color = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <View key={item.muscle} style={{ gap: theme.spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  {item.muscle}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.xs }}>
                  <Text variant="caption" tone="muted">
                    {formatVolume(item.volume)}
                  </Text>
                  <Text variant="caption" tone="muted" style={{ fontSize: 10, minWidth: 32, textAlign: 'right' }}>
                    {pct.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.pill,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: theme.radius.pill,
                  }}
                />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}
