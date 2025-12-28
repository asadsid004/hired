"use client";

import { useEffect, useEffectEvent, useState } from "react";

const MOBILE_BREAKPOINT = "(min-width: 640px)";

const useMediaQuery = (query: string = MOBILE_BREAKPOINT) => {
  const [matches, setMatches] = useState<boolean | null>(null);

  const updateSize = useEffectEvent((val: boolean) => {
    setMatches(val);
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) updateSize(media.matches);

    const listener = () => setMatches(media.matches);

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [query, matches]);

  return matches;
};

export default useMediaQuery;
