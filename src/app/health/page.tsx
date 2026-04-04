"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart, Droplets, Thermometer, Activity, Watch, Loader2, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

interface Device {
  id: number;
  imei: string;
  user_name: string;
  heart_rate: number;
  sbp: number;
  dbp: number;
  spo2: number;
  temp: number;
  battery_level: number;
  last_health_at: string;
}

interface HealthRecord {
  heart_rate: number;
  sbp: number;
  dbp: number;
  spo2: number;
  temp: number;
  battery_level: number;
  timestamp: string;
}

export default function HealthPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [healthData, setHealthData] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      const devs = Array.isArray(data) ? data : [];
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!selectedDevice) return;
    async function fetchHealth() {
      setLoadingChart(true);
      try {
        const res = await fetch(`/api/devices/${selectedDevice}`);
        const data = await res.json();
        setHealthData(data.healthHistory || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchHealth();
  }, [selectedDevice]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selected = devices.find(d => d.id === selectedDevice);
  const chartData = [...healthData].reverse().map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    date: new Date(h.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" }),
    hr: h.heart_rate || null,
    sbp: h.sbp || null,
    dbp: h.dbp || null,
    spo2: h.spo2 || null,
    temp: h.temp ? Number(h.temp) : null,
  }));

  const tooltipStyle = {
    backgroundColor: "oklch(0.2 0.01 15)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: "8px",
    color: "#fff",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Metrics</h1>
          <p className="text-muted-foreground mt-1">Monitor health data across all devices</p>
        </div>

        {/* Device Selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedDevice || ""}
            onChange={(e) => setSelectedDevice(Number(e.target.value))}
            className="rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user_name || d.imei}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Health Summary */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Heart Rate", value: selected.heart_rate, unit: "bpm", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
            { label: "SpO2", value: selected.spo2, unit: "%", icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Temperature", value: selected.temp ? Number(selected.temp).toFixed(1) : null, unit: "°C", icon: Thermometer, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: "Blood Pressure", value: selected.sbp && selected.dbp ? `${selected.sbp}/${selected.dbp}` : null, unit: "mmHg", icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((card) => (
            <Card key={card.label} className="card-glow">
              <CardContent className="pt-6 text-center">
                <div className={cn("mx-auto mb-2 rounded-lg p-2 w-fit", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value || "--"}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Charts */}
      {loadingChart ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.some(d => d.hr) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4 text-pink-400" /> Heart Rate History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="hrGradH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[40, 140]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="hr" stroke="#f472b6" fill="url(#hrGradH)" strokeWidth={2} dot={false} name="BPM" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.some(d => d.spo2) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplets className="h-4 w-4 text-blue-400" /> SpO2 History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="spo2GradH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="spo2" stroke="#60a5fa" fill="url(#spo2GradH)" strokeWidth={2} dot={false} name="SpO2 %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.some(d => d.sbp) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-purple-400" /> Blood Pressure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[50, 180]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="sbp" stroke="#a78bfa" strokeWidth={2} dot={false} name="Systolic" />
                    <Line type="monotone" dataKey="dbp" stroke="#818cf8" strokeWidth={2} dot={false} name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.some(d => d.temp) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="h-4 w-4 text-orange-400" /> Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tempGradH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[34, 42]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="temp" stroke="#fb923c" fill="url(#tempGradH)" strokeWidth={2} dot={false} name="°C" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Health Data Table */}
      {healthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw Health Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Time</th>
                    <th className="pb-3 pr-4 font-medium">HR</th>
                    <th className="pb-3 pr-4 font-medium">BP</th>
                    <th className="pb-3 pr-4 font-medium">SpO2</th>
                    <th className="pb-3 pr-4 font-medium">Temp</th>
                    <th className="pb-3 font-medium">Battery</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.slice(0, 20).map((h, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {new Date(h.timestamp).toLocaleString("en", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn(
                          "font-medium",
                          h.heart_rate > 100 ? "text-red-400" : h.heart_rate < 60 ? "text-yellow-400" : "text-foreground"
                        )}>
                          {h.heart_rate || "--"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-foreground">
                        {h.sbp && h.dbp ? `${h.sbp}/${h.dbp}` : "--"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("font-medium", h.spo2 < 95 ? "text-red-400" : "text-foreground")}>
                          {h.spo2 || "--"}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-foreground">
                        {h.temp ? `${Number(h.temp).toFixed(1)}°C` : "--"}
                      </td>
                      <td className="py-2.5 text-foreground">{h.battery_level || "--"}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
