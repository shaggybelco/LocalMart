import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeader } from '@/components/GradientHeader';
import { LocationPicker } from '@/components/LocationPicker';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/services/supabase';
import { uploadBusinessImage, attachImagesToBusiness, getMyBusinesses, requestDeletion, cancelDeletionRequest, Business } from '@/services/businesses';

const CATEGORIES = [
  'spaza',
  'grocery',
  'hair_salon',
  'beauty_salon',
  'car_wash',
  'mechanic',
  'food_vendor',
  'phone_repair',
  'tailor',
  'laundry',
  'tutoring',
  'other',
];

const PRICE_TIERS: { value: 'R' | 'RR' | 'RRR'; icon: string; label: string; hint: string }[] = [
  { value: 'R',   icon: '💰',   label: 'Budget',   hint: 'Under R100' },
  { value: 'RR',  icon: '💰💰', label: 'Moderate', hint: 'R100 – R300' },
  { value: 'RRR', icon: '💰💰💰', label: 'Premium', hint: 'R300+' },
];

export default function RegisterScreen() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    getMyBusinesses(user.id).then(setMyBusinesses);
  }, [user]));
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [inventoryInput, setInventoryInput] = useState('');
  const [inventory, setInventory] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<'R' | 'RR' | 'RRR'>('RR');
  const [images, setImages] = useState<{ uri: string; mimeType: string }[]>([]);
  const [pinnedLat, setPinnedLat] = useState<number | null>(null);
  const [pinnedLng, setPinnedLng] = useState<number | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (authLoading) return <ThemedView style={styles.centered}><ActivityIndicator /></ThemedView>;

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="storefront-outline" size={48} color={theme.textSecondary} />
        <ThemedText type="smallBold">List Your Business</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.gateText}>
          Sign in to register and manage your businesses on LocalMart.
        </ThemedText>
        <Pressable style={[styles.btn, { backgroundColor: theme.brand }]} onPress={() => router.push('/auth/login')}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Sign In</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // ── My Businesses dashboard (shown when user has businesses and isn't in form mode) ──
  if (myBusinesses.length > 0 && !showForm && !done) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader
          title="My Businesses"
          subtitle={`${myBusinesses.length} registered`}
          right={
            <Pressable style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setShowForm(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <ThemedText type="smallBold" style={{ color: '#fff' }}>Add New</ThemedText>
            </Pressable>
          }
        />

        <FlatList
          data={myBusinesses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.dashList}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.myBizCard, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => router.push(`/business/${item.id}`)}>
              <View style={styles.myBizLeft}>
                <ThemedText type="smallBold" style={{ fontSize: 15 }} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
                  {item.category.replace(/_/g, ' ')}
                  {item.address ? ` · ${item.address.split(',')[0]}` : ''}
                </ThemedText>
              </View>
              {item.deletion_requested ? (
                <View style={[styles.statusPill, { backgroundColor: '#FEF2F2' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                  <ThemedText style={[styles.statusText, { color: '#B91C1C' }]}>Deletion pending</ThemedText>
                </View>
              ) : (
                <View style={[
                  styles.statusPill,
                  { backgroundColor: item.verified ? '#ECFDF5' : '#FEF9C3' },
                ]}>
                  <View style={[styles.statusDot, { backgroundColor: item.verified ? '#059669' : '#D97706' }]} />
                  <ThemedText style={[styles.statusText, { color: item.verified ? '#065F46' : '#92400E' }]}>
                    {item.verified ? 'Live' : 'Pending'}
                  </ThemedText>
                </View>
              )}
              <Pressable
                hitSlop={8}
                onPress={() => {
                  if (item.deletion_requested) {
                    Alert.alert(
                      'Cancel Deletion Request',
                      `Cancel the deletion request for "${item.name}"?`,
                      [
                        { text: 'No', style: 'cancel' },
                        { text: 'Yes, Cancel Request', onPress: async () => {
                          await cancelDeletionRequest(item.id);
                          getMyBusinesses(user!.id).then(setMyBusinesses);
                        }},
                      ]
                    );
                  } else {
                    Alert.prompt
                      ? Alert.prompt(
                          'Request Deletion',
                          `Why do you want to remove "${item.name}"? (optional)`,
                          async (reason) => {
                            await requestDeletion(item.id, reason ?? '');
                            getMyBusinesses(user!.id).then(setMyBusinesses);
                          },
                          'plain-text',
                          '',
                        )
                      : Alert.alert(
                          'Request Deletion',
                          `Submit a deletion request for "${item.name}"? An admin will review and delete it.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Request Deletion', style: 'destructive', onPress: async () => {
                              await requestDeletion(item.id, '');
                              getMyBusinesses(user!.id).then(setMyBusinesses);
                            }},
                          ]
                        );
                  }
                }}>
                <Ionicons
                  name={item.deletion_requested ? 'close-circle' : 'trash-outline'}
                  size={18}
                  color={item.deletion_requested ? '#EF4444' : theme.textSecondary}
                />
              </Pressable>
            </Pressable>
          )}
        />
      </ThemedView>
    );
  }

  if (done) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="checkmark-circle" size={52} color={theme.brand} />
        <ThemedText type="smallBold" style={{ textAlign: 'center' }}>Business submitted!</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Pending verification — it will appear on the map once approved.
        </ThemedText>
        <Pressable
          style={[styles.btn, { backgroundColor: theme.brand }]}
          onPress={() => {
            setDone(false);
            setShowForm(false);
            setName('');
            setCategory('');
            setAddress('');
            setWhatsapp('');
            setInventory([]);
            getMyBusinesses(user.id).then(setMyBusinesses);
          }}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>View My Businesses</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const addInventoryItem = () => {
    const item = inventoryInput.trim();
    if (item && !inventory.includes(item)) setInventory(prev => [...prev, item]);
    setInventoryInput('');
  };

  const handleSubmit = async () => {
    if (!name || !category || !whatsapp) {
      Alert.alert('Please fill in name, category, and WhatsApp number');
      return;
    }
    setSubmitting(true);
    try {
      let lat = pinnedLat;
      let lng = pinnedLng;

      // Fall back to GPS if no pin was set
      if (!lat || !lng) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } else {
          lat = -26.2678;
          lng = 27.8589;
        }
      }

      // Step 1: INSERT (no .select() — avoids conflicting with the verified=true SELECT policy)
      const { error: insertError } = await supabase
        .from('businesses')
        .insert({
          name,
          category,
          location: `POINT(${lng} ${lat})`,
          address,
          whatsapp_number: whatsapp,
          open_time: openTime,
          close_time: closeTime,
          inventory,
          price_range: priceRange,
          owner_id: user.id,
          verified: false,
        });

      if (insertError) throw insertError;

      // Step 2: fetch the new row using the owner SELECT policy
      if (images.length > 0) {
        const { data: bizData } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bizData?.id) {
          const urls: string[] = [];
          for (const img of images) {
            const url = await uploadBusinessImage(bizData.id, img.uri, img.mimeType);
            urls.push(url);
          }
          await attachImagesToBusiness(bizData.id, urls);
        }
      }

      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <ThemedText type="subtitle" style={styles.title}>List Your Business</ThemedText>

        <Field label="Business Name *">
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={name} onChangeText={setName}
            placeholder="e.g. Tasty Spaza" placeholderTextColor={theme.textSecondary}
          />
        </Field>

        <Field label="Category *">
          <View style={styles.chips}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, { backgroundColor: category === c ? theme.brand : theme.backgroundElement }]}
                onPress={() => setCategory(c)}>
                <ThemedText type="small" style={{ color: category === c ? '#fff' : theme.text, textTransform: 'capitalize' }}>
                  {c.replace('_', ' ')}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="WhatsApp Number *">
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={whatsapp} onChangeText={setWhatsapp}
            placeholder="0821234567" placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Trading Hours">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={openTime} onChangeText={setOpenTime}
              placeholder="08:00" placeholderTextColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary"> to </ThemedText>
            <TextInput
              style={[styles.input, styles.half, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={closeTime} onChangeText={setCloseTime}
              placeholder="17:00" placeholderTextColor={theme.textSecondary}
            />
          </View>
        </Field>

        <Field label="Price Range">
          <View style={styles.priceRow}>
            {PRICE_TIERS.map(tier => {
              const active = priceRange === tier.value;
              return (
                <Pressable
                  key={tier.value}
                  style={[
                    styles.priceTile,
                    {
                      backgroundColor: active ? theme.brand : theme.backgroundElement,
                      borderColor: active ? theme.brand : theme.border,
                      borderWidth: active ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => setPriceRange(tier.value)}>
                  <ThemedText style={[styles.priceIcon, { opacity: active ? 1 : 0.6 }]}>
                    {tier.icon}
                  </ThemedText>
                  <ThemedText
                    type="smallBold"
                    style={{ color: active ? '#fff' : theme.text, fontSize: 12 }}>
                    {tier.label}
                  </ThemedText>
                  <ThemedText
                    style={{ color: active ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontSize: 10 }}>
                    {tier.hint}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Inventory / Services">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={inventoryInput} onChangeText={setInventoryInput}
              placeholder="e.g. Bread" placeholderTextColor={theme.textSecondary}
              onSubmitEditing={addInventoryItem} returnKeyType="done"
            />
            <Pressable style={[styles.chip, { backgroundColor: theme.brand }]} onPress={addInventoryItem}>
              <ThemedText type="small" style={{ color: '#fff' }}>Add</ThemedText>
            </Pressable>
          </View>
          {inventory.length > 0 && (
            <View style={styles.chips}>
              {inventory.map(item => (
                <Pressable
                  key={item}
                  style={[styles.chip, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => setInventory(prev => prev.filter(i => i !== item))}>
                  <ThemedText type="small">{item} ✕</ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </Field>

        {/* Combined location + address field */}
        <Field label="Location / Address *">
          <Pressable
            style={[styles.locationBtn, {
              backgroundColor: theme.backgroundElement,
              borderColor: pinnedLat ? theme.brand : theme.border,
              borderWidth: pinnedLat ? 1.5 : 1,
            }]}
            onPress={() => setLocationPickerOpen(true)}>
            <Ionicons
              name={pinnedLat ? 'location' : 'location-outline'}
              size={18}
              color={pinnedLat ? theme.brand : theme.textSecondary}
              style={{ flexShrink: 0 }}
            />
            <ThemedText
              type="small"
              numberOfLines={2}
              style={{ flex: 1, color: pinnedLat ? theme.text : theme.textSecondary }}>
              {address || (pinnedLat ? `${pinnedLat.toFixed(5)}, ${pinnedLng?.toFixed(5)}` : 'Search or pin on map')}
            </ThemedText>
            {pinnedLat
              ? <Pressable onPress={() => { setPinnedLat(null); setPinnedLng(null); setAddress(''); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </Pressable>
              : <Ionicons name="map-outline" size={16} color={theme.textSecondary} />}
          </Pressable>
          {!pinnedLat && (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
              Uses your GPS if skipped.
            </ThemedText>
          )}
        </Field>

        {/* Image picker */}
        <Field label={`Photos (${images.length}/4)`}>
          <View style={styles.imageRow}>
            {images.map((img, i) => (
              <View key={i} style={styles.imageThumb}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                <Pressable
                  style={[styles.thumbRemove, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                  <Ionicons name="close" size={12} color={theme.text} />
                </Pressable>
              </View>
            ))}
            {images.length < 4 && (
              <Pressable
                style={[styles.addPhoto, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                onPress={async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please allow access to your photo library.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                    allowsMultipleSelection: false,
                  });
                  if (!result.canceled && result.assets[0]) {
                    const asset = result.assets[0];
                    setImages(prev => [...prev, {
                      uri: asset.uri,
                      mimeType: asset.mimeType ?? 'image/jpeg',
                    }]);
                  }
                }}>
                <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">Add photo</ThemedText>
              </Pressable>
            )}
          </View>
        </Field>

        <Pressable style={[styles.btn, { backgroundColor: theme.brand }]} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <ThemedText type="smallBold" style={{ color: '#fff' }}>Submit Business</ThemedText>}
        </Pressable>
      </ScrollView>
      <Modal
        visible={locationPickerOpen}
        animationType="slide"
        onRequestClose={() => setLocationPickerOpen(false)}>
        <LocationPicker
          initialLat={pinnedLat ?? undefined}
          initialLng={pinnedLng ?? undefined}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={(lat, lng, addr) => {
            setPinnedLat(lat);
            setPinnedLng(lng);
            setAddress(addr);
            setLocationPickerOpen(false);
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small" style={{ fontSize: 11, opacity: 0.6, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  gateText: { textAlign: 'center', maxWidth: 280 },

  // My Businesses dashboard
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dashList: {
    padding: Spacing.three,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  myBizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
  },
  myBizLeft: { flex: 1, gap: 3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: 100,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { marginBottom: Spacing.two },
  input: { borderRadius: Spacing.two, padding: Spacing.two, fontSize: 16 },
  half: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: Spacing.five, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  btn: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    minHeight: 48,
    justifyContent: 'center',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 10,
    padding: Spacing.two,
  },
  priceRow: { flexDirection: 'row', gap: Spacing.two },
  priceTile: {
    flex: 1,
    borderRadius: 10,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 3,
  },
  priceIcon: { fontSize: 20 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  imageThumb: { position: 'relative', width: 80, height: 80 },
  thumbImg: { width: 80, height: 80, borderRadius: 8 },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
