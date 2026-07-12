import { NextRequest } from 'next/server';
import {
  AIProvider,
  detectProvider,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL
} from './aiClient';

// Tên header dùng để truyền cấu hình từ Client (Bring Your Own Key)
export const AI_PROVIDER_HEADER = 'x-ai-provider';
export const AI_KEY_HEADER = 'x-ai-key';
export const AI_MODEL_HEADER = 'x-ai-model';
export const AI_BASE_URL_HEADER = 'x-ai-base-url';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * Xác định cấu hình AI theo thứ tự ưu tiên:
 * 1. Key + provider do người dùng nhập trên giao diện (gửi qua header)
 * 2. Biến môi trường (.env.local): ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY
 * Nếu không có key nào -> apiKey = undefined (Route sẽ dùng cơ chế Fallback).
 */
export function resolveAIConfig(req: NextRequest): AIConfig {
  const headerKey = req.headers.get(AI_KEY_HEADER)?.trim() || undefined;
  const headerProviderRaw = req.headers.get(AI_PROVIDER_HEADER)?.trim();
  const headerModel = req.headers.get(AI_MODEL_HEADER)?.trim() || undefined;
  const headerBaseUrl = req.headers.get(AI_BASE_URL_HEADER)?.trim() || undefined;

  let provider: AIProvider | undefined =
    headerProviderRaw === 'anthropic' || headerProviderRaw === 'gemini' || headerProviderRaw === 'openai'
      ? headerProviderRaw
      : undefined;
  let apiKey: string | undefined = headerKey;
  let baseUrl: string | undefined = headerBaseUrl;

  // Nếu client không gửi key -> lấy từ biến môi trường
  if (!apiKey) {
    const envAnthropic = process.env.ANTHROPIC_API_KEY?.trim();
    const envGemini = process.env.GEMINI_API_KEY?.trim();
    const envOpenAI = process.env.OPENAI_API_KEY?.trim();
    if (envAnthropic) {
      provider = 'anthropic';
      apiKey = envAnthropic;
    } else if (envGemini) {
      provider = 'gemini';
      apiKey = envGemini;
    } else if (envOpenAI) {
      provider = 'openai';
      apiKey = envOpenAI;
      baseUrl = baseUrl || process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    }
  }

  // Nếu có key nhưng chưa rõ provider -> tự nhận diện theo tiền tố key
  if (apiKey && !provider) {
    provider = detectProvider(apiKey) || (baseUrl ? 'openai' : 'gemini');
  }

  // Chốt provider + base URL mặc định cho OpenAI
  const finalProvider: AIProvider = provider || 'gemini';
  if (finalProvider === 'openai' && !baseUrl) {
    baseUrl = 'https://api.openai.com/v1';
  }

  let model = headerModel;
  if (!model) {
    if (finalProvider === 'anthropic') {
      model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
    } else if (finalProvider === 'openai') {
      model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
    } else {
      model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    }
  }

  return { provider: finalProvider, apiKey, model, baseUrl };
}
