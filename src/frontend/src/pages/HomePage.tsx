import { useNavigate } from "@tanstack/react-router";
import { Camera, ChevronRight, Sparkles } from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { TemplatePreview } from "../components/photobooth/TemplatePreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";
import {
  BUILT_IN_TEMPLATES,
  type LocalTemplate,
  usePhotoboothStore,
} from "../store/photoboothStore";

const LAYOUT_LABELS: Record<string, string> = {
  strip_1x4: "1×4 Strip",
  grid_2x2: "2×2 Grid",
  strip_3x1: "3×1 Strip",
};

const LAYOUT_DESCRIPTIONS: Record<string, string> = {
  strip_1x4: "Classic 4-photo booth strip",
  grid_2x2: "Square grid, 4 equal photos",
  strip_3x1: "Minimal trio portrait strip",
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function HomePage() {
  const navigate = useNavigate();
  const { templates, setActiveSession, branding, filterPresets } =
    usePhotoboothStore();
  const [selectedTemplate, setSelectedTemplate] = useState<LocalTemplate>(
    BUILT_IN_TEMPLATES[0],
  );
  const [eventName, setEventName] = useState("My Event");
  const [countdown, setCountdown] = useState(3);
  const [burstCount, setBurstCount] = useState(4);

  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...templates.filter((t) => !t.isBuiltIn),
  ];

  const handleStart = useCallback(() => {
    const sessionId = uuidv4();
    setActiveSession({
      id: sessionId,
      eventName: eventName || "My Event",
      layoutType: selectedTemplate.layoutType,
      templateId: selectedTemplate.id,
      filterId: filterPresets[0]?.id ?? null,
      photos: [],
      createdAt: Date.now(),
      countdown,
      burstCount,
    });
    navigate({ to: "/capture" });
  }, [
    selectedTemplate,
    eventName,
    countdown,
    burstCount,
    setActiveSession,
    navigate,
    filterPresets,
  ]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-b from-amber/3 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Professional Photobooth
              </span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl sm:text-5xl font-bold text-cream leading-tight tracking-tight mb-3"
            >
              Capture the{" "}
              <span className="text-amber italic font-serif">Moment</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              Professional-grade photobooth with unlimited filters, premium
              layouts, and instant prints. Built for events that deserve more.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main setup */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr,360px] gap-10">
          {/* Left: Template + settings */}
          <div className="space-y-8">
            {/* Event name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Event Name
              </Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sarah & James Wedding"
                className="bg-secondary/50 border-border/60 text-cream h-11 font-sans placeholder:text-muted-foreground/50"
                data-ocid="template.event_name_input"
              />
            </motion.div>

            {/* Template select */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Choose Layout
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allTemplates.map((template, i) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    data-ocid={`template.select.item.${i + 1}`}
                    className={cn(
                      "group relative text-left rounded-lg border p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      selectedTemplate.id === template.id
                        ? "border-amber/60 bg-amber/5 shadow-amber-glow"
                        : "border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/40",
                    )}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Mini preview */}
                      <div className="flex-shrink-0 w-14">
                        <TemplatePreview
                          template={template}
                          compact
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              "text-xs font-semibold truncate transition-colors",
                              selectedTemplate.id === template.id
                                ? "text-amber"
                                : "text-foreground",
                            )}
                          >
                            {template.name}
                          </p>
                          {template.isBuiltIn && (
                            <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">
                              Built-in
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {LAYOUT_LABELS[template.layoutType]}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">
                          {LAYOUT_DESCRIPTIONS[template.layoutType]}
                        </p>
                      </div>
                    </div>
                    {selectedTemplate.id === template.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Capture settings */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              {/* Countdown */}
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Countdown Timer
                </Label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setCountdown(s)}
                      data-ocid={`capture.countdown_${s}_button`}
                      className={cn(
                        "flex-1 h-11 rounded-md text-sm font-mono font-semibold border transition-all",
                        countdown === s
                          ? "border-amber/60 bg-amber/10 text-amber"
                          : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Burst count */}
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Photos Per Session
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setBurstCount(n)}
                      data-ocid={`capture.burst_${n}_button`}
                      className={cn(
                        "flex-1 h-11 rounded-md text-sm font-mono font-semibold border transition-all",
                        burstCount === n
                          ? "border-amber/60 bg-amber/10 text-amber"
                          : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Preview + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-6 lg:sticky lg:top-24 lg:self-start"
          >
            {/* Template preview */}
            <div className="w-full max-w-[220px]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3 text-center">
                Preview
              </p>
              <TemplatePreview
                template={selectedTemplate}
                branding={branding}
                showBranding={branding.enabled}
                eventName={eventName}
                className="w-full shadow-strip mx-auto"
              />
            </div>

            <div className="w-full max-w-[260px] space-y-3">
              <Button
                onClick={handleStart}
                data-ocid="template.select.submit_button"
                className="w-full h-12 bg-amber hover:bg-amber-glow text-primary-foreground font-display font-semibold text-sm tracking-wide btn-amber-glow transition-all duration-200"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Session
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-center text-[10px] text-muted-foreground font-mono">
                {selectedTemplate.slots.length} photos ·{" "}
                {LAYOUT_LABELS[selectedTemplate.layoutType]}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
