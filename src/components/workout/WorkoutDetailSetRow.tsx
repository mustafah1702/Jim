import { useRef, useState, useEffect } from 'react';
import { Alert, Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type ReadProps = {
  mode: 'read';
  setNumber: number;
  isWarmup: boolean;
  weight: number | null;
  reps: number | null;
};

type EditProps = {
  mode: 'edit';
  setNumber: number;
  isWarmup: boolean;
  weight: number | null;
  reps: number | null;
  onChange: (updates: { weight?: number | null; reps?: number | null; is_warmup?: boolean }) => void;
  onDelete: () => void;
};

export type WorkoutDetailSetRowProps = ReadProps | EditProps;

export function WorkoutDetailSetRow(props: WorkoutDetailSetRowProps) {
  const theme = useTheme();
  const { isWarmup, setNumber, weight, reps } = props;

  const [weightText, setWeightText] = useState(weight != null ? String(weight) : '');
  const [repsText, setRepsText] = useState(reps != null ? String(reps) : '');

  // Keep local input text in sync if parent state changes (e.g. after Cancel re-entry).
  useEffect(() => {
    setWeightText(weight != null ? String(weight) : '');
  }, [weight]);
  useEffect(() => {
    setRepsText(reps != null ? String(reps) : '');
  }, [reps]);

  const swipeRef = useRef<Swipeable>(null);

  const renderInner = () => (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (props.mode === 'edit') props.onChange({ is_warmup: !isWarmup });
        }}
        disabled={props.mode === 'read'}
        style={[
          styles.setLabel,
          {
            backgroundColor: isWarmup ? theme.colors.accentSoft : theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text
          variant="caption"
          tone={isWarmup ? 'accent' : 'muted'}
          style={{ fontWeight: '600', textAlign: 'center' }}
        >
          {isWarmup ? 'W' : setNumber}
        </Text>
      </Pressable>

      {props.mode === 'edit' ? (
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}
          value={weightText}
          onChangeText={setWeightText}
          onBlur={() => {
            const v = parseFloat(weightText);
            props.onChange({ weight: isNaN(v) ? null : v });
          }}
          placeholder="lbs"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
        />
      ) : (
        <View style={styles.cell}>
          <Text variant="body">{weight != null ? String(weight) : '—'}</Text>
        </View>
      )}

      <Text variant="caption" tone="muted">
        ×
      </Text>

      {props.mode === 'edit' ? (
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}
          value={repsText}
          onChangeText={setRepsText}
          onBlur={() => {
            const v = parseInt(repsText, 10);
            props.onChange({ reps: isNaN(v) ? null : v });
          }}
          placeholder="reps"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
        />
      ) : (
        <View style={styles.cell}>
          <Text variant="body">{reps != null ? String(reps) : '—'}</Text>
        </View>
      )}
    </View>
  );

  if (props.mode === 'read') {
    return renderInner();
  }

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-64, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    const onDelete = props.onDelete;
    return (
      <Pressable
        onPress={() => {
          swipeRef.current?.close();
          Alert.alert('Delete Set?', 'This set will be removed when you save.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        }}
        style={[
          styles.deleteAction,
          { backgroundColor: theme.colors.danger, borderRadius: theme.radius.sm },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      {renderInner()}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  setLabel: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    marginLeft: 8,
  },
});
