import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "@/offline/pwa";
import { startOfflineSync } from "@/offline/sync";

createRoot(document.getElementById("root")!).render(<App />);

// Enable the offline app shell (no-op in dev / unsupported browsers).
registerServiceWorker();

// Boot the offline sync engine: recover any interrupted sync, flush writes
// queued in a previous session, and keep the durable queue draining as
// connectivity comes and goes.
void startOfflineSync();
