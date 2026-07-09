import { siteConfig } from "@/lib/site";

export type OpenRouterRole = "system" | "user" | "assistant" | "tool";

export type OpenRouterMessage = {
  role: OpenRouterRole;
  content: string;
  name?: string;
};

export type OpenRouterCallOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  referer?: string;
  appTitle?: string;
  signal?: AbortSignal;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

function getApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }
  return apiKey;
}

function getHeaders(options: OpenRouterCallOptions) {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "HTTP-Referer": options.referer || process.env.OPENROUTER_SITE_URL || siteConfig.url,
    "X-OpenRouter-Title": options.appTitle || process.env.OPENROUTER_APP_NAME || siteConfig.name,
  };
}

export async function callOpenRouter(messages: OpenRouterMessage[], options: OpenRouterCallOptions = {}) {
  const model = options.model || process.env.OPENROUTER_MODEL || "~openai/gpt-latest";
  const payloadMessages = options.systemPrompt
    ? [{ role: "system" as const, content: options.systemPrompt }, ...messages]
    : messages;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: getHeaders(options),
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      temperature: options.temperature,
      top_p: options.topP,
      max_tokens: options.maxTokens,
    }),
    signal: options.signal,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as OpenRouterResponse;
  return {
    model: data.model || model,
    text: data.choices?.[0]?.message?.content?.trim() || "",
    usage: data.usage || null,
    raw: data,
  };
}

export async function askOpenRouter(prompt: string, options: OpenRouterCallOptions = {}) {
  return callOpenRouter([{ role: "user", content: prompt }], options);
}
