import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signIn, signUp } from '@/services/supabase';

const FORM_MAX_WIDTH = 440;
// Demo account — has both regular user + admin rights for testing
const DEMO_EMAIL = 'localMart@belco.co.za';
const DEMO_PASS  = '#Password1';

export default function LoginScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

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
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setMode('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setLoading(true);
    try {
      await signIn(DEMO_EMAIL, DEMO_PASS);
      router.canGoBack() ? router.back() : router.replace('/');
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
          ref={passwordRef}
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

        {/* Demo section */}
        <View style={[styles.demoCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.demoTop}>
            <View style={[styles.demoIcon, { backgroundColor: theme.brand + '20' }]}>
              <Ionicons name="flask-outline" size={18} color={theme.brand} />
            </View>
            <View style={styles.demoText}>
              <ThemedText type="smallBold">Try the Demo</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                One account — includes admin access
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={[styles.demoBtn, { backgroundColor: theme.brand, borderColor: theme.brand }]}
            onPress={loginAsDemo}
            disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="flash-outline" size={14} color="#fff" />
                  <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 13 }}>
                    Sign in to demo account
                  </ThemedText>
                </>}
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.demoNote}>
            You can add your own email as admin inside the Admin Panel.
          </ThemedText>
        </View>

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

  demoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  demoTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  demoIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  demoText: { flex: 1, gap: 2 },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 10,
  },
  demoNote: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
  },
});
