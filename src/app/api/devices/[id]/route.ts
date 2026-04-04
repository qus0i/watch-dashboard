import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const device = await queryOne(
      `SELECT d.*,
        h.heart_rate, h.blood_pressure_systolic AS sbp, h.blood_pressure_diastolic AS dbp,
        h.spo2, h.body_temperature AS temp, h.timestamp AS last_health_at, h.battery_level,
        l.latitude, l.longitude, l.timestamp AS last_location_at, l.gps_valid
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT * FROM health_data WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1
      ) h ON true
      LEFT JOIN LATERAL (
        SELECT * FROM locations WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1
      ) l ON true
      WHERE d.id = $1`,
      [id]
    );

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Get recent health history
    const healthHistory = await query(
      `SELECT heart_rate, blood_pressure_systolic AS sbp, blood_pressure_diastolic AS dbp,
        spo2, body_temperature AS temp, battery_level, timestamp
      FROM health_data WHERE device_id = $1
      ORDER BY timestamp DESC LIMIT 100`,
      [id]
    );

    // Get recent locations
    const locations = await query(
      `SELECT latitude, longitude, gps_valid, speed, battery_level, timestamp
      FROM locations WHERE device_id = $1 AND latitude != 0 AND longitude != 0
      ORDER BY timestamp DESC LIMIT 50`,
      [id]
    );

    // Get daily steps
    const steps = await query(
      `SELECT date, step_count, roll_frequency
      FROM daily_steps WHERE device_id = $1
      ORDER BY date DESC LIMIT 30`,
      [id]
    );

    // Get alerts
    const alerts = await query(
      `SELECT id, alert_type, timestamp, latitude, longitude, is_handled, handled_at, handled_by
      FROM alerts WHERE device_id = $1
      ORDER BY created_at DESC LIMIT 20`,
      [id]
    );

    return NextResponse.json({
      device,
      healthHistory,
      locations,
      steps,
      alerts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const d = await request.json();
    await query(
      `UPDATE devices SET user_name=$1, user_phone=$2, sim_number=$3, notes=$4, device_model=$5
       WHERE id=$6`,
      [d.user_name, d.user_phone, d.sim_number, d.notes, d.device_model, id]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM devices WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
