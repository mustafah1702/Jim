import { useState } from 'react';
import { View } from 'react-native';
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
const LINE_WIDTH = 2;

export function PRTrendChart({ data }: PRTrendChartProps) {
  const theme = useTheme();
  const [chartWidth, setChartWidth] = useState(0);

  if (data.length === 0) return null;

  const totalPRs = data[data.length - 1]?.cumulativePRs ?? 0;
  const maxPRs = Math.max(totalPRs, 1);

  // Show at most 12 points to keep it readable; sample evenly if more
  const displayData = data.length <= 12 ? data : samplePoints(data, 12);
  const plotWidth = Math.max(chartWidth - DOT_SIZE, 0);
  const plotHeight = CHART_HEIGHT - DOT_SIZE;

  const getX = (i: number) => {
    const pct = displayData.length === 1 ? 0.5 : i / (displayData.length - 1);
    return DOT_SIZE / 2 + pct * plotWidth;
  };

  const getY = (point: PRPoint) => {
    const pct = Math.max(0, Math.min(1, point.cumulativePRs / maxPRs));
    return DOT_SIZE / 2 + pct * plotHeight;
  };

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

        <View
          style={{ height: CHART_HEIGHT, position: 'relative' }}
          onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
        >
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
          {chartWidth > 0 && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              {displayData.slice(0, -1).map((point, i) => (
                <LineSegment
                  key={`line-${i}`}
                  x1={getX(i)}
                  y1={getY(point)}
                  x2={getX(i + 1)}
                  y2={getY(displayData[i + 1])}
                  color={theme.colors.accent}
                />
              ))}
              {displayData.map((point, i) => (
                <View
                  key={`dot-${i}`}
                  style={{
                    position: 'absolute',
                    left: getX(i) - DOT_SIZE / 2,
                    bottom: getY(point) - DOT_SIZE / 2,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    borderRadius: DOT_SIZE / 2,
                    backgroundColor: theme.colors.accent,
                  }}
                />
              ))}
            </View>
          )}
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
  color: string;
};

function LineSegment({ x1, y1, x2, y2, color }: LineSegmentProps) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx ** 2 + dy ** 2);
  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);

  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        bottom: y1 - LINE_WIDTH / 2,
        width: length,
        height: LINE_WIDTH,
        backgroundColor: color,
        transformOrigin: 'left center',
        transform: [{ rotate: `${angle}deg` }],
        opacity: 0.6,
      }}
    />
  );
}
