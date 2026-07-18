import { useSyncExternalStore } from "react";

import { connectivity, type ConnectivityState } from "@/offline/connectivity";

/**
 * Subscribe a component to the app's connectivity state.
 *
 * Backed by `useSyncExternalStore`, so it stays consistent across concurrent
 * renders and shares a single heartbeat loop for the whole app (the underlying
 * service starts lazily on first subscription).
 *
 * @example
 * const { state, isOnline, isOffline } = useConnectivity();
 */
export interface UseConnectivityResult {
  state: ConnectivityState;
  /** Network is usable for sync (online or poor). */
  isReachable: boolean;
  isOnline: boolean;
  isOffline: boolean;
  isPoor: boolean;
  isReconnecting: boolean;
}

export function useConnectivity(): UseConnectivityResult {
  const state = useSyncExternalStore(
    (onChange) => connectivity.subscribe(onChange),
    () => connectivity.getState(),
    () => "online" as ConnectivityState, // SSR/first-paint default: assume usable
  );

  return {
    state,
    isReachable: state === "online" || state === "poor",
    isOnline: state === "online",
    isOffline: state === "offline",
    isPoor: state === "poor",
    isReconnecting: state === "reconnecting",
  };
}
