export interface Message {
  id: string,
  role: string,
  content: string,
  promptTokens: number,
  completionTokens: number,
  provider: string,
} 

export interface TextModelPricing {
  modelInputPrice: number,
  userBilledInputPrice: number,
  modelOutputPrice: number,
  userBilledOutputPrice: number,
}