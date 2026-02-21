"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "show" | "fade">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("splashShown")) return;
    sessionStorage.setItem("splashShown", "1");
    setPhase("show");
    const t = setTimeout(() => setPhase("fade"), 3000);
    return () => clearTimeout(t);
  }, []);

  if (phase === "hidden") return null;
  return (
    <div
      style={{
        transition: "opacity 0.7s ease",
        opacity: phase === "fade" ? 0 : 1,
        pointerEvents: phase === "fade" ? "none" : "all",
      }}
      onTransitionEnd={() => setPhase("hidden")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#fffcf6]"
    >
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Learned logo" className="w-40 h-40 object-contain" />
      </div>
    </div>
  );
}
