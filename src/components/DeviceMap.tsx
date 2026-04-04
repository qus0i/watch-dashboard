"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet default marker icons in Next.js
const defaultIcon = L.divIcon({
  html: `<div style="background:#C8102E;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const latestIcon = L.divIcon({
  html: `<div style="background:#C8102E;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(200,16,46,0.5)"></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  battery_level?: number;
  gps_valid?: boolean;
}

interface DeviceMapProps {
  locations: Location[];
  deviceName: string;
}

export default function DeviceMap({ locations, deviceName }: DeviceMapProps) {
  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No location data available
      </div>
    );
  }

  const latest = locations[0];
  const center: [number, number] = [Number(latest.latitude), Number(latest.longitude)];

  const path: [number, number][] = locations
    .filter((l) => l.latitude && l.longitude)
    .map((l) => [Number(l.latitude), Number(l.longitude)]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Path line */}
      {path.length > 1 && (
        <Polyline positions={path} color="#C8102E" weight={3} opacity={0.6} dashArray="8 4" />
      )}

      {/* Latest position marker */}
      <Marker position={center} icon={latestIcon}>
        <Popup>
          <div style={{ color: "#333", fontSize: "13px" }}>
            <strong>{deviceName}</strong>
            <br />
            📍 {Number(latest.latitude).toFixed(5)}, {Number(latest.longitude).toFixed(5)}
            <br />
            🕐 {new Date(latest.timestamp).toLocaleString()}
          </div>
        </Popup>
      </Marker>

      {/* Historical markers */}
      {locations.slice(1, 10).map((loc, i) => (
        <Marker
          key={i}
          position={[Number(loc.latitude), Number(loc.longitude)]}
          icon={defaultIcon}
        >
          <Popup>
            <div style={{ color: "#333", fontSize: "12px" }}>
              🕐 {new Date(loc.timestamp).toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
