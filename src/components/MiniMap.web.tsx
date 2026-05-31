import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useAppTheme } from '@/context/app-theme';

function useLeafletCSS() {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
}

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTR = '© <a href="https://carto.com/attributions" target="_blank">CARTO</a>';

function pin(color: string) {
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

export interface MiniMapProps {
  lat: number;
  lng: number;
  color?: string;
  height?: number;
}

export function MiniMap({ lat, lng, color = '#059669', height = 180 }: MiniMapProps) {
  useLeafletCSS();
  const { resolved } = useAppTheme();

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
      style={{ height, width: '100%', borderRadius: 10 }}>
      <TileLayer url={TILES[resolved]} attribution={ATTR} />
      <Marker position={[lat, lng]} icon={pin(color)} />
    </MapContainer>
  );
}
