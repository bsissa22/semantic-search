"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Redirect to verification page
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-16 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light tracking-tight mb-2">Create Account</h1>
            <p className="text-sm opacity-50 font-geist">Start streaming in seconds</p>
          </div>

          <div className="card-flashlight p-8">
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium opacity-50 mb-2 font-geist uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    className="w-full bg-bark/5 border border-bark/10 rounded-xl px-4 py-3 text-sm placeholder:opacity-30 transition-colors focus:border-accent/30"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium opacity-50 mb-2 font-geist uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-bark/5 border border-bark/10 rounded-xl px-4 py-3 text-sm placeholder:opacity-30 transition-colors focus:border-accent/30"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium opacity-50 mb-2 font-geist uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-bark/5 border border-bark/10 rounded-xl px-4 py-3 text-sm placeholder:opacity-30 transition-colors focus:border-accent/30"
                    placeholder="Min 6 characters"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bark text-cream py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? "Sending verification..." : "Create Account"}
                </button>
              </form>

              <p className="text-center text-xs opacity-40 mt-6 font-geist">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
