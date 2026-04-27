"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("partme-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("partme-user");
    localStorage.removeItem("partme-token");
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-xl border-b border-bark/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-3 h-3 bg-accent rounded-full" />
            <div className="sonar-ring text-accent" />
          </div>
          <span className="text-xl font-light tracking-tight">Partme</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
              >
                Dashboard
              </Link>
              <span className="text-sm opacity-40">|</span>
              <span className="text-sm font-medium opacity-60">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm bg-bark/5 hover:bg-bark/10 px-4 py-2 rounded-full transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm bg-bark text-cream px-5 py-2 rounded-full hover:scale-105 transition-transform"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
