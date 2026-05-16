import { RefObject, useCallback, useEffect, useState } from "react";

import { UseStoreOptions, useSettings } from "./store";

export function useHover(ref: RefObject<Element>): boolean {
  const [value, setValue] = useState(false);

  const handleMouseEnter = useCallback(() => setValue(true), []);
  const handleMouseLeave = useCallback(() => setValue(false), []);

  useEffect(() => {
    const node = ref.current;

    if (node == null) {
      return;
    }

    node.addEventListener("mouseenter", handleMouseEnter);
    node.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref.current]);

  return value;
}

const mediaQueryList = matchMedia("(prefers-color-scheme: dark)");

export function usePreferDarkMode() {
  const [darkMode, setDarkMode] = useState(mediaQueryList.matches);

  useEffect(() => {
    const listener = (event: MediaQueryListEvent) => {
      setDarkMode(event.matches);
    };

    mediaQueryList.addEventListener("change", listener);

    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, []);

  return darkMode;
}
