import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  edges?: Edges;
  style?: ViewStyle;
};

export function Screen({ children, padded = true, edges = ['top', 'bottom'], style }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.inner,
          padded && { paddingHorizontal: theme.spacing.lg },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
