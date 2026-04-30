import { groq } from '@ai-sdk/groq';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export const models = {
    fast: google('gemini-2.5-flash-lite'),

    standard: google('gemini-2.5-flash'),

    complex: google('gemini-2.5-pro'),

    standard_2: google('gemma-4-31b-it'),

    standard_3: google('gemini-3-flash-preview'),

    standard_4: groq('openai/gpt-oss-120b'),

    standard_5: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

    standard_6: openrouter.chat('deepseek/deepseek-v4-flash'),
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