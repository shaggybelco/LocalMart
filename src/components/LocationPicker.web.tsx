import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { GradientView } from '@/components/GradientView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/context/app-theme';

function useLeafletCSS() {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    if (!document.getElementById('lm-marker-css')) {
      const style = document.createElement('style');
      style.id = 'lm-marker-css';
      style.textContent = `@keyframes lm-pulse { 0%{transform:scale(1);opacity:.7} 70%{transform:scale(2.8);opacity:0} 100%{transform:scale(1);opacity:0} }`;
      document.head.appendChild(style);
    }
  }, []);
}

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTR = '© <a href="https://carto.com/attributions" target="_blank">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

function teardrop(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:30px;height:38px;">
      <div style="width:30px;height:30px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.28);"></div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:8px;height:8px;background:${color};border-radius:50%;opacity:0.35;"></div>
    </div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

interface SearchResult { display_name: string; lat: string; lon: string; }

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

export function LocationPicker({ initialLat, initialLng, onConfirm, onClose }: LocationPickerProps) {
  useLeafletCSS();
  const theme = useTheme();
  const { resolved } = useAppTheme();

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
  const mapRef = useRef<any>(null);

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

  const handlePick = (lat: number, lng: number) => {
    setPin({ lat, lng });
    setResults([]);
    reverseGeocode(lat, lng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPin({ lat, lng });
        setResults([]);
        reverseGeocode(lat, lng);
        mapRef.current?.flyTo([lat, lng], 16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
  };

  return (
    <View style={s.container}>
      {/* Header */}
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

        {/* Results dropdown */}
        {results.length > 0 && (
          <View style={[s.results, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {results.map((r, i) => (
              <Pressable
                key={i}
                style={[s.resultItem, { borderBottomColor: theme.border }, i === results.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => pickResult(r)}>
                <Ionicons name="location-outline" size={14} color={theme.brand} style={{ flexShrink: 0 }} />
                <ThemedText type="small" style={{ flex: 1 }} numberOfLines={2}>{r.display_name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <View style={s.map}>
        <ThemedText style={[s.hint, { color: theme.textSecondary, backgroundColor: theme.background + 'CC' }]}>
          Tap the map to drop a pin
        </ThemedText>
        <MapContainer
          center={pin ? [pin.lat, pin.lng] : [defaultLat, defaultLng]}
          zoom={14}
          zoomControl={false}
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer url={TILES[resolved]} attribution={ATTR} />
          <ClickHandler onPick={handlePick} />
          {pin && <Marker position={[pin.lat, pin.lng]} icon={teardrop('#059669')} />}
        </MapContainer>
      </View>

      {/* Confirm bar */}
      <View style={[s.confirmBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {pin ? (
          <>
            <View style={{ flex: 1 }}>
              {geocoding
                ? <ActivityIndicator size="small" color={theme.brand} />
                : <ThemedText type="small" numberOfLines={2} style={{ flex: 1 }}>{address}</ThemedText>}
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
            Search or tap the map to select your business location
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
  searchWrap: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, position: 'relative', zIndex: 10 },
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
    position: 'absolute', top: '100%', left: Spacing.three, right: Spacing.three,
    borderRadius: 10, borderWidth: 1, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8,
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    padding: Spacing.two, borderBottomWidth: 1,
  },
  map: { flex: 1, position: 'relative' },
  hint: {
    position: 'absolute', top: 10, left: '50%', transform: [{ translateX: -90 }],
    zIndex: 10, fontSize: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
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
