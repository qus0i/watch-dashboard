"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

function createMarkerIcon(online: boolean) {
  const color = online ? "#10b981" : "#6b7280";
  return L.divIcon({
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const selectedIcon = L.divIcon({
  html: `<div style="background:#C8102E;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(200,16,46,0.6)"></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface Device {
  id: number;
  imei: string;
  user_name: string;
  last_connection: string;
  heart_rate: number;
  spo2: number;
  battery_level: number;
  latitude: number;
  longitude: number;
}

function isOnline(lastConnection: string): boolean {
  if (!lastConnection) return false;
  return Date.now() - new Date(lastConnection).getTime() < 10 * 60 * 1000;
}

interface AllDevicesMapProps {
  devices: Device[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function AllDevicesMap({ devices, selectedId, onSelect }: AllDevicesMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Center on Jordan by default
  const defaultCenter: [number, number] = [31.95, 35.93];
  const center: [number, number] = devices.length > 0
    ? [Number(devices[0].latitude), Number(devices[0].longitude)]
    : defaultCenter;

  useEffect(() => {
    if (selectedId && mapRef.current) {
      const device = devices.find((d) => d.id === selectedId);
      if (device) {
        mapRef.current.flyTo([Number(device.latitude), Number(device.longitude)], 16, {
          duration: 1,
        });
      }
    }
  }, [selectedId, devices]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {devices.map((device) => {
        const online = isOnline(device.last_connection);
        const icon = device.id === selectedId ? selectedIcon : createMarkerIcon(online);
        return (
          <Marker
            key={device.id}
            position={[Number(device.latitude), Number(device.longitude)]}
            icon={icon}
            eventHandlers={{ click: () => onSelect(device.id) }}
          >
            <Popup>
              <div style={{ color: "#333", fontSize: "13px", minWidth: "160px" }}>
                <strong>{device.user_name || device.imei}</strong>
                <br />
                {device.heart_rate > 0 && <>❤️ {device.heart_rate} bpm<br /></>}
                {device.spo2 > 0 && <>🫁 {device.spo2}% SpO2<br /></>}
                {device.battery_level > 0 && <>🔋 {device.battery_level}%<br /></>}
                📍 {Number(device.latitude).toFixed(5)}, {Number(device.longitude).toFixed(5)}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
