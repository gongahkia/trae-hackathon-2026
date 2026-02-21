"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("splashShown")) return;
    sessionStorage.setItem("splashShown", "1");
    setVisible(true);
    const t1 = setTimeout(() => setFading(true), 1800);
    const t2 = setTimeout(() => setVisible(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;
  return (
    <div
      style={{ transition: "opacity 0.7s ease" }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${fading ? "opacity-0" : "opacity-100"}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#fffcf6]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Learned logo" className="relative w-40 h-40 object-contain rounded-2xl shadow-lg" />
    </div>
  );
}
