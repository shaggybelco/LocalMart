import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { GradientView } from '@/components/GradientView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  if (type === 'fork')  return `Keep ${modifier ?? 'straight'} at the fork`;
  if (type === 'merge') return `Merge ${modifier ?? ''} ${road}`.trim();
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
  coords: { latitude: number; longitude: number }[];
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
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const stepListRef = useRef<ScrollView>(null);

  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPos, setCurrentPos] = useState(from);
  const [currentStep, setCurrentStep] = useState(0);

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
        const coords = (r.geometry?.coordinates ?? []).map(
          ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
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

  // Watch live GPS position
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      loc => {
        const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCurrentPos(pos);

        // Advance step when within 40m of next waypoint
        setCurrentStep(prev => {
          if (!route) return prev;
          const next = route.steps[prev + 1];
          if (!next) return prev;
          return distanceBetween(pos, { lat: next.lat, lng: next.lng }) < 40 ? prev + 1 : prev;
        });

        // Move map camera to follow user
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    ).then(s => { sub = s; });
    return () => { sub?.remove(); };
  }, [route]);

  // Scroll step list to current step
  useEffect(() => {
    stepListRef.current?.scrollTo({ y: currentStep * 54, animated: true });
  }, [currentStep]);

  const currentInstruction = route?.steps[currentStep];
  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;
  const latDelta = Math.abs(from.lat - to.lat) * 1.6 + 0.01;
  const lngDelta = Math.abs(from.lng - to.lng) * 1.6 + 0.01;

  return (
    <View style={styles.container}>
      {/* Gradient header showing current instruction */}
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
                  {route ? `  ·  ${route.distanceKm} km ~${route.durationMin} min` : ''}
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

      {/* Map — follows user */}
      <View style={styles.map}>
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={theme.brand} size="large" />
          </View>
        )}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
          showsUserLocation
          showsCompass>
          <Marker coordinate={{ latitude: currentPos.lat, longitude: currentPos.lng }} title="You" pinColor="#3B82F6" />
          <Marker coordinate={{ latitude: to.lat, longitude: to.lng }} title={businessName} pinColor="#059669" />
          {route && <Polyline coordinates={route.coords} strokeColor="#059669" strokeWidth={4} />}
        </MapView>
      </View>

      {/* Turn-by-turn steps */}
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
                  <ThemedText type="small" style={[styles.stepText, active && { fontWeight: '700' }]}>
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
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
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
