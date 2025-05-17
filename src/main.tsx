import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find root element");

createRoot(container).render(
  <StrictMode>
    <App />
    <Toaster richColors position="bottom-right" />
  </StrictMode>,
);
