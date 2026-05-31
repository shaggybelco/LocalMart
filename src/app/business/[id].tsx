import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DirectionsMap } from '@/components/DirectionsMap';
import { MiniMap } from '@/components/MiniMap';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import { verifyBusiness, rejectBusiness } from '@/services/admin';
import {
  getBusinessById,
  getBusinessReviews,
  addReview,
  saveBusiness,
  unsaveBusiness,
  isBusinessSaved,
  Business,
  Review,
} from '@/services/businesses';

function AdminBar({ name, id, onDone }: { name: string; id: string; onDone: () => void }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const onVerify = () => Alert.alert(
    'Verify Business',
    `Approve "${name}" and make it visible to customers?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify', onPress: async () => { setBusy(true); await verifyBusiness(id); onDone(); } },
    ]
  );

  const onRemove = () => Alert.alert(
    'Remove Business',
    `Permanently delete "${name}"? This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { setBusy(true); await rejectBusiness(id); onDone(); } },
    ]
  );

  return (
    <View style={[adminStyles.bar, { borderColor: '#FDE68A', backgroundColor: '#FEF9C3' }]}>
      <View style={[adminStyles.iconWrap, { backgroundColor: '#FDE68A' }]}>
        <Ionicons name="time-outline" size={18} color="#92400E" />
      </View>
      <ThemedText type="smallBold" style={[adminStyles.textBlock, { color: '#92400E' }]}>
        {'Pending approval\n'}
        <Text style={{ fontWeight: '400', fontSize: 12, opacity: 0.75 }}>{'Review then verify or remove.'}</Text>
      </ThemedText>
      {busy ? (
        <ActivityIndicator size="small" color="#92400E" />
      ) : (
        <View style={adminStyles.btns}>
          <Pressable style={[adminStyles.btn, { backgroundColor: theme.brand }]} onPress={onVerify}>
            <Ionicons name="checkmark" size={14} color="#fff" />
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Verify</ThemedText>
          </Pressable>
          <Pressable style={[adminStyles.btn, { backgroundColor: '#EF4444' }]} onPress={onRemove}>
            <Ionicons name="trash-outline" size={13} color="#fff" />
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Remove</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const adminStyles = StyleSheet.create({
  bar: {
    marginHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textBlock: { flex: 1, lineHeight: 18 },
  btns: { flexDirection: 'row', gap: Spacing.one },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, borderRadius: 7, paddingVertical: 6, paddingHorizontal: Spacing.two,
  },
});

function formatTime(t?: string) {
  if (!t) return '';
  // strip seconds if present: "08:00:00" → "08:00"
  return t.slice(0, 5);
}

function openWhatsApp(number: string) {
  const digits = number.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? '27' + digits.slice(1) : digits;
  Linking.openURL(`https://wa.me/${intl}`);
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [business, setBusiness] = useState<Business | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [directionsVisible, setDirectionsVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getBusinessById(id), getBusinessReviews(id)]).then(([b, r]) => {
      setBusiness(b);
      setReviews(r);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    isBusinessSaved(user.id, id).then(setSaved);
  }, [user, id]);

  const reloadReviews = () =>
    getBusinessReviews(id!).then(setReviews);

  const submitReview = async () => {
    if (reviewRating === 0) { Alert.alert('Please select a star rating'); return; }
    if (!reviewComment.trim()) { Alert.alert('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await addReview(id!, reviewRating, reviewComment.trim(), user?.id);
      setReviewDone(true);
      setReviewRating(0);
      setReviewComment('');
      reloadReviews();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleSave = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      if (saved) {
        await unsaveBusiness(user.id, id!);
        setSaved(false);
      } else {
        await saveBusiness(user.id, id!);
        setSaved(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openDirections = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Please enable location to get directions.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setDirectionsVisible(true);
    } catch {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  if (loading) {
    return <ThemedView style={styles.centered}><ActivityIndicator color={theme.brand} /></ThemedView>;
  }

  if (!business) {
    return <ThemedView style={styles.centered}><ThemedText>Business not found.</ThemedText></ThemedView>;
  }

  // Use explicit children array — JSX whitespace between siblings is a
  // text node in Metro/Hermes and triggers react-native-web's View check.
  const directionsModal = (
    <Modal
      key="directions"
      visible={directionsVisible}
      animationType="slide"
      onRequestClose={() => setDirectionsVisible(false)}>
      {userLocation && (
        <DirectionsMap
          from={userLocation}
          to={{ lat: business.latitude, lng: business.longitude }}
          businessName={business.name}
          onClose={() => setDirectionsVisible(false)}
        />
      )}
    </Modal>
  );

  // React.createElement avoids JSX whitespace text nodes between ThemedView's children
  const scrollContent = (<ScrollView contentContainerStyle={styles.scroll}>
        {/* Full-width hero */}
        <View style={[styles.heroOuter, { backgroundColor: theme.brand }]}>
        <View style={[styles.hero, { paddingTop: insets.top + Spacing.two }]}>
          {/* Back button */}
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <ThemedText type="small" style={{ color: '#fff' }}>Back</ThemedText>
          </Pressable>
          <View style={styles.heroTop}>
            <ThemedText type="subtitle" style={styles.heroName}>{business.name}</ThemedText>
            <Pressable onPress={toggleSave} style={styles.heartBtn}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={24}
                color={saved ? '#EF4444' : 'rgba(255,255,255,0.8)'}
              />
            </Pressable>
          </View>
          <View style={styles.heroMeta}>
            <ThemedText type="small" style={styles.heroSub}>
              {business.category.replace(/_/g, ' ')}
            </ThemedText>
            {business.rating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FCD34D" />
                <ThemedText type="small" style={styles.heroSub}>{business.rating}</ThemedText>
              </View>
            )}
          </View>
        </View>
        </View>
        <View style={styles.content}>
          {isAdmin && !business.verified && (<AdminBar name={business.name} id={business.id} onDone={() => router.canGoBack() ? router.back() : router.replace('/')} />)}
          {React.createElement(
            ThemedView,
            { type: 'backgroundElement', style: styles.infoCard },
            business.open_time ? (
              <View key="time" style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {`${formatTime(business.open_time)} – ${formatTime(business.close_time)}`}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.price}>
                  {{ R: 'Budget · under R100', RR: 'Moderate · R100–R300', RRR: 'Premium · R300+' }[business.price_range] ?? business.price_range}
                </ThemedText>
              </View>
            ) : null,
            business.address ? (
              <View key="addr" style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                  {business.address}
                </ThemedText>
              </View>
            ) : null
          )}
          {business.latitude && business.longitude && (<View style={styles.miniMapWrap}><MiniMap lat={business.latitude} lng={business.longitude} height={160} /></View>)}
          {(business.images?.length ?? 0) > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}>
            {business.images!.map((url, i) => (
              <Pressable key={i} onPress={() => setLightboxIndex(i)} style={styles.galleryThumb}>
                <Image
                  source={{ uri: url }}
                  style={styles.galleryImg}
                  contentFit="cover"
                  transition={300}
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              {reviews.length > 0 ? `REVIEWS (${reviews.length})` : 'REVIEWS'}
            </ThemedText>
            {business.rating > 0 && (
              <View style={styles.avgRating}>
                <Ionicons name="star" size={13} color="#FCD34D" />
                <ThemedText type="smallBold">{`${business.rating} avg`}</ThemedText>
              </View>
            )}
          </View>
          {reviewDone ? (
            <View style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.brand} />
                <ThemedText type="smallBold" style={{ color: theme.brand }}>{'Review submitted — thank you!'}</ThemedText>
              </View>
              <Pressable onPress={() => setReviewDone(false)}>
                <ThemedText type="small" themeColor="textSecondary">{'Leave another?'}</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>{'Leave a Review'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>{'No account needed — anyone can review.'}</ThemedText>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Pressable key={s} onPress={() => setReviewRating(s)} hitSlop={6}>
                    <Ionicons
                      name={s <= reviewRating ? 'star' : 'star-outline'}
                      size={28}
                      color={s <= reviewRating ? '#FCD34D' : theme.textSecondary}
                    />
                  </Pressable>
                ))}
                {reviewRating > 0 && (
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: 6 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRating]}
                  </ThemedText>
                )}
              </View>
              <TextInput
                style={[styles.reviewInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Share your experience…"
                placeholderTextColor={theme.textSecondary}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                maxLength={400}
              />
              <Pressable
                style={[styles.reviewSubmit, { backgroundColor: theme.brand }]}
                onPress={submitReview}
                disabled={submittingReview}>
                {submittingReview
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="send-outline" size={15} color="#fff" /><ThemedText type="smallBold" style={{ color: '#fff' }}>{'Submit Review'}</ThemedText></>}
              </Pressable>
            </View>
          )}
          {reviews.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic', marginTop: 4 }}>
              {'No reviews yet. Be the first!'}
            </ThemedText>
          ) : (
            reviews.map(r => (
              <View key={r.id} style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Ionicons
                        key={s}
                        name={s <= r.rating ? 'star' : 'star-outline'}
                        size={13}
                        color={s <= r.rating ? '#FCD34D' : theme.textSecondary}
                      />
                    ))}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
                {r.comment && (
                  <ThemedText type="small" style={{ lineHeight: 20, marginTop: 4 }}>
                    {r.comment}
                  </ThemedText>
                )}
              </View>
            ))
          )}
        </View>
        {business.images && (
          <Modal
            visible={lightboxIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setLightboxIndex(null)}>
            <View style={styles.lightbox}>
              {lightboxIndex !== null && (
                <>
                  <Image
                    source={{ uri: business.images[lightboxIndex] }}
                    style={styles.lightboxImg}
                    contentFit="contain"
                    transition={200}
                  />
                  <View style={styles.lightboxCounter}>
                    <ThemedText style={styles.lightboxCounterText}>
                      {`${lightboxIndex + 1} / ${business.images.length}`}
                    </ThemedText>
                  </View>
                  {lightboxIndex > 0 && (
                    <Pressable
                      style={[styles.lightboxArrow, styles.lightboxLeft]}
                      onPress={() => setLightboxIndex(i => (i ?? 1) - 1)}>
                      <Ionicons name="chevron-back" size={28} color="#fff" />
                    </Pressable>
                  )}
                  {lightboxIndex < business.images.length - 1 && (
                    <Pressable
                      style={[styles.lightboxArrow, styles.lightboxRight]}
                      onPress={() => setLightboxIndex(i => (i ?? 0) + 1)}>
                      <Ionicons name="chevron-forward" size={28} color="#fff" />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.lightboxClose}
                    onPress={() => setLightboxIndex(null)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </Pressable>
                </>
              )}
            </View>
          </Modal>
        )}
        {business.inventory?.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>IN STOCK / SERVICES</ThemedText>
            <View style={styles.chips}>
              {business.inventory.map(item => (
                <View key={item} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small">{item}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.actions}>
          {business.whatsapp_number && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
              onPress={() => openWhatsApp(business.whatsapp_number!)}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <ThemedText type="smallBold" style={styles.actionBtnText}>WhatsApp</ThemedText>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }]}
            onPress={openDirections}
            disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={theme.brand} />
              : <>
                  <Ionicons name="navigate-outline" size={16} color={theme.text} />
                  <ThemedText type="smallBold" style={styles.actionBtnText}>Directions</ThemedText>
                </>}
          </Pressable>
        </View>
        </View>
  </ScrollView>);

  return React.createElement(ThemedView, { style: styles.container }, scrollContent, directionsModal);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: Spacing.six },
  heroOuter: { width: '100%' },
  hero: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    padding: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  content: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: Spacing.two,
    opacity: 0.9,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroName: { color: '#fff', flex: 1 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heartBtn: { padding: Spacing.one },
  infoCard: {
    marginHorizontal: Spacing.three,
    borderRadius: 10,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  price: { marginLeft: 'auto' },
  section: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  sectionLabel: { fontSize: 11, letterSpacing: 0.5, opacity: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnText: {},
  starPicker: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.two },
  reviewInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.two,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.two,
  },
  reviewSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
  },
  miniMapWrap: {
    marginHorizontal: Spacing.three,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  avgRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCard: {
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: 2,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  gallery: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  galleryThumb: {
    borderRadius: 10,
    overflow: 'hidden',
    width: 180,
    height: 120,
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },

  // Lightbox
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImg: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  lightboxCounter: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  lightboxCounterText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  lightboxClose: {
    position: 'absolute',
    top: 48,
    right: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxArrow: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxLeft: { left: Spacing.two },
  lightboxRight: { right: Spacing.two },
});
