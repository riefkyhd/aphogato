"use client";

import { useEffect, useState } from "react";

/** Touch-first devices and narrow viewports (coarse pointer or phone-width). */
export function useTouchLike(): boolean {
  const [touchLike, setTouchLike] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setTouchLike(coarse.matches || narrow.matches);
    };

    update();
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  return touchLike;
}
