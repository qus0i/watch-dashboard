"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell, Check, Clock, MapPin, Filter, Loader2, AlertTriangle,
  ShieldAlert, UserX, Smartphone, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Alert {
  id: number;
  device_id: number;
  imei: string;
  user_name: string;
  user_phone: string;
  alert_type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  is_handled: boolean;
  handled_at: string;
  handled_by: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const alertIcons: Record<string, typeof Bell> = {
  SOS: ShieldAlert,
  FALL_DOWN: AlertTriangle,
  NOT_WEAR: UserX,
  LOW_BATTERY: Zap,
  REMOVE: Smartphone,
};

const alertColors: Record<string, string> = {
  SOS: "text-red-500 bg-red-500/10",
  FALL_DOWN: "text-orange-500 bg-orange-500/10",
  NOT_WEAR: "text-yellow-500 bg-yellow-500/10",
  LOW_BATTERY: "text-amber-500 bg-amber-500/10",
  REMOVE: "text-blue-500 bg-blue-500/10",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "handled">("all");
  const [handling, setHandling] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAlert = async (id: number) => {
    setHandling(id);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handled_by: "dashboard-admin" }),
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setHandling(null);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === "pending") return !a.is_handled;
    if (filter === "handled") return a.is_handled;
    return true;
  });

  const pendingCount = alerts.filter((a) => !a.is_handled).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount > 0 ? (
              <span className="text-destructive font-medium">{pendingCount} pending alerts</span>
            ) : (
              "All alerts handled"
            )}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "pending", "handled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors capitalize",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">No alerts</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "pending" ? "No pending alerts" : "No alerts recorded yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((alert, i) => {
            const AlertIcon = alertIcons[alert.alert_type] || Bell;
            const colorClass = alertColors[alert.alert_type] || "text-muted-foreground bg-muted";

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "transition-all",
                  !alert.is_handled && "border-destructive/20 shadow-sm shadow-destructive/5"
                )}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {/* Icon */}
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      colorClass
                    )}>
                      <AlertIcon className="h-6 w-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{alert.alert_type}</p>
                        {!alert.is_handled && (
                          <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.user_name || alert.imei}
                        {alert.user_phone && ` · ${alert.user_phone}`}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(alert.timestamp || alert.created_at)}
                        </span>
                        {alert.latitude && alert.latitude !== 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                          </span>
                        )}
                        {alert.is_handled && alert.handled_by && (
                          <span className="text-green-400">
                            Handled by {alert.handled_by}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {!alert.is_handled ? (
                      <button
                        onClick={() => handleAlert(alert.id)}
                        disabled={handling === alert.id}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                      >
                        {handling === alert.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Handle
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 shrink-0">
                        <Check className="h-3 w-3" />
                        Handled
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
