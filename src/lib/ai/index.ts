import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export const models = {
    fast: google('gemini-2.5-flash-lite'),

    standard: google('gemini-2.5-flash'),

    complex: google('gemini-2.5-pro'),
} as const;

export type ModelPreset = keyof typeof models;

export function getModel(preset: ModelPreset = 'standard'): LanguageModel {
    return models[preset] as LanguageModel;
}

export function getEmbeddingModel() {
    return {
        model: google.embedding('gemini-embedding-001'),
        providerOptions: {
            google: {
                taskType: 'SEMANTIC_SIMILARITY',
                outputDimensionality: 768,
            }
        }
    };
}