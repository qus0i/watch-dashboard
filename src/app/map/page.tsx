"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Watch, Heart, Battery, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const AllDevicesMap = dynamic(() => import("@/components/AllDevicesMap"), { ssr: false });

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

export default function MapPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(Array.isArray(data) ? data.filter((d: Device) => d.latitude && d.latitude !== 0) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Map */}
      <div className="flex-1 relative">
        <AllDevicesMap devices={devices} selectedId={selected} onSelect={setSelected} />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 border-l border-border bg-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Devices on Map</h2>
          <p className="text-sm text-muted-foreground">{devices.length} with location</p>
        </div>
        <div className="p-2 space-y-1">
          {devices.map((device) => {
            const online = isOnline(device.last_connection);
            return (
              <button
                key={device.id}
                onClick={() => setSelected(device.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                  selected === device.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center",
                    online ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
                  )}>
                    <Watch className="h-4 w-4" />
                  </div>
                  {online && <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {device.user_name || device.imei}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {device.heart_rate > 0 && (
                      <span className="flex items-center gap-0.5 text-pink-400">
                        <Heart className="h-3 w-3" />{device.heart_rate}
                      </span>
                    )}
                    {device.battery_level > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Battery className="h-3 w-3" />{device.battery_level}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {devices.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No devices with location data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
