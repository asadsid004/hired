import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export const models = {
    fast: google('gemini-2.5-flash-lite'),

    standard: google('gemini-2.5-flash'),

    complex: google('gemini-2.5-pro'),

    standard_2: google('gemma-4-31b-it')
} as const;

export type ModelPreset = keyof typeof models;

export function getModel(preset: ModelPreset = 'standard'): LanguageModel {
    console.log(`Getting AI model for preset: ${preset}`);
    const model = models[preset];
    if (!model) {
        console.error(`Model preset "${preset}" not found!`);
    }
    return model as LanguageModel;
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