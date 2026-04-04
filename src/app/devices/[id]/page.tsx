"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Heart, Droplets, Thermometer, Activity,
  MapPin, Battery, Clock, Footprints, Bell, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import dynamic from "next/dynamic";

const DeviceMap = dynamic(() => import("@/components/DeviceMap"), { ssr: false });

interface DeviceDetail {
  device: {
    id: number; imei: string; user_name: string; user_phone: string;
    sim_number: string; notes: string; device_model: string;
    last_connection: string; is_active: boolean;
    heart_rate: number; sbp: number; dbp: number; spo2: number;
    temp: number; battery_level: number;
    latitude: number; longitude: number; last_health_at: string;
  };
  healthHistory: {
    heart_rate: number; sbp: number; dbp: number; spo2: number;
    temp: number; battery_level: number; timestamp: string;
  }[];
  locations: {
    latitude: number; longitude: number; timestamp: string;
    speed: number; battery_level: number; gps_valid: boolean;
  }[];
  steps: { date: string; step_count: number; roll_frequency: number }[];
  alerts: {
    id: number; alert_type: string; timestamp: string;
    is_handled: boolean; handled_by: string;
  }[];
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevice() {
      try {
        const res = await fetch(`/api/devices/${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch device:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
    const interval = setInterval(fetchDevice, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.device) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Device not found
      </div>
    );
  }

  const { device, healthHistory, locations, steps, alerts } = data;
  const online = device.last_connection && Date.now() - new Date(device.last_connection).getTime() < 10 * 60 * 1000;

  // Prepare chart data (reverse for chronological order)
  const chartData = [...healthHistory].reverse().map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    hr: h.heart_rate || null,
    sbp: h.sbp || null,
    dbp: h.dbp || null,
    spo2: h.spo2 || null,
    temp: h.temp ? Number(h.temp) : null,
  }));

  const healthCards = [
    { label: "Heart Rate", value: device.heart_rate, unit: "bpm", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "SpO2", value: device.spo2, unit: "%", icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Temperature", value: device.temp ? Number(device.temp).toFixed(1) : null, unit: "°C", icon: Thermometer, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Blood Pressure", value: device.sbp && device.dbp ? `${device.sbp}/${device.dbp}` : null, unit: "mmHg", icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Battery", value: device.battery_level, unit: "%", icon: Battery, color: device.battery_level < 20 ? "text-red-400" : "text-green-400", bg: device.battery_level < 20 ? "bg-red-500/10" : "bg-green-500/10" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link href="/devices" className="rounded-lg p-2 hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {device.user_name || "Unnamed Device"}
            </h1>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              online ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
            )}>
              {online ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{device.imei}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1 justify-end">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(device.last_connection)}
          </div>
          {device.user_phone && <p className="mt-1">{device.user_phone}</p>}
        </div>
      </div>

      {/* Health Metric Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {healthCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="text-center card-glow">
              <CardContent className="pt-6">
                <div className={cn("mx-auto mb-2 rounded-lg p-2 w-fit", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {card.value || "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.label} {card.value ? `(${card.unit})` : ""}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate Chart */}
        {chartData.some(d => d.hr) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" /> Heart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[40, 140]} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0.01 15)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="hr" stroke="#f472b6" fill="url(#hrGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* SpO2 Chart */}
        {chartData.some(d => d.spo2) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-400" /> SpO2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0.01 15)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="spo2" stroke="#60a5fa" fill="url(#spo2Grad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Blood Pressure Chart */}
        {chartData.some(d => d.sbp) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" /> Blood Pressure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[50, 180]} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0.01 15)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "#fff" }} />
                  <Line type="monotone" dataKey="sbp" stroke="#a78bfa" strokeWidth={2} dot={false} name="Systolic" />
                  <Line type="monotone" dataKey="dbp" stroke="#818cf8" strokeWidth={2} dot={false} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Temperature Chart */}
        {chartData.some(d => d.temp) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-400" /> Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[34, 42]} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.2 0.01 15)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="temp" stroke="#fb923c" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map & Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Map */}
        {locations.length > 0 && locations[0].latitude !== 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-400" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <DeviceMap locations={locations} deviceName={device.user_name || device.imei} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps & Alerts */}
        <div className="space-y-6">
          {steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 text-green-400" /> Daily Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.slice(0, 7).map((s) => (
                    <div key={s.date} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {s.step_count.toLocaleString()} steps
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-400" /> Device Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-3 border",
                        a.is_handled ? "border-border/30 bg-secondary/20" : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.alert_type}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        a.is_handled ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
                      )}>
                        {a.is_handled ? "Handled" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
