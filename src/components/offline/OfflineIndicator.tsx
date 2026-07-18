import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, RefreshCw, TriangleAlert, Wifi } from "lucide-react";

import { db } from "@/offline/db";
import { META_KEYS } from "@/offline/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { cn } from "@/lib/utils";

/**
 * A subtle, non-blocking connectivity/sync indicator mounted once at the app
 * root. It stays out of the way: nothing shows while the app is healthy and has
 * no pending work; it only surfaces when the user genuinely benefits from
 * knowing (offline, reconnecting, weak signal, or changes waiting to sync), and
 * flashes a brief "Back online" reassurance on recovery.
 *
 * Pending count reads live from the sync queue via Dexie's `useLiveQuery`, so it
 * will reflect real queued mutations once the repository layer (Phase 3) starts
 * enqueuing them. Until then it is simply always zero — harmless.
 */
const FLASH_MS = 2200;

export default function OfflineIndicator() {
  const { state } = useConnectivity();
  const pendingCount = useLiveQuery(
    () => db.sync_queue.where("status").notEqual("done").count(),
    [],
    0,
  );
  const lastSyncedAt = useLiveQuery(
    async () => {
      const record = await db.metadata.get(META_KEYS.lastSyncAt);
      return typeof record?.value === "string" ? record.value : null;
    },
    [],
    null,
  );

  // Show a short "Back online" confirmation when we recover from a bad state.
  const [flashRecovered, setFlashRecovered] = useState(false);
  const wasReachable = useRef(true);

  useEffect(() => {
    const reachable = state === "online" || state === "poor";
    if (reachable && !wasReachable.current) {
      setFlashRecovered(true);
      const timer = setTimeout(() => setFlashRecovered(false), FLASH_MS);
      return () => clearTimeout(timer);
    }
    wasReachable.current = reachable;
  }, [state]);

  const content = resolveContent(state, pendingCount ?? 0, flashRecovered, lastSyncedAt);
  if (!content) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.25rem)" }}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all",
          content.tone,
        )}
      >
        {content.icon}
        <span>{content.label}</span>
      </div>
    </div>
  );
}

interface IndicatorContent {
  label: string;
  icon: JSX.Element;
  tone: string;
}

/** Compact relative age, e.g. "just now", "5m ago", "2h ago", "3d ago". */
function formatAgo(iso: string): string | null {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function resolveContent(
  state: ReturnType<typeof useConnectivity>["state"],
  pendingCount: number,
  flashRecovered: boolean,
  lastSyncedAt: string | null,
): IndicatorContent | null {
  const iconClass = "h-3.5 w-3.5";
  const syncedAgo = lastSyncedAt ? formatAgo(lastSyncedAt) : null;
  // Offline reassurance: pending count is more actionable, so it wins; otherwise
  // show when we were last fully synced.
  const offlineSuffix = pendingCount > 0
    ? `${pendingCount} pending`
    : syncedAgo
      ? `synced ${syncedAgo}`
      : null;

  if (state === "offline") {
    return {
      label: offlineSuffix ? `Offline · ${offlineSuffix}` : "Offline",
      icon: <CloudOff className={iconClass} />,
      tone: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300",
    };
  }

  if (state === "reconnecting") {
    return {
      label: "Reconnecting…",
      icon: <RefreshCw className={cn(iconClass, "animate-spin")} />,
      tone: "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-300",
    };
  }

  if (state === "poor") {
    return {
      label: offlineSuffix ? `Weak signal · ${offlineSuffix}` : "Weak connection",
      icon: <TriangleAlert className={iconClass} />,
      tone: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300",
    };
  }

  // Online: only surface if there is queued work or a fresh recovery to confirm.
  if (pendingCount > 0) {
    return {
      label: `Syncing ${pendingCount}…`,
      icon: <RefreshCw className={cn(iconClass, "animate-spin")} />,
      tone: "border-primary/30 bg-primary/15 text-primary",
    };
  }

  if (flashRecovered) {
    return {
      label: "Back online",
      icon: <Wifi className={iconClass} />,
      tone: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    };
  }

  return null;
}
