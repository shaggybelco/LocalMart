import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeader } from '@/components/GradientHeader';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import { usePendingCount } from '@/hooks/use-pending-count';
import { supabase, signOut } from '@/services/supabase';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const pendingCount = usePendingCount();

  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Enter both fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSignOut = () => setSignOutConfirm(true);

  const confirmSignOut = async () => {
    setSignOutConfirm(false);
    await signOut();
    router.replace('/');
  };

  return (
    <ThemedView style={s.container}>
      <GradientHeader
        title="Settings"
        subtitle="Account & preferences"
        right={
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.closeBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.content}>

        {/* Account info */}
        <View style={[s.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[s.iconWrap, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="person-outline" size={22} color={theme.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">Signed in as</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{user?.email}</ThemedText>
          </View>
          {isAdmin && (
            <View style={[s.adminBadge, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="shield-checkmark" size={12} color={theme.brand} />
              <ThemedText style={{ fontSize: 11, color: theme.brand, fontWeight: '700' }}>Admin</ThemedText>
            </View>
          )}
        </View>

        {/* Change password */}
        <View style={s.section}>
          <ThemedText type="smallBold" style={s.sectionTitle}>Change Password</ThemedText>

          <View style={[s.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <TextInput
              style={[s.input, { color: theme.text }]}
              placeholder="New password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowNew(v => !v)} hitSlop={8}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={[s.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <TextInput
              style={[s.input, { color: theme.text }]}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            style={[s.btn, { backgroundColor: theme.brand }]}
            onPress={handleChangePassword}
            disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>Update Password</ThemedText>
                </>}
          </Pressable>
        </View>

        {/* Admin panel link */}
        {isAdmin && (
          <Pressable
            style={[s.card, { backgroundColor: theme.background, borderColor: theme.brand + '40' }]}
            onPress={() => router.push('/admin')}>
            <View style={[s.iconWrap, { backgroundColor: theme.brand + '15' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Admin Panel</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pendingCount > 0
                  ? `${pendingCount} business${pendingCount === 1 ? '' : 'es'} waiting for approval`
                  : 'Verify businesses, manage admins'}
              </ThemedText>
            </View>
            {pendingCount > 0 ? (
              <View style={s.pendingBadge}>
                <ThemedText style={s.pendingBadgeText}>{pendingCount}</ThemedText>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            )}
          </Pressable>
        )}

        {/* Sign out */}
        <Pressable
          style={[s.card, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
          onPress={handleSignOut}>
          <View style={[s.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </View>
          <ThemedText type="smallBold" style={{ color: '#DC2626', flex: 1 }}>Sign Out</ThemedText>
          <Ionicons name="chevron-forward" size={16} color="#DC2626" />
        </Pressable>

      </ScrollView>

      {/* In-app sign-out confirmation */}
      <Modal visible={signOutConfirm} transparent animationType="fade" onRequestClose={() => setSignOutConfirm(false)}>
        <Pressable style={s.overlay} onPress={() => setSignOutConfirm(false)}>
          <Pressable style={[s.dialog, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[s.dialogIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out-outline" size={26} color="#DC2626" />
            </View>
            <ThemedText type="smallBold" style={s.dialogTitle}>Sign Out</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={s.dialogMsg}>
              Are you sure you want to sign out of LocalMart?
            </ThemedText>
            <View style={s.dialogBtns}>
              <Pressable
                style={[s.dialogBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => setSignOutConfirm(false)}>
                <ThemedText type="smallBold">Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[s.dialogBtn, { backgroundColor: '#DC2626' }]}
                onPress={confirmSignOut}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>Sign Out</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  section: { gap: Spacing.two },
  sectionTitle: { marginBottom: 2, opacity: 0.7, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: Spacing.three, paddingVertical: 2,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 13, minHeight: 48,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  dialogIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  dialogTitle: { fontSize: 17 },
  dialogMsg: { textAlign: 'center', lineHeight: 20 },
  dialogBtns: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    width: '100%',
  },
  dialogBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    minWidth: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
