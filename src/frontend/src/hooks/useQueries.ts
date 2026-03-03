import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BrandingConfig,
  FilterPreset,
  Session,
  Template,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ─────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────

export function useGetAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSessions();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      eventName: string;
      date: bigint;
      layoutType: string;
      photoCount: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createSession(
        vars.id,
        vars.eventName,
        vars.date,
        vars.layoutType,
        vars.photoCount,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────

export function useGetAllTemplates() {
  const { actor, isFetching } = useActor();
  return useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTemplates();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useCreateTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      layoutType: string;
      schemaJson: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTemplate(
        vars.id,
        vars.name,
        vars.layoutType,
        vars.schemaJson,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

// ─────────────────────────────────────────────
// Filter Presets
// ─────────────────────────────────────────────

export function useGetAllFilterPresets() {
  const { actor, isFetching } = useActor();
  return useQuery<FilterPreset[]>({
    queryKey: ["filterPresets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFilterPresets();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useCreateFilterPreset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      exposure: number;
      contrast: number;
      highlights: number;
      shadows: number;
      temperature: number;
      tint: number;
      grain: number;
      fade: number;
      sharpness: number;
      vignette: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createFilterPreset(
        vars.id,
        vars.name,
        vars.exposure,
        vars.contrast,
        vars.highlights,
        vars.shadows,
        vars.temperature,
        vars.tint,
        vars.grain,
        vars.fade,
        vars.sharpness,
        vars.vignette,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filterPresets"] }),
  });
}

// ─────────────────────────────────────────────
// Branding
// ─────────────────────────────────────────────

export function useGetBrandingConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<BrandingConfig | null>({
    queryKey: ["branding"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBrandingConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetBrandingConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: BrandingConfig) => {
      if (!actor) throw new Error("No actor");
      return actor.setBrandingConfig(config);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branding"] }),
  });
}

// ─────────────────────────────────────────────
// Event Mode
// ─────────────────────────────────────────────

export function useGetEventMode() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["eventMode"],
    queryFn: async () => {
      if (!actor) return { isLocked: false };
      return actor.getEventMode();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useSetEventMode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      isLocked: boolean;
      activeTemplateId?: string;
      activeFilterPresetId?: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setEventMode(
        vars.isLocked,
        vars.activeTemplateId ?? null,
        vars.activeFilterPresetId ?? null,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventMode"] }),
  });
}
