import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { FiNavigation, FiMapPin, FiTruck, FiSearch, FiCompass, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Sleek Custom Leaflet Markers for Uber-Style Tracking
const customerIcon = new L.DivIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(201, 162, 39, 0.4); animation: ping 1.8s infinite; cubic-bezier(0, 0, 0.2, 1);"></div>
      <div style="position: relative; width: 30px; height: 30px; margin: 3px; border-radius: 50%; background: #C9A227; border: 3px solid #000; box-shadow: 0 0 15px rgba(201, 162, 39, 0.8); display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 14px;">
        📍
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const adminDriverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `
    <div style="position: relative; width: 40px; height: 40px;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: ping 2s infinite;"></div>
      <div style="position: relative; width: 34px; height: 34px; margin: 3px; border-radius: 50%; background: #1D4ED8; border: 3px solid #FFF; box-shadow: 0 0 15px rgba(59, 130, 246, 0.9); display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 16px;">
        🏎️
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

// Map Click Listener to fine-tune pinpoint coordinates
const MapClickListener: React.FC<{ onLocationSelected: (lat: number, lng: number) => void }> = ({ onLocationSelected }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to dynamically fit bounds or re-center
const MapAutoRecenter: React.FC<{ customerCoords: [number, number]; adminCoords: [number, number] | null }> = ({
  customerCoords,
  adminCoords,
}) => {
  const map = useMap();
  useEffect(() => {
    if (adminCoords) {
      const bounds = L.latLngBounds([customerCoords, adminCoords]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      map.setView(customerCoords, 15);
    }
  }, [customerCoords, adminCoords, map]);

  return null;
};

export const LiveMapTracker: React.FC<LiveMapTrackerProps> = ({
  orderId,
  initialCustomerLat = 5.6037, // Default Accra
  initialCustomerLng = -0.1870,
  customerName,
  fullAddress,
  city = 'Accra',
  region = 'Greater Accra',
}) => {
  const [customerCoords, setCustomerCoords] = useState<[number, number]>([initialCustomerLat, initialCustomerLng]);
  const [adminCoords, setAdminCoords] = useState<[number, number] | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [distanceKm, setDistanceKm] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationName, setLocationName] = useState<string>('Detecting exact street location...');

  // Calculate distance in km & ETA in minutes (avg 35 km/h urban speed)
  const calculateDistanceAndEta = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    const kmStr = dist < 1 ? `${Math.round(dist * 1000)} meters` : `${dist.toFixed(2)} km`;
    setDistanceKm(kmStr);

    // Estimate ETA (assuming avg driving speed 35 km/h + 5 mins buffer)
    const mins = Math.max(3, Math.round((dist / 35) * 60 + 5));
    setEtaMinutes(mins);
  }, []);

  // 1. Precise OpenStreetMap Nominatim Geocoding for Customer Address
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
        toast.success(`📍 Precise location resolved: ${data[0].display_name.slice(0, 45)}...`);

        if (adminCoords) {
          calculateDistanceAndEta(adminCoords[0], adminCoords[1], lat, lon);
        }
      } else {
        console.warn('Geocoding query returned no results for:', queryStr);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, [adminCoords, calculateDistanceAndEta]);

  // Initial Auto-Geocoding on Mount if initial coords are default
  useEffect(() => {
    if (initialCustomerLat === 5.6037 && initialCustomerLng === -0.1870) {
      const searchTarget = fullAddress || `${city}, ${region}, Ghana`;
      geocodeAddress(searchTarget);
    } else {
      setCustomerCoords([initialCustomerLat, initialCustomerLng]);
    }
  }, [initialCustomerLat, initialCustomerLng, fullAddress, city, region, geocodeAddress]);

  // 2. High-Accuracy Continuous Live GPS Tracking (watchPosition)
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setAdminCoords([lat, lng]);
          calculateDistanceAndEta(lat, lng, customerCoords[0], customerCoords[1]);
        },
        (err) => console.log('Driver location watch error:', err?.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [customerCoords, calculateDistanceAndEta]);

  // 3. Socket.io Real-Time Live Uber-Style Customer Movement Stream
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('⚡ [Uber Map Engine] WebSockets connected.');
    });

    socket.on(`order:location:${orderId}`, (data: { latitude: number; longitude: number }) => {
      console.log('📍 [Uber Stream Movement]:', data);
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

  // Turn-by-Turn Navigation Links
  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${customerCoords[0]},${customerCoords[1]}`;
  const wazeNavUrl = `https://waze.com/ul?ll=${customerCoords[0]},${customerCoords[1]}&navigate=yes`;

  return (
    <div className="bg-black border border-gold-500/30 rounded-sm p-4 space-y-4 shadow-2xl font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-gold-500 text-xs font-mono font-bold uppercase tracking-wider">
          <FiTruck size={16} /> Advanced Uber-Grade Live Delivery Map Engine
        </div>
        <div className="flex items-center gap-2">
          {isLiveStreaming ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-green-500/20 border border-green-500 text-green-400 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-green-400 rounded-full" /> LIVE UBER STREAM ACTIVE
            </span>
          ) : (
            <span className="text-[10px] font-mono bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2.5 py-1 rounded-full">
              GPS Fixed Pin
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Geocoding Search & Fine-Tune Bar */}
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
            placeholder="Type any landmark, digital address, or street (e.g. Spintex Road, Accra)..."
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
          <FiCompass size={13} /> {isGeocoding ? 'Locating...' : 'Find GPS'}
        </button>
      </div>

      {/* Uber Metrics Bar: Distance, ETA, Target */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-950 p-3 rounded border border-gray-900 font-mono text-xs">
        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Customer Target</span>
          <span className="text-gold-400 font-bold flex items-center gap-1 text-sm truncate">
            <FiMapPin size={13} /> {customerName}
          </span>
          <span className="text-[10px] text-gray-400 block truncate">{locationName}</span>
        </div>

        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Distance To Customer</span>
          <span className="text-white font-bold flex items-center gap-1 text-sm">
            <FiNavigation size={13} className="text-blue-400" /> {distanceKm || 'Calculating...'}
          </span>
        </div>

        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Estimated Arrival (ETA)</span>
          <span className="text-green-400 font-bold flex items-center gap-1 text-sm">
            ⏱️ {etaMinutes ? `~${etaMinutes} mins` : 'Calculating...'}
          </span>
        </div>
      </div>

      {/* Leaflet Map with CartoDB Dark Matter Luxury Tiles */}
      <div className="w-full h-88 rounded overflow-hidden border border-gold-500/30 relative shadow-2xl">
        <MapContainer
          center={customerCoords}
          zoom={15}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '350px', backgroundColor: '#09090b' }}
        >
          {/* CartoDB Dark Matter Luxury Dark Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Map Click Event Listener */}
          <MapClickListener
            onLocationSelected={(lat, lng) => {
              setCustomerCoords([lat, lng]);
              toast.success(`📍 Pinpoint updated to: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              if (adminCoords) calculateDistanceAndEta(adminCoords[0], adminCoords[1], lat, lng);
            }}
          />

          {/* Customer Uber Target Marker */}
          <Marker position={customerCoords} icon={customerIcon} draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setCustomerCoords([position.lat, position.lng]);
                toast.success(`📍 Custom position saved: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`);
                if (adminCoords) calculateDistanceAndEta(adminCoords[0], adminCoords[1], position.lat, position.lng);
              },
            }}
          >
            <Popup>
              <div className="text-xs font-sans text-black">
                <strong>📍 {customerName} (Destination)</strong>
                <br />
                Coordinates: {customerCoords[0].toFixed(5)}, {customerCoords[1].toFixed(5)}
                <br />
                <span className="text-[10px] text-gray-600">Drag marker to adjust exact building entrance</span>
              </div>
            </Popup>
          </Marker>

          {/* Admin / Driver Live Location Marker */}
          {adminCoords && (
            <Marker position={adminCoords} icon={adminDriverIcon}>
              <Popup>
                <div className="text-xs font-sans text-black">
                  <strong>🏎️ J&J Delivery Hub / Driver</strong>
                  <br />
                  Your Live GPS Position
                </div>
              </Popup>
            </Marker>
          )}

          {/* Uber-Style Glowing Route Line */}
          {adminCoords && (
            <Polyline
              positions={[adminCoords, customerCoords]}
              color="#C9A227"
              weight={5}
              opacity={0.9}
              dashArray="8, 10"
            />
          )}

          <MapAutoRecenter customerCoords={customerCoords} adminCoords={adminCoords} />
        </MapContainer>
      </div>

      {/* 1-Click Turn-by-Turn Navigation Action Buttons */}
      <div className="flex gap-3 flex-wrap pt-1">
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors shadow-md flex-1 justify-center"
        >
          <FiExternalLink size={14} /> Open Google Maps Live Navigation
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
