import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export interface MiniMapProps {
  lat: number;
  lng: number;
  color?: string;
  height?: number;
}

export function MiniMap({ lat, lng, color = '#059669', height = 180 }: MiniMapProps) {
  return (
    <MapView
      style={[styles.map, { height }]}
      initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      pointerEvents="none">
      <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor={color} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', borderRadius: 10, overflow: 'hidden' },
});
