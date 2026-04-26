import { type DimensionValue, View } from 'react-native';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { PRPoint } from '@/hooks/useProgressStats';

type PRTrendChartProps = {
  data: PRPoint[];
};

const CHART_HEIGHT = 140;
const DOT_SIZE = 6;

export function PRTrendChart({ data }: PRTrendChartProps) {
  const theme = useTheme();

  if (data.length === 0) return null;

  const maxPRs = Math.max(...data.map((d) => d.cumulativePRs), 1);
  const totalPRs = data[data.length - 1]?.cumulativePRs ?? 0;

  // Show at most 12 points to keep it readable; sample evenly if more
  const displayData = data.length <= 12 ? data : samplePoints(data, 12);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="PR Trend" />
      <Card style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="title" style={{ fontSize: 28 }}>
            {totalPRs}
          </Text>
          <Text variant="caption" tone="muted">
            personal records
          </Text>
        </View>

        <View style={{ height: CHART_HEIGHT, position: 'relative' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <View
              key={pct}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: pct * CHART_HEIGHT,
                height: 1,
                backgroundColor: theme.colors.border,
                opacity: pct === 0 ? 1 : 0.5,
              }}
            />
          ))}

          {/* Line segments + dots */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {displayData.map((point, i) => {
              const x = displayData.length === 1 ? 0.5 : i / (displayData.length - 1);
              const y = point.cumulativePRs / maxPRs;
              const left = `${x * 100}%` as DimensionValue;
              const bottom = y * CHART_HEIGHT - DOT_SIZE / 2;

              return (
                <View key={i}>
                  {/* Line to next point */}
                  {i < displayData.length - 1 && (
                    <LineSegment
                      x1={x}
                      y1={y}
                      x2={(i + 1) / (displayData.length - 1)}
                      y2={displayData[i + 1].cumulativePRs / maxPRs}
                      chartHeight={CHART_HEIGHT}
                      color={theme.colors.accent}
                    />
                  )}
                  {/* Dot */}
                  <View
                    style={{
                      position: 'absolute',
                      left,
                      bottom,
                      marginLeft: -DOT_SIZE / 2,
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      borderRadius: DOT_SIZE / 2,
                      backgroundColor: theme.colors.accent,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* X-axis labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {displayData.length > 0 && (
            <Text variant="caption" tone="muted" style={{ fontSize: 10 }}>
              {displayData[0].date}
            </Text>
          )}
          {displayData.length > 2 && (
            <Text variant="caption" tone="muted" style={{ fontSize: 10 }}>
              {displayData[Math.floor(displayData.length / 2)].date}
            </Text>
          )}
          {displayData.length > 1 && (
            <Text variant="caption" tone="muted" style={{ fontSize: 10 }}>
              {displayData[displayData.length - 1].date}
            </Text>
          )}
        </View>
      </Card>
    </View>
  );
}

function samplePoints(data: PRPoint[], maxPoints: number): PRPoint[] {
  if (data.length <= maxPoints) return data;
  const result: PRPoint[] = [data[0]];
  const step = (data.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(data[Math.round(i * step)]);
  }
  result.push(data[data.length - 1]);
  return result;
}

type LineSegmentProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chartHeight: number;
  color: string;
};

function LineSegment({ x1, y1, x2, y2, chartHeight, color }: LineSegmentProps) {
  const dx = (x2 - x1) * 100; // percentage
  const dy = (y2 - y1) * chartHeight; // pixels
  const length = Math.sqrt((dx * 3.5) ** 2 + dy ** 2); // approximate pixel length (assuming ~350px width)
  const angle = Math.atan2(-dy, dx * 3.5) * (180 / Math.PI);

  return (
    <View
      style={{
        position: 'absolute',
        left: `${x1 * 100}%` as DimensionValue,
        bottom: y1 * chartHeight,
        width: length,
        height: 2,
        backgroundColor: color,
        transformOrigin: 'left center',
        transform: [{ rotate: `${angle}deg` }],
        opacity: 0.6,
      }}
    />
  );
}
