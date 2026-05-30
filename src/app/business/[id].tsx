import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DirectionsMap } from '@/components/DirectionsMap';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import {
  getBusinessById,
  saveBusiness,
  unsaveBusiness,
  isBusinessSaved,
  Business,
} from '@/services/businesses';

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
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [directionsVisible, setDirectionsVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBusinessById(id).then(b => {
      setBusiness(b);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    isBusinessSaved(user.id, id).then(setSaved);
  }, [user, id]);

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Full-width hero */}
        <View style={[styles.heroOuter, { backgroundColor: theme.brand }]}>
        <View style={styles.hero}>
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

        {/* Centered content */}
        <View style={styles.content}>
        <ThemedView type="backgroundElement" style={styles.infoCard}>
          {business.open_time && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatTime(business.open_time)} – {formatTime(business.close_time)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.price}>
                {business.price_range}
              </ThemedText>
            </View>
          )}
          {business.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                {business.address}
              </ThemedText>
            </View>
          )}
        </ThemedView>

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
      </ScrollView>

      {/* Full-screen directions modal */}
      <Modal
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
    </ThemedView>
  );
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
});
