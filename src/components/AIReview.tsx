import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Square } from "lucide-react";
import {
    AI_PROVIDERS,
    getModelsForProvider,
    fetchProviderModels,
    reviewCode,
    type AIModel,
} from "../lib/ai";
import MarkdownRenderer from "./MarkdownRenderer";

const AIReview: React.FC = () => {
    const [input, setInput] = useState("");
    const [reviewing, setReviewing] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(
        AI_PROVIDERS[0].id,
    );
    const [selectedModel, setSelectedModel] = useState(
        AI_PROVIDERS[0].defaultModel,
    );
    const [language, setLanguage] = useState("TypeScript");
    const [result, setResult] = useState("");
    const [error, setError] = useState("");
    const abortRef = useRef<AbortController | null>(null);
    const [models, setModels] = useState<AIModel[]>(
        getModelsForProvider(selectedProvider),
    );

    useEffect(() => {
        setModels(getModelsForProvider(selectedProvider));
        fetchProviderModels(selectedProvider)
            .then((m) => {
                setModels(m);
                if (!m.find((x) => x.id === selectedModel)) {
                    const p = AI_PROVIDERS.find(
                        (x) => x.id === selectedProvider,
                    );
                    if (p) setSelectedModel(p.defaultModel);
                }
            })
            .catch(() => {});
    }, [selectedProvider]);

    const handleProviderChange = (pid: string) => {
        setSelectedProvider(pid);
        const p = AI_PROVIDERS.find((x) => x.id === pid);
        if (p) setSelectedModel(p.defaultModel);
    };

    const handleReview = async () => {
        if (!input.trim() || reviewing) return;
        setReviewing(true);
        setResult("");
        setError("");

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await reviewCode(
                selectedProvider,
                input,
                language,
                (chunk) => {
                    setResult((prev) => prev + chunk);
                },
                controller.signal,
                selectedModel,
            );
        } catch (e: unknown) {
            if (e instanceof Error && e.name === "AbortError") return;
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setReviewing(false);
            abortRef.current = null;
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
    };

    return (
        <div className="p-6 h-full flex flex-col max-w-5xl">
            <header className="mb-4">
                <h1
                    className="text-xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    AI Code Review
                </h1>
                <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Paste code or a diff to get a review
                </p>
            </header>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Input */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <select
                            value={selectedProvider}
                            onChange={(e) =>
                                handleProviderChange(e.target.value)
                            }
                            className="input-glass py-1.5 px-3 text-sm w-auto"
                        >
                            {AI_PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="input-glass py-1.5 px-3 text-sm w-auto"
                        >
                            {models.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="input-glass py-1.5 px-3 text-sm w-auto"
                        >
                            {[
                                "JavaScript",
                                "TypeScript",
                                "Python",
                                "Rust",
                                "Go",
                                "Java",
                                "PHP",
                                "C++",
                                "C#",
                                "Ruby",
                                "Swift",
                                "Kotlin",
                            ].map((l) => (
                                <option key={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="// Paste your code here..."
                        className="flex-1 w-full p-4 rounded-lg font-mono text-sm resize-none outline-none border"
                        style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            borderColor: "var(--border)",
                        }}
                    />

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={reviewing ? handleStop : handleReview}
                            disabled={!reviewing && !input.trim()}
                            className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm flex-1"
                        >
                            {reviewing ? (
                                <>
                                    <Square className="w-4 h-4" /> Stop
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" /> Review Code
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div
                    className="flex-1 border rounded-lg p-4 overflow-auto"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <h3
                        className="text-sm font-medium mb-3"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Review Results
                    </h3>

                    {error && (
                        <div
                            className="text-sm mb-3 p-3 rounded-lg"
                            style={{
                                background: "rgba(255, 59, 48, 0.08)",
                                color: "var(--error)",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {reviewing && !result ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2
                                className="w-5 h-5 animate-spin"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                        </div>
                    ) : result ? (
                        <MarkdownRenderer content={result} />
                    ) : (
                        <p
                            className="text-sm"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            Submit code to see review results here.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIReview;
