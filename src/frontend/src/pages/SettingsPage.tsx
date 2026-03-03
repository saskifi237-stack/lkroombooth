import {
  Layout,
  Loader2,
  Lock,
  Palette,
  Save,
  Settings,
  Sliders,
  Unlock,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TemplatePreview } from "../components/photobooth/TemplatePreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  useCreateTemplate,
  useGetBrandingConfig,
  useSetBrandingConfig,
  useSetEventMode,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";
import {
  BUILT_IN_FILTERS,
  BUILT_IN_TEMPLATES,
  type LocalFilterPreset,
  usePhotoboothStore,
} from "../store/photoboothStore";

// Position options for future extension
const _POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
] as const;

export function SettingsPage() {
  const {
    branding,
    setBranding,
    eventMode,
    setEventMode,
    filterPresets,
    templates,
  } = usePhotoboothStore();

  const { data: savedBranding } = useGetBrandingConfig();
  const setBrandingMutation = useSetBrandingConfig();
  const setEventModeMutation = useSetEventMode();
  // createTemplateMutation reserved for future template builder
  const _createTemplateMutation = useCreateTemplate();

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [localBranding, setLocalBranding] = useState(branding);

  // Sync from backend branding (run once when savedBranding loads)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when savedBranding loads
  useEffect(() => {
    if (savedBranding) {
      setBranding({
        enabled: savedBranding.enabled,
        photographerName: savedBranding.photographerName,
        fontFamily: savedBranding.fontFamily,
        fontSize: Number(savedBranding.fontSize),
        color: savedBranding.color,
        opacity: savedBranding.opacity,
        positionX: savedBranding.positionX,
        positionY: savedBranding.positionY,
        logoUrl: savedBranding.logoUrl,
      });
    }
  }, [savedBranding]);

  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleSaveBranding = useCallback(async () => {
    setIsSavingBranding(true);
    try {
      setBranding(localBranding);
      await setBrandingMutation.mutateAsync({
        enabled: localBranding.enabled,
        photographerName: localBranding.photographerName,
        logoUrl: localBranding.logoUrl,
        fontFamily: localBranding.fontFamily,
        fontSize: BigInt(Math.round(localBranding.fontSize)),
        color: localBranding.color,
        opacity: localBranding.opacity,
        positionX: localBranding.positionX,
        positionY: localBranding.positionY,
      });
      toast.success("Branding saved");
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setIsSavingBranding(false);
    }
  }, [localBranding, setBranding, setBrandingMutation]);

  const handleToggleEventMode = useCallback(
    async (locked: boolean) => {
      setEventMode({ isLocked: locked });
      try {
        await setEventModeMutation.mutateAsync({
          isLocked: locked,
          activeTemplateId: eventMode.activeTemplateId,
          activeFilterPresetId: eventMode.activeFilterPresetId,
        });
        toast.success(locked ? "Event Mode enabled" : "Event Mode disabled");
      } catch {
        toast.error("Failed to update event mode");
      }
    },
    [eventMode, setEventMode, setEventModeMutation],
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLocalBranding((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...templates.filter((t) => !t.isBuiltIn),
  ];

  const allFilters = [
    ...BUILT_IN_FILTERS,
    ...filterPresets.filter((p) => !p.isBuiltIn),
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] page-enter">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Settings className="w-5 h-5 text-amber" />
          <h1 className="font-display text-3xl font-bold text-cream tracking-tight">
            Settings
          </h1>
        </motion.div>

        <Tabs defaultValue="branding">
          <TabsList className="bg-secondary/30 border border-border/30 rounded-lg p-1 h-auto gap-1 mb-8 flex-wrap">
            <TabsTrigger
              value="branding"
              data-ocid="settings.branding_tab"
              className="text-xs font-mono data-[state=active]:bg-amber/10 data-[state=active]:text-amber data-[state=active]:shadow-none rounded-md"
            >
              <Palette className="w-3.5 h-3.5 mr-1.5" />
              Branding
            </TabsTrigger>
            <TabsTrigger
              value="filters"
              data-ocid="settings.filters_tab"
              className="text-xs font-mono data-[state=active]:bg-amber/10 data-[state=active]:text-amber data-[state=active]:shadow-none rounded-md"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              Filters
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              data-ocid="settings.templates_tab"
              className="text-xs font-mono data-[state=active]:bg-amber/10 data-[state=active]:text-amber data-[state=active]:shadow-none rounded-md"
            >
              <Layout className="w-3.5 h-3.5 mr-1.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="eventmode"
              data-ocid="settings.event_mode_tab"
              className="text-xs font-mono data-[state=active]:bg-amber/10 data-[state=active]:text-amber data-[state=active]:shadow-none rounded-md"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Event Mode
            </TabsTrigger>
          </TabsList>

          {/* ── BRANDING ── */}
          <TabsContent value="branding">
            <div className="grid lg:grid-cols-[1fr,320px] gap-8">
              <div className="space-y-6">
                <div className="card-glow rounded-lg p-6 space-y-5">
                  <h3 className="font-display text-sm font-semibold text-cream">
                    Branding Configuration
                  </h3>

                  {/* Enable toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Enable Branding
                    </Label>
                    <Switch
                      checked={localBranding.enabled}
                      onCheckedChange={(v) =>
                        setLocalBranding((prev) => ({ ...prev, enabled: v }))
                      }
                    />
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Photographer name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Photographer Name
                    </Label>
                    <Input
                      value={localBranding.photographerName}
                      onChange={(e) =>
                        setLocalBranding((prev) => ({
                          ...prev,
                          photographerName: e.target.value,
                        }))
                      }
                      placeholder="Studio Name"
                      className="bg-secondary/50 border-border/60 text-cream h-10 text-sm"
                    />
                  </div>

                  {/* Logo upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Logo (PNG with transparency)
                    </Label>
                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="logo-upload"
                        data-ocid="settings.branding_save_button"
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/60 bg-secondary/30 text-xs text-muted-foreground hover:text-foreground hover:border-border cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Logo
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/png,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {localBranding.logoUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={localBranding.logoUrl}
                            alt="Logo preview"
                            className="h-8 w-8 object-contain bg-secondary/50 rounded border border-border/30"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setLocalBranding((prev) => ({
                                ...prev,
                                logoUrl: "",
                              }))
                            }
                            className="text-destructive/70 hover:text-destructive text-xs font-mono"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Font family */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Font Family
                    </Label>
                    <select
                      value={localBranding.fontFamily}
                      onChange={(e) =>
                        setLocalBranding((prev) => ({
                          ...prev,
                          fontFamily: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border/60 text-cream text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Geist Mono">Geist Mono</option>
                      <option value="Cabinet Grotesk">Cabinet Grotesk</option>
                      <option value="Bricolage Grotesque">
                        Bricolage Grotesque
                      </option>
                      <option value="Fraunces">Fraunces</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Color */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground">
                        Color
                      </Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={localBranding.color}
                          onChange={(e) =>
                            setLocalBranding((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="w-10 h-10 rounded-md border border-border/60 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={localBranding.color}
                          onChange={(e) =>
                            setLocalBranding((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="flex-1 bg-secondary/50 border-border/60 text-cream h-10 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Font size */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground">
                        Font Size: {localBranding.fontSize}px
                      </Label>
                      <Slider
                        min={8}
                        max={32}
                        step={1}
                        value={[localBranding.fontSize]}
                        onValueChange={([v]) =>
                          setLocalBranding((prev) => ({ ...prev, fontSize: v }))
                        }
                        className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-amber/60 [&_[role=slider]]:bg-amber mt-3"
                      />
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs font-mono text-muted-foreground">
                        Opacity
                      </Label>
                      <span className="text-xs font-mono text-amber/70">
                        {Math.round(localBranding.opacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[localBranding.opacity]}
                      onValueChange={([v]) =>
                        setLocalBranding((prev) => ({ ...prev, opacity: v }))
                      }
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-amber/60 [&_[role=slider]]:bg-amber"
                    />
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-xs font-mono text-muted-foreground">
                          X Position
                        </Label>
                        <span className="text-xs font-mono text-amber/70">
                          {localBranding.positionX}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[localBranding.positionX]}
                        onValueChange={([v]) =>
                          setLocalBranding((prev) => ({
                            ...prev,
                            positionX: v,
                          }))
                        }
                        className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-amber/60 [&_[role=slider]]:bg-amber"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-xs font-mono text-muted-foreground">
                          Y Position
                        </Label>
                        <span className="text-xs font-mono text-amber/70">
                          {localBranding.positionY}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[localBranding.positionY]}
                        onValueChange={([v]) =>
                          setLocalBranding((prev) => ({
                            ...prev,
                            positionY: v,
                          }))
                        }
                        className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-amber/60 [&_[role=slider]]:bg-amber"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    data-ocid="settings.branding_save_button"
                    className="w-full h-10 bg-amber hover:bg-amber-glow text-primary-foreground font-display font-semibold text-xs btn-amber-glow"
                  >
                    {isSavingBranding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Save Branding
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Live preview */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Live Preview
                </p>
                <TemplatePreview
                  template={BUILT_IN_TEMPLATES[0]}
                  branding={localBranding}
                  showBranding={localBranding.enabled}
                  eventName="Your Event Name"
                  className="w-full max-w-[200px] mx-auto shadow-strip"
                />
              </div>
            </div>
          </TabsContent>

          {/* ── FILTERS ── */}
          <TabsContent value="filters">
            <div className="space-y-4">
              <h3 className="font-display text-sm font-semibold text-cream">
                Filter Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFilters.map((preset, idx) => (
                  <div
                    key={preset.id}
                    data-ocid={`filter.preset.item.${idx + 1}`}
                    className="card-glow rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-display font-semibold text-cream">
                        {preset.name}
                      </p>
                      {preset.isBuiltIn && (
                        <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">
                          Built-in
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(preset.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-[9px] font-mono text-muted-foreground/60 capitalize">
                            {key}
                          </span>
                          <span className="text-[9px] font-mono text-amber/60">
                            {(value as number).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filterPresets.filter((p) => !p.isBuiltIn).length === 0 && (
                  <div className="sm:col-span-2 lg:col-span-3 card-glow rounded-lg p-6 text-center">
                    <p className="text-xs text-muted-foreground font-mono">
                      No custom presets yet. Create one in the Review page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── TEMPLATES ── */}
          <TabsContent value="templates">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-cream">
                  Layout Templates
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allTemplates.map((template, idx) => (
                  <div
                    key={template.id}
                    data-ocid={`template.select.item.${idx + 1}`}
                    className="card-glow rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-display font-semibold text-cream">
                        {template.name}
                      </p>
                      {template.isBuiltIn && (
                        <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">
                          Built-in
                        </span>
                      )}
                    </div>
                    <TemplatePreview
                      template={template}
                      compact
                      className="w-full max-w-[100px] mx-auto"
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[9px] font-mono text-muted-foreground/60">
                          Layout
                        </span>
                        <span className="text-[9px] font-mono text-amber/60">
                          {template.layoutType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] font-mono text-muted-foreground/60">
                          Slots
                        </span>
                        <span className="text-[9px] font-mono text-amber/60">
                          {template.slots.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] font-mono text-muted-foreground/60">
                          Background
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2.5 h-2.5 rounded-sm border border-border/30"
                            style={{ background: template.background.value }}
                          />
                          <span className="text-[9px] font-mono text-amber/60">
                            {template.background.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── EVENT MODE ── */}
          <TabsContent value="eventmode">
            <div className="max-w-lg space-y-6">
              <div className="card-glow rounded-lg p-6 space-y-5">
                <div className="flex items-center gap-3">
                  {eventMode.isLocked ? (
                    <Lock className="w-5 h-5 text-amber" />
                  ) : (
                    <Unlock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-display text-sm font-semibold text-cream">
                      Event Mode
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Lock settings to prevent tampering during events
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-foreground">
                      Enable Event Mode
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Hides Settings nav, locks filter/template controls
                    </p>
                  </div>
                  <Switch
                    checked={eventMode.isLocked}
                    onCheckedChange={handleToggleEventMode}
                    data-ocid="settings.event_mode_toggle"
                  />
                </div>

                {eventMode.isLocked && (
                  <div className="rounded-md border border-amber/20 bg-amber/5 p-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber flex-shrink-0" />
                      <p className="text-xs text-amber font-mono">
                        Event Mode is currently active
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1.5">
                      Settings are hidden from the navigation. Toggle the lock
                      icon in the header or use the switch above to disable.
                    </p>
                  </div>
                )}

                <Separator className="bg-border/30" />

                {/* Active template selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground">
                    Locked Template
                  </Label>
                  <select
                    value={eventMode.activeTemplateId ?? ""}
                    onChange={(e) =>
                      setEventMode({
                        activeTemplateId: e.target.value || undefined,
                      })
                    }
                    className="w-full h-9 px-3 rounded-md bg-secondary/50 border border-border/60 text-cream text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  >
                    <option value="">Any template</option>
                    {allTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active filter selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground">
                    Locked Filter
                  </Label>
                  <select
                    value={eventMode.activeFilterPresetId ?? ""}
                    onChange={(e) =>
                      setEventMode({
                        activeFilterPresetId: e.target.value || undefined,
                      })
                    }
                    className="w-full h-9 px-3 rounded-md bg-secondary/50 border border-border/60 text-cream text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  >
                    <option value="">Any filter</option>
                    {[
                      ...BUILT_IN_FILTERS,
                      ...filterPresets.filter((p) => !p.isBuiltIn),
                    ].map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
