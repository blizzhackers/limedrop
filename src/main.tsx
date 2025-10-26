import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ItemPacksDialog from "./components/ItemPacksDialog.tsx";
import { RecentDrops } from "./components/RecentDrops.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find root element");

createRoot(container).render(
  <StrictMode>
    <App />
    <ItemPacksDialog />
    <RecentDrops />
    <Toaster richColors position="bottom-right" />
  </StrictMode>,
);
