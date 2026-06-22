"use client";

import { useEffect, useState } from "react";

function readColumnCount(mode: "gallery" | "dashboard"): number {
  if (typeof window === "undefined") {
    return mode === "gallery" ? 2 : 2;
  }
  if (mode === "gallery") {
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 480px)").matches) return 2;
    return 1;
  }
  if (window.matchMedia("(min-width: 1024px)").matches) return 4;
  if (window.matchMedia("(min-width: 768px)").matches) return 3;
  return 2;
}

export function useColumnCount(mode: "gallery" | "dashboard" = "dashboard") {
  const [count, setCount] = useState(() => readColumnCount(mode));

  useEffect(() => {
    function update() {
      setCount(readColumnCount(mode));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mode]);

  return count;
}
