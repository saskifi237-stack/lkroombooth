import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Camera, Check, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCamera } from "../camera/useCamera";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { usePhotoboothStore } from "../store/photoboothStore";
import { BUILT_IN_TEMPLATES } from "../store/photoboothStore";

type CaptureState = "idle" | "countdown" | "capturing" | "review";

function playShutterSound() {
  try {
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] =
        (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.18;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore if audio fails
  }
}

export function CapturePage() {
  const navigate = useNavigate();
  const { activeSession, updateSession, templates, setFlashActive } =
    usePhotoboothStore();
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [countdownValue, setCountdownValue] = useState(0);
  const [currentBurst, setCurrentBurst] = useState(0);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    isSupported,
    error,
    startCamera,
    capturePhoto,
  } = useCamera({
    facingMode: "user",
    width: 1280,
    height: 720,
    quality: 0.95,
  });

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const template =
    templates.find((t) => t.id === activeSession?.templateId) ??
    BUILT_IN_TEMPLATES[0];

  const targetCount = activeSession
    ? retakeIndex !== null
      ? 1
      : Math.min(activeSession.burstCount, template.slots.length)
    : 1;

  const doCapture = useCallback(async () => {
    if (!isActive || !isMounted.current) return;

    setFlashActive(true);
    playShutterSound();

    const file = await capturePhoto();
    if (!file || !isMounted.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (!isMounted.current) return;
      const dataUrl = reader.result as string;
      const photoId = uuidv4();

      // Get current photos from store state and update
      const store = usePhotoboothStore.getState();
      const currentPhotos = [...(store.activeSession?.photos ?? [])];
      if (retakeIndex !== null) {
        currentPhotos[retakeIndex] = {
          id: photoId,
          dataUrl,
          slotIndex: retakeIndex,
        };
      } else {
        const slotIndex = currentBurst;
        currentPhotos.push({ id: photoId, dataUrl, slotIndex });
      }
      updateSession({ photos: currentPhotos });
    };
    reader.readAsDataURL(file);
  }, [
    isActive,
    capturePhoto,
    updateSession,
    setFlashActive,
    currentBurst,
    retakeIndex,
  ]);

  const startCountdown = useCallback(async () => {
    if (!activeSession || captureState !== "idle") return;
    setCaptureState("countdown");

    const doOneBurst = async (burstIdx: number) => {
      const count = activeSession.countdown;
      setCountdownValue(count);
      setCurrentBurst(burstIdx);

      await new Promise<void>((resolve) => {
        let remaining = count;
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(countdownRef.current!);
            setCountdownValue(0);
            resolve();
          } else {
            setCountdownValue(remaining);
          }
        }, 1000);
      });

      if (!isMounted.current) return;
      setCaptureState("capturing");
      await doCapture();
      if (!isMounted.current) return;

      const nextBurst = burstIdx + 1;
      if (retakeIndex === null && nextBurst < targetCount) {
        setCaptureState("countdown");
        await new Promise((r) => setTimeout(r, 400));
        if (isMounted.current) await doOneBurst(nextBurst);
      } else {
        setCaptureState("review");
        setRetakeIndex(null);
      }
    };

    await doOneBurst(0);
  }, [activeSession, captureState, doCapture, targetCount, retakeIndex]);

  const handleRetake = useCallback((idx: number) => {
    setRetakeIndex(idx);
    setCaptureState("idle");
  }, []);

  const handleConfirm = useCallback(() => {
    navigate({ to: "/review" });
  }, [navigate]);

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4 page-enter">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          No active session. Please start from the home page.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  const photosReady =
    activeSession.photos.length >=
    Math.min(activeSession.burstCount, template.slots.length);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col page-enter">
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Camera preview */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[60vw] lg:min-h-0">
          {/* Viewfinder frame corners */}
          <div className="absolute inset-6 z-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber/50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber/50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber/50" />
          </div>

          {/* Burst indicator */}
          {captureState !== "review" && (
            <div className="absolute top-4 right-4 z-20 flex gap-1.5">
              {Array.from({ length: template.slots.length }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional indicator
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full border transition-all",
                    i < activeSession.photos.length
                      ? "bg-amber border-amber"
                      : i === currentBurst && captureState === "countdown"
                        ? "bg-amber/40 border-amber/60 animate-pulse-amber"
                        : "bg-transparent border-white/30",
                  )}
                />
              ))}
            </div>
          )}

          {/* Camera video */}
          {isSupported === false ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-mono">
                Camera not supported in this browser
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-mono">{error.message}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className={cn(
                "w-full h-full object-cover",
                captureState === "review" ? "opacity-20" : "opacity-100",
              )}
              style={{ transform: "scaleX(-1)" }}
              playsInline
              muted
              autoPlay
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-white/60 font-mono text-sm animate-pulse">
                Initializing camera...
              </div>
            </div>
          )}

          {/* Countdown overlay */}
          <AnimatePresence>
            {captureState === "countdown" && countdownValue > 0 && (
              <motion.div
                key={countdownValue}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
              >
                <span
                  className="countdown-text text-white font-bold"
                  style={{
                    fontSize: "min(35vw, 180px)",
                    lineHeight: 1,
                    textShadow: "0 0 80px rgba(200,180,140,0.5)",
                  }}
                >
                  {countdownValue}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review overlay: show captured photos */}
          {captureState === "review" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6">
              <div className="space-y-4 w-full max-w-lg">
                <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Review Shots
                </p>
                <div
                  className={cn(
                    "grid gap-3",
                    activeSession.photos.length <= 2
                      ? "grid-cols-2"
                      : "grid-cols-4",
                  )}
                >
                  {activeSession.photos.map((photo, idx) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.dataUrl}
                        alt={`Shot ${idx + 1}`}
                        className="w-full aspect-[3/4] object-cover rounded-sm border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleRetake(idx)}
                        data-ocid="capture.retake_button"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <RefreshCw className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-mono">
                            Retake
                          </span>
                        </div>
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5">
                        <span className="text-white/70 text-[9px] font-mono">
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/50 flex flex-col">
          <div className="p-5 border-b border-border/30">
            <h2 className="font-display text-sm font-semibold text-cream">
              {activeSession.eventName}
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {template.name} · {template.slots.length} shots
            </p>
          </div>

          <div className="flex-1 p-5 space-y-4">
            {/* Action buttons */}
            {captureState === "idle" && (
              <Button
                onClick={startCountdown}
                disabled={!isActive || isLoading}
                data-ocid="capture.start_button"
                className="w-full h-12 bg-amber hover:bg-amber-glow text-primary-foreground font-display font-semibold text-sm btn-amber-glow transition-all"
              >
                <Camera className="w-4 h-4 mr-2" />
                {retakeIndex !== null
                  ? `Retake Shot ${retakeIndex + 1}`
                  : "Start Capture"}
              </Button>
            )}

            {captureState === "countdown" && (
              <div className="w-full h-12 flex items-center justify-center bg-secondary/30 rounded-md border border-border/50">
                <span className="text-amber font-mono text-sm animate-pulse">
                  Capturing {currentBurst + 1} of {targetCount}...
                </span>
              </div>
            )}

            {captureState === "capturing" && (
              <div className="w-full h-12 flex items-center justify-center bg-secondary/30 rounded-md border border-border/50">
                <span className="text-muted-foreground font-mono text-xs animate-pulse">
                  Processing...
                </span>
              </div>
            )}

            {captureState === "review" && (
              <div className="space-y-2">
                <Button
                  onClick={handleConfirm}
                  data-ocid="capture.confirm_button"
                  className="w-full h-12 bg-amber hover:bg-amber-glow text-primary-foreground font-display font-semibold text-sm btn-amber-glow"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateSession({ photos: [] });
                    setCaptureState("idle");
                  }}
                  className="w-full h-10 text-xs border-border/50 text-muted-foreground hover:text-foreground"
                >
                  Start Over
                </Button>
              </div>
            )}

            {photosReady && captureState === "idle" && (
              <Button
                onClick={handleConfirm}
                data-ocid="capture.confirm_button"
                variant="outline"
                className="w-full h-10 text-xs border-border/50 text-muted-foreground hover:text-foreground"
              >
                Skip to Review →
              </Button>
            )}
          </div>

          {/* Shot thumbnails */}
          {activeSession.photos.length > 0 && captureState !== "review" && (
            <div className="p-5 border-t border-border/30">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Shots ({activeSession.photos.length}/{targetCount})
              </p>
              <div className="flex gap-2">
                {activeSession.photos.map((photo, idx) => (
                  <div key={photo.id} className="relative group flex-1">
                    <img
                      src={photo.dataUrl}
                      alt={`Shot ${idx + 1}`}
                      className="w-full aspect-[3/4] object-cover rounded-sm border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => handleRetake(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
