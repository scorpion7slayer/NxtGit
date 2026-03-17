import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";

// --- Step definitions ---

interface OnboardingStep {
    target: string | null; // null = centered modal, string = CSS selector
    title: string;
    description: string;
}

const STEPS: OnboardingStep[] = [
    {
        target: null,
        title: "Welcome to NxtGit!",
        description: "Hey! Let me show you around — it'll only take a minute.",
    },
    {
        target: '[data-tour="dashboard"]',
        title: "Dashboard",
        description:
            "This is your home base. You'll see your repos, stars, open PRs and recent activity at a glance.",
    },
    {
        target: '[data-tour="repos"]',
        title: "Repositories",
        description:
            "All your GitHub repos in one place. Search, filter by language or type, then click one to explore its files and branches.",
    },
    {
        target: '[data-tour="issues"]',
        title: "Issues",
        description:
            "Your issues across every repo. Switch between open and closed, search by title, and jump to the details.",
    },
    {
        target: '[data-tour="prs"]',
        title: "Pull Requests",
        description:
            "All your PRs at a glance. Filter by state, then open any PR to review diffs, check CI, or merge.",
    },
    {
        target: '[data-tour="chat"]',
        title: "AI Chat",
        description:
            "Ask questions about your code, attach files for context, or just brainstorm. Works with multiple AI providers.",
    },
    {
        target: '[data-tour="ai-review"]',
        title: "AI Code Review",
        description:
            "Drop in a code snippet and get instant feedback on bugs, security issues, and performance.",
    },
    {
        target: '[data-tour="settings"]',
        title: "Settings",
        description:
            "This is where you connect your AI providers and tweak keyboard shortcuts to your liking.",
    },
    {
        target: null,
        title: "You're good to go!",
        description:
            "Head to Settings to add an AI key — that unlocks Chat and Code Review. Everything stays on your machine.",
    },
];

// --- Rect type ---

interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const PAD = 6;

// --- Main component (rendered OUTSIDE Layout in App.tsx) ---

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<SpotlightRect | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);
    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;
    const isFirst = step === 0;

    // --- Measure target ---
    const measure = useCallback(() => {
        if (!current.target) {
            setRect(null);
            return;
        }
        const el = document.querySelector(current.target);
        if (!el) {
            setRect(null);
            return;
        }
        const r = el.getBoundingClientRect();
        setRect({
            top: r.top - PAD,
            left: r.left - PAD,
            width: r.width + PAD * 2,
            height: r.height + PAD * 2,
        });
    }, [current.target]);

    useEffect(() => {
        const timer = setTimeout(measure, 60);

        observerRef.current?.disconnect();
        if (current.target) {
            const el = document.querySelector(current.target);
            if (el) {
                observerRef.current = new ResizeObserver(measure);
                observerRef.current.observe(el);
            }
        }

        window.addEventListener("resize", measure);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", measure);
            observerRef.current?.disconnect();
        };
    }, [step, measure, current.target]);

    const advance = () => (isLast ? onComplete() : setStep((s) => s + 1));
    const goBack = () => setStep((s) => Math.max(0, s - 1));

    // --- Centered modal for welcome / finish ---
    if (!current.target) {
        return (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{
                    background: "rgba(0, 0, 0, 0.55)",
                    backdropFilter: "blur(6px)",
                }}
            >
                <div
                    className="relative w-full max-w-sm mx-4 rounded-2xl border shadow-2xl"
                    style={{
                        background: "var(--bg-primary)",
                        borderColor: "var(--border)",
                    }}
                >
                    <button
                        onClick={onComplete}
                        className="absolute top-4 right-4 p-1 rounded-md transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color =
                                "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color =
                                "var(--text-tertiary)")
                        }
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="px-8 pt-8 pb-2 text-center">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                            style={{ background: "rgba(0, 122, 255, 0.1)" }}
                        >
                            <Sparkles
                                className="w-7 h-7"
                                style={{ color: "var(--accent)" }}
                            />
                        </div>
                        <h2
                            className="text-xl font-bold mb-2"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {current.title}
                        </h2>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {current.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between px-8 py-5">
                        <StepDots total={STEPS.length} current={step} />
                        <div className="flex items-center gap-2">
                            {!isFirst && (
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-1 text-xs py-2 px-4 rounded-lg font-medium"
                                    style={{
                                        color: "var(--text-secondary)",
                                        background: "var(--bg-tertiary)",
                                    }}
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={advance}
                                className="flex items-center gap-1.5 text-xs py-2 px-5 rounded-lg font-medium"
                                style={{
                                    background: "var(--accent)",
                                    color: "white",
                                }}
                            >
                                {isLast ? "Let's go!" : "Start tour"}
                                {!isLast && (
                                    <ArrowRight className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Spotlight mode: blocking overlay with cutout ---

    // Build clip-path polygon with a rectangular hole around the target
    const clipPath = rect
        ? `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${rect.left}px ${rect.top}px,
            ${rect.left}px ${rect.top + rect.height}px,
            ${rect.left + rect.width}px ${rect.top + rect.height}px,
            ${rect.left + rect.width}px ${rect.top}px,
            ${rect.left}px ${rect.top}px
        )`
        : undefined;

    // Tooltip position — to the right of target, clamped to viewport
    const tooltipH = 140; // approximate tooltip height
    const tooltipStyle: React.CSSProperties = rect
        ? {
              position: "fixed",
              top: Math.min(rect.top, window.innerHeight - tooltipH - 16),
              left: rect.left + rect.width + 16,
              maxWidth: 280,
              zIndex: 10002,
          }
        : { display: "none" };

    return (
        <div className="fixed inset-0" style={{ zIndex: 9999 }}>
            {/* Blocking dark overlay with hole cut around target */}
            <div
                className="fixed inset-0"
                style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    clipPath,
                    zIndex: 10000,
                }}
            />

            {/* Highlight ring around target (visual only) */}
            {rect && (
                <div
                    className="fixed rounded-lg transition-all duration-200"
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        zIndex: 10001,
                        pointerEvents: "none",
                        boxShadow:
                            "0 0 0 2px var(--accent), 0 0 14px rgba(0, 122, 255, 0.35)",
                    }}
                />
            )}

            {/* Skip tour button */}
            <button
                onClick={onComplete}
                className="fixed flex items-center gap-1 text-[11px] py-1.5 px-3 rounded-md"
                style={{
                    top: 48,
                    right: 16,
                    zIndex: 10002,
                    background: "rgba(0, 0, 0, 0.55)",
                    color: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(4px)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)")
                }
            >
                Skip tour
                <X className="w-3 h-3" />
            </button>

            {/* Tooltip card */}
            <div
                className="rounded-xl border shadow-2xl"
                style={{
                    ...tooltipStyle,
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                }}
            >
                <div className="px-5 pt-4 pb-2.5">
                    <h3
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {current.title}
                    </h3>
                    <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {current.description}
                    </p>
                </div>

                <div
                    className="flex items-center justify-between px-5 py-2.5 border-t"
                    style={{ borderColor: "var(--border)" }}
                >
                    <StepDots total={STEPS.length} current={step} />

                    <div className="flex items-center gap-1.5">
                        {step > 1 && (
                            <button
                                onClick={goBack}
                                className="flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-md font-medium"
                                style={{
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-tertiary)",
                                }}
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Back
                            </button>
                        )}
                        <button
                            onClick={advance}
                            className="flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-md font-medium"
                            style={{
                                background: "var(--accent)",
                                color: "white",
                            }}
                        >
                            {isLast ? "Finish" : "Next"}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Step dots ---

const StepDots: React.FC<{ total: number; current: number }> = ({
    total,
    current,
}) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
            <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                    width: i === current ? 14 : 6,
                    background:
                        i === current
                            ? "var(--accent)"
                            : i < current
                              ? "var(--text-tertiary)"
                              : "var(--border)",
                }}
            />
        ))}
    </div>
);

export default Onboarding;
