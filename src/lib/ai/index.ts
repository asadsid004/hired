import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export const models = {
    fast: google('gemini-2.5-flash-lite'),

    standard: google('gemini-3-flash-preview'),

    complex: google('gemini-3-pro-preview'),
} as const;

export type ModelPreset = keyof typeof models;

export function getModel(preset: ModelPreset = 'complex'): LanguageModel {
    return models[preset] as LanguageModel;
}