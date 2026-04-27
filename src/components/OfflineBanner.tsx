import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export function OfflineBanner() {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [slideAnim] = useState(() => new Animated.Value(isOnline ? -50 : 0));

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
      Animated.timing(slideAnim, {
        toValue: online ? -50 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, [slideAnim]);

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningSoft,
          borderBottomColor: theme.colors.border,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={14} color={theme.colors.warning} />
      <Text variant="caption" style={{ color: theme.colors.warning, fontWeight: '600' }}>
        You're offline
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
