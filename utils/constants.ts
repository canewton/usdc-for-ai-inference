import type { TextModelPricing } from './types';

export const IMAGE_MODEL_PRICING = {
  replicatePrice: 0.003,
  userBilledPrice: 0.01,
};

export const MODEL_ASSET_PRICING = {
  replicatePrice: 0.01,
  userBilledPrice: 0.02,
};

export const TEXT_MODEL_PRICING: Record<string, TextModelPricing> = {
  'gpt-4o-mini': {
    modelInputPrice: 0.00000015,
    userBilledInputPrice: 0.00001115,
    modelOutputPrice: 0.0000006,
    userBilledOutputPrice: 0.0000116,
  },
  'gpt-4o': {
    modelInputPrice: 0.0000025,
    userBilledInputPrice: 0.00001125,
    modelOutputPrice: 0.00001,
    userBilledOutputPrice: 0.00111,
  },
};
