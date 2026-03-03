import { useMemo } from "react";
import { filterParamsToCss } from "../../lib/filterUtils";
import { cn } from "../../lib/utils";
import type {
  BrandingState,
  FilterParams,
  LocalTemplate,
} from "../../store/photoboothStore";

interface TemplatePreviewProps {
  template: LocalTemplate;
  photos?: (string | null)[];
  branding?: BrandingState;
  filterParams?: FilterParams;
  className?: string;
  showBranding?: boolean;
  compact?: boolean;
  eventName?: string;
}

export function TemplatePreview({
  template,
  photos = [],
  branding,
  filterParams,
  className,
  showBranding = false,
  compact = false,
  eventName,
}: TemplatePreviewProps) {
  const aspectRatio = useMemo(() => {
    switch (template.layoutType) {
      case "strip_1x4":
        return "2/6";
      case "grid_2x2":
        return "1/1";
      case "strip_3x1":
        return "2/4.5";
      default:
        return "1/1";
    }
  }, [template.layoutType]);

  const filterCss = filterParams ? filterParamsToCss(filterParams) : undefined;

  const bgStyle = useMemo(() => {
    if (template.background.type === "gradient" && template.background.value2) {
      return {
        background: `linear-gradient(135deg, ${template.background.value}, ${template.background.value2})`,
      };
    }
    return { background: template.background.value };
  }, [template.background]);

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none photo-strip",
        compact ? "rounded" : "rounded-sm",
        className,
      )}
      style={{
        aspectRatio,
        ...bgStyle,
      }}
    >
      {/* Photo slots */}
      {template.slots.map((slot) => {
        const photo = photos[slot.index];
        return (
          <div
            key={slot.index}
            className="absolute overflow-hidden"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={`Slot ${slot.index + 1}`}
                className="w-full h-full object-cover"
                style={filterCss ? { filter: filterCss } : undefined}
              />
            ) : (
              <div className="w-full h-full bg-black/15 flex items-center justify-center">
                {!compact && (
                  <span className="text-white/30 font-mono text-xs">
                    {slot.index + 1}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Text overlays */}
      {template.overlays.map((overlay) => {
        let content = overlay.content;
        if (overlay.type === "datetime") {
          content = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else if (overlay.type === "event-title" && eventName) {
          content = eventName;
        }

        return (
          <div
            key={overlay.id}
            className="absolute"
            style={{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${overlay.fontSize * (compact ? 0.7 : 1)}px`,
              color: overlay.color,
              fontFamily: overlay.fontFamily || "Geist Mono",
              opacity: overlay.opacity ?? 1,
              whiteSpace: "nowrap",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {content}
          </div>
        );
      })}

      {/* Branding overlay */}
      {showBranding && branding?.enabled && branding.photographerName && (
        <div
          className="absolute"
          style={{
            left: `${branding.positionX}%`,
            top: `${branding.positionY}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${branding.fontSize * (compact ? 0.6 : 1)}px`,
            color: branding.color,
            fontFamily: branding.fontFamily,
            opacity: branding.opacity,
            whiteSpace: "nowrap",
            letterSpacing: "0.08em",
          }}
        >
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt="Logo"
              style={{
                height: `${branding.fontSize * 1.5}px`,
                display: "inline-block",
                marginRight: "4px",
                verticalAlign: "middle",
              }}
            />
          )}
          {branding.photographerName}
        </div>
      )}
    </div>
  );
}
