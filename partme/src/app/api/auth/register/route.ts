import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = store.getUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const existingUsername = store.getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Generate verification code
    const code = generateCode();
    const passwordHash = hashPassword(password);

    // Store pending verification
    store.addPending({
      email,
      username,
      passwordHash,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send verification email
    await sendVerificationEmail(email, code);

    return NextResponse.json({
      message: "Verification code sent to your email",
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
