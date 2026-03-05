import React, { useState, useEffect, useRef } from "react";
import {
    Key,
    CheckCircle,
    Loader2,
    CreditCard,
    Shield,
    Copy,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
    AI_PROVIDERS,
    startCopilotDeviceFlow,
    pollCopilotToken,
    getOllamaBaseURL,
    setOllamaBaseURL,
    type CopilotDeviceCode,
} from "../lib/ai";
import { fetchSubscription, type GitHubSubscription } from "../lib/github";
import { LazyStore } from "@tauri-apps/plugin-store";

const settingsStore = new LazyStore("settings.json");

const Settings: React.FC = () => {
    const { user, copilotGithubToken, clearCopilotToken } = useAuthStore();
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [ollamaURL, setOllamaURL] = useState("http://localhost:11434");
    const [notifications, setNotifications] = useState(true);
    const [autoReview, setAutoReview] = useState(false);
    const [savedMsg, setSavedMsg] = useState("");
    const [subscription, setSubscription] = useState<GitHubSubscription | null>(
        null,
    );
    const [subLoading, setSubLoading] = useState(true);

    // Copilot device flow state
    const [copilotConnecting, setCopilotConnecting] = useState(false);
    const [copilotDeviceData, setCopilotDeviceData] =
        useState<CopilotDeviceCode | null>(null);
    const [copilotError, setCopilotError] = useState("");
    const [copilotCopied, setCopilotCopied] = useState(false);
    const cancelRef = useRef(false);

    useEffect(() => {
        settingsStore
            .get<Record<string, string>>("apiKeys")
            .then((keys) => {
                if (keys) setApiKeys(keys);
            })
            .catch(() => {});

        getOllamaBaseURL()
            .then(setOllamaURL)
            .catch(() => {});

        fetchSubscription()
            .then(setSubscription)
            .catch(() => {})
            .finally(() => setSubLoading(false));
    }, []);

    const connectCopilot = async () => {
        setCopilotConnecting(true);
        setCopilotError("");
        setCopilotDeviceData(null);
        cancelRef.current = false;

        try {
            const deviceData = await startCopilotDeviceFlow();
            setCopilotDeviceData(deviceData);

            try {
                await navigator.clipboard.writeText(deviceData.user_code);
                setCopilotCopied(true);
                setTimeout(() => setCopilotCopied(false), 3000);
            } catch {
                /* clipboard may not be available */
            }

            const interval = (deviceData.interval || 5) * 1000;
            const expiresAt = Date.now() + deviceData.expires_in * 1000;

            await pollCopilotToken(deviceData.device_code, interval, expiresAt);
            setCopilotDeviceData(null);
        } catch (e) {
            if (!cancelRef.current) {
                setCopilotError(e instanceof Error ? e.message : String(e));
            }
        } finally {
            setCopilotConnecting(false);
        }
    };

    const disconnectCopilot = async () => {
        await clearCopilotToken();
        setCopilotDeviceData(null);
        setCopilotError("");
    };

    const updateKey = (providerId: string, value: string) => {
        setApiKeys((prev) => ({ ...prev, [providerId]: value }));
    };

    const saveKeys = async () => {
        await settingsStore.set("apiKeys", apiKeys);
        await settingsStore.save();
        await setOllamaBaseURL(ollamaURL);
        setSavedMsg("Saved");
        setTimeout(() => setSavedMsg(""), 2000);
    };

    // Providers that need API keys (exclude OAuth-based ones)
    const keyProviders = AI_PROVIDERS.filter((p) => !p.usesOAuth);

    return (
        <div className="p-6 max-w-3xl">
            <header className="mb-6">
                <h1
                    className="text-xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    Settings
                </h1>
                <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Configure NxtGit
                </p>
            </header>

            <div className="space-y-6">
                {/* GitHub Account */}
                <Section title="GitHub Account">
                    <div
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: "var(--bg-tertiary)" }}
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={
                                    user?.avatar_url ||
                                    "https://github.com/github.png"
                                }
                                alt=""
                                className="w-8 h-8 rounded-full"
                            />
                            <div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {user?.login || "unknown"}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    Connected via OAuth
                                </p>
                            </div>
                        </div>
                        <button className="btn-secondary text-xs px-3 py-1.5">
                            Disconnect
                        </button>
                    </div>
                </Section>

                {/* Subscription & Copilot */}
                <Section title="Subscription">
                    {subLoading ? (
                        <div
                            className="flex items-center gap-2 p-3 rounded-lg"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            <Loader2
                                className="w-4 h-4 animate-spin"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <span
                                className="text-sm"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Loading subscription info...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* GitHub Plan */}
                            <div
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ background: "var(--bg-tertiary)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard
                                        className="w-4 h-4"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    />
                                    <div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            GitHub Plan
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            Your current GitHub subscription
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                                    style={{
                                        background:
                                            subscription?.plan === "free"
                                                ? "var(--bg-secondary)"
                                                : "rgba(0, 122, 255, 0.1)",
                                        color:
                                            subscription?.plan === "free"
                                                ? "var(--text-secondary)"
                                                : "var(--accent)",
                                    }}
                                >
                                    {subscription?.plan || "free"}
                                </span>
                            </div>

                            {/* GitHub Copilot */}
                            <div
                                className="p-3 rounded-lg"
                                style={{ background: "var(--bg-tertiary)" }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield
                                            className="w-4 h-4"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        />
                                        <div>
                                            <p
                                                className="text-sm font-medium"
                                                style={{
                                                    color: "var(--text-primary)",
                                                }}
                                            >
                                                GitHub Copilot
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                {copilotGithubToken
                                                    ? "Connected — uses a separate GitHub Copilot token"
                                                    : "Requires a separate authentication with GitHub Copilot"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {copilotGithubToken ? (
                                            <>
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle
                                                        className="w-3.5 h-3.5"
                                                        style={{
                                                            color: "var(--success)",
                                                        }}
                                                    />
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{
                                                            color: "var(--success)",
                                                        }}
                                                    >
                                                        Connected
                                                    </span>
                                                </span>
                                                <button
                                                    onClick={disconnectCopilot}
                                                    className="btn-secondary text-xs px-2.5 py-1"
                                                >
                                                    Disconnect
                                                </button>
                                            </>
                                        ) : copilotConnecting ? (
                                            <Loader2
                                                className="w-4 h-4 animate-spin"
                                                style={{
                                                    color: "var(--accent)",
                                                }}
                                            />
                                        ) : (
                                            <button
                                                onClick={connectCopilot}
                                                className="btn-primary text-xs px-3 py-1.5"
                                            >
                                                Connect Copilot
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {copilotDeviceData && (
                                    <div
                                        className="mt-3 p-3 rounded-lg"
                                        style={{
                                            background: "var(--bg-secondary)",
                                        }}
                                    >
                                        <p
                                            className="text-xs mb-2"
                                            style={{
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            Enter this code on GitHub:
                                        </p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <code
                                                className="text-lg font-mono font-bold tracking-widest px-3 py-1.5 rounded"
                                                style={{
                                                    background:
                                                        "var(--bg-tertiary)",
                                                    color: "var(--accent)",
                                                }}
                                            >
                                                {copilotDeviceData.user_code}
                                            </code>
                                            <button
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(
                                                        copilotDeviceData.user_code,
                                                    );
                                                    setCopilotCopied(true);
                                                    setTimeout(
                                                        () =>
                                                            setCopilotCopied(
                                                                false,
                                                            ),
                                                        2000,
                                                    );
                                                }}
                                                className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]"
                                                title="Copy code"
                                            >
                                                {copilotCopied ? (
                                                    <CheckCircle
                                                        className="w-4 h-4"
                                                        style={{
                                                            color: "var(--success)",
                                                        }}
                                                    />
                                                ) : (
                                                    <Copy
                                                        className="w-4 h-4"
                                                        style={{
                                                            color: "var(--text-tertiary)",
                                                        }}
                                                    />
                                                )}
                                            </button>
                                        </div>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            Waiting for authorization...
                                        </p>
                                    </div>
                                )}

                                {copilotError && (
                                    <div
                                        className="mt-2 text-xs px-3 py-2 rounded"
                                        style={{
                                            background: "rgba(255,59,48,0.08)",
                                            color: "var(--error)",
                                        }}
                                    >
                                        {copilotError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Section>

                {/* AI Providers (API Key based) */}
                <Section title="AI Providers">
                    <div className="space-y-3">
                        {keyProviders.map((provider) => (
                            <div
                                key={provider.id}
                                className="p-3 rounded-lg"
                                style={{ background: "var(--bg-tertiary)" }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {provider.name}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            {provider.description}
                                            {" — "}
                                            {provider.models.length} model
                                            {provider.models.length > 1
                                                ? "s"
                                                : ""}{" "}
                                            available
                                        </p>
                                    </div>
                                    {apiKeys[provider.id] && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                                            style={{
                                                background:
                                                    "rgba(52, 199, 89, 0.15)",
                                                color: "var(--success)",
                                            }}
                                        >
                                            configured
                                        </span>
                                    )}
                                </div>
                                {/* Ollama: URL field */}
                                {provider.customBaseURL && (
                                    <div className="relative mb-2">
                                        <span
                                            className="text-[10px] absolute left-3 top-1/2 -translate-y-1/2"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            URL
                                        </span>
                                        <input
                                            type="text"
                                            value={ollamaURL}
                                            onChange={(e) =>
                                                setOllamaURL(e.target.value)
                                            }
                                            placeholder="http://localhost:11434"
                                            className="input-glass pl-10 w-full text-sm py-2"
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <Key
                                        className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    />
                                    <input
                                        type="password"
                                        value={apiKeys[provider.id] || ""}
                                        onChange={(e) =>
                                            updateKey(
                                                provider.id,
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            provider.apiKeyOptional
                                                ? "Optional — only for Ollama Cloud"
                                                : provider.placeholder
                                        }
                                        className="input-glass pl-9 w-full text-sm py-2"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={saveKeys}
                                className="btn-primary text-sm px-4 py-2"
                            >
                                Save API Keys
                            </button>
                            {savedMsg && (
                                <span
                                    className="text-xs"
                                    style={{ color: "var(--success)" }}
                                >
                                    {savedMsg}
                                </span>
                            )}
                        </div>

                        <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            API keys are stored locally and never shared. GitHub
                            Copilot requires a separate connection above.
                        </p>
                    </div>
                </Section>

                {/* Preferences */}
                <Section title="Preferences">
                    <div className="space-y-2">
                        <ToggleRow
                            label="Push Notifications"
                            description="Get notified about PR reviews and comments"
                            checked={notifications}
                            onChange={setNotifications}
                        />
                        <ToggleRow
                            label="Auto-review PRs"
                            description="Automatically review new pull requests with AI"
                            checked={autoReview}
                            onChange={setAutoReview}
                        />
                    </div>
                </Section>

                {/* Data */}
                <Section title="Data">
                    <div className="space-y-2">
                        <button
                            className="w-full flex items-center justify-between p-3 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            <span style={{ color: "var(--text-primary)" }}>
                                Clear cache
                            </span>
                        </button>
                        <button
                            className="w-full flex items-center justify-between p-3 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            <span style={{ color: "var(--error)" }}>
                                Reset all data
                            </span>
                        </button>
                    </div>
                </Section>
            </div>

            <div
                className="mt-8 pt-6 border-t"
                style={{ borderColor: "var(--border)" }}
            >
                <p
                    className="text-xs text-center"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    NxtGit v0.1.0
                </p>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => (
    <div>
        <h2
            className="text-sm font-medium mb-3"
            style={{ color: "var(--text-secondary)" }}
        >
            {title}
        </h2>
        {children}
    </div>
);

const ToggleRow: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ background: "var(--bg-tertiary)" }}
    >
        <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {label}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {description}
            </p>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className="w-10 h-5 rounded-full transition-colors relative flex-shrink-0"
            style={{
                background: checked ? "var(--accent)" : "var(--bg-secondary)",
            }}
        >
            <div
                className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
            />
        </button>
    </div>
);

export default Settings;
