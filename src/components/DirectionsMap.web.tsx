import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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

    // Inject pulse keyframe once
    if (!document.getElementById('lm-marker-css')) {
      const style = document.createElement('style');
      style.id = 'lm-marker-css';
      style.textContent = `
        @keyframes lm-pulse {
          0%   { transform: scale(1); opacity: 0.7; }
          70%  { transform: scale(2.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

// Pulsing blue dot — Google Maps "you are here" style
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

// Teardrop pin — Google Maps destination style
function teardrop(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:30px;height:38px;">
        <div style="
          width:30px;height:30px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.28);
        "></div>
        <div style="
          position:absolute;bottom:0;left:50%;
          transform:translateX(-50%);
          width:8px;height:8px;
          background:${color};
          border-radius:50%;
          opacity:0.35;
        "></div>
      </div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTR = '© <a href="https://carto.com/attributions" target="_blank">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';


// Moves the map to follow the user's current position
function TrackUser({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.panTo(pos, { animate: true }); }, [pos[0], pos[1]]);
  return null;
}

function FitBounds({ from, to }: { from: [number, number]; to: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.fitBounds([from, to], { padding: [50, 40] }); }, []);
  return null;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Step {
  instruction: string;
  distance: string;
  icon: IoniconsName;
  lat: number;
  lng: number;
}

function buildInstruction(type: string, modifier?: string, name?: string): string {
  const road = name ? `onto ${name}` : '';
  if (type === 'depart')          return `Head ${modifier ?? 'forward'} ${road}`.trim();
  if (type === 'arrive')          return 'Arrive at destination';
  if (type === 'turn') {
    if (modifier === 'left')         return `Turn left ${road}`.trim();
    if (modifier === 'right')        return `Turn right ${road}`.trim();
    if (modifier === 'slight left')  return `Keep left ${road}`.trim();
    if (modifier === 'slight right') return `Keep right ${road}`.trim();
    if (modifier === 'sharp left')   return `Sharp left ${road}`.trim();
    if (modifier === 'sharp right')  return `Sharp right ${road}`.trim();
    if (modifier === 'uturn')        return 'Make a U-turn';
  }
  if (type === 'roundabout' || type === 'rotary') return `Enter the roundabout ${road}`.trim();
  if (type === 'exit roundabout') return `Exit the roundabout ${road}`.trim();
  if (type === 'fork')   return `Keep ${modifier ?? 'straight'} at the fork`;
  if (type === 'merge')  return `Merge ${modifier ?? ''} ${road}`.trim();
  return `Continue ${road || 'on route'}`.trim();
}

function stepIcon(type: string, modifier?: string): IoniconsName {
  if (type === 'depart') return 'navigate-outline';
  if (type === 'arrive') return 'flag';
  if (type === 'roundabout' || type === 'rotary' || type === 'exit roundabout') return 'reload-outline';
  if (modifier?.includes('right')) return 'arrow-forward-outline';
  if (modifier?.includes('left'))  return 'arrow-back-outline';
  if (modifier === 'uturn')        return 'return-down-back-outline';
  return 'arrow-up-outline';
}

function distanceBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin), Math.sqrt(1 - sin));
}

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

interface RouteData {
  coords: [number, number][];
  distanceKm: string;
  durationMin: string;
  steps: Step[];
}

export interface DirectionsMapProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  businessName: string;
  onClose: () => void;
}

export function DirectionsMap({ from, to, businessName, onClose }: DirectionsMapProps) {
  useLeafletCSS();
  const theme = useTheme();
  const { resolved } = useAppTheme();

  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPos, setCurrentPos] = useState(from);
  const [currentStep, setCurrentStep] = useState(0);
  const [tracking, setTracking] = useState(false);
  const stepListRef = useRef<ScrollView>(null);

  // Fetch route once
  useEffect(() => {
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson&steps=true`
    )
      .then(r => r.json())
      .then(data => {
        if (data.code !== 'Ok') throw new Error('No route');
        const r = data.routes[0];
        const coords: [number, number][] = (r.geometry?.coordinates ?? []).map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const rawSteps: any[] = r.legs?.[0]?.steps ?? [];
        const steps: Step[] = rawSteps
          .filter(s => s?.maneuver?.type)
          .map(s => ({
            instruction: buildInstruction(s.maneuver.type, s.maneuver.modifier, s.name ?? ''),
            distance: formatDist(s.distance ?? 0),
            icon: stepIcon(s.maneuver.type, s.maneuver.modifier),
            lat: s.maneuver.location?.[1] ?? from.lat,
            lng: s.maneuver.location?.[0] ?? from.lng,
          }));
        setRoute({ coords, distanceKm: (r.distance / 1000).toFixed(1), durationMin: Math.round(r.duration / 60).toString(), steps });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Watch live position and auto-advance steps
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      loc => {
        const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCurrentPos(pos);
        setTracking(true);
        // Advance step when within 40m of the next step's waypoint
        setCurrentStep(prev => {
          if (!route) return prev;
          const next = route.steps[prev + 1];
          if (!next) return prev;
          const dist = distanceBetween(pos, { lat: next.lat, lng: next.lng });
          return dist < 40 ? prev + 1 : prev;
        });
      }
    ).then(s => { sub = s; });
    return () => { sub?.remove(); };
  }, [route]);

  // Scroll step list to current step
  useEffect(() => {
    if (route && stepListRef.current) {
      stepListRef.current.scrollTo({ y: currentStep * 54, animated: true });
    }
  }, [currentStep]);

  const userPos: [number, number] = [currentPos.lat, currentPos.lng];
  const currentInstruction = route?.steps[currentStep];

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <GradientView horizontal style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate" size={16} color="#fff" />
          <View style={{ flex: 1 }}>
            {currentInstruction ? (
              <>
                <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
                  {currentInstruction.instruction}
                </ThemedText>
                <ThemedText style={styles.headerSub}>
                  {currentInstruction.distance}
                  {route ? `  ·  Total: ${route.distanceKm} km ~${route.durationMin} min` : ''}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="smallBold" style={styles.headerTitle}>{businessName}</ThemedText>
                {route && <ThemedText style={styles.headerSub}>{route.distanceKm} km · ~{route.durationMin} min</ThemedText>}
                {loading && <ThemedText style={styles.headerSub}>Calculating route…</ThemedText>}
                {error && <ThemedText style={styles.headerSub}>Could not calculate route</ThemedText>}
              </>
            )}
          </View>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Close</ThemedText>
        </Pressable>
      </GradientView>

      {/* Map */}
      <View style={styles.map}>
        {loading && (
          <View style={[styles.overlay, { backgroundColor: resolved === 'dark' ? 'rgba(3,10,6,0.7)' : 'rgba(255,255,255,0.7)' }]}>
            <ActivityIndicator color={theme.brand} size="large" />
          </View>
        )}
        <MapContainer center={userPos} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={TILES[resolved]} attribution={ATTR} />

          {/* Live user position — pulsing blue dot */}
          <Marker position={userPos} icon={userDot()}>
            <Popup><span style={{ fontSize: 12 }}>You are here</span></Popup>
          </Marker>

          {/* Destination — emerald teardrop pin */}
          <Marker position={[to.lat, to.lng]} icon={teardrop('#059669')}>
            <Popup><span style={{ fontSize: 12 }}>{businessName}</span></Popup>
          </Marker>

          {/* Route */}
          {route && <Polyline positions={route.coords} color="#059669" weight={5} opacity={0.9} />}

          {/* Follow user when tracking, else fit full route */}
          {tracking ? <TrackUser pos={userPos} /> : route && <FitBounds from={userPos} to={[to.lat, to.lng]} />}
        </MapContainer>
      </View>

      {/* Turn-by-turn list */}
      <View style={[styles.steps, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {loading && <View style={styles.center}><ActivityIndicator color={theme.brand} /></View>}
        {error && <View style={styles.center}><ThemedText themeColor="textSecondary">Could not load directions.</ThemedText></View>}
        {route && (
          <ScrollView ref={stepListRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepsList}>
            {route.steps.map((step, i) => {
              const active = i === currentStep;
              return (
                <View
                  key={i}
                  style={[
                    styles.stepRow,
                    { borderBottomColor: theme.border },
                    active && { backgroundColor: theme.backgroundElement },
                    i === route.steps.length - 1 && { borderBottomWidth: 0 },
                  ]}>
                  <View style={[styles.iconWrap, { backgroundColor: active ? theme.brand : theme.backgroundElement }]}>
                    <Ionicons name={step.icon} size={15} color={active ? '#fff' : theme.brand} />
                  </View>
                  <ThemedText
                    type="small"
                    style={[styles.stepText, active && { fontWeight: '700', color: theme.text }]}>
                    {step.instruction}
                  </ThemedText>
                  {step.distance !== '0 m' && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.stepDist}>
                      {step.distance}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerTitle: { color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12 },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  map: { flex: 6, position: 'relative' },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { flex: 4, borderTopWidth: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepsList: { paddingVertical: Spacing.one },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { flex: 1, fontSize: 13 },
  stepDist: { fontSize: 12, flexShrink: 0 },
});
