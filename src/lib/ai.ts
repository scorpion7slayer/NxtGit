import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import { useAuthStore } from "../stores/authStore";
import { open } from "@tauri-apps/plugin-shell";

const settingsStore = new LazyStore("settings.json");

// ---------- Copilot OAuth device flow (VS Code client ID) ----------

const COPILOT_CLIENT_ID = "Iv1.b507a08c87ecfe98";

export interface CopilotDeviceCode {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export async function startCopilotDeviceFlow(): Promise<CopilotDeviceCode> {
    const res = await tauriFetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: COPILOT_CLIENT_ID,
            scope: "read:user",
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GitHub device flow error ${res.status}: ${body}`);
    }
    const data = (await res.json()) as CopilotDeviceCode;
    // Validate verification_uri to prevent open redirect
    if (
        !data.verification_uri ||
        !data.verification_uri.startsWith("https://github.com/")
    ) {
        throw new Error("Invalid verification URI from GitHub");
    }
    await open(data.verification_uri);
    return data;
}

export async function pollCopilotToken(
    deviceCode: string,
    interval: number,
    expiresAt: number,
): Promise<string> {
    while (Date.now() < expiresAt) {
        await new Promise((r) => setTimeout(r, interval));

        const res = await tauriFetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    client_id: COPILOT_CLIENT_ID,
                    device_code: deviceCode,
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                }),
            },
        );

        const text = await res.text();
        let data: Record<string, string>;
        try {
            data = JSON.parse(text);
        } catch {
            continue;
        }

        if (data.error === "authorization_pending") continue;
        if (data.error === "slow_down") {
            interval += 5000;
            continue;
        }
        if (data.error) throw new Error(data.error_description || data.error);
        if (data.access_token) {
            await useAuthStore.getState().setCopilotToken(data.access_token);
            return data.access_token;
        }
    }
    throw new Error("Device flow expired. Please try again.");
}

// ---------- Copilot API token exchange ----------

interface CopilotApiToken {
    token: string;
    expiresAt: number; // ms
}

let copilotApiTokenCache: CopilotApiToken | null = null;

async function getCopilotToken(): Promise<string> {
    if (
        copilotApiTokenCache &&
        Date.now() < copilotApiTokenCache.expiresAt - 60_000
    ) {
        return copilotApiTokenCache.token;
    }

    const copilotGhToken = useAuthStore.getState().copilotGithubToken;
    if (!copilotGhToken) {
        throw new Error(
            "GitHub Copilot not connected. Go to Settings to connect your Copilot account.",
        );
    }

    const res = await tauriFetch(
        "https://api.github.com/copilot_internal/v2/token",
        {
            method: "GET",
            headers: {
                Authorization: `token ${copilotGhToken}`,
                Accept: "application/json",
                "User-Agent": "GitHubCopilotChat/0.26.7",
                "editor-version": "vscode/1.97.0",
                "editor-plugin-version": "copilot-chat/0.26.7",
            },
        },
    );

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
            // Token expired or revoked — clear it
            await useAuthStore.getState().clearCopilotToken();
            copilotApiTokenCache = null;
            throw new Error(
                "Copilot token expired. Please reconnect in Settings.",
            );
        }
        throw new Error(
            `Failed to get Copilot token: ${res.status} ${errText}`,
        );
    }

    const data = (await res.json()) as {
        token: string;
        expires_at: number;
        refresh_in: number;
    };
    copilotApiTokenCache = {
        token: data.token,
        expiresAt: data.expires_at * 1000,
    };
    return data.token;
}

export interface AIModel {
    id: string;
    name: string;
}

export interface AIProvider {
    id: string;
    name: string;
    placeholder: string;
    description: string;
    defaultModel: string;
    baseURL: string;
    models: AIModel[];
    usesOAuth?: boolean;
    modelsEndpoint?: string;
    customBaseURL?: boolean; // user can override baseURL (e.g. Ollama)
    apiKeyOptional?: boolean; // key not required (e.g. local Ollama)
}

export const AI_PROVIDERS: AIProvider[] = [
    {
        id: "github-copilot",
        name: "GitHub Copilot",
        placeholder: "",
        description: "Uses your GitHub OAuth token — no extra key needed",
        defaultModel: "gpt-4o",
        baseURL: "https://api.githubcopilot.com",
        usesOAuth: true,
        modelsEndpoint: "/models",
        models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "o3-mini", name: "o3-mini" },
            { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
        ],
    },
    {
        id: "openrouter",
        name: "OpenRouter",
        placeholder: "sk-or-...",
        description: "Access multiple AI models through one API",
        defaultModel: "anthropic/claude-sonnet-4-20250514",
        baseURL: "https://openrouter.ai/api/v1",
        modelsEndpoint: "/models",
        models: [
            {
                id: "anthropic/claude-sonnet-4-20250514",
                name: "Claude Sonnet 4",
            },
            { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
            { id: "openai/gpt-4o", name: "GPT-4o" },
            { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
            { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3" },
            { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
        ],
    },
    {
        id: "anthropic",
        name: "Anthropic",
        placeholder: "sk-ant-...",
        description: "Claude models",
        defaultModel: "claude-sonnet-4-20250514",
        baseURL: "https://api.anthropic.com",
        models: [
            { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
            { id: "claude-sonnet-4-5-20250514", name: "Claude Sonnet 4.5" },
            { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
            { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
        ],
    },
    {
        id: "openai",
        name: "OpenAI",
        placeholder: "sk-...",
        description: "GPT models",
        defaultModel: "gpt-4o",
        baseURL: "https://api.openai.com/v1",
        modelsEndpoint: "/models",
        models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
            { id: "o3-mini", name: "o3-mini" },
        ],
    },
    {
        id: "moonshot",
        name: "Moonshot AI",
        placeholder: "sk-...",
        description: "Kimi AI models",
        defaultModel: "moonshot-v1-8k",
        baseURL: "https://api.moonshot.cn/v1",
        modelsEndpoint: "/models",
        models: [
            { id: "moonshot-v1-8k", name: "Moonshot V1 8K" },
            { id: "moonshot-v1-32k", name: "Moonshot V1 32K" },
            { id: "moonshot-v1-128k", name: "Moonshot V1 128K" },
        ],
    },
    {
        id: "kilocode",
        name: "Kilocode",
        placeholder: "kc-...",
        description: "Kilocode AI assistant",
        defaultModel: "kilocode-v1",
        baseURL: "https://api.kilocode.ai/v1",
        models: [{ id: "kilocode-v1", name: "Kilocode V1" }],
    },
    {
        id: "minimax",
        name: "MiniMax",
        placeholder: "eyJ...",
        description: "MiniMax AI models",
        defaultModel: "MiniMax-Text-01",
        baseURL: "https://api.minimax.chat/v1",
        models: [
            { id: "MiniMax-Text-01", name: "MiniMax Text 01" },
            { id: "MiniMax-Text-02", name: "MiniMax Text 02" },
        ],
    },
    {
        id: "ollama",
        name: "Ollama",
        placeholder: "ollama (or cloud key)",
        description: "Local or Ollama Cloud — URL configurable",
        defaultModel: "llama3",
        baseURL: "http://localhost:11434",
        customBaseURL: true,
        apiKeyOptional: true,
        modelsEndpoint: "/api/tags",
        models: [
            { id: "llama3", name: "Llama 3" },
            { id: "qwen3", name: "Qwen 3" },
            { id: "deepseek-r1", name: "DeepSeek R1" },
            { id: "gemma3", name: "Gemma 3" },
            { id: "phi4", name: "Phi 4" },
            { id: "mistral", name: "Mistral" },
        ],
    },
];

// ---------- helpers ----------

export function getModelsForProvider(providerId: string): AIModel[] {
    return AI_PROVIDERS.find((p) => p.id === providerId)?.models || [];
}

export async function getApiKey(providerId: string): Promise<string | null> {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (provider?.usesOAuth) {
        // For Copilot, exchange the GitHub token for a Copilot-specific token
        try {
            return await getCopilotToken();
        } catch {
            return null;
        }
    }
    try {
        const keys = await settingsStore.get<Record<string, string>>("apiKeys");
        const key = keys?.[providerId] || null;
        // Ollama: return a default key if none set (local doesn't need one)
        if (!key && provider?.apiKeyOptional) return "ollama";
        return key;
    } catch {
        if (provider?.apiKeyOptional) return "ollama";
        return null;
    }
}

// ---------- Ollama custom base URL ----------

export async function getOllamaBaseURL(): Promise<string> {
    try {
        const url = await settingsStore.get<string>("ollamaBaseURL");
        return url || "http://localhost:11434";
    } catch {
        return "http://localhost:11434";
    }
}

export async function setOllamaBaseURL(url: string): Promise<void> {
    // Validate URL to prevent SSRF
    const trimmed = url.trim();
    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new Error("Invalid URL format");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only http and https URLs are allowed");
    }
    await settingsStore.set("ollamaBaseURL", trimmed);
    await settingsStore.save();
}

async function resolveBaseURL(provider: AIProvider): Promise<string> {
    if (provider.id === "ollama") {
        return await getOllamaBaseURL();
    }
    return provider.baseURL;
}

// ---------- fetch models from API ----------

const modelsCache = new Map<string, { models: AIModel[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchProviderModels(
    providerId: string,
): Promise<AIModel[]> {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider?.modelsEndpoint) return provider?.models || [];

    const cached = modelsCache.get(providerId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.models;

    const apiKey = await getApiKey(providerId);
    if (!apiKey) return provider.models;

    try {
        const headers: Record<string, string> = {
            Accept: "application/json",
            "User-Agent": "NxtGit/0.1.0",
        };

        if (providerId === "anthropic") {
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2023-06-01";
        } else if (providerId === "github-copilot") {
            headers["Authorization"] = `Bearer ${apiKey}`;
            headers["copilot-integration-id"] = "vscode-chat";
            headers["editor-version"] = "vscode/1.97.0";
            headers["editor-plugin-version"] = "copilot-chat/0.26.7";
            headers["openai-intent"] = "conversation-panel";
            headers["x-github-api-version"] = "2025-04-01";
        } else if (providerId === "ollama") {
            // Ollama only needs auth header for cloud
            if (apiKey && apiKey !== "ollama") {
                headers["Authorization"] = `Bearer ${apiKey}`;
            }
        } else {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const baseURL = await resolveBaseURL(provider);
        const modelsURL =
            providerId === "ollama"
                ? `${baseURL}${provider.modelsEndpoint}`
                : `${provider.baseURL}${provider.modelsEndpoint}`;

        const res = await tauriFetch(modelsURL, {
            method: "GET",
            headers,
        });
        if (!res.ok) return provider.models;

        const raw = await res.json();

        // Ollama uses { models: [{ name, ... }] } for /api/tags
        if (providerId === "ollama") {
            const ollamaData = raw as {
                models?: {
                    name: string;
                    modified_at?: string;
                    size?: number;
                }[];
            };
            const list = ollamaData.models;
            if (!Array.isArray(list) || list.length === 0)
                return provider.models;

            const models: AIModel[] = list
                .map((m) => ({
                    id: m.name,
                    name: m.name,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            modelsCache.set(providerId, { models, ts: Date.now() });
            provider.models = models;
            return models;
        }

        const data = raw as {
            data?: {
                id: string;
                name?: string;
                model_picker_enabled?: boolean;
            }[];
        };
        const list = data.data;
        if (!Array.isArray(list) || list.length === 0) return provider.models;

        // Filter / map to friendly names
        const models: AIModel[] = list
            .filter((m) => {
                // Copilot models have a model_picker_enabled flag
                if (providerId === "github-copilot") {
                    return m.model_picker_enabled !== false;
                }
                const id = m.id.toLowerCase();
                // Filter out embedding / moderation / tts / whisper / dall-e models
                if (id.includes("embedding") || id.includes("moderation"))
                    return false;
                if (
                    id.includes("tts") ||
                    id.includes("whisper") ||
                    id.includes("dall-e")
                )
                    return false;
                return true;
            })
            .map((m) => ({
                id: m.id,
                name: m.name || m.id,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (models.length === 0) return provider.models;

        modelsCache.set(providerId, { models, ts: Date.now() });

        // Also update the static list so getModelsForProvider works immediately
        provider.models = models;

        return models;
    } catch {
        return provider.models;
    }
}

// ---------- streaming chat (direct SSE) ----------

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    thinking?: string;
    attachments?: {
        name: string;
        type: "file" | "folder" | "repo";
        content?: string;
        repo?: string;
    }[];
}

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onThinking?: (text: string) => void;
}

function buildHeaders(
    providerId: string,
    apiKey: string,
): Record<string, string> {
    const base: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "NxtGit/0.1.0",
    };

    if (providerId === "anthropic") {
        base["x-api-key"] = apiKey;
        base["anthropic-version"] = "2023-06-01";
    } else if (providerId === "github-copilot") {
        base["Authorization"] = `Bearer ${apiKey}`;
        base["copilot-integration-id"] = "vscode-chat";
        base["editor-version"] = "vscode/1.97.0";
        base["editor-plugin-version"] = "copilot-chat/0.26.7";
        base["openai-intent"] = "conversation-panel";
        base["x-github-api-version"] = "2025-04-01";
    } else if (providerId === "ollama") {
        // Ollama: only add auth for cloud (non-default key)
        if (apiKey && apiKey !== "ollama") {
            base["Authorization"] = `Bearer ${apiKey}`;
        }
    } else {
        base["Authorization"] = `Bearer ${apiKey}`;
    }
    return base;
}

function buildBody(
    providerId: string,
    modelId: string,
    messages: ChatMessage[],
): string {
    if (providerId === "anthropic") {
        // Anthropic Messages API format
        const systemMsg = messages.find((m) => m.role === "system");
        const nonSystem = messages.filter((m) => m.role !== "system");

        // Enable extended thinking for models that support it (claude-sonnet-4-5, claude-opus-4, etc.)
        const supportsThinking =
            modelId.includes("claude-3-7") ||
            modelId.includes("claude-sonnet-4-5") ||
            modelId.includes("claude-opus-4");

        return JSON.stringify({
            model: modelId,
            max_tokens: supportsThinking ? 16384 : 4096,
            stream: true,
            ...(supportsThinking
                ? { thinking: { type: "enabled", budget_tokens: 8192 } }
                : {}),
            ...(systemMsg ? { system: systemMsg.content } : {}),
            messages: nonSystem.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
    }

    // OpenRouter: add reasoning config for models that support it
    if (providerId === "openrouter") {
        const supportsReasoning =
            modelId.includes("claude-sonnet-4-5") ||
            modelId.includes("claude-opus-4") ||
            modelId.includes("claude-3-7") ||
            modelId.includes("deepseek-r1") ||
            modelId.includes("/o1") ||
            modelId.includes("/o3") ||
            modelId.includes("/o4");

        return JSON.stringify({
            model: modelId,
            stream: true,
            ...(supportsReasoning ? { reasoning: { max_tokens: 8000 } } : {}),
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
    }

    // OpenAI: add reasoning_effort for o-series models
    if (providerId === "openai" || providerId === "github-copilot") {
        const isReasoningModel =
            modelId.startsWith("o1") ||
            modelId.startsWith("o3") ||
            modelId.startsWith("o4");

        return JSON.stringify({
            model: modelId,
            stream: true,
            ...(isReasoningModel ? { reasoning_effort: "medium" } : {}),
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
    }

    // Ollama native API (not OpenAI compat) — use /api/chat with think param
    if (providerId === "ollama") {
        return JSON.stringify({
            model: modelId,
            stream: true,
            think: true,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
    }

    // Other OpenAI-compatible providers (Moonshot, Kilocode, MiniMax)
    return JSON.stringify({
        model: modelId,
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
}

function chatEndpoint(baseURL: string, provider: AIProvider): string {
    if (provider.id === "anthropic") {
        return `${baseURL}/v1/messages`;
    }
    if (provider.id === "ollama") {
        return `${baseURL}/api/chat`;
    }
    return `${baseURL}/chat/completions`;
}

export async function streamChat(
    providerId: string,
    messages: ChatMessage[],
    onChunk: ((text: string) => void) | StreamCallbacks,
    signal?: AbortSignal,
    modelId?: string,
): Promise<{ content: string; thinking: string }> {
    const callbacks: StreamCallbacks =
        typeof onChunk === "function" ? { onChunk } : onChunk;

    let apiKey: string | null = null;
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (provider?.usesOAuth) {
        const githubToken = useAuthStore.getState().token;
        if (!githubToken)
            throw new Error("Please sign in with GitHub to use Copilot.");
        apiKey = await getCopilotToken();
    } else {
        apiKey = await getApiKey(providerId);
    }
    if (!apiKey) {
        throw new Error(
            `No API key configured for ${provider?.name || providerId}. Go to Settings to add one.`,
        );
    }

    if (!provider) throw new Error(`Unknown provider: ${providerId}`);

    const selectedModel = modelId || provider.defaultModel;
    const baseURL = await resolveBaseURL(provider);
    const url = chatEndpoint(baseURL, provider);
    const headers = buildHeaders(providerId, apiKey);
    const body = buildBody(providerId, selectedModel, messages);

    const res = await tauriFetch(url, {
        method: "POST",
        headers,
        body,
        signal,
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(
            `${provider.name} error ${res.status}: ${errText || res.statusText}`,
        );
    }

    // Use ReadableStream for true incremental streaming
    if (res.body) {
        if (providerId === "anthropic") {
            return streamAnthropicSSE(res.body, callbacks);
        }
        if (providerId === "ollama") {
            return streamOllamaNDJSON(res.body, callbacks);
        }
        return streamOpenAISSE(res.body, callbacks);
    }

    // Fallback: download full response then parse (no streaming effect)
    const text = await res.text();
    if (providerId === "anthropic") {
        return parseSyncAnthropicSSE(text, callbacks);
    }
    return parseSyncOpenAISSE(text, callbacks);
}

// ---------- true streaming parsers (ReadableStream) ----------

async function streamOpenAISSE(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks,
): Promise<{ content: string; thinking: string }> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let thinking = "";
    let inThink = false;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") return { content, thinking };
                try {
                    const obj = JSON.parse(payload) as {
                        choices?: {
                            delta?: {
                                content?: string;
                                reasoning_content?: string;
                                reasoning_details?: {
                                    type?: string;
                                    text?: string;
                                    summary?: string;
                                }[];
                            };
                        }[];
                    };
                    // OpenAI/DeepSeek: reasoning_content
                    const reasoning =
                        obj.choices?.[0]?.delta?.reasoning_content;
                    if (reasoning) {
                        thinking += reasoning;
                        callbacks.onThinking?.(reasoning);
                        continue;
                    }
                    // OpenRouter: reasoning_details array
                    const details = obj.choices?.[0]?.delta?.reasoning_details;
                    if (details && Array.isArray(details)) {
                        for (const d of details) {
                            const rText = d.text || d.summary || "";
                            if (rText) {
                                thinking += rText;
                                callbacks.onThinking?.(rText);
                            }
                        }
                        continue;
                    }
                    const text = obj.choices?.[0]?.delta?.content;
                    if (text) {
                        const processed = processThinkTags(
                            text,
                            inThink,
                            (t) => {
                                thinking += t;
                                callbacks.onThinking?.(t);
                            },
                            (t) => {
                                content += t;
                                callbacks.onChunk(t);
                            },
                        );
                        inThink = processed.inThink;
                    }
                } catch {
                    /* skip malformed */
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    return { content, thinking };
}

async function streamOllamaNDJSON(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks,
): Promise<{ content: string; thinking: string }> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let thinking = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    const obj = JSON.parse(trimmed) as {
                        message?: {
                            content?: string;
                            thinking?: string;
                        };
                        done?: boolean;
                    };
                    // Ollama sends thinking in message.thinking
                    if (obj.message?.thinking) {
                        thinking += obj.message.thinking;
                        callbacks.onThinking?.(obj.message.thinking);
                    }
                    if (obj.message?.content) {
                        content += obj.message.content;
                        callbacks.onChunk(obj.message.content);
                    }
                    if (obj.done) return { content, thinking };
                } catch {
                    /* skip malformed */
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    return { content, thinking };
}

async function streamAnthropicSSE(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks,
): Promise<{ content: string; thinking: string }> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let thinking = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                try {
                    const obj = JSON.parse(payload) as {
                        type?: string;
                        content_block?: { type?: string };
                        delta?: {
                            type?: string;
                            text?: string;
                            thinking?: string;
                        };
                    };
                    if (obj.type === "content_block_delta") {
                        if (
                            obj.delta?.type === "thinking_delta" &&
                            obj.delta.thinking
                        ) {
                            thinking += obj.delta.thinking;
                            callbacks.onThinking?.(obj.delta.thinking);
                        } else if (
                            obj.delta?.type === "text_delta" &&
                            obj.delta.text
                        ) {
                            content += obj.delta.text;
                            callbacks.onChunk(obj.delta.text);
                        }
                    }
                } catch {
                    /* skip */
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    return { content, thinking };
}

// ---------- fallback sync parsers (full text) ----------

function parseSyncOpenAISSE(
    raw: string,
    callbacks: StreamCallbacks,
): { content: string; thinking: string } {
    let content = "";
    let thinking = "";
    let inThink = false;
    const lines = raw.split("\n");
    for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") break;
        try {
            const obj = JSON.parse(payload) as {
                choices?: {
                    delta?: { content?: string; reasoning_content?: string };
                }[];
            };
            const reasoning = obj.choices?.[0]?.delta?.reasoning_content;
            if (reasoning) {
                thinking += reasoning;
                callbacks.onThinking?.(reasoning);
                continue;
            }
            const text = obj.choices?.[0]?.delta?.content;
            if (text) {
                const processed = processThinkTags(
                    text,
                    inThink,
                    (t) => {
                        thinking += t;
                        callbacks.onThinking?.(t);
                    },
                    (t) => {
                        content += t;
                        callbacks.onChunk(t);
                    },
                );
                inThink = processed.inThink;
            }
        } catch {
            /* skip malformed lines */
        }
    }
    return { content, thinking };
}

function parseSyncAnthropicSSE(
    raw: string,
    callbacks: StreamCallbacks,
): { content: string; thinking: string } {
    let content = "";
    let thinking = "";
    const lines = raw.split("\n");
    for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        try {
            const obj = JSON.parse(payload) as {
                type?: string;
                content_block?: { type?: string };
                delta?: {
                    type?: string;
                    text?: string;
                    thinking?: string;
                };
            };
            if (obj.type === "content_block_delta") {
                if (
                    obj.delta?.type === "thinking_delta" &&
                    obj.delta.thinking
                ) {
                    thinking += obj.delta.thinking;
                    callbacks.onThinking?.(obj.delta.thinking);
                } else if (obj.delta?.type === "text_delta" && obj.delta.text) {
                    content += obj.delta.text;
                    callbacks.onChunk(obj.delta.text);
                }
            }
        } catch {
            /* skip */
        }
    }
    return { content, thinking };
}

/** Process inline <think>...</think> tags within streaming text */
function processThinkTags(
    chunk: string,
    inThink: boolean,
    onThinking: (t: string) => void,
    onContent: (t: string) => void,
): { inThink: boolean } {
    let remaining = chunk;
    let currentlyInThink = inThink;

    while (remaining.length > 0) {
        if (currentlyInThink) {
            const endIdx = remaining.indexOf("</think>");
            if (endIdx === -1) {
                onThinking(remaining);
                remaining = "";
            } else {
                onThinking(remaining.slice(0, endIdx));
                remaining = remaining.slice(endIdx + 8);
                currentlyInThink = false;
            }
        } else {
            const startIdx = remaining.indexOf("<think>");
            if (startIdx === -1) {
                onContent(remaining);
                remaining = "";
            } else {
                if (startIdx > 0) onContent(remaining.slice(0, startIdx));
                remaining = remaining.slice(startIdx + 7);
                currentlyInThink = true;
            }
        }
    }
    return { inThink: currentlyInThink };
}

export async function reviewCode(
    providerId: string,
    code: string,
    language: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    modelId?: string,
): Promise<string> {
    const result = await streamChat(
        providerId,
        [
            {
                role: "system",
                content: `You are a senior code reviewer. Review the following ${language} code. Identify bugs, security issues, performance problems, and suggest improvements. Be concise and actionable. Format your response with markdown.`,
            },
            {
                role: "user",
                content: `Review this code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            },
        ],
        onChunk,
        signal,
        modelId,
    );
    return result.content;
}
