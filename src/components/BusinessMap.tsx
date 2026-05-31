import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Business } from '@/services/businesses';

export interface BusinessMapProps {
  businesses: (Business & { distance_meters?: number })[];
  userLocation: { lat: number; lng: number } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
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

export function BusinessMap({ businesses, userLocation }: BusinessMapProps) {
  const center = userLocation ?? { lat: -26.2678, lng: 27.8589 };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={!!userLocation}>
      {businesses.map(biz => (
        <Marker
          key={biz.id}
          coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
          title={biz.name}
          description={biz.category.replace('_', ' ')}
          pinColor={CATEGORY_COLORS[biz.category] ?? '#FF6B35'}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
