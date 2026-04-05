"use client";

import { useEffect, useState, useCallback } from "react";
import { motion,  } from "framer-motion";
import { useRef } from "react";
import {
  Watch, Activity, Bell, Heart, Thermometer,
  Droplets, Signal, Clock, MapPin, ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Stats {
  totalDevices: number;
  activeDevices: number;
  unhandledAlerts: number;
  avgHeartRate: number;
  avgSpo2: number;
  alertsToday: number;
}

interface Device {
  id: number;
  imei: string;
  user_name: string;
  user_phone: string;
  last_connection: string;
  is_active: boolean;
  heart_rate: number;
  sbp: number;
  dbp: number;
  spo2: number;
  temp: number;
  battery_level: number;
  latitude: number;
  longitude: number;
  last_health_at: string;
  step_count: number;
}

interface Alert {
  id: number;
  alert_type: string;
  user_name: string;
  imei: string;
  is_handled: boolean;
  created_at: string;
  timestamp: string;
}

const statCards = [
  { key: "totalDevices", label: "Total Devices", icon: Watch, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "activeDevices", label: "Active Now", icon: Signal, color: "text-green-400", bg: "bg-green-500/10" },
  { key: "unhandledAlerts", label: "Pending Alerts", icon: Bell, color: "text-red-400", bg: "bg-red-500/10" },
  { key: "avgHeartRate", label: "Avg Heart Rate", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10", unit: "bpm" },
];

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

function isOnline(lastConnection: string): boolean {
  if (!lastConnection) return false;
  return Date.now() - new Date(lastConnection).getTime() < 10 * 60 * 1000;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, devicesRes, alertsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/devices"),
        fetch("/api/alerts"),
      ]);
      const [statsData, devicesData, alertsData] = await Promise.all([
        statsRes.json(),
        devicesRes.json(),
        alertsRes.json(),
      ]);
      setStats(statsData);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData.slice(0, 5) : []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time GPS watch monitoring overview</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((sc) => {
          const value = stats ? stats[sc.key as keyof Stats] : 0;
          return (
            <motion.div key={sc.key} variants={itemVariants}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300 card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {sc.label}
                  </CardTitle>
                  <div className={cn("rounded-lg p-2", sc.bg)}>
                    <sc.icon className={cn("h-5 w-5", sc.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {value || 0}
                    </span>
                    {sc.unit && (
                      <span className="text-sm text-muted-foreground">{sc.unit}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Devices Status</CardTitle>
              <Link
                href="/devices"
                className="flex items-center text-sm text-primary hover:underline"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No devices registered yet</p>
                ) : (
                  devices.slice(0, 6).map((device) => {
                    const online = isOnline(device.last_connection);
                    return (
                      <Link key={device.id} href={`/devices/${device.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.01, x: 4 }}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                                online ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                              )}>
                                <Watch className="h-5 w-5" />
                              </div>
                              {online && (
                                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 pulse-active" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {device.user_name || device.imei}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(device.last_connection)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            {device.heart_rate > 0 && (
                              <div className="flex items-center gap-1 text-pink-400">
                                <Heart className="h-4 w-4" />
                                <span>{device.heart_rate}</span>
                              </div>
                            )}
                            {device.spo2 > 0 && (
                              <div className="flex items-center gap-1 text-blue-400">
                                <Droplets className="h-4 w-4" />
                                <span>{device.spo2}%</span>
                              </div>
                            )}
                            {device.temp > 0 && (
                              <div className="flex items-center gap-1 text-orange-400">
                                <Thermometer className="h-4 w-4" />
                                <span>{Number(device.temp).toFixed(1)}°</span>
                              </div>
                            )}
                            {device.latitude && device.latitude !== 0 && (
                              <MapPin className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <Link
                href="/alerts"
                className="flex items-center text-sm text-primary hover:underline"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 border",
                        alert.is_handled
                          ? "border-border/30 bg-secondary/20"
                          : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        alert.is_handled ? "bg-muted" : "bg-destructive/20"
                      )}>
                        <Bell className={cn(
                          "h-4 w-4",
                          alert.is_handled ? "text-muted-foreground" : "text-destructive"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {alert.alert_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.user_name || alert.imei} · {timeAgo(alert.timestamp || alert.created_at)}
                        </p>
                      </div>
                      {!alert.is_handled && (
                        <span className="shrink-0 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          NEW
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Health Overview */}
      {devices.some(d => d.heart_rate > 0) && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {devices.filter(d => d.heart_rate > 0).slice(0, 4).map((device) => {
                  const hrColor = device.heart_rate > 100 ? "text-red-400" : device.heart_rate < 60 ? "text-yellow-400" : "text-green-400";
                  const spo2Color = device.spo2 < 95 ? "text-red-400" : "text-blue-400";
                  return (
                    <Link key={device.id} href={`/devices/${device.id}`}>
                      <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors cursor-pointer">
                        <p className="font-semibold text-foreground mb-3 truncate">
                          {device.user_name || device.imei}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Heart Rate</p>
                            <p className={cn("text-lg font-bold", hrColor)}>
                              {device.heart_rate} <span className="text-xs font-normal">bpm</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">SpO2</p>
                            <p className={cn("text-lg font-bold", spo2Color)}>
                              {device.spo2} <span className="text-xs font-normal">%</span>
                            </p>
                          </div>
                          {device.sbp > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Blood Pressure</p>
                              <p className="text-lg font-bold text-purple-400">
                                {device.sbp}/{device.dbp}
                              </p>
                            </div>
                          )}
                          {device.temp > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Temp</p>
                              <p className="text-lg font-bold text-orange-400">
                                {Number(device.temp).toFixed(1)}°C
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
