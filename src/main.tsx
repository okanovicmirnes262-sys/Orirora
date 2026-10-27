import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./RestaurantOS";
import ErrorBoundary from "./ErrorBoundary";
import { installGlobalErrorHandlers } from "./errorReporter";
import "./index.css";

installGlobalErrorHandlers();

// /admin is the internal admin panel. It's code-split so restaurants never
// download it; vercel.json rewrites every path to index.html.
const AdminApp = lazy(() => import("./admin/AdminApp"));
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary area={isAdmin ? "admin" : "app"}>
      {isAdmin ? (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);

// Register the service worker so the app is installable / works as a home-screen
// app. Best-effort — failures (e.g. unsupported browser) are ignored.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
