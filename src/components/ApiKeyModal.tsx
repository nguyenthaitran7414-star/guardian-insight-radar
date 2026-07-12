'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sparkles,
  Server
} from 'lucide-react';
import {
  AI_KEY_STORAGE,
  AI_MODEL_STORAGE,
  AI_PROVIDER_STORAGE,
  AI_BASE_URL_STORAGE
} from '../context/DataContext';

type Provider = 'gemini' | 'anthropic' | 'openai';

const PROVIDER_INFO: Record<
  Provider,
  { short: string; label: string; defaultModel: string; keyHint: string; getKeyUrl?: string; altModel: string; custom?: boolean }
> = {
  gemini: {
    short: 'Gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    keyHint: 'AIza...',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    altModel: 'gemini-2.0-flash'
  },
  anthropic: {
    short: 'Claude',
    label: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-5',
    keyHint: 'sk-ant-...',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    altModel: 'claude-haiku-4-5-20251001'
  },
  openai: {
    short: 'OpenAI',
    label: 'OpenAI (& dịch vụ tương thích)',
    defaultModel: 'gpt-4o-mini',
    keyHint: 'sk-...',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    altModel: 'gpt-4o',
    custom: true
  }
};

const DEFAULT_OPENAI_BASE = 'https://api.openai.com/v1';

// Tự nhận diện provider theo tiền tố key. Trả về null nếu không chắc.
function detectProvider(key: string): Provider | null {
  const k = key.trim();
  if (k.startsWith('sk-ant')) return 'anthropic';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-') || k.startsWith('sk-proj-')) return 'openai';
  return null;
}

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export default function ApiKeyModal({ open, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [provider, setProvider] = useState<Provider>('gemini');
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle' });
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (open) {
      const savedKey = localStorage.getItem(AI_KEY_STORAGE) || '';
      const savedProvider = (localStorage.getItem(AI_PROVIDER_STORAGE) as Provider) || detectProvider(savedKey) || 'gemini';
      setApiKey(savedKey);
      setModel(localStorage.getItem(AI_MODEL_STORAGE) || '');
      setBaseUrl(localStorage.getItem(AI_BASE_URL_STORAGE) || '');
      setProvider(['gemini', 'anthropic', 'openai'].includes(savedProvider) ? savedProvider : 'gemini');
      setTest({ status: 'idle' });
      setShowKey(false);
    }
  }, [open]);

  if (!open) return null;

  const info = PROVIDER_INFO[provider];
  const effectiveModel = model.trim() || info.defaultModel;
  const effectiveBaseUrl = baseUrl.trim() || DEFAULT_OPENAI_BASE;

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    setTest({ status: 'idle' });
    const detected = detectProvider(val);
    if (detected) {
      setProvider(detected);
      if (detected === 'openai' && !baseUrl.trim()) setBaseUrl(DEFAULT_OPENAI_BASE);
    }
  };

  const chooseProvider = (p: Provider) => {
    setProvider(p);
    setTest({ status: 'idle' });
    if (p === 'openai' && !baseUrl.trim()) setBaseUrl(DEFAULT_OPENAI_BASE);
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(AI_KEY_STORAGE, apiKey.trim());
      localStorage.setItem(AI_PROVIDER_STORAGE, provider);
    } else {
      localStorage.removeItem(AI_KEY_STORAGE);
      localStorage.removeItem(AI_PROVIDER_STORAGE);
    }
    if (model.trim()) localStorage.setItem(AI_MODEL_STORAGE, model.trim());
    else localStorage.removeItem(AI_MODEL_STORAGE);
    if (provider === 'openai') localStorage.setItem(AI_BASE_URL_STORAGE, effectiveBaseUrl);
    else localStorage.removeItem(AI_BASE_URL_STORAGE);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
    onSaved?.();
  };

  const handleClear = () => {
    localStorage.removeItem(AI_KEY_STORAGE);
    localStorage.removeItem(AI_MODEL_STORAGE);
    localStorage.removeItem(AI_PROVIDER_STORAGE);
    localStorage.removeItem(AI_BASE_URL_STORAGE);
    setApiKey('');
    setModel('');
    setBaseUrl('');
    setProvider('gemini');
    setTest({ status: 'idle' });
    onSaved?.();
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTest({ status: 'error', message: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }
    setTest({ status: 'testing' });
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-key': apiKey.trim(),
        'x-ai-provider': provider,
        'x-ai-model': effectiveModel
      };
      if (provider === 'openai') headers['x-ai-base-url'] = effectiveBaseUrl;
      const res = await fetch('/api/verify-key', { method: 'POST', headers, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.ok) {
        setTest({ status: 'success', message: `Kết nối thành công! ${data.providerLabel} · ${data.model}` });
      } else {
        setTest({ status: 'error', message: data.error || 'Không kết nối được.' });
      }
    } catch (e: any) {
      setTest({ status: 'error', message: 'Lỗi mạng khi kiểm tra kết nối.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="apple-glass rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-border-color text-secondary-text hover:text-primary-text transition-apple"
        >
          <X size={16} />
        </button>

        <div className="flex items-center space-x-3 text-accent-color">
          <KeyRound size={22} />
          <div>
            <h3 className="font-bold text-base text-primary-text">Cấu hình AI API</h3>
            <p className="text-[11px] text-secondary-text">Dùng key Gemini, Claude, hoặc endpoint tùy chỉnh để bật phân tích AI thật.</p>
          </div>
        </div>

        {/* Provider selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold tracking-wider text-secondary-text">Nhà cung cấp</label>
          <div className="grid grid-cols-3 gap-2">
            {(['gemini', 'anthropic', 'openai'] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => chooseProvider(p)}
                className={`flex items-center justify-center space-x-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold border transition-apple ${
                  provider === p
                    ? 'bg-accent-soft border-accent-color text-accent-color'
                    : 'bg-page-bg border-border-color text-secondary-text hover:text-primary-text'
                }`}
              >
                {p === 'openai' ? <Server size={13} /> : <Sparkles size={13} />}
                <span>{PROVIDER_INFO[p].short}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-secondary-text">
            {provider === 'openai'
              ? 'Dùng cho Groq, OpenRouter, DeepSeek, dịch vụ bán lại API... (bất kỳ endpoint tương thích OpenAI).'
              : 'Tự động nhận diện theo tiền tố key, hoặc bấm chọn thủ công.'}
          </p>
        </div>

        {/* Base URL (chỉ hiện cho endpoint tùy chỉnh) */}
        {provider === 'openai' && (
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-secondary-text">Base URL (endpoint)</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setTest({ status: 'idle' }); }}
              placeholder={DEFAULT_OPENAI_BASE}
              className="w-full bg-page-bg border border-border-color rounded-xl px-3.5 py-2.5 text-sm text-primary-text placeholder:text-secondary-text/60 focus:outline-none focus:ring-2 focus:ring-accent-color/40 transition-apple"
            />
            <p className="text-[10px] text-secondary-text">Mặc định là OpenAI (<span className="font-mono">{DEFAULT_OPENAI_BASE}</span>). Đổi sang địa chỉ khác nếu dùng Groq/OpenRouter/DeepSeek...</p>
          </div>
        )}

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold tracking-wider text-secondary-text">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={`Dán API Key vào đây (${info.keyHint})`}
              className="w-full bg-page-bg border border-border-color rounded-xl px-3.5 py-2.5 pr-10 text-sm text-primary-text placeholder:text-secondary-text/60 focus:outline-none focus:ring-2 focus:ring-accent-color/40 transition-apple"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-secondary-text hover:text-primary-text transition-apple"
              title={showKey ? 'Ẩn key' : 'Hiện key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold tracking-wider text-secondary-text">Model {provider === 'openai' ? '(nên nhập)' : '(tùy chọn)'}</label>
          <input
            type="text"
            value={model}
            onChange={(e) => { setModel(e.target.value); setTest({ status: 'idle' }); }}
            placeholder={info.defaultModel}
            className="w-full bg-page-bg border border-border-color rounded-xl px-3.5 py-2.5 text-sm text-primary-text placeholder:text-secondary-text/60 focus:outline-none focus:ring-2 focus:ring-accent-color/40 transition-apple"
          />
          <p className="text-[10px] text-secondary-text">Để trống dùng mặc định <span className="font-mono">{info.defaultModel}</span>. Nếu báo lỗi model, thử <span className="font-mono">{info.altModel}</span>.</p>
        </div>

        {test.status === 'success' && (
          <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{test.message}</span>
          </div>
        )}
        {test.status === 'error' && (
          <div className="flex items-start space-x-2 text-red-500 bg-red-500/10 rounded-xl px-3.5 py-2.5 text-xs">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <span>{test.message}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTest}
            disabled={test.status === 'testing'}
            className="flex items-center space-x-2 bg-page-bg border border-border-color hover:bg-border-color text-primary-text font-semibold text-xs px-4 py-2.5 rounded-xl transition-apple disabled:opacity-60"
          >
            {test.status === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            <span>{test.status === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-accent-color hover:bg-accent-hover text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-apple"
          >
            <CheckCircle2 size={14} />
            <span>{savedToast ? 'Đã lưu ✓' : 'Lưu cấu hình'}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center space-x-2 text-red-500 hover:bg-red-500/10 font-semibold text-xs px-4 py-2.5 rounded-xl transition-apple ml-auto"
            title="Xóa API Key đã lưu"
          >
            <Trash2 size={14} />
            <span>Xóa key</span>
          </button>
        </div>

        <div className="border-t border-border-color pt-3.5 space-y-2 text-[11px] text-secondary-text leading-relaxed">
          {info.getKeyUrl ? (
            <a
              href={info.getKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-accent-color hover:underline font-medium"
            >
              <ExternalLink size={12} />
              <span>Lấy API Key {info.label}</span>
            </a>
          ) : (
            <p className="text-secondary-text">Lấy API Key và Base URL từ trang quản trị của dịch vụ bạn đang dùng.</p>
          )}
          <p className="flex items-start space-x-1.5">
            <ShieldCheck size={13} className="shrink-0 mt-0.5 text-emerald-500" />
            <span>Key được lưu ngay trong trình duyệt của bạn (LocalStorage) và chỉ gửi tới máy chủ nội bộ của ứng dụng để gọi AI — không bị lộ ra ngoài hay nhúng vào mã nguồn.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
