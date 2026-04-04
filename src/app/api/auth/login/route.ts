import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
  ensureDefaultAdmin,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultAdmin();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await queryOne(
      "SELECT * FROM admin_users WHERE username = $1",
      [username]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await query("UPDATE admin_users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = await createToken({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
