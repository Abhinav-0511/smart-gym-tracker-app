import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "@/offline/pwa";

createRoot(document.getElementById("root")!).render(<App />);

// Enable the offline app shell (no-op in dev / unsupported browsers).
registerServiceWorker();
