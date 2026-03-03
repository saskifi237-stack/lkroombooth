import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ChevronRight, Plus, RotateCcw, Save } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { TemplatePreview } from "../components/photobooth/TemplatePreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import { useCreateFilterPreset } from "../hooks/useQueries";
import { cn } from "../lib/utils";
import {
  BUILT_IN_FILTERS,
  type FilterParams,
  type LocalFilterPreset,
  NEUTRAL_FILTER,
  usePhotoboothStore,
} from "../store/photoboothStore";
import { BUILT_IN_TEMPLATES } from "../store/photoboothStore";

const FILTER_SLIDERS: {
  key: keyof FilterParams;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "exposure", label: "Exposure", min: -1, max: 1, step: 0.01 },
  { key: "contrast", label: "Contrast", min: 0, max: 2, step: 0.01 },
  { key: "highlights", label: "Highlights", min: 0, max: 1, step: 0.01 },
  { key: "shadows", label: "Shadows", min: 0, max: 1, step: 0.01 },
  { key: "temperature", label: "Temperature", min: -1, max: 1, step: 0.01 },
  { key: "tint", label: "Tint", min: -1, max: 1, step: 0.01 },
  { key: "grain", label: "Grain", min: 0, max: 1, step: 0.01 },
  { key: "fade", label: "Fade", min: 0, max: 1, step: 0.01 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 1, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
];

export function ReviewPage() {
  const navigate = useNavigate();
  const {
    activeSession,
    templates,
    branding,
    filterPresets,
    activeFilter,
    setActiveFilter,
    addFilterPreset,
    eventMode,
  } = usePhotoboothStore();

  const [localFilter, setLocalFilter] = useState<FilterParams>(activeFilter);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const createFilterPreset = useCreateFilterPreset();

  const template =
    templates.find((t) => t.id === activeSession?.templateId) ??
    BUILT_IN_TEMPLATES[0];

  const photos = activeSession?.photos.map((p) => p.dataUrl) ?? [];

  const handlePresetSelect = useCallback(
    (preset: LocalFilterPreset, idx: number) => {
      setSelectedPresetId(preset.id);
      setLocalFilter(preset.params);
      // Track the ocid index
      void idx;
    },
    [],
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterParams, value: number) => {
      setLocalFilter((prev) => ({ ...prev, [key]: value }));
      setSelectedPresetId(null);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setLocalFilter(NEUTRAL_FILTER);
    setSelectedPresetId("natural");
  }, []);

  const handleSavePreset = useCallback(async () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    setIsSaving(true);
    try {
      const id = uuidv4();
      const preset: LocalFilterPreset = {
        id,
        name: newPresetName.trim(),
        params: localFilter,
        createdAt: Date.now(),
      };
      addFilterPreset(preset);
      await createFilterPreset.mutateAsync({
        id,
        name: newPresetName.trim(),
        ...localFilter,
      });
      toast.success(`Preset "${newPresetName}" saved`);
      setNewPresetName("");
      setShowSaveForm(false);
      setSelectedPresetId(id);
    } catch {
      toast.error("Failed to save preset");
    } finally {
      setIsSaving(false);
    }
  }, [newPresetName, localFilter, addFilterPreset, createFilterPreset]);

  const handleContinue = useCallback(() => {
    setActiveFilter(localFilter);
    navigate({ to: "/export" });
  }, [localFilter, setActiveFilter, navigate]);

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

  const allPresets = [
    ...BUILT_IN_FILTERS,
    ...filterPresets.filter((p) => !p.isBuiltIn),
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row page-enter">
      {/* Left: Strip preview */}
      <div className="flex-1 bg-black/30 flex items-center justify-center p-8 lg:p-12">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Live Preview
          </p>
          <div className="w-full max-w-[240px]">
            <TemplatePreview
              template={template}
              photos={photos}
              branding={branding}
              filterParams={localFilter}
              showBranding={branding.enabled}
              eventName={activeSession.eventName}
              className="w-full shadow-strip"
            />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono text-center">
            {activeSession.eventName} · {template.name}
          </p>
        </div>
      </div>

      {/* Right: Filter controls */}
      <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/50 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border/30 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-cream">
              Filters
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              Adjust and apply
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleContinue}
            data-ocid="capture.confirm_button"
            className="h-9 text-xs bg-amber/10 border-amber/40 text-amber hover:bg-amber/20 font-semibold"
          >
            Export
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-5 space-y-6">
            {/* Preset chips */}
            <div className="space-y-2">
              <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Presets
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {allPresets.map((preset, i) => {
                  const builtinIdx = BUILT_IN_FILTERS.findIndex(
                    (b) => b.id === preset.id,
                  );
                  const ocid =
                    builtinIdx >= 0
                      ? `filter.preset.item.${builtinIdx + 1}`
                      : `filter.preset.item.${i + 1}`;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset, i)}
                      data-ocid={ocid}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-mono border transition-all",
                        selectedPresetId === preset.id
                          ? "border-amber/60 bg-amber/10 text-amber"
                          : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Parameter sliders */}
            {!eventMode.isLocked && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Adjust
                  </Label>
                  <button
                    type="button"
                    onClick={handleReset}
                    data-ocid="filter.reset_button"
                    className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {FILTER_SLIDERS.map(({ key, label, min, max, step }) => {
                  const ocidMap: Partial<Record<keyof FilterParams, string>> = {
                    exposure: "filter.exposure_input",
                    contrast: "filter.contrast_input",
                    grain: "filter.grain_input",
                    vignette: "filter.vignette_input",
                  };
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">
                          {label}
                        </Label>
                        <span className="text-[10px] font-mono text-amber/80">
                          {localFilter[key].toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={min}
                        max={max}
                        step={step}
                        value={[localFilter[key]]}
                        onValueChange={([v]) => handleFilterChange(key, v)}
                        data-ocid={ocidMap[key] || undefined}
                        className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-amber/60 [&_[role=slider]]:bg-amber"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {eventMode.isLocked && (
              <div className="rounded-md border border-border/30 bg-secondary/20 p-3 text-center">
                <p className="text-xs text-muted-foreground font-mono">
                  Filter editing is disabled in event mode.
                </p>
              </div>
            )}

            <Separator className="bg-border/30" />

            {/* Save preset */}
            {!eventMode.isLocked && (
              <div className="space-y-2">
                {showSaveForm ? (
                  <div className="space-y-2">
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Preset name..."
                      className="bg-secondary/50 border-border/60 text-cream h-9 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePreset}
                        disabled={isSaving}
                        data-ocid="filter.save_button"
                        size="sm"
                        className="flex-1 h-8 text-xs bg-amber/10 border-amber/40 text-amber hover:bg-amber/20 border"
                      >
                        {isSaving ? (
                          <span className="animate-pulse">Saving...</span>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-1.5" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSaveForm(false)}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveForm(true)}
                    className="w-full h-9 text-xs border-border/50 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Save as Preset
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}
