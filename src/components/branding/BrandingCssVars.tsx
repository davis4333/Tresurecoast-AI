"use client";

import { useEffect } from "react";

export function BrandingCssVars() {
  useEffect(() => {
    let cancelled = false;

    async function apply() {
      try {
        const res = await fetch("/api/org/branding", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const enabled = Boolean(data?.branding?.whiteLabelEnabled);
        const color = data?.branding?.brandPrimaryColor || "#6366f1";
        document.documentElement.style.setProperty("--tca-brand-primary", enabled ? color : "#6366f1");
      } catch {
        // silent fail
      }
    }

    apply();
    return () => { cancelled = true; };
  }, []);

  return null;
}
