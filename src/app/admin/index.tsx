import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { GradientView } from '@/components/GradientView';
import { GradientHeader } from '@/components/GradientHeader';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import {
  getPendingBusinesses,
  getAllBusinesses,
  verifyBusiness,
  rejectBusiness,
  getDeletionRequests,
  approveDeletion,
  rejectDeletionRequest,
  getAdmins,
  addAdmin,
  removeAdmin,
  Admin,
} from '@/services/admin';
import { Business } from '@/services/businesses';

type Tab = 'pending' | 'all' | 'deletions' | 'admins';

export default function AdminScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<Business[]>([]);
  const [allBiz, setAllBiz] = useState<Business[]>([]);
  const [deletions, setDeletions] = useState<Business[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, a, d, adm] = await Promise.all([
      getPendingBusinesses(),
      getAllBusinesses(),
      getDeletionRequests(),
      getAdmins(),
    ]);
    setPending(p);
    setAllBiz(a);
    setDeletions(d);
    setAdmins(adm);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (adminLoading) {
    return <ThemedView style={s.centered}><ActivityIndicator /></ThemedView>;
  }

  if (!isAdmin) {
    return (
      <ThemedView style={s.centered}>
        <Ionicons name="lock-closed-outline" size={48} color={theme.textSecondary} />
        <ThemedText type="smallBold">Access denied</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">This page is for admins only.</ThemedText>
        <Pressable style={[s.btn, { backgroundColor: theme.brand }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const onVerify = async (id: string) => {
    await verifyBusiness(id);
    load();
  };

  const onReject = (id: string, name: string) => {
    Alert.alert('Reject business', `Remove "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await rejectBusiness(id); load(); } },
    ]);
  };

  const onAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      await addAdmin(newAdminEmail, user?.email ?? '');
      setNewAdminEmail('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const onRemoveAdmin = (admin: Admin) => {
    if (admin.is_root) { Alert.alert('Cannot remove', 'The root admin cannot be removed.'); return; }
    Alert.alert('Remove admin', `Remove admin access for ${admin.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeAdmin(admin.id); load(); } },
    ]);
  };

  const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; badge?: number }[] = [
    { id: 'pending',   label: 'Pending',  icon: 'time-outline',       badge: pending.length   },
    { id: 'deletions', label: 'Deletions', icon: 'trash-outline',      badge: deletions.length },
    { id: 'all',       label: 'All',      icon: 'storefront-outline'                          },
    { id: 'admins',    label: 'Admins',   icon: 'shield-outline'                              },
  ];

  return (
    <ThemedView style={s.container}>
      <GradientHeader
        title="Admin Panel"
        subtitle="LocalMart administration"
        right={
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        }
      />

      {/* Tab bar */}
      <GradientView style={s.tabsOuter}>
        <View style={s.tabs}>
          {TABS.map(t => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[s.tabItem, tab === t.id && s.tabActive]}>
              <Ionicons name={t.icon} size={15} color={tab === t.id ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <ThemedText style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>
                {t.label}
              </ThemedText>
              {!!t.badge && t.badge > 0 && (
                <View style={s.tabBadge}>
                  <ThemedText style={s.tabBadgeText}>{t.badge}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </GradientView>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={theme.brand} /></View>
      ) : tab === 'pending' ? (
        <PendingTab businesses={pending} onVerify={onVerify} onReject={onReject} />
      ) : tab === 'deletions' ? (
        <DeletionsTab
          businesses={deletions}
          onApprove={async (id) => { await approveDeletion(id); load(); }}
          onReject={async (id) => { await rejectDeletionRequest(id); load(); }}
        />
      ) : tab === 'all' ? (
        <AllTab businesses={allBiz} onVerify={onVerify} onReject={onReject} />
      ) : (
        <AdminsTab
          admins={admins}
          newEmail={newAdminEmail}
          onChangeEmail={setNewAdminEmail}
          onAdd={onAddAdmin}
          adding={addingAdmin}
          onRemove={onRemoveAdmin}
          currentUserEmail={user?.email ?? ''}
        />
      )}
    </ThemedView>
  );
}

// ─── Deletion requests ────────────────────────────────────────────────────────
function DeletionsTab({ businesses, onApprove, onReject }: {
  businesses: Business[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const theme = useTheme();
  if (businesses.length === 0) {
    return (
      <View style={s.centered}>
        <Ionicons name="trash-outline" size={48} color={theme.textSecondary} />
        <ThemedText type="smallBold">No deletion requests</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Business owners have not requested any deletions.</ThemedText>
      </View>
    );
  }
  return (
    <FlatList
      data={businesses}
      keyExtractor={item => item.id}
      contentContainerStyle={[s.listContent, { maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' }]}
      renderItem={({ item }) => (
        <DeletionCard item={item} onApprove={onApprove} onReject={onReject} />
      )}
    />
  );
}

// Extracted so useState is used inside a proper component, not a renderItem callback
function DeletionCard({ item, onApprove, onReject }: {
  item: Business;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  return (
    <View style={[s.bizCard, { backgroundColor: theme.background, borderColor: '#FCA5A5', borderWidth: 1.5 }]}>
      <View style={s.bizTop}>
        <View style={{ flex: 1, gap: 3 }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>{item.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
            {item.category.replace(/_/g, ' ')}
            {item.address ? ` · ${item.address.split(',')[0]}` : ''}
          </ThemedText>
          {item.deletion_reason ? (
            <View style={[s.reasonBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
                {`"${item.deletion_reason}"`}
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
              No reason given
            </ThemedText>
          )}
        </View>
      </View>
      <View style={s.bizActions}>
        <Pressable
          style={[s.actionBtn, { backgroundColor: '#EF4444' }]}
          disabled={busy}
          onPress={() => Alert.alert(
            'Approve Deletion',
            `Permanently delete "${item.name}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { setBusy(true); await onApprove(item.id); } },
            ]
          )}>
          {busy
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="trash" size={14} color="#fff" />
                <ThemedText type="small" style={{ color: '#fff', fontWeight: '700' }}>Approve & Delete</ThemedText>
              </>}
        </Pressable>
        <Pressable
          style={[s.actionBtn, { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }]}
          onPress={() => onReject(item.id)}>
          <Ionicons name="arrow-undo-outline" size={14} color={theme.text} />
          <ThemedText type="small" style={{ fontWeight: '700' }}>Keep Business</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Pending businesses ───────────────────────────────────────────────────────
function PendingTab({ businesses, onVerify, onReject }: {
  businesses: Business[];
  onVerify: (id: string) => void;
  onReject: (id: string, name: string) => void;
}) {
  const theme = useTheme();
  if (businesses.length === 0) {
    return (
      <View style={s.centered}>
        <Ionicons name="checkmark-circle-outline" size={48} color={theme.brand} />
        <ThemedText type="smallBold">All caught up!</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">No businesses pending review.</ThemedText>
      </View>
    );
  }
  return (
    <FlatList
      data={businesses}
      keyExtractor={item => item.id}
      contentContainerStyle={[s.listContent, { maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' }]}
      renderItem={({ item }) => (
        <BusinessAdminCard
          business={item}
          onVerify={() => onVerify(item.id)}
          onReject={() => onReject(item.id, item.name)}
          showVerifyBadge={false}
        />
      )}
    />
  );
}

// ─── All businesses ───────────────────────────────────────────────────────────
function AllTab({ businesses, onVerify, onReject }: {
  businesses: Business[];
  onVerify: (id: string) => void;
  onReject: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const theme = useTheme();
  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View style={[s.searchRow, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search businesses…"
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      }
      contentContainerStyle={[s.listContent, { maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' }]}
      renderItem={({ item }) => (
        <BusinessAdminCard
          business={item}
          onVerify={() => onVerify(item.id)}
          onReject={() => onReject(item.id, item.name)}
          showVerifyBadge
        />
      )}
    />
  );
}

// ─── Business card (admin view) ───────────────────────────────────────────────
function BusinessAdminCard({ business, onVerify, onReject, showVerifyBadge }: {
  business: Business;
  onVerify: () => void;
  onReject: () => void;
  showVerifyBadge: boolean;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => { setBusy(true); await onVerify(); setBusy(false); };
  const handleReject = () => onReject();

  return (
    <Pressable
      onPress={() => router.push(`/business/${business.id}`)}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
    <View style={[s.bizCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <View style={s.bizTop}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ fontSize: 15 }}>{business.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
            {business.category.replace(/_/g, ' ')}
            {business.address ? ` · ${business.address}` : ''}
          </ThemedText>
        </View>
        {showVerifyBadge && (
          <View style={[s.statusBadge, { backgroundColor: business.verified ? '#ECFDF5' : '#FEF9C3' }]}>
            <ThemedText style={{ fontSize: 11, fontWeight: '700', color: business.verified ? '#065F46' : '#713F12' }}>
              {business.verified ? 'Verified' : 'Pending'}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={s.bizActions}>
        {!business.verified && (
          <Pressable
            style={[s.actionBtn, { backgroundColor: theme.brand }]}
            onPress={handleVerify}
            disabled={busy}>
            {busy ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <ThemedText type="small" style={{ color: '#fff', fontWeight: '700' }}>Verify</ThemedText>
              </>
            )}
          </Pressable>
        )}
        <Pressable
          style={[s.actionBtn, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' }]}
          onPress={handleReject}>
          <Ionicons name="trash-outline" size={14} color="#DC2626" />
          <ThemedText type="small" style={{ color: '#DC2626', fontWeight: '700' }}>Remove</ThemedText>
        </Pressable>
      </View>
    </View>
    </Pressable>
  );
}

// ─── Admins tab ───────────────────────────────────────────────────────────────
function AdminsTab({ admins, newEmail, onChangeEmail, onAdd, adding, onRemove, currentUserEmail }: {
  admins: Admin[];
  newEmail: string;
  onChangeEmail: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
  onRemove: (a: Admin) => void;
  currentUserEmail: string;
}) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={[s.listContent, { maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' }]}>
      {/* Add new admin */}
      <View style={[s.addAdminCard, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>Add Admin</ThemedText>
        <View style={s.addRow}>
          <TextInput
            style={[s.addInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="admin@email.com"
            placeholderTextColor={theme.textSecondary}
            value={newEmail}
            onChangeText={onChangeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable
            style={[s.addBtn, { backgroundColor: theme.brand }]}
            onPress={onAdd}
            disabled={adding}>
            {adding
              ? <ActivityIndicator size="small" color="#fff" />
              : <ThemedText type="smallBold" style={{ color: '#fff' }}>Add</ThemedText>}
          </Pressable>
        </View>
      </View>

      {/* Admin list */}
      <ThemedText type="smallBold" style={s.sectionLabel}>Current Admins ({admins.length})</ThemedText>
      {admins.map(admin => (
        <View key={admin.id} style={[s.adminRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[s.adminIconWrap, { backgroundColor: admin.is_root ? theme.brand : theme.backgroundElement }]}>
            <Ionicons name={admin.is_root ? 'shield' : 'shield-outline'} size={18} color={admin.is_root ? '#fff' : theme.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" style={{ fontWeight: '600' }}>{admin.email}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
              {admin.is_root ? 'Root admin' : `Added by ${admin.added_by_email ?? 'system'}`}
            </ThemedText>
          </View>
          {!admin.is_root && admin.email !== currentUserEmail && (
            <Pressable
              onPress={() => onRemove(admin)}
              style={[s.removeBtn, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="person-remove-outline" size={15} color="#DC2626" />
            </Pressable>
          )}
          {admin.is_root && (
            <View style={s.rootBadge}>
              <ThemedText style={{ fontSize: 10, color: theme.brand, fontWeight: '700' }}>ROOT</ThemedText>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  tabsOuter: { width: '100%' },
  tabs: {
    flexDirection: 'row',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 7, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  listContent: { padding: Spacing.three, gap: Spacing.two },

  reasonBox: { borderRadius: 6, padding: Spacing.two, marginTop: 4 },
  bizCard: {
    borderRadius: 12, borderWidth: 1, padding: Spacing.three, gap: Spacing.two,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bizTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, flexShrink: 0 },
  bizActions: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 8,
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
    borderRadius: 8, marginBottom: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 6 },

  addAdminCard: { borderRadius: 12, padding: Spacing.three, marginBottom: Spacing.three },
  addRow: { flexDirection: 'row', gap: Spacing.two },
  addInput: {
    flex: 1, borderRadius: 8, borderWidth: 1,
    paddingHorizontal: Spacing.two, paddingVertical: 8, fontSize: 14,
  },
  addBtn: {
    borderRadius: 8, paddingHorizontal: Spacing.three,
    alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  sectionLabel: { marginBottom: Spacing.two, opacity: 0.6, fontSize: 11, letterSpacing: 0.4 },
  adminRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderRadius: 12, borderWidth: 1, padding: Spacing.three,
  },
  adminIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rootBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: 'rgba(5,150,105,0.1)', flexShrink: 0 },

  btn: { borderRadius: 10, paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
