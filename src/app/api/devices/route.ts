import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        d.id, d.imei, d.user_name, d.user_phone, d.sim_number,
        d.last_connection, d.is_active, d.notes, d.device_model, d.firmware_version,
        h.heart_rate,
        h.blood_pressure_systolic AS sbp,
        h.blood_pressure_diastolic AS dbp,
        h.spo2,
        h.body_temperature AS temp,
        h.timestamp AS last_health_at,
        h.battery_level,
        l.latitude, l.longitude,
        l.timestamp AS last_location_at,
        l.gps_valid,
        s.step_count,
        s.date AS steps_date
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT * FROM health_data
        WHERE device_id = d.id
        ORDER BY timestamp DESC LIMIT 1
      ) h ON true
      LEFT JOIN LATERAL (
        SELECT * FROM locations
        WHERE device_id = d.id
        ORDER BY timestamp DESC LIMIT 1
      ) l ON true
      LEFT JOIN LATERAL (
        SELECT * FROM daily_steps
        WHERE device_id = d.id
        ORDER BY date DESC LIMIT 1
      ) s ON true
      ORDER BY d.last_connection DESC NULLS LAST
    `);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const rows = await query(
      `INSERT INTO devices (imei, user_name, user_phone, sim_number, notes, device_model)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (imei) DO UPDATE SET
         user_name = EXCLUDED.user_name,
         user_phone = EXCLUDED.user_phone,
         sim_number = EXCLUDED.sim_number,
         notes = EXCLUDED.notes,
         device_model = EXCLUDED.device_model
       RETURNING id`,
      [d.imei, d.user_name, d.user_phone, d.sim_number, d.notes, d.device_model]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
