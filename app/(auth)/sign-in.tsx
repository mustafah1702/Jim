import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

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
            justifyContent: 'center',
            padding: theme.spacing.lg,
            gap: theme.spacing.xl,
          }}
        >
          <View style={{ gap: theme.spacing.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="title" style={{ color: '#FFFFFF' }}>
                J
              </Text>
            </View>

            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="display">Jim</Text>
              <Text variant="body" tone="secondary">
                {mode === 'sign-in' ? 'Welcome back. Time to lift.' : 'Create an account to start tracking.'}
              </Text>
            </View>
          </View>

          <Card style={{ gap: theme.spacing.lg }}>
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
          </Card>

          <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Apple and Google sign-in coming soon.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
});
