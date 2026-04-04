import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");

    let sql: string;
    let params: unknown[];

    if (deviceId) {
      sql = `
        SELECT a.*, d.user_name, d.user_phone, d.imei
        FROM alerts a
        JOIN devices d ON a.device_id = d.id
        WHERE a.device_id = $1
        ORDER BY a.created_at DESC
        LIMIT 100
      `;
      params = [deviceId];
    } else {
      sql = `
        SELECT a.*, d.user_name, d.user_phone, d.imei
        FROM alerts a
        JOIN devices d ON a.device_id = d.id
        ORDER BY a.created_at DESC
        LIMIT 100
      `;
      params = [];
    }

    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, handled_by } = await request.json();
    await query(
      "UPDATE alerts SET is_handled = true, handled_at = NOW(), handled_by = $1 WHERE id = $2",
      [handled_by || "dashboard", id]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
