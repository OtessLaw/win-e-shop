import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { FiNavigation, FiMapPin, FiTruck } from 'react-icons/fi';

// Custom Leaflet Markers with Gold & Black styling
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const adminIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LiveMapTrackerProps {
  orderId: string;
  initialCustomerLat?: number;
  initialCustomerLng?: number;
  customerName: string;
}

// Component to dynamically re-center Leaflet map bounds when markers move
const MapAutoRecenter: React.FC<{ customerCoords: [number, number]; adminCoords: [number, number] | null }> = ({
  customerCoords,
  adminCoords,
}) => {
  const map = useMap();
  useEffect(() => {
    if (adminCoords) {
      const bounds = L.latLngBounds([customerCoords, adminCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
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
}) => {
  const [customerCoords, setCustomerCoords] = useState<[number, number]>([initialCustomerLat, initialCustomerLng]);
  const [adminCoords, setAdminCoords] = useState<[number, number] | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [distanceKm, setDistanceKm] = useState<string | null>(null);

  // Calculate distance between two lat/lng points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // 1. Get Admin's current live GPS position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setAdminCoords([lat, lng]);
          const d = calculateDistance(lat, lng, customerCoords[0], customerCoords[1]);
          setDistanceKm(d);
        },
        () => console.log('Admin location permission declined'),
        { enableHighAccuracy: true }
      );
    }
  }, [customerCoords]);

  // 2. Connect to Socket.io for Real-Time Live Uber-style Customer Movement Updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('⚡ [Live Map] WebSockets connected to server.');
    });

    socket.on(`order:location:${orderId}`, (data: { latitude: number; longitude: number }) => {
      console.log('📍 [Live Uber Map Stream] Movement detected:', data);
      setCustomerCoords([data.latitude, data.longitude]);
      setIsLiveStreaming(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return (
    <div className="bg-black border border-gold-500/30 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gold-500 text-xs font-mono font-bold uppercase tracking-wider">
          <FiTruck size={16} /> Customer Live Order GPS Tracker
        </div>
        <div className="flex items-center gap-2">
          {isLiveStreaming ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-green-500/20 border border-green-500 text-green-400 px-2.5 py-0.5 rounded animate-pulse">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> LIVE GPS STREAMING
            </span>
          ) : (
            <span className="text-[10px] font-mono bg-gold-500/10 border border-gold-500/30 text-gold-400 px-2.5 py-0.5 rounded">
              GPS Position Fixed
            </span>
          )}
        </div>
      </div>

      {/* Distance & Info Header Bar */}
      <div className="grid grid-cols-2 gap-2 bg-gray-950 p-2.5 rounded border border-gray-900 font-mono text-xs">
        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Customer Target</span>
          <span className="text-gold-400 font-bold flex items-center gap-1">
            <FiMapPin size={12} /> {customerName}
          </span>
        </div>
        <div>
          <span className="text-gray-500 text-[10px] block uppercase">Direct Distance to Admin</span>
          <span className="text-white font-bold flex items-center gap-1">
            <FiNavigation size={12} className="text-blue-400" /> {distanceKm ? `${distanceKm} km away` : 'Calculating...'}
          </span>
        </div>
      </div>

      {/* Embedded In-Site Leaflet Real-time Map Canvas */}
      <div className="w-full h-80 rounded overflow-hidden border border-gold-500/30 relative">
        <MapContainer
          center={customerCoords}
          zoom={14}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Customer Live Marker */}
          <Marker position={customerCoords} icon={customerIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong>📍 {customerName} (Customer)</strong>
                <br />
                {customerCoords[0].toFixed(5)}, {customerCoords[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>

          {/* Admin Current Location Marker */}
          {adminCoords && (
            <Marker position={adminCoords} icon={adminIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong>🏢 Admin / Store Hub</strong>
                  <br />
                  Your Location
                </div>
              </Popup>
            </Marker>
          )}

          {/* Uber-style Direct Connecting Flight/Route Line */}
          {adminCoords && (
            <Polyline
              positions={[adminCoords, customerCoords]}
              color="#C9A227"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          )}

          <MapAutoRecenter customerCoords={customerCoords} adminCoords={adminCoords} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveMapTracker;
