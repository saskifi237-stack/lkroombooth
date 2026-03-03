import { Link, useLocation } from "@tanstack/react-router";
import { Camera, Home, Images, Lock, Settings, Unlock } from "lucide-react";
import { useSetEventMode } from "../../hooks/useQueries";
import { cn } from "../../lib/utils";
import { usePhotoboothStore } from "../../store/photoboothStore";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: Home, ocid: "nav.home_link" },
  { to: "/capture", label: "Capture", icon: Camera, ocid: "nav.capture_link" },
  { to: "/gallery", label: "Gallery", icon: Images, ocid: "nav.gallery_link" },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    ocid: "nav.settings_link",
  },
] as const;

export function AppHeader() {
  const location = useLocation();
  const { eventMode, setEventMode } = usePhotoboothStore();
  const setEventModeMutation = useSetEventMode();

  const handleToggleEventMode = () => {
    const next = !eventMode.isLocked;
    setEventMode({ isLocked: next });
    setEventModeMutation.mutate({
      isLocked: next,
      activeTemplateId: eventMode.activeTemplateId,
      activeFilterPresetId: eventMode.activeFilterPresetId,
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          data-ocid="nav.home_link"
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-sm bg-amber/10 group-hover:bg-amber/20 transition-colors" />
            <Camera className="w-4 h-4 text-amber" />
          </div>
          <span className="font-display font-semibold tracking-tight text-cream text-sm hidden sm:block">
            DARKROOM
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.filter((link) =>
            eventMode.isLocked ? link.to !== "/settings" : true,
          ).map(({ to, label, icon: Icon, ocid }) => {
            const isActive =
              location.pathname === to ||
              (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  isActive
                    ? "bg-amber/10 text-amber"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {eventMode.isLocked && (
            <Badge
              variant="outline"
              className="border-amber/40 text-amber text-xs font-mono animate-pulse-amber hidden sm:flex"
            >
              EVENT MODE
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleEventMode}
            data-ocid="nav.event_mode_toggle"
            className={cn(
              "h-8 w-8 p-0 rounded-md transition-all",
              eventMode.isLocked
                ? "text-amber hover:bg-amber/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
            title={
              eventMode.isLocked ? "Unlock Event Mode" : "Enable Event Mode"
            }
          >
            {eventMode.isLocked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
