import { useSyncExternalStore } from "react";

const portraitMq = window.matchMedia("(orientation: portrait)");

export function useIsPortrait(): boolean {
  return useSyncExternalStore(
    (callback) => {
      portraitMq.addEventListener("change", callback);
      return () => portraitMq.removeEventListener("change", callback);
    },
    () => portraitMq.matches,
    () => false,
  );
}
