"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal-up").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center group">
        <div className="absolute inset-0 bg-gradient-to-br from-bark/90 via-bark/70 to-bark/90 z-10" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div ref={heroRef} className="relative z-20 text-center text-cream max-w-4xl px-6">
          <div className="reveal-up mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-sm mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full live-dot" />
              <span className="opacity-80">P2P Streaming - Zero Cost, Unlimited Time</span>
            </div>
          </div>

          <h1 className="reveal-up text-5xl md:text-7xl tracking-tighter mb-8 leading-[0.9] font-light">
            Stream Live.<br />
            <span className="text-accent">Directly.</span><br />
            No Middleman.
          </h1>

          <div className="reveal-up flex items-center justify-center gap-3 text-lg opacity-70 mb-12">
            <div className="w-8 h-[1px] bg-cream/40" />
            <p className="font-geist text-sm">Peer-to-peer streaming. Powered by you.</p>
            <div className="w-8 h-[1px] bg-cream/40" />
          </div>

          <div className="reveal-up flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/25"
            >
              Start Streaming
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-cream px-8 py-4 rounded-full text-sm font-medium border border-white/10 transition-all hover:bg-white/20"
            >
              Join a Room
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-40">
          <span className="text-cream text-xs font-geist">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-cream/60 to-transparent" />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-cream">
        <div className="max-w-[88rem] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
            <div>
              <p className="text-sm font-medium tracking-tight opacity-50 mb-4 uppercase font-geist">( How It Works )</p>
              <h2 className="text-5xl md:text-6xl tracking-tighter font-light">
                Pure P2P<br />Architecture
              </h2>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-bark text-cream px-6 py-3 rounded-full text-sm font-medium transition-transform hover:scale-105"
            >
              <span className="font-geist">Get Started Free</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            <div className="lg:col-span-4 max-w-sm">
              <p className="text-xl leading-relaxed opacity-90 mb-8 font-light">
                Video flows directly between browsers. No servers touch your stream.
                Cloudflare only handles the tiny signaling messages to connect peers.
              </p>
              <div className="relative inline-flex text-accent mt-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <div className="sonar-ring" />
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Go Live",
                  desc: "Click one button. Your camera activates and a direct connection request is generated instantly.",
                },
                {
                  step: "02",
                  title: "Signal via Cloudflare",
                  desc: "A lightweight signal connects you to your viewers. No video data ever touches any server.",
                },
                {
                  step: "03",
                  title: "Viewers Connect",
                  desc: "Viewers join the room, receive the offer, and create a direct P2P connection to you.",
                },
                {
                  step: "04",
                  title: "Stream Forever",
                  desc: "Video flows browser-to-browser. No time limits. No bills. No middleman.",
                },
              ].map((item) => (
                <GlassCard key={item.step} className="pb-8 cursor-pointer">
                  <span className="opacity-50 text-xs block mb-3 font-geist">{item.step}</span>
                  <h3 className="text-lg font-medium tracking-tight mb-2">{item.title}</h3>
                  <p className="text-sm opacity-60 leading-relaxed font-geist">{item.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-bark text-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl tracking-tighter font-light mb-4">
              Built for <span className="text-accent">Freedom</span>
            </h2>
            <p className="text-sm opacity-50 font-geist">No credit card. No time limits. No corporate surveillance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Zero Latency", desc: "Direct connection between you and your viewers, no middleman" },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "End-to-End Private", desc: "No server ever sees your video stream data" },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", title: "Truly Free", desc: "No credit card, no time limits, no hidden fees. Stream forever." },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm opacity-50 font-geist leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-cream border-t border-bark/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-light">Partme</span>
          </div>
          <p className="text-xs opacity-40 font-geist">
            Stream directly. No limits. No fees. Just you and your audience.
          </p>
        </div>
      </footer>
    </>
  );
}
