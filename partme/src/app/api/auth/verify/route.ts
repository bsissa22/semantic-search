import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const pending = store.getPending(email);

    if (!pending) {
      return NextResponse.json(
        { error: "No pending verification found. Please register again." },
        { status: 404 }
      );
    }

    if (Date.now() > pending.expiresAt) {
      store.removePending(email);
      return NextResponse.json(
        { error: "Verification code expired. Please register again." },
        { status: 410 }
      );
    }

    if (pending.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Create user
    store.addUser({
      email: pending.email,
      username: pending.username,
      passwordHash: pending.passwordHash,
      verified: true,
    });

    store.removePending(email);

    // Generate JWT
    const token = signToken({
      email: pending.email,
      username: pending.username,
    });

    const response = NextResponse.json({
      message: "Email verified successfully",
      token,
      user: { email: pending.email, username: pending.username },
    });

    // Set token as HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
