import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Download, Loader2, Plus, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { TemplatePreview } from "../components/photobooth/TemplatePreview";
import { Button } from "../components/ui/button";
import { useCreateSession } from "../hooks/useQueries";
import { applyFiltersToCanvas } from "../lib/filterUtils";
import { cn } from "../lib/utils";
import {
  BUILT_IN_TEMPLATES,
  usePhotoboothStore,
} from "../store/photoboothStore";

export function ExportPage() {
  const navigate = useNavigate();
  const { activeSession, templates, branding, activeFilter } =
    usePhotoboothStore();

  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const createSession = useCreateSession();

  const template =
    templates.find((t) => t.id === activeSession?.templateId) ??
    BUILT_IN_TEMPLATES[0];

  const photos = activeSession?.photos.map((p) => p.dataUrl) ?? [];

  // Save session to backend on mount (run once per session id)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once per session
  useEffect(() => {
    if (!activeSession || sessionSaved) return;
    const save = async () => {
      try {
        await createSession.mutateAsync({
          id: activeSession.id,
          eventName: activeSession.eventName,
          date: BigInt(Date.now() * 1_000_000),
          layoutType: activeSession.layoutType,
          photoCount: BigInt(activeSession.photos.length),
        });
        setSessionSaved(true);
      } catch {
        // Non-critical
      }
    };
    save();
  }, [activeSession?.id]);

  const handleExport = useCallback(async () => {
    if (!activeSession || !canvasRef.current) return;
    setIsExporting(true);

    try {
      // Determine canvas dimensions based on layout
      let canvasW = 600;
      let canvasH = 1800;
      if (template.layoutType === "grid_2x2") {
        canvasW = 1200;
        canvasH = 1200;
      } else if (template.layoutType === "strip_3x1") {
        canvasW = 600;
        canvasH = 1350;
      }

      const canvas = canvasRef.current;
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Draw background
      if (
        template.background.type === "gradient" &&
        template.background.value2
      ) {
        const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        gradient.addColorStop(0, template.background.value);
        gradient.addColorStop(1, template.background.value2);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = template.background.value;
      }
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Process and draw photos with filters
      const processedPhotos = await Promise.all(
        photos.map(async (photoUrl, idx) => {
          const slot = template.slots[idx];
          if (!slot) return null;
          const slotW = (slot.width / 100) * canvasW;
          const slotH = (slot.height / 100) * canvasH;
          return {
            slot,
            processed: await applyFiltersToCanvas(
              photoUrl,
              activeFilter,
              Math.round(slotW),
              Math.round(slotH),
            ),
          };
        }),
      );

      // Draw photos into slots
      const drawPromises = processedPhotos.map(async (item) => {
        if (!item) return;
        const { slot, processed } = item;
        const x = (slot.x / 100) * canvasW;
        const y = (slot.y / 100) * canvasH;
        const w = (slot.width / 100) * canvasW;
        const h = (slot.height / 100) * canvasH;

        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.src = processed;
        });
      });
      await Promise.all(drawPromises);

      // Draw overlays
      for (const overlay of template.overlays) {
        let content = overlay.content;
        if (overlay.type === "datetime") {
          content = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else if (overlay.type === "event-title" && activeSession.eventName) {
          content = activeSession.eventName;
        }

        ctx.fillStyle = overlay.color;
        ctx.font = `${overlay.fontSize * (canvasW / 200)}px "${overlay.fontFamily || "monospace"}"`;
        ctx.textAlign = "center";
        ctx.globalAlpha = overlay.opacity ?? 1;
        ctx.fillText(
          content,
          (overlay.x / 100) * canvasW,
          (overlay.y / 100) * canvasH,
        );
        ctx.globalAlpha = 1;
      }

      // Draw branding
      if (branding.enabled && branding.photographerName) {
        ctx.fillStyle = branding.color;
        ctx.font = `${branding.fontSize * (canvasW / 200)}px "${branding.fontFamily}"`;
        ctx.textAlign = "center";
        ctx.globalAlpha = branding.opacity;
        ctx.fillText(
          branding.photographerName,
          (branding.positionX / 100) * canvasW,
          (branding.positionY / 100) * canvasH,
        );
        ctx.globalAlpha = 1;
      }

      // Export
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!blob) throw new Error("Export failed");

      const url = URL.createObjectURL(blob);
      setExportUrl(url);

      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = `photobooth-${activeSession.eventName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      a.click();

      toast.success("Photo exported successfully!");
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [activeSession, template, photos, activeFilter, branding]);

  const sessionUrl = `${window.location.origin}/gallery`;

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4 page-enter">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No active session.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] page-enter">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl font-bold text-cream mb-2">
            Your Photos Are Ready
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeSession.eventName} · {template.name}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Strip preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-full max-w-[240px] mx-auto">
              <TemplatePreview
                template={template}
                photos={photos}
                branding={branding}
                filterParams={activeFilter}
                showBranding={branding.enabled}
                eventName={activeSession.eventName}
                className="w-full shadow-strip"
              />
            </div>

            <div className="flex gap-2 w-full max-w-[280px]">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                data-ocid="export.download_button"
                className="flex-1 h-11 bg-amber hover:bg-amber-glow text-primary-foreground font-display font-semibold text-sm btn-amber-glow"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </>
                )}
              </Button>
            </div>

            {exportUrl && (
              <a
                href={exportUrl}
                download
                className="text-xs font-mono text-amber/70 hover:text-amber underline transition-colors"
              >
                Download again
              </a>
            )}
          </motion.div>

          {/* QR code + actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            {/* QR Code */}
            <div className="card-glow rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber" />
                <p className="text-sm font-display font-semibold text-cream">
                  Gallery QR Code
                </p>
              </div>
              <div
                data-ocid="export.qr_code"
                className="p-4 bg-white rounded-sm shadow-strip"
              >
                <QRCodeSVG
                  value={sessionUrl}
                  size={160}
                  level="M"
                  fgColor="#1a1710"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground text-center max-w-[200px]">
                Scan to view the photo gallery
              </p>
            </div>

            {/* Session summary */}
            <div className="card-glow rounded-lg p-5 space-y-3">
              <p className="text-xs font-display font-semibold text-cream">
                Session Summary
              </p>
              <div className="space-y-2">
                {[
                  ["Event", activeSession.eventName],
                  ["Layout", template.name],
                  ["Photos", `${activeSession.photos.length} shots`],
                  [
                    "Date",
                    new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {label}
                    </span>
                    <span className="text-[11px] text-cream font-mono">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => navigate({ to: "/" })}
                data-ocid="export.new_session_button"
                variant="outline"
                className="w-full h-11 border-border/60 text-muted-foreground hover:text-foreground text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
              <Button
                onClick={() => navigate({ to: "/gallery" })}
                variant="ghost"
                className="w-full h-10 text-xs text-muted-foreground hover:text-foreground"
              >
                View Gallery →
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
