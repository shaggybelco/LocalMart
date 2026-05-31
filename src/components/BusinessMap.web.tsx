import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Business } from '@/services/businesses';
import { useAppTheme } from '@/context/app-theme';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

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
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/attributions" target="_blank">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/attributions" target="_blank">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  },
};

export const CATEGORY_COLOR: Record<string, string> = {
  spaza:        '#F97316',
  grocery:      '#FB923C',
  hair_salon:   '#A855F7',
  beauty_salon: '#EC4899',
  car_wash:     '#3B82F6',
  mechanic:     '#64748B',
  food_vendor:  '#EF4444',
  phone_repair: '#EAB308',
  tailor:       '#10B981',
  laundry:      '#06B6D4',
  tutoring:     '#8B5CF6',
  other:        '#6B7280',
};

function userDot() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:24px;height:24px;background:rgba(59,130,246,0.35);border-radius:50%;animation:lm-pulse 2s ease-out infinite;"></div>
        <div style="width:14px;height:14px;background:#3B82F6;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.55);position:relative;z-index:1;"></div>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function teardrop(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:26px;height:34px;">
        <div style="width:26px;height:26px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);"></div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:6px;height:6px;background:${color};border-radius:50%;opacity:0.3;"></div>
      </div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  });
}

// Dismiss card when map is tapped
function MapClickDismiss({ onDismiss }: { onDismiss: () => void }) {
  useMapEvents({ click: onDismiss });
  return null;
}

function formatDist(m?: number) {
  if (!m) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export interface BusinessMapProps {
  businesses: (Business & { distance_meters?: number })[];
  userLocation: { lat: number; lng: number } | null;
}

export function BusinessMap({ businesses, userLocation }: BusinessMapProps) {
  useLeafletCSS();
  const { resolved } = useAppTheme();
  const theme = useTheme();
  const tile = TILES[resolved];
  const center = userLocation ?? { lat: -26.2678, lng: 27.8589 };
  const [selected, setSelected] = useState<(Business & { distance_meters?: number }) | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}>
        <TileLayer url={tile.url} attribution={tile.attribution} />
        <MapClickDismiss onDismiss={() => setSelected(null)} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userDot()} />
        )}

        {businesses.map(biz => (
          <Marker
            key={biz.id}
            position={[biz.latitude, biz.longitude]}
            icon={teardrop(CATEGORY_COLOR[biz.category] ?? '#059669')}
            eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); setSelected(biz); } }}
          />
        ))}
      </MapContainer>

      {/* Business card popup */}
      {selected && (
        <View style={[s.card, {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          shadowColor: '#000',
        }]}>
          {/* Cover image */}
          {selected.cover_image && (
            <Image
              source={{ uri: selected.cover_image }}
              style={s.cardImage}
              contentFit="cover"
              transition={200}
            />
          )}

          <View style={s.cardBody}>
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={s.cardName} numberOfLines={1}>
                  {selected.name}
                </ThemedText>
                <ThemedText type="small" style={[s.cardCategory, { color: CATEGORY_COLOR[selected.category] ?? theme.brand }]}>
                  {selected.category.replace(/_/g, ' ')}
                </ThemedText>
              </View>
              <Pressable onPress={() => setSelected(null)} style={s.dismiss}>
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={s.cardMeta}>
              {selected.distance_meters !== undefined && (
                <View style={s.metaChip}>
                  <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                  <ThemedText style={s.metaText}>{formatDist(selected.distance_meters)}</ThemedText>
                </View>
              )}
              {selected.rating > 0 && (
                <View style={s.metaChip}>
                  <Ionicons name="star" size={12} color="#FCD34D" />
                  <ThemedText style={s.metaText}>{selected.rating} ({selected.total_reviews})</ThemedText>
                </View>
              )}
              {selected.price_range && (
                <View style={s.metaChip}>
                  <ThemedText style={s.metaText}>
                    {{ R: 'Budget', RR: 'Moderate', RRR: 'Premium' }[selected.price_range]}
                  </ThemedText>
                </View>
              )}
            </View>

            <Pressable
              style={[s.viewBtn, { backgroundColor: theme.brand }]}
              onPress={() => { setSelected(null); router.push(`/business/${selected.id}`); }}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>View Details</ThemedText>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: Spacing.three, gap: Spacing.two },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardName: { fontSize: 16 },
  cardCategory: { fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  dismiss: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metaText: { fontSize: 11, color: '#6B7280' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 11,
  },
});
