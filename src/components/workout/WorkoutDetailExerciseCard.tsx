import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { WorkoutDetailSetRow } from '@/components/workout/WorkoutDetailSetRow';
import { useTheme } from '@/theme';

type ReadSet = {
  clientId: string;
  weight: number | null;
  reps: number | null;
  is_warmup: boolean;
};

type ReadProps = {
  mode: 'read';
  exerciseName: string;
  primaryMuscle: string | null;
  sets: ReadSet[];
};

type EditProps = {
  mode: 'edit';
  exerciseName: string;
  primaryMuscle: string | null;
  sets: ReadSet[];
  onChangeSet: (clientId: string, updates: { weight?: number | null; reps?: number | null; is_warmup?: boolean }) => void;
  onDeleteSet: (clientId: string) => void;
  onAddSet: () => void;
};

type Props = ReadProps | EditProps;

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export function WorkoutDetailExerciseCard(props: Props) {
  const theme = useTheme();
  const { exerciseName, primaryMuscle, sets } = props;

  let totalVolume = 0;
  for (const s of sets) {
    if (!s.is_warmup) totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
  }

  let workingNumber = 0;

  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {exerciseName}
        </Text>
        {primaryMuscle ? (
          <Text variant="caption" tone="muted">
            {primaryMuscle}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        {sets.map((s) => {
          if (!s.is_warmup) workingNumber += 1;
          if (props.mode === 'read') {
            return (
              <WorkoutDetailSetRow
                key={s.clientId}
                mode="read"
                setNumber={workingNumber}
                isWarmup={s.is_warmup}
                weight={s.weight}
                reps={s.reps}
              />
            );
          }
          return (
            <WorkoutDetailSetRow
              key={s.clientId}
              mode="edit"
              setNumber={workingNumber}
              isWarmup={s.is_warmup}
              weight={s.weight}
              reps={s.reps}
              onChange={(u) => props.onChangeSet(s.clientId, u)}
              onDelete={() => props.onDeleteSet(s.clientId)}
            />
          );
        })}
      </View>

      {props.mode === 'edit' ? (
        <Pressable
          onPress={props.onAddSet}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: theme.spacing.sm,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          }}
        >
          <Ionicons name="add" size={16} color={theme.colors.accent} />
          <Text variant="caption" style={{ color: theme.colors.accent, fontWeight: '600' }}>
            Add set
          </Text>
        </Pressable>
      ) : null}

      <Text variant="caption" tone="muted">
        {sets.length} sets · {formatVolume(totalVolume)} volume
      </Text>
    </Card>
  );
}
