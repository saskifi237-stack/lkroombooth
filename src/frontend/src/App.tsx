import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppHeader } from "./components/photobooth/AppHeader";
import { FlashOverlay } from "./components/photobooth/FlashOverlay";
import { Toaster } from "./components/ui/sonner";
import { CapturePage } from "./pages/CapturePage";
import { ExportPage } from "./pages/ExportPage";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { ReviewPage } from "./pages/ReviewPage";
import { SettingsPage } from "./pages/SettingsPage";

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <FlashOverlay />
      <Outlet />
      <Footer />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.16 0.009 56)",
            border: "1px solid oklch(0.25 0.012 60)",
            color: "oklch(0.93 0.012 82)",
            fontFamily: "Geist Mono, monospace",
            fontSize: "12px",
          },
        }}
      />
    </div>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const captureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/capture",
  component: CapturePage,
});

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: ReviewPage,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/export",
  component: ExportPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  captureRoute,
  reviewRoute,
  exportRoute,
  galleryRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/50">
          DARKROOM Photobooth Studio
        </span>
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          © {year}. Built with ♥ using caffeine.ai
        </a>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}
