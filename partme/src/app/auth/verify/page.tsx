"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

function VerifyForm() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setCode(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        return;
      }

      // Store user info
      localStorage.setItem("partme-token", data.token);
      localStorage.setItem("partme-user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-tight mb-2">Verify Email</h1>
          <p className="text-sm opacity-50 font-geist">
            We sent a 6-digit code to{" "}
            <span className="text-accent">{email}</span>
          </p>
        </div>

        <div className="card-flashlight p-8">
          <div className="relative z-10">
            <div className="flex justify-center gap-3 mb-6">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-medium bg-bark/5 border border-bark/10 rounded-xl transition-colors focus:border-accent/50"
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 text-center">
                {error}
              </div>
            )}

            {loading && (
              <p className="text-center text-sm opacity-50 font-geist">Verifying...</p>
            )}

            <p className="text-center text-xs opacity-30 mt-6 font-geist">
              Check your spam folder if you don&apos;t see the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center pt-16">
          <p className="text-sm opacity-50">Loading...</p>
        </div>
      }>
        <VerifyForm />
      </Suspense>
    </>
  );
}
