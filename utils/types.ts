export interface ImageMessage {
  id: string;
  role: string;
  imageUrl: string;
  prompt: string;
  cost: number;
  provider: string;
  downloadable: boolean;
}

export interface TextModelPricing {
  modelInputPrice: number;
  userBilledInputPrice: number;
  modelOutputPrice: number;
  userBilledOutputPrice: number;
}

export interface BaseMessage {
  id: string;
  role: string;
  provider?: string;
  content?: string;
  url?: string;
  promptTokens?: number;
  completionTokens?: number;
  parts?: any[];
  cost?: number;
  downloadable?: boolean;
  prompt?: string;
  imageUrl?: string;
}
