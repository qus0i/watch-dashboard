import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [total] = await query("SELECT COUNT(*) AS total FROM devices");
    const [active] = await query(
      "SELECT COUNT(*) AS active FROM devices WHERE last_connection > NOW() - INTERVAL '10 minutes'"
    );
    const [unhandled] = await query(
      "SELECT COUNT(*) AS unhandled FROM alerts WHERE is_handled = false"
    );
    const [avgHr] = await query(`
      SELECT ROUND(AVG(heart_rate)) AS avg_hr FROM (
        SELECT DISTINCT ON (device_id) heart_rate
        FROM health_data WHERE heart_rate > 0
        ORDER BY device_id, timestamp DESC
      ) latest
    `);
    const [avgSpo2] = await query(`
      SELECT ROUND(AVG(spo2)) AS avg_spo2 FROM (
        SELECT DISTINCT ON (device_id) spo2
        FROM health_data WHERE spo2 > 0
        ORDER BY device_id, timestamp DESC
      ) latest
    `);
    const [totalAlerts] = await query(
      "SELECT COUNT(*) AS total FROM alerts WHERE created_at > NOW() - INTERVAL '24 hours'"
    );

    return NextResponse.json({
      totalDevices: parseInt(total.total),
      activeDevices: parseInt(active.active),
      unhandledAlerts: parseInt(unhandled.unhandled),
      avgHeartRate: parseInt(avgHr?.avg_hr || "0"),
      avgSpo2: parseInt(avgSpo2?.avg_spo2 || "0"),
      alertsToday: parseInt(totalAlerts.total),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
