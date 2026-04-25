import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.flex, { justifyContent: 'center', gap: theme.spacing.xl }]}>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="display">Jim</Text>
            <Text variant="body" tone="secondary">
              {mode === 'sign-in' ? 'Welcome back. Time to lift.' : 'Create an account to start tracking.'}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <TextField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              placeholder="••••••••"
              autoCapitalize="none"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Button
              label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
              onPress={submit}
              loading={loading}
            />
            <Button
              label={mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              variant="ghost"
              onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            />
          </View>

          <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Apple and Google sign-in coming soon.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
