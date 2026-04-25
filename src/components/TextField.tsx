import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function TextField({ label, error, icon, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" tone="secondary" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: error
              ? theme.colors.danger
              : focused
              ? theme.colors.accent
              : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={focused ? theme.colors.accent : theme.colors.textMuted} />
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              paddingVertical: theme.spacing.md,
            },
            style,
          ]}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  inputWrap: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
