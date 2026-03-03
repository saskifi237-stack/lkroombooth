import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FilterParams {
  exposure: number; // -1 to +1
  contrast: number; // 0 to 2
  highlights: number; // 0 to 1
  shadows: number; // 0 to 1
  temperature: number; // -1 to +1
  tint: number; // -1 to +1
  grain: number; // 0 to 1
  fade: number; // 0 to 1
  sharpness: number; // 0 to 1
  vignette: number; // 0 to 1
}

export interface LocalFilterPreset {
  id: string;
  name: string;
  params: FilterParams;
  isBuiltIn?: boolean;
  createdAt: number;
}

export interface TemplateOverlay {
  id: string;
  type: "text" | "sticker" | "datetime" | "event-title";
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  locked: boolean;
  fontFamily?: string;
  width?: number;
  opacity?: number;
}

export interface TemplateSlot {
  index: number;
  x: number; // percent
  y: number; // percent
  width: number; // percent
  height: number; // percent
}

export interface TemplateBackground {
  type: "solid" | "gradient";
  value: string;
  value2?: string;
}

export interface LocalTemplate {
  id: string;
  name: string;
  layoutType: "strip_1x4" | "grid_2x2" | "strip_3x1";
  background: TemplateBackground;
  slots: TemplateSlot[];
  overlays: TemplateOverlay[];
  branding: {
    enabled: boolean;
    position:
      | "bottom-right"
      | "bottom-left"
      | "bottom-center"
      | "top-right"
      | "top-left";
  };
  isBuiltIn?: boolean;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  slotIndex: number;
  blobHash?: string;
}

export interface ActiveSession {
  id: string;
  eventName: string;
  layoutType: string;
  templateId: string;
  filterId: string | null;
  photos: CapturedPhoto[];
  createdAt: number;
  countdown: number;
  burstCount: number;
}

export interface BrandingState {
  enabled: boolean;
  photographerName: string;
  logoUrl: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  positionX: number;
  positionY: number;
}

export interface EventModeState {
  isLocked: boolean;
  activeTemplateId?: string;
  activeFilterPresetId?: string;
}

// ─────────────────────────────────────────────
// Built-in presets
// ─────────────────────────────────────────────

export const NEUTRAL_FILTER: FilterParams = {
  exposure: 0,
  contrast: 1,
  highlights: 0.5,
  shadows: 0.5,
  temperature: 0,
  tint: 0,
  grain: 0,
  fade: 0,
  sharpness: 0,
  vignette: 0,
};

export const BUILT_IN_FILTERS: LocalFilterPreset[] = [
  {
    id: "natural",
    name: "Natural",
    isBuiltIn: true,
    createdAt: 0,
    params: { ...NEUTRAL_FILTER },
  },
  {
    id: "film-noir",
    name: "Film Noir",
    isBuiltIn: true,
    createdAt: 0,
    params: {
      exposure: -0.1,
      contrast: 1.5,
      highlights: 0.2,
      shadows: 0.1,
      temperature: -0.2,
      tint: -0.05,
      grain: 0.45,
      fade: 0.05,
      sharpness: 0.6,
      vignette: 0.75,
    },
  },
  {
    id: "soft-glow",
    name: "Soft Glow",
    isBuiltIn: true,
    createdAt: 0,
    params: {
      exposure: 0.2,
      contrast: 0.85,
      highlights: 0.65,
      shadows: 0.55,
      temperature: 0.3,
      tint: 0.05,
      grain: 0.08,
      fade: 0.12,
      sharpness: 0.1,
      vignette: 0.15,
    },
  },
  {
    id: "matte-film",
    name: "Matte Film",
    isBuiltIn: true,
    createdAt: 0,
    params: {
      exposure: 0.05,
      contrast: 0.75,
      highlights: 0.45,
      shadows: 0.55,
      temperature: 0.1,
      tint: 0,
      grain: 0.35,
      fade: 0.38,
      sharpness: 0.15,
      vignette: 0.2,
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    isBuiltIn: true,
    createdAt: 0,
    params: {
      exposure: -0.05,
      contrast: 1.35,
      highlights: 0.35,
      shadows: 0.3,
      temperature: -0.45,
      tint: -0.2,
      grain: 0.2,
      fade: 0.05,
      sharpness: 0.4,
      vignette: 0.4,
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    isBuiltIn: true,
    createdAt: 0,
    params: {
      exposure: 0.15,
      contrast: 0.95,
      highlights: 0.55,
      shadows: 0.65,
      temperature: 0.5,
      tint: 0.1,
      grain: 0.15,
      fade: 0.18,
      sharpness: 0.2,
      vignette: 0.25,
    },
  },
];

// ─────────────────────────────────────────────
// Built-in templates (slot positions as percent)
// ─────────────────────────────────────────────

export const BUILT_IN_TEMPLATES: LocalTemplate[] = [
  {
    id: "classic-strip",
    name: "Classic Strip",
    layoutType: "strip_1x4",
    isBuiltIn: true,
    background: { type: "solid", value: "#f5f0eb" },
    slots: [
      { index: 0, x: 8, y: 3, width: 84, height: 21 },
      { index: 1, x: 8, y: 27, width: 84, height: 21 },
      { index: 2, x: 8, y: 51, width: 84, height: 21 },
      { index: 3, x: 8, y: 75, width: 84, height: 21 },
    ],
    overlays: [
      {
        id: "ov1",
        type: "event-title",
        content: "Photo Booth",
        x: 50,
        y: 97.5,
        fontSize: 9,
        color: "#3a3028",
        locked: false,
        fontFamily: "Geist Mono",
        opacity: 1,
      },
    ],
    branding: { enabled: true, position: "bottom-right" },
  },
  {
    id: "grid-2x2",
    name: "Grid 2×2",
    layoutType: "grid_2x2",
    isBuiltIn: true,
    background: { type: "solid", value: "#1a1816" },
    slots: [
      { index: 0, x: 4, y: 4, width: 44, height: 44 },
      { index: 1, x: 52, y: 4, width: 44, height: 44 },
      { index: 2, x: 4, y: 52, width: 44, height: 44 },
      { index: 3, x: 52, y: 52, width: 44, height: 44 },
    ],
    overlays: [
      {
        id: "ov2",
        type: "event-title",
        content: "Event Name",
        x: 50,
        y: 98,
        fontSize: 10,
        color: "#c8b89a",
        locked: false,
        fontFamily: "Geist Mono",
        opacity: 0.8,
      },
    ],
    branding: { enabled: true, position: "bottom-center" },
  },
  {
    id: "trio-strip",
    name: "Trio Strip",
    layoutType: "strip_3x1",
    isBuiltIn: true,
    background: { type: "solid", value: "#f2ede8" },
    slots: [
      { index: 0, x: 8, y: 4, width: 84, height: 28.5 },
      { index: 1, x: 8, y: 36, width: 84, height: 28.5 },
      { index: 2, x: 8, y: 68, width: 84, height: 28.5 },
    ],
    overlays: [
      {
        id: "ov3",
        type: "datetime",
        content: "",
        x: 50,
        y: 98,
        fontSize: 8,
        color: "#4a3f35",
        locked: true,
        fontFamily: "Geist Mono",
        opacity: 0.7,
      },
    ],
    branding: { enabled: true, position: "bottom-right" },
  },
];

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

interface PhotoboothStore {
  // Session
  activeSession: ActiveSession | null;
  setActiveSession: (s: ActiveSession | null) => void;
  updateSession: (partial: Partial<ActiveSession>) => void;

  // Templates
  templates: LocalTemplate[];
  setTemplates: (t: LocalTemplate[]) => void;
  addTemplate: (t: LocalTemplate) => void;

  // Filters
  filterPresets: LocalFilterPreset[];
  setFilterPresets: (f: LocalFilterPreset[]) => void;
  addFilterPreset: (f: LocalFilterPreset) => void;
  activeFilter: FilterParams;
  setActiveFilter: (f: FilterParams) => void;

  // Branding
  branding: BrandingState;
  setBranding: (b: Partial<BrandingState>) => void;

  // Event mode
  eventMode: EventModeState;
  setEventMode: (e: Partial<EventModeState>) => void;

  // UI state
  flashActive: boolean;
  setFlashActive: (v: boolean) => void;
}

export const usePhotoboothStore = create<PhotoboothStore>()(
  persist(
    (set) => ({
      activeSession: null,
      setActiveSession: (s) => set({ activeSession: s }),
      updateSession: (partial) =>
        set((state) =>
          state.activeSession
            ? { activeSession: { ...state.activeSession, ...partial } }
            : {},
        ),

      templates: BUILT_IN_TEMPLATES,
      setTemplates: (t) => set({ templates: t }),
      addTemplate: (t) =>
        set((state) => ({ templates: [...state.templates, t] })),

      filterPresets: BUILT_IN_FILTERS,
      setFilterPresets: (f) => set({ filterPresets: f }),
      addFilterPreset: (f) =>
        set((state) => ({ filterPresets: [...state.filterPresets, f] })),
      activeFilter: NEUTRAL_FILTER,
      setActiveFilter: (f) => set({ activeFilter: f }),

      branding: {
        enabled: true,
        photographerName: "Studio Lumière",
        logoUrl: "",
        fontFamily: "Geist Mono",
        fontSize: 12,
        color: "#c8b89a",
        opacity: 0.9,
        positionX: 92,
        positionY: 97,
      },
      setBranding: (b) =>
        set((state) => ({ branding: { ...state.branding, ...b } })),

      eventMode: { isLocked: false },
      setEventMode: (e) =>
        set((state) => ({ eventMode: { ...state.eventMode, ...e } })),

      flashActive: false,
      setFlashActive: (v) => set({ flashActive: v }),
    }),
    {
      name: "photobooth-store",
      partialize: (state) => ({
        templates: state.templates,
        filterPresets: state.filterPresets,
        branding: state.branding,
        eventMode: state.eventMode,
      }),
    },
  ),
);
