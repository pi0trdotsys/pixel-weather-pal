// Plain client-only bootstrap used ONLY for the static Capacitor/Android build
// (see vite.capacitor.config.ts + capacitor-entry.html). TanStack Start's default
// entry hydrates SSR-rendered markup; this app is shipped to the WebView as a
// fully static bundle with no server, so we do a fresh client render instead.
// `createRoot` (not `hydrateRoot`) is given the whole `document` because the
// root route's `shellComponent` renders the entire <html> document itself.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";

const router = getRouter();

createRoot(document).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
