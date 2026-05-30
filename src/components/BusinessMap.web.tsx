import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Business } from '@/services/businesses';
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

const CATEGORY_COLOR: Record<string, string> = {
  spaza:        '#F97316',
  hair_salon:   '#A855F7',
  car_wash:     '#3B82F6',
  food_vendor:  '#EF4444',
  phone_repair: '#EAB308',
  tailor:       '#10B981',
};

// Pulsing blue dot — "you are here"
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

// Teardrop pin per category colour
function teardrop(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:26px;height:34px;">
        <div style="
          width:26px;height:26px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:2.5px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.25);
        "></div>
        <div style="
          position:absolute;bottom:0;left:50%;
          transform:translateX(-50%);
          width:6px;height:6px;
          background:${color};
          border-radius:50%;
          opacity:0.3;
        "></div>
      </div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  });
}

export interface BusinessMapProps {
  businesses: (Business & { distance_meters?: number })[];
  userLocation: { lat: number; lng: number } | null;
}

export function BusinessMap({ businesses, userLocation }: BusinessMapProps) {
  useLeafletCSS();
  const { resolved } = useAppTheme();
  const tile = TILES[resolved];
  const center = userLocation ?? { lat: -26.2678, lng: 27.8589 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}>
      <TileLayer url={tile.url} attribution={tile.attribution} />

      {/* Pulsing user location dot */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userDot()}>
          <Popup><span style={{ fontSize: 12 }}>You are here</span></Popup>
        </Marker>
      )}

      {/* Teardrop pins per category */}
      {businesses.map(biz => (
        <Marker
          key={biz.id}
          position={[biz.latitude, biz.longitude]}
          icon={teardrop(CATEGORY_COLOR[biz.category] ?? '#059669')}>
          <Popup>
            <strong style={{ fontSize: 13 }}>{biz.name}</strong>
            <br />
            <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>
              {biz.category.replace(/_/g, ' ')}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
