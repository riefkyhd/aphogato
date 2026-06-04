"use client";

import { useEffect, useState } from "react";

export function useColumnCount(mode: "gallery" | "dashboard" = "dashboard") {
  const [count, setCount] = useState(2);

  useEffect(() => {
    function update() {
      if (mode === "gallery") {
        // Fewer columns → wider tiles, easier to judge portraits on client gallery.
        if (window.matchMedia("(min-width: 1024px)").matches) setCount(3);
        else setCount(2);
        return;
      }
      if (window.matchMedia("(min-width: 1024px)").matches) setCount(4);
      else if (window.matchMedia("(min-width: 768px)").matches) setCount(3);
      else setCount(2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mode]);

  return count;
}
