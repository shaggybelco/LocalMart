import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BusinessCard } from '@/components/BusinessCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { RadiusSelector } from '@/components/RadiusSelector';
import { BusinessMap } from '@/components/BusinessMap';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppTheme } from '@/context/app-theme';
import { GradientView } from '@/components/GradientView';
import { getNearbyBusinesses, Business } from '@/services/businesses';

export default function HomeScreen() {
  const theme = useTheme();
  const { resolved, toggle } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isWide, numColumns } = useResponsive();
  const [businesses, setBusinesses] = useState<(Business & { distance_meters?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(2);
  const [category, setCategory] = useState('all');
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [radius, category]);

  const loadBusinesses = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError(true);
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    setUserLocation(pos);
    setLocationError(false);
    const results = await getNearbyBusinesses({
      lat: pos.lat,
      lng: pos.lng,
      radiusKm: radius,
      category: category !== 'all' ? category : undefined,
    });
    setBusinesses(results);
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Gradient header */}
      <GradientView style={[styles.headerOuter, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <ThemedText type="subtitle" style={styles.headerTitle}>LocalMart</ThemedText>
            <ThemedText type="small" style={styles.headerSub}>Discover local businesses near you</ThemedText>
          </View>
          {/* Only show toggle on mobile — desktop has it in the top navbar */}
          {!isWide && (
            <Pressable onPress={toggle} style={styles.themeBtn} hitSlop={8}>
              <Ionicons
                name={resolved === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color="rgba(255,255,255,0.9)"
              />
            </Pressable>
          )}
        </View>
      </GradientView>

      {/* Centered controls */}
      <View style={styles.controls}>
        <View style={[styles.controlsInner, isWide && styles.controlsRow]}>
          <View style={isWide ? styles.controlHalf : styles.controlFull}>
            <RadiusSelector value={radius} onChange={r => setRadius(r)} />
          </View>
          <View style={isWide ? styles.controlHalf : styles.controlFull}>
            <CategoryFilter selected={category} onSelect={setCategory} />
          </View>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.brand} />
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
            Finding businesses...
          </ThemedText>
        </View>
      ) : locationError ? (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
            Location access is needed to find nearby businesses.
          </ThemedText>
          <Pressable style={[styles.retryBtn, { backgroundColor: theme.brand }]} onPress={loadBusinesses}>
            <ThemedText type="small" style={{ color: '#fff' }}>Enable Location</ThemedText>
          </Pressable>
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary">No businesses found nearby.</ThemedText>
          <Pressable style={[styles.retryBtn, { backgroundColor: theme.brand }]} onPress={() => setRadius(r => Math.min(r * 2, 10))}>
            <ThemedText type="small" style={{ color: '#fff' }}>Try wider radius</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={businesses}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              style={numColumns > 1 ? styles.cardColumn : undefined}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: BottomTabInset + Spacing.six, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
          ]}
        />
      )}

      {/* Floating map button */}
      {!loading && businesses.length > 0 && (
        <Pressable
          style={[styles.mapBtn, { bottom: BottomTabInset + Spacing.four }]}
          onPress={() => setMapVisible(true)}>
          <GradientView horizontal style={styles.mapBtnGradient}>
            <Ionicons name="map-outline" size={16} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff' }}>Show Map</ThemedText>
          </GradientView>
        </Pressable>
      )}

      {/* Map modal */}
      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapContainer}>
          <GradientView horizontal style={styles.mapHeader}>
            <Ionicons name="map" size={16} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff', flex: 1 }}>
              Nearby Businesses
            </ThemedText>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => setMapVisible(false)}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>✕ Close</ThemedText>
            </Pressable>
          </GradientView>
          <BusinessMap businesses={businesses} userLocation={userLocation} />
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerOuter: { width: '100%' },
  headerInner: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: Spacing.half },
  headerTitle: { color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.8)' },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  controls: { paddingVertical: Spacing.two },
  controlsInner: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.two,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  controlHalf: { flex: 1 },
  controlFull: { width: '100%' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centeredText: { textAlign: 'center' },
  list: { padding: Spacing.three },
  columnWrapper: { gap: Spacing.two },
  cardColumn: { flex: 1 },
  retryBtn: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  mapBtn: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: Spacing.five,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  mapBtnGradient: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapContainer: { flex: 1 },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  closeBtn: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
