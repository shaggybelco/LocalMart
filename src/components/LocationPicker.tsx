import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { GradientView } from '@/components/GradientView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SearchResult { display_name: string; lat: string; lon: string; }

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

export function LocationPicker({ initialLat, initialLng, onConfirm, onClose }: LocationPickerProps) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  const defaultLat = initialLat ?? -25.975;
  const defaultLng = initialLng ?? 28.215;

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'LocalMart/1.0' } }
      );
      const data = await res.json();
      setAddress(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setPin({ lat, lng });
      setResults([]);
      reverseGeocode(lat, lng);
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
    } finally {
      setLocating(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setPin({ lat, lng });
    setResults([]);
    reverseGeocode(lat, lng);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!text.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=za`,
          { headers: { 'User-Agent': 'LocalMart/1.0' } }
        );
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const pickResult = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setPin({ lat, lng });
    setSearch('');
    setResults([]);
    setAddress(r.display_name);
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
  };

  return (
    <View style={s.container}>
      <GradientView horizontal style={s.header}>
        <Ionicons name="location" size={16} color="#fff" />
        <ThemedText type="smallBold" style={s.headerTitle}>Pin Business Location</ThemedText>
        <Pressable onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={18} color="#fff" />
        </Pressable>
      </GradientView>

      {/* Search bar */}
      <View style={[s.searchWrap, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={s.searchBarRow}>
          <View style={[s.searchRow, { backgroundColor: theme.backgroundElement, flex: 1 }]}>
            <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
            <TextInput
              style={[s.searchInput, { color: theme.text }]}
              placeholder="Search address or place…"
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={handleSearch}
            />
            {searching && <ActivityIndicator size="small" color={theme.brand} />}
            {search.length > 0 && !searching && (
              <Pressable onPress={() => { setSearch(''); setResults([]); }}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={[s.myLocBtn, { backgroundColor: theme.brand }]}
            onPress={useMyLocation}
            disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="navigate" size={16} color="#fff" />}
          </Pressable>
        </View>

        {results.length > 0 && (
          <View style={[s.results, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {results.map((r, i) => (
              <Pressable
                key={i}
                style={[s.resultItem, { borderBottomColor: theme.border }, i === results.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => pickResult(r)}>
                <Ionicons name="location-outline" size={14} color={theme.brand} />
                <ThemedText type="small" style={{ flex: 1 }} numberOfLines={2}>{r.display_name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <View style={s.map}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ latitude: pin?.lat ?? defaultLat, longitude: pin?.lng ?? defaultLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          onPress={handleMapPress}
          showsUserLocation>
          {pin && (
            <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} pinColor="#059669" />
          )}
        </MapView>
        <View style={[s.hintWrap, { backgroundColor: theme.background + 'CC' }]}>
          <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>Tap map to drop pin</ThemedText>
        </View>
      </View>

      {/* Confirm bar */}
      <View style={[s.confirmBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {pin ? (
          <>
            <View style={{ flex: 1 }}>
              {geocoding
                ? <ActivityIndicator size="small" color={theme.brand} />
                : <ThemedText type="small" numberOfLines={2}>{address}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </ThemedText>
            </View>
            <Pressable
              style={[s.confirmBtn, { backgroundColor: theme.brand }]}
              onPress={() => onConfirm(pin.lat, pin.lng, address)}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <ThemedText type="smallBold" style={{ color: '#fff' }}>Use Location</ThemedText>
            </Pressable>
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1, textAlign: 'center' }}>
            Search or tap the map to pin your business
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  headerTitle: { color: '#fff', flex: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, zIndex: 10 },
  searchBarRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderRadius: 10, paddingHorizontal: Spacing.two, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  myLocBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  results: {
    borderRadius: 10, borderWidth: 1, marginTop: Spacing.one,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    padding: Spacing.two, borderBottomWidth: 1,
  },
  map: { flex: 1, position: 'relative' },
  hintWrap: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  confirmBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderTopWidth: 1,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: Spacing.three, borderRadius: 10,
  },
});
