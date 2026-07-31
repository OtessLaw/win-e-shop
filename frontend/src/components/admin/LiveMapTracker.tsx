import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { FiNavigation, FiMapPin, FiTruck, FiSearch, FiCompass, FiExternalLink, FiCrosshair, FiTarget } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Custom Leaflet Markers
const customerIcon = new L.DivIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="position: relative; width: 38px; height: 38px;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(201, 162, 39, 0.4); animation: ping 1.8s infinite;"></div>
      <div style="position: relative; width: 32px; height: 32px; margin: 3px; border-radius: 50%; background: #C9A227; border: 3px solid #000; box-shadow: 0 0 15px rgba(201, 162, 39, 0.9); display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 15px;">
        📍
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const adminDriverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `
    <div style="position: relative; width: 42px; height: 42px;">
      <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 2s infinite;"></div>
      <div style="position: relative; width: 36px; height: 36px; margin: 3px; border-radius: 50%; background: #2563EB; border: 3px solid #FFF; box-shadow: 0 0 15px rgba(59, 130, 246, 0.9); display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 17px;">
        🏎️
      </div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

interface LiveMapTrackerProps {
  orderId: string;
  initialCustomerLat?: number;
  initialCustomerLng?: number;
  customerName: string;
  fullAddress?: string;
  city?: string;
  region?: string;
}

const MapClickListener: React.FC<{ onLocationSelected: (lat: number, lng: number) => void }> = ({ onLocationSelected }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapAutoRecenter: React.FC<{ customerCoords: [number, number]; adminCoords: [number, number] | null }> = ({
  customerCoords,
  adminCoords,
}) => {
  const map = useMap();
  useEffect(() => {
    if (adminCoords) {
      const bounds = L.latLngBounds([customerCoords, adminCoords]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 19 });
    } else {
      map.setView(customerCoords, 17);
    }
  }, [customerCoords, adminCoords, map]);

  return null;
};

export const LiveMapTracker: React.FC<LiveMapTrackerProps> = ({
  orderId,
  initialCustomerLat = 5.6037,
  initialCustomerLng = -0.1870,
  customerName,
  fullAddress,
  city = 'Accra',
  region = 'Greater Accra',
}) => {
  const [customerCoords, setCustomerCoords] = useState<[number, number]>([initialCustomerLat, initialCustomerLng]);
  const [adminCoords, setAdminCoords] = useState<[number, number] | null>(null);
  const [adminAccuracy, setAdminAccuracy] = useState<number | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  
  const [distanceText, setDistanceText] = useState<string>('Calculating...');
  const [proximityLabel, setProximityLabel] = useState<string>('Detecting Proximity...');
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationName, setLocationName] = useState<string>('Determining exact location...');

  // High Precision Haversine Distance Calculation (Meter level precision)
  const calculateDistanceAndEta = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of Earth in METERS
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;

    if (meters < 15) {
      setDistanceText(`${Math.round(meters)} meters`);
      setProximityLabel('🏠 Same Room / Building');
      setEtaMinutes(1);
    } else if (meters < 120) {
      setDistanceText(`${Math.round(meters)} meters`);
      setProximityLabel('🏡 Next Door / Opposite House');
      setEtaMinutes(2);
    } else if (meters < 1000) {
      setDistanceText(`${Math.round(meters)} meters`);
      setProximityLabel('🚗 Same Neighborhood');
      setEtaMinutes(Math.max(3, Math.round((meters / 1000 / 30) * 60)));
    } else {
      const km = (meters / 1000).toFixed(2);
      setDistanceText(`${km} km`);
      setProximityLabel('🚘 Live Delivery Route');
      setEtaMinutes(Math.max(4, Math.round((meters / 1000 / 35) * 60 + 3)));
    }
  }, []);

  // Fetch Admin's Hardware Device GPS Position with High Precision
  const fetchAdminHardwareGPS = useCallback(() => {
    if ('geolocation' in navigator) {
      toast.loading('🎯 Locking onto hardware GPS sensor...', { id: 'gps-lock' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy);

          setAdminCoords([lat, lng]);
          setAdminAccuracy(accuracy);
          calculateDistanceAndEta(lat, lng, customerCoords[0], customerCoords[1]);

          toast.success(`🎯 Hardware GPS Locked! Accuracy: ±${accuracy}m`, { id: 'gps-lock' });
        },
        (err) => {
          toast.error(`GPS Error: ${err.message}. Please enable location permissions.`, { id: 'gps-lock' });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
  }, [customerCoords, calculateDistanceAndEta]);

  // Geocoding via Nominatim
  const geocodeAddress = useCallback(async (queryStr: string) => {
    setIsGeocoding(true);
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&countrycodes=gh&limit=1`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'JJVintage-ECommerce-App' },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCustomerCoords([lat, lon]);
        setLocationName(data[0].display_name);
        toast.success(`📍 Precise location updated: ${data[0].display_name.slice(0, 45)}...`);

        if (adminCoords) {
          calculateDistanceAndEta(adminCoords[0], adminCoords[1], lat, lon);
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, [adminCoords, calculateDistanceAndEta]);

  // Initial load: Get Hardware GPS and Geocode
  useEffect(() => {
    fetchAdminHardwareGPS();
    if (initialCustomerLat === 5.6037 && initialCustomerLng === -0.1870) {
      const searchTarget = fullAddress || `${city}, ${region}, Ghana`;
      geocodeAddress(searchTarget);
    } else {
      setCustomerCoords([initialCustomerLat, initialCustomerLng]);
    }
  }, [fetchAdminHardwareGPS, initialCustomerLat, initialCustomerLng, fullAddress, city, region, geocodeAddress]);

  // Socket.io Real-Time Live Uber Stream
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('⚡ [Uber Map Engine] WebSockets active.');
    });

    socket.on(`order:location:${orderId}`, (data: { latitude: number; longitude: number }) => {
      console.log('📍 [Uber Movement Stream]:', data);
      setCustomerCoords([data.latitude, data.longitude]);
      setIsLiveStreaming(true);
      if (adminCoords) {
        calculateDistanceAndEta(adminCoords[0], adminCoords[1], data.latitude, data.longitude);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, adminCoords, calculateDistanceAndEta]);

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${customerCoords[0]},${customerCoords[1]}`;
  const wazeNavUrl = `https://waze.com/ul?ll=${customerCoords[0]},${customerCoords[1]}&navigate=yes`;

  return (
    <div className="bg-black border border-gold-500/30 rounded-sm p-4 space-y-4 shadow-2xl font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-gold-500 text-xs font-mono font-bold uppercase tracking-wider">
          <FiTruck size={16} /> Micro-Precision Live Location Engine
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchAdminHardwareGPS}
            className="bg-blue-600/30 hover:bg-blue-600 text-blue-300 border border-blue-500/40 text-[10px] font-mono px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <FiTarget size={12} /> Re-Lock Hardware GPS
          </button>

          {isLiveStreaming ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-green-500/20 border border-green-500 text-green-400 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-green-400 rounded-full" /> LIVE STREAM ACTIVE
            </span>
          ) : (
            <span className="text-[10px] font-mono bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2.5 py-1 rounded-full">
              GPS Fixed
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Geocoding Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                geocodeAddress(searchQuery.trim());
              }
            }}
            placeholder="Type street, landmark, or Ghana digital address (e.g. Spintex, East Legon)..."
            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 pl-9 text-xs text-white focus:border-gold-500 outline-none"
          />
          <FiSearch size={14} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={() => searchQuery.trim() && geocodeAddress(searchQuery.trim())}
          disabled={isGeocoding || !searchQuery.trim()}
          className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold text-xs px-4 py-2 rounded flex items-center gap-1.5 transition-colors"
        >
          <FiCompass size={13} /> {isGeocoding ? 'Locating...' : 'Search'}
        </button>
      </div>

      {/* Precision Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-950 p-3 rounded border border-gray-900 font-mono text-xs">
        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Customer Destination</span>
          <span className="text-gold-400 font-bold flex items-center gap-1 text-sm truncate">
            <FiMapPin size={13} /> {customerName}
          </span>
          <span className="text-[10px] text-gray-400 block truncate">{locationName}</span>
        </div>

        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Distance & Proximity</span>
          <span className="text-white font-bold text-sm block">
            {distanceText}
          </span>
          <span className="text-[10px] text-gold-400 block font-bold">
            {proximityLabel}
          </span>
        </div>

        <div>
          <span className="text-gray-500 text-[10px] block uppercase">GPS Hardware Accuracy</span>
          <span className="text-green-400 font-bold text-sm block">
            {adminAccuracy ? `±${adminAccuracy}m Accuracy` : 'Detecting Sensor...'}
          </span>
          <span className="text-[10px] text-gray-400 block">
            {etaMinutes ? `Estimated Arrival: ~${etaMinutes} mins` : ''}
          </span>
        </div>
      </div>

      {/* CartoDB Dark Matter Luxury Leaflet Map */}
      <div className="w-full h-88 rounded overflow-hidden border border-gold-500/30 relative shadow-2xl">
        <MapContainer
          center={customerCoords}
          zoom={18}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '370px', backgroundColor: '#09090b' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapClickListener
            onLocationSelected={(lat, lng) => {
              setCustomerCoords([lat, lng]);
              toast.success(`📍 Pinpoint placed: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
              if (adminCoords) calculateDistanceAndEta(adminCoords[0], adminCoords[1], lat, lng);
            }}
          />

          {/* Customer Location Pin */}
          <Marker
            position={customerCoords}
            icon={customerIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                setCustomerCoords([pos.lat, pos.lng]);
                toast.success(`📍 Exact door pin saved: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
                if (adminCoords) calculateDistanceAndEta(adminCoords[0], adminCoords[1], pos.lat, pos.lng);
              },
            }}
          >
            <Popup>
              <div className="text-xs font-sans text-black">
                <strong>📍 {customerName} (Customer Pin)</strong>
                <br />
                {customerCoords[0].toFixed(6)}, {customerCoords[1].toFixed(6)}
                <br />
                <span className="text-[10px] text-gray-600">Click or drag pin to exact room/door entrance</span>
              </div>
            </Popup>
          </Marker>

          {/* Admin Driver Location Marker + Accuracy Circle */}
          {adminCoords && (
            <>
              <Marker position={adminCoords} icon={adminDriverIcon}>
                <Popup>
                  <div className="text-xs font-sans text-black">
                    <strong>🏎️ Your Live Hardware Location</strong>
                    <br />
                    Accuracy: ±{adminAccuracy || 10} meters
                  </div>
                </Popup>
              </Marker>

              {adminAccuracy && (
                <Circle
                  center={adminCoords}
                  radius={adminAccuracy}
                  pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.15, weight: 1 }}
                />
              )}
            </>
          )}

          {/* Uber Connecting Line */}
          {adminCoords && (
            <Polyline
              positions={[adminCoords, customerCoords]}
              color="#C9A227"
              weight={5}
              opacity={0.9}
              dashArray="6, 8"
            />
          )}

          <MapAutoRecenter customerCoords={customerCoords} adminCoords={adminCoords} />
        </MapContainer>
      </div>

      {/* Navigation Shortcuts */}
      <div className="flex gap-3 flex-wrap pt-1">
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-md flex-1 justify-center"
        >
          <FiExternalLink size={14} /> Open Google Maps Navigation
        </a>

        <a
          href={wazeNavUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-md flex-1 justify-center"
        >
          <FiExternalLink size={14} /> Open Live Waze Navigation
        </a>
      </div>

    </div>
  );
};

export default LiveMapTracker;
