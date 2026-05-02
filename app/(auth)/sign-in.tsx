import { useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

const HERO_IMAGE_URI = 'https://cdn.pixabay.com/photo/2015/01/09/11/22/fitness-594143_640.jpg';

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const result =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        Alert.alert(mode === 'sign-in' ? 'Sign in failed' : 'Sign up failed', result.error.message);
      } else if (mode === 'sign-up' && !result.data.session) {
        Alert.alert(
          'Check your inbox',
          'We sent you a confirmation email. Click the link to finish signing up.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <ImageBackground
            source={{ uri: HERO_IMAGE_URI }}
            resizeMode="cover"
            imageStyle={styles.heroImage}
            style={[styles.hero, { backgroundColor: '#101010' }]}
          >
            <View style={styles.heroOverlay} />
            <View style={[styles.heroContent, { padding: theme.spacing.xl }]}>
              <Text variant="display" style={{ color: '#FFFFFF' }}>
                Jim
              </Text>
              <Text variant="body" style={{ color: '#F3EDE4' }}>
                {mode === 'sign-in' ? 'Welcome back. Time to lift.' : 'Create an account to start tracking.'}
              </Text>
            </View>
          </ImageBackground>

          <Card
            style={{
              gap: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
              marginTop: -theme.spacing.xl,
              marginBottom: theme.spacing.xxl,
              padding: theme.spacing.lg,
            }}
          >
            <View
              style={[
                styles.segment,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.xs,
                },
              ]}
            >
              {(['sign-in', 'sign-up'] as Mode[]).map((item) => {
                const selected = mode === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setMode(item)}
                    style={[
                      styles.segmentItem,
                      {
                        backgroundColor: selected ? theme.colors.surfaceElevated : 'transparent',
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <Text variant="bodyStrong" tone={selected ? 'primary' : 'secondary'}>
                      {item === 'sign-in' ? 'Sign in' : 'Sign up'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: theme.spacing.md }}>
              <TextField
                label="Email"
                icon="mail-outline"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                label="Password"
                icon="lock-closed-outline"
                placeholder="Password"
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Button
              label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
              icon={mode === 'sign-in' ? 'log-in-outline' : 'person-add-outline'}
              onPress={submit}
              loading={loading}
            />

            <View style={styles.socialRow}>
              <Button
                label="Apple"
                icon="logo-apple"
                variant="secondary"
                size="sm"
                fullWidth={false}
                disabled
                style={styles.socialButton}
              />
              <Button
                label="Google"
                icon="logo-google"
                variant="secondary"
                size="sm"
                fullWidth={false}
                disabled
                style={styles.socialButton}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    minHeight: 300,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroImage: {
    opacity: 0.9,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 16, 16, 0.48)',
  },
  heroContent: {
    minHeight: 172,
    justifyContent: 'flex-end',
    gap: 8,
  },
  segment: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    flex: 1,
  },
});
