import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Session {
    id: string;
    date: Time;
    createdAt: Time;
    photoCount: bigint;
    layoutType: string;
    eventName: string;
}
export type Time = bigint;
export interface EventMode {
    activeTemplateId?: string;
    activeFilterPresetId?: string;
    isLocked: boolean;
}
export interface BrandingConfig {
    color: string;
    enabled: boolean;
    logoUrl: string;
    fontFamily: string;
    photographerName: string;
    fontSize: bigint;
    positionX: number;
    positionY: number;
    opacity: number;
}
export interface FilterPreset {
    id: string;
    exposure: number;
    sharpness: number;
    vignette: number;
    contrast: number;
    temperature: number;
    fade: number;
    name: string;
    createdAt: Time;
    tint: number;
    shadows: number;
    highlights: number;
    grain: number;
}
export interface Template {
    id: string;
    schemaJson: string;
    name: string;
    createdAt: Time;
    layoutType: string;
}
export interface backendInterface {
    createFilterPreset(id: string, name: string, exposure: number, contrast: number, highlights: number, shadows: number, temperature: number, tint: number, grain: number, fade: number, sharpness: number, vignette: number): Promise<void>;
    createSession(id: string, eventName: string, date: Time, layoutType: string, photoCount: bigint): Promise<void>;
    createTemplate(id: string, name: string, layoutType: string, schemaJson: string): Promise<void>;
    getAllFilterPresets(): Promise<Array<FilterPreset>>;
    getAllSessions(): Promise<Array<Session>>;
    getAllTemplates(): Promise<Array<Template>>;
    getBrandingConfig(): Promise<BrandingConfig | null>;
    getEventMode(): Promise<EventMode>;
    getFilterPreset(id: string): Promise<FilterPreset>;
    getSession(id: string): Promise<Session>;
    getTemplate(id: string): Promise<Template>;
    setBrandingConfig(config: BrandingConfig): Promise<void>;
    setEventMode(isLocked: boolean, activeTemplateId: string | null, activeFilterPresetId: string | null): Promise<void>;
}
