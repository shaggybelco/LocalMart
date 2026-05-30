import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const FORM_MAX_WIDTH = 440;
import { useTheme } from '@/hooks/use-theme';
import { signIn, signUp } from '@/services/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}>
        <ThemedText type="subtitle" style={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </ThemedText>

        <TextInput
          style={[styles.input, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.brand }]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <ThemedText type="smallBold" style={styles.buttonText}>
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </ThemedText>}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </ThemedText>
        </Pressable>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  title: { marginBottom: Spacing.two },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.two,
  },
  buttonText: { color: '#fff' },
  toggle: { textAlign: 'center', marginTop: Spacing.two },
});
