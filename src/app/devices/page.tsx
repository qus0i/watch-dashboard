"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Watch, Search, Plus, X, Heart, Droplets, Thermometer,
  Clock, MapPin, Battery, Signal, Loader2, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Device {
  id: number;
  imei: string;
  user_name: string;
  user_phone: string;
  sim_number: string;
  last_connection: string;
  is_active: boolean;
  notes: string;
  device_model: string;
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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    imei: "", user_name: "", user_phone: "", sim_number: "", notes: "", device_model: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const filtered = devices.filter(
    (d) =>
      d.imei?.toLowerCase().includes(search.toLowerCase()) ||
      d.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.user_phone?.includes(search)
  );

  const openAddForm = () => {
    setEditDevice(null);
    setFormData({ imei: "", user_name: "", user_phone: "", sim_number: "", notes: "", device_model: "" });
    setShowForm(true);
  };

  const openEditForm = (device: Device) => {
    setEditDevice(device);
    setFormData({
      imei: device.imei,
      user_name: device.user_name || "",
      user_phone: device.user_phone || "",
      sim_number: device.sim_number || "",
      notes: device.notes || "",
      device_model: device.device_model || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editDevice) {
        await fetch(`/api/devices/${editDevice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      fetchDevices();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      await fetch(`/api/devices/${id}`, { method: "DELETE" });
      fetchDevices();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Devices</h1>
          <p className="text-muted-foreground mt-1">{devices.length} registered devices</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Add Device
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, IMEI, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-secondary/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Device Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {filtered.map((device, i) => {
          const online = isOnline(device.last_connection);
          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                {/* Status indicator */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  online ? "bg-green-500" : "bg-muted"
                )} />

                <CardHeader className="flex flex-row items-start justify-between pt-5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center",
                      online ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
                    )}>
                      <Watch className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {device.user_name || "Unnamed Device"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {device.imei}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); openEditForm(device); }}
                      className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(device.id); }}
                      className="rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <Link href={`/devices/${device.id}`}>
                  <CardContent className="cursor-pointer">
                    {/* Health Metrics */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <Heart className="h-4 w-4 mx-auto text-pink-400 mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {device.heart_rate || "--"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">bpm</p>
                      </div>
                      <div className="text-center">
                        <Droplets className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {device.spo2 || "--"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">SpO2%</p>
                      </div>
                      <div className="text-center">
                        <Thermometer className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {device.temp ? Number(device.temp).toFixed(1) : "--"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">°C</p>
                      </div>
                      <div className="text-center">
                        <Signal className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {device.sbp && device.dbp ? `${device.sbp}/${device.dbp}` : "--"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">BP</p>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(device.last_connection)}
                      </div>
                      <div className="flex items-center gap-3">
                        {device.battery_level > 0 && (
                          <div className="flex items-center gap-1">
                            <Battery className={cn("h-3 w-3", device.battery_level < 20 ? "text-red-400" : "text-green-400")} />
                            {device.battery_level}%
                          </div>
                        )}
                        {device.latitude && device.latitude !== 0 && (
                          <MapPin className="h-3 w-3 text-green-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Watch className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No devices found</p>
          <p className="text-sm mt-1">
            {search ? "Try a different search term" : "Add your first device to get started"}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editDevice ? "Edit Device" : "Add Device"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">IMEI</label>
                <input
                  type="text"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  disabled={!!editDevice}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground disabled:opacity-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="15-digit IMEI number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">User Name</label>
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.user_phone}
                    onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="+962..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">SIM Number</label>
                  <input
                    type="text"
                    value={formData.sim_number}
                    onChange={(e) => setFormData({ ...formData, sim_number: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="SIM card number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.device_model}
                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Watch model"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.imei}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editDevice ? "Save Changes" : "Add Device"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
