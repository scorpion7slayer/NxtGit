import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Loader2,
    RefreshCw,
    Sparkles,
    X,
    ExternalLink,
    Hash,
    ChevronRight,
    FileCode,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import DOMPurify from "dompurify";
import {
    fetchCodeWiki,
    askCodeWiki,
    type WikiSection,
    type WikiDiagram,
} from "../lib/codewiki";

// ---------- Mermaid ----------

mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
});

let mermaidCounter = 0;

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const id = `mermaid-${++mermaidCounter}`;
        containerRef.current.innerHTML = "";
        mermaid
            .render(id, chart)
            .then(({ svg }) => {
                if (containerRef.current) containerRef.current.innerHTML = svg;
            })
            .catch(() => {
                if (containerRef.current) {
                    const pre = document.createElement("pre");
                    pre.style.color = "var(--text-tertiary)";
                    pre.style.fontSize = "12px";
                    pre.textContent = chart;
                    containerRef.current.appendChild(pre);
                }
            });
    }, [chart]);

    return (
        <div
            ref={containerRef}
            className="my-4 flex justify-center overflow-x-auto"
        />
    );
};

// ---------- SVG Diagram viewer ----------

const DiagramView: React.FC<{ diagram: WikiDiagram }> = ({ diagram }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !diagram.svg) return;
        const sanitized = DOMPurify.sanitize(diagram.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["use"],
        });
        containerRef.current.innerHTML = sanitized;
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
            // Preserve the viewBox for correct aspect ratio, make responsive
            if (!svgEl.getAttribute("viewBox")) {
                const w = svgEl.getAttribute("width");
                const h = svgEl.getAttribute("height");
                if (w && h) {
                    svgEl.setAttribute(
                        "viewBox",
                        `0 0 ${parseFloat(w)} ${parseFloat(h)}`,
                    );
                }
            }
            svgEl.setAttribute("width", "100%");
            svgEl.setAttribute("height", "auto");
            svgEl.setAttribute("preserveAspectRatio", "xMidYMin meet");
        }
    }, [diagram.svg]);

    if (!diagram.svg) return null;

    return (
        <div
            className="my-5 border rounded-xl overflow-hidden"
            style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
            }}
        >
            {/* Diagram header */}
            <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}
            >
                <Sparkles
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--accent)" }}
                />
                <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {diagram.altText || "Architecture Diagram"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() =>
                            setZoom((z) => Math.max(0.25, z - 0.25))
                        }
                        className="p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]"
                        style={{ color: "var(--text-tertiary)" }}
                        title="Zoom out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span
                        className="text-[10px] w-8 text-center"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                        className="p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]"
                        style={{ color: "var(--text-tertiary)" }}
                        title="Zoom in"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => {
                            setExpanded((v) => !v);
                            setZoom(1);
                        }}
                        className="p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]"
                        style={{ color: "var(--text-tertiary)" }}
                        title={expanded ? "Collapse" : "Expand"}
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* SVG content — white background to match Graphviz color scheme */}
            <div
                className="overflow-auto"
                style={{
                    maxHeight: expanded ? "none" : "550px",
                }}
            >
                <div
                    ref={containerRef}
                    className="p-4 flex justify-center"
                    style={{
                        background: "#ffffff",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                    }}
                />
            </div>

            {/* Source files */}
            {diagram.sourceFiles.length > 0 && (
                <div
                    className="px-4 py-2 border-t flex flex-wrap gap-1.5"
                    style={{ borderColor: "var(--border)" }}
                >
                    {diagram.sourceFiles.map((f, i) => (
                        <a
                            key={i}
                            href={`https://codewiki.google${f}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--text-tertiary)",
                            }}
                        >
                            <FileCode className="w-2.5 h-2.5" />
                            {f.split("/").pop()}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- Markdown with Mermaid support ----------

const WikiMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const parts: { type: "md" | "mermaid"; content: string }[] = [];
    const regex = /```mermaid\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                type: "md",
                content: content.slice(lastIndex, match.index),
            });
        }
        parts.push({ type: "mermaid", content: match[1].trim() });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        parts.push({ type: "md", content: content.slice(lastIndex) });
    }

    return (
        <>
            {parts.map((part, i) =>
                part.type === "mermaid" ? (
                    <MermaidDiagram key={i} chart={part.content} />
                ) : (
                    <ReactMarkdown
                        key={i}
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ href, children, ...props }) => {
                                // Handle internal Code Wiki anchor links
                                const resolvedHref =
                                    href?.startsWith("#") ? href : href;
                                return (
                                    <a
                                        href={resolvedHref}
                                        target={
                                            href?.startsWith("#")
                                                ? undefined
                                                : "_blank"
                                        }
                                        rel="noopener noreferrer"
                                        style={{ color: "var(--accent)" }}
                                        {...props}
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            img: ({ src, alt, ...props }) => (
                                <img
                                    src={src}
                                    alt={alt || ""}
                                    loading="lazy"
                                    style={{
                                        maxWidth: "100%",
                                        borderRadius: "8px",
                                        margin: "0.75em 0",
                                        border: "1px solid var(--border)",
                                    }}
                                    {...props}
                                />
                            ),
                            code: ({ className, children, ...props }) => {
                                const isInline = !className;
                                return isInline ? (
                                    <code
                                        style={{
                                            background: "var(--bg-tertiary)",
                                            padding: "0.15em 0.4em",
                                            borderRadius: "4px",
                                            fontSize: "0.85em",
                                        }}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            pre: ({ children }) => (
                                <pre
                                    style={{
                                        background: "var(--bg-tertiary)",
                                        padding: "1em",
                                        borderRadius: "8px",
                                        overflowX: "auto",
                                        fontSize: "0.85em",
                                        margin: "0.75em 0",
                                    }}
                                >
                                    {children}
                                </pre>
                            ),
                            h1: ({ children }) => (
                                <h1
                                    className="text-2xl font-bold mt-6 mb-3"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2
                                    className="text-xl font-semibold mt-5 mb-2"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3
                                    className="text-lg font-medium mt-4 mb-2"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {children}
                                </h3>
                            ),
                            p: ({ children }) => (
                                <p
                                    className="mb-3 leading-relaxed"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {children}
                                </p>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-3 space-y-1">
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-3 space-y-1">
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li style={{ color: "var(--text-secondary)" }}>
                                    {children}
                                </li>
                            ),
                            table: ({ children }) => (
                                <div className="overflow-x-auto my-3">
                                    <table
                                        className="w-full text-sm border-collapse"
                                        style={{
                                            borderColor: "var(--border)",
                                        }}
                                    >
                                        {children}
                                    </table>
                                </div>
                            ),
                            th: ({ children }) => (
                                <th
                                    className="text-left px-3 py-2 border-b font-medium"
                                    style={{
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                        background: "var(--bg-tertiary)",
                                    }}
                                >
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td
                                    className="px-3 py-2 border-b"
                                    style={{
                                        borderColor: "var(--border)",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {children}
                                </td>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote
                                    className="border-l-4 pl-4 my-3 italic"
                                    style={{
                                        borderColor: "var(--accent)",
                                        color: "var(--text-tertiary)",
                                    }}
                                >
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {part.content}
                    </ReactMarkdown>
                ),
            )}
        </>
    );
};

// ---------- Main component ----------

const CodeWiki: React.FC = () => {
    const { owner, name } = useParams<{ owner: string; name: string }>();
    const navigate = useNavigate();

    // Wiki state
    const [sections, setSections] = useState<WikiSection[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commit, setCommit] = useState<string | null>(null);


    // Request state
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestUrl, setRequestUrl] = useState("");
    const [requesting, setRequesting] = useState(false);
    const [requestDone, setRequestDone] = useState(false);

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Content scroll ref
    const contentRef = useRef<HTMLDivElement>(null);

    // ---------- Load wiki ----------

    const loadWiki = useCallback(async () => {
        if (!owner || !name) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchCodeWiki(owner, name);
            setSections(result.sections);
            setCommit(result.commit);
            setActiveIdx(0);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load Code Wiki",
            );
        } finally {
            setLoading(false);
        }
    }, [owner, name]);

    useEffect(() => {
        loadWiki();
    }, [loadWiki]);

    // ---------- Request repo ----------

    const handleRequest = useCallback(() => {
        const url = requestUrl.trim();
        if (requesting || !url) return;
        // Validate URL format
        if (!/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(url)) return;
        setRequesting(true);
        // Code Wiki's own "Request repo" doesn't make an API call —
        // it only shows a confirmation snackbar. We replicate the same behavior.
        setTimeout(() => {
            setRequesting(false);
            setRequestDone(true);
        }, 800);
    }, [requestUrl, requesting]);

    // ---------- Chat ----------

    const handleChatSend = useCallback(async () => {
        if (!chatInput.trim() || chatLoading || !owner || !name) return;

        const question = chatInput.trim();
        setChatInput("");
        setChatMessages((prev) => [
            ...prev,
            { role: "user", content: question },
        ]);
        setChatLoading(true);

        try {
            const history = chatMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            const answer = await askCodeWiki(owner, name, question, history);
            setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: answer },
            ]);
        } catch (err) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Error: ${err instanceof Error ? err.message : "Failed to get answer"}`,
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    }, [chatInput, chatLoading, chatMessages, owner, name]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // ---------- Scroll to top on section change ----------

    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [activeIdx]);

    // ---------- Build sidebar tree ----------

    // Group sections by hierarchy: level 1 sections are parents, level 2+ are children
    const sidebarItems: {
        section: WikiSection;
        idx: number;
        children: { section: WikiSection; idx: number }[];
    }[] = [];

    let currentParent: (typeof sidebarItems)[0] | null = null;
    sections.forEach((s, i) => {
        if (s.level <= 1) {
            currentParent = { section: s, idx: i, children: [] };
            sidebarItems.push(currentParent);
        } else if (currentParent) {
            currentParent.children.push({ section: s, idx: i });
        } else {
            sidebarItems.push({ section: s, idx: i, children: [] });
        }
    });

    // ---------- Render ----------

    if (!owner || !name) return null;

    const activeSection = sections[activeIdx] || null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
                style={{ borderColor: "var(--border)" }}
            >
                <button
                    onClick={() => navigate(`/repos/${owner}/${name}`)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <Sparkles
                        className="w-5 h-5 shrink-0"
                        style={{ color: "var(--accent)" }}
                    />
                    <h1
                        className="text-lg font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Code Wiki
                    </h1>
                    <span
                        className="text-sm truncate"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {owner}/{name}
                    </span>
                    {commit && (
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--text-tertiary)",
                            }}
                        >
                            {commit.slice(0, 7)}
                        </span>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {owner && name && (
                        <>
                            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                                More detailed documentation available on Code Wiki
                            </span>
                            <a
                                href={`https://codewiki.google/github.com/${owner}/${name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-tertiary)",
                                }}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                codewiki.google
                            </a>
                        </>
                    )}

                    <button
                        onClick={loadWiki}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                        style={{
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() => setChatOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                        style={{
                            borderColor: chatOpen
                                ? "var(--accent)"
                                : "var(--border)",
                            color: chatOpen
                                ? "var(--accent)"
                                : "var(--text-secondary)",
                            background: chatOpen
                                ? "rgba(0,122,255,0.1)"
                                : "var(--bg-tertiary)",
                        }}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ask
                    </button>
                </div>
            </div>

            {/* Body: Loading */}
            {loading && (
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-3"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm">
                        Fetching documentation from Code Wiki...
                    </p>
                </div>
            )}

            {/* Body: Not found / Error */}
            {!loading && error && (
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    {/* Icon */}
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                        style={{ background: "var(--bg-tertiary)" }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </div>

                    <h2
                        className="text-lg font-semibold mb-2"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Sorry, we couldn't find what you were looking for.
                    </h2>
                    <p
                        className="text-sm mb-8 max-w-md"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        Our catalog is constantly expanding. If you can't find a
                        repository, it may not be available yet.
                    </p>

                    {!requestOpen ? (
                        <button
                            onClick={() => {
                                setRequestUrl(`https://github.com/${owner}/${name}`);
                                setRequestOpen(true);
                                setRequestDone(false);
                            }}
                            className="px-8 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
                            style={{
                                background: "linear-gradient(135deg, #4A90D9, #7B68EE)",
                                color: "#fff",
                                boxShadow: "0 4px 20px rgba(74, 144, 217, 0.35)",
                            }}
                        >
                            Request repository
                        </button>
                    ) : requestDone ? (
                        <div
                            className="border rounded-xl p-6 w-full max-w-md text-center"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                                style={{ background: "rgba(52,199,89,0.15)" }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <p
                                className="text-base font-semibold mb-1"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Repo requested
                            </p>
                            <p
                                className="text-sm mb-5"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Thanks for reaching out. We'll review your request.
                            </p>
                            <button
                                onClick={() => {
                                    setRequestOpen(false);
                                    setRequestDone(false);
                                    loadWiki();
                                }}
                                className="text-xs font-medium px-4 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg-tertiary)]"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div
                            className="border rounded-xl p-5 w-full max-w-md"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            <h3
                                className="text-sm font-semibold mb-3"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Request repo
                            </h3>
                            <form onSubmit={(e) => { e.preventDefault(); handleRequest(); }}>
                                <input
                                    type="text"
                                    value={requestUrl}
                                    onChange={(e) => setRequestUrl(e.target.value)}
                                    placeholder="Enter URL"
                                    className="w-full px-4 py-2.5 rounded-lg border text-sm"
                                    style={{
                                        background: "var(--bg-primary)",
                                        borderColor: requestUrl.trim() && !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(requestUrl.trim())
                                            ? "var(--error)"
                                            : "var(--border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                {requestUrl.trim() && !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(requestUrl.trim()) && (
                                    <p
                                        className="text-xs mt-1.5"
                                        style={{ color: "var(--error)" }}
                                    >
                                        Please enter a valid, well-formed repository URL (e.g. https://github.com/owner/repo)
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={requesting || !requestUrl.trim() || !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(requestUrl.trim())}
                                    className="text-sm font-medium transition-colors mt-3"
                                    style={{
                                        color: requesting || !requestUrl.trim() || !/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(requestUrl.trim())
                                            ? "var(--text-tertiary)"
                                            : "var(--accent)",
                                    }}
                                >
                                    {requesting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        "Submit"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Body: Wiki content */}
            {!loading && !error && (
            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <div
                    className="w-56 shrink-0 border-r flex flex-col"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p
                            className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            Sections
                        </p>
                        {sidebarItems.map((item) => (
                            <div key={item.idx}>
                                <button
                                    onClick={() => setActiveIdx(item.idx)}
                                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm transition-colors mb-0.5"
                                    style={{
                                        background:
                                            activeIdx === item.idx
                                                ? "var(--bg-tertiary)"
                                                : "transparent",
                                        color:
                                            activeIdx === item.idx
                                                ? "var(--text-primary)"
                                                : "var(--text-secondary)",
                                        fontWeight:
                                            activeIdx === item.idx ? 500 : 400,
                                    }}
                                >
                                    <Hash className="w-3.5 h-3.5 shrink-0 opacity-50" />
                                    <span className="truncate">
                                        {item.section.title}
                                    </span>
                                    {item.section.diagramCount > 0 && (
                                        <span
                                            className="text-[10px] px-1 rounded"
                                            style={{
                                                background:
                                                    "rgba(0,122,255,0.1)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            {item.section.diagramCount}
                                        </span>
                                    )}
                                </button>
                                {item.children.length > 0 && (
                                    <div className="ml-3 border-l pl-1 mb-1"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        {item.children.map((child) => (
                                            <button
                                                key={child.idx}
                                                onClick={() =>
                                                    setActiveIdx(child.idx)
                                                }
                                                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs transition-colors"
                                                style={{
                                                    background:
                                                        activeIdx === child.idx
                                                            ? "var(--bg-tertiary)"
                                                            : "transparent",
                                                    color:
                                                        activeIdx === child.idx
                                                            ? "var(--text-primary)"
                                                            : "var(--text-tertiary)",
                                                    fontWeight:
                                                        activeIdx === child.idx
                                                            ? 500
                                                            : 400,
                                                }}
                                            >
                                                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                                                <span className="truncate">
                                                    {child.section.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer info */}
                    <div
                        className="border-t px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <div
                            className="flex items-center gap-1.5 text-[10px]"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <Sparkles className="w-3 h-3" />
                            Powered by Google Code Wiki
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {activeSection ? (
                        <div
                            ref={contentRef}
                            className="flex-1 overflow-y-auto p-6"
                        >
                            {/* Section header */}
                            <div className="flex items-center gap-3 mb-4">
                                <h2
                                    className="text-xl font-semibold"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {activeSection.title}
                                </h2>
                                {activeSection.summary &&
                                    activeSection.summary !==
                                        activeSection.markdown && (
                                        <span
                                            className="text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            {activeSection.summary}
                                        </span>
                                    )}
                            </div>

                            {/* Content */}
                            <div className="wiki-content">
                                <WikiMarkdown
                                    content={activeSection.markdown}
                                />
                            </div>

                            {/* Diagrams */}
                            {activeSection.diagrams.length > 0 && (
                                <div className="mt-6">
                                    {activeSection.diagrams.map((d, i) => (
                                        <DiagramView key={i} diagram={d} />
                                    ))}
                                </div>
                            )}

                            {/* Source files references */}
                            {activeSection.sourceFiles.length > 0 && (
                                <div className="mt-4">
                                    <p
                                        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        Source files
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeSection.sourceFiles.map(
                                            (f, i) => (
                                                <a
                                                    key={i}
                                                    href={`https://codewiki.google${f}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-mono transition-colors border hover:bg-[var(--bg-tertiary)]"
                                                    style={{
                                                        borderColor:
                                                            "var(--border)",
                                                        color: "var(--text-secondary)",
                                                        background:
                                                            "var(--bg-secondary)",
                                                    }}
                                                >
                                                    <FileCode className="w-3 h-3 shrink-0 opacity-60" />
                                                    {f}
                                                </a>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Navigation between sections */}
                            <div
                                className="flex items-center justify-between mt-8 pt-4 border-t"
                                style={{ borderColor: "var(--border)" }}
                            >
                                {activeIdx > 0 ? (
                                    <button
                                        onClick={() =>
                                            setActiveIdx(activeIdx - 1)
                                        }
                                        className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        &larr; {sections[activeIdx - 1].title}
                                    </button>
                                ) : (
                                    <div />
                                )}
                                {activeIdx < sections.length - 1 ? (
                                    <button
                                        onClick={() =>
                                            setActiveIdx(activeIdx + 1)
                                        }
                                        className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {sections[activeIdx + 1].title} &rarr;
                                    </button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex items-center justify-center h-full"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <p className="text-sm">No sections found</p>
                        </div>
                    )}
                </div>

                {/* Chat panel */}
                {chatOpen && (
                    <div
                        className="w-80 shrink-0 border-l flex flex-col"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)",
                        }}
                    >
                        {/* Chat header */}
                        <div
                            className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <MessageSquare
                                className="w-4 h-4"
                                style={{ color: "var(--accent)" }}
                            />
                            <span
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Ask about this codebase
                            </span>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="ml-auto p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Chat messages */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {chatMessages.length === 0 && (
                                <div
                                    className="flex flex-col items-center justify-center h-full gap-2 text-center px-4"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    <Sparkles className="w-6 h-6" />
                                    <p className="text-xs">
                                        Ask anything about{" "}
                                        <strong>
                                            {owner}/{name}
                                        </strong>
                                        . Powered by Google Code Wiki &
                                        Gemini.
                                    </p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`text-sm ${msg.role === "user" ? "ml-8" : "mr-4"}`}
                                >
                                    <div
                                        className="rounded-lg px-3 py-2"
                                        style={{
                                            background:
                                                msg.role === "user"
                                                    ? "var(--accent)"
                                                    : "var(--bg-tertiary)",
                                            color:
                                                msg.role === "user"
                                                    ? "#fff"
                                                    : "var(--text-secondary)",
                                        }}
                                    >
                                        {msg.role === "assistant" ? (
                                            <div className="wiki-content text-xs">
                                                <WikiMarkdown
                                                    content={msg.content}
                                                />
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div
                                    className="flex items-center gap-2 px-3 py-2 mr-4"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span className="text-xs">
                                        Thinking...
                                    </span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat input */}
                        <div
                            className="border-t p-3 shrink-0"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) =>
                                        setChatInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleChatSend();
                                        }
                                    }}
                                    placeholder="Ask a question..."
                                    disabled={chatLoading}
                                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                                    style={{
                                        background: "var(--bg-primary)",
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <button
                                    onClick={handleChatSend}
                                    disabled={!chatInput.trim() || chatLoading}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{
                                        background:
                                            chatInput.trim() && !chatLoading
                                                ? "var(--accent)"
                                                : "var(--bg-tertiary)",
                                        color:
                                            chatInput.trim() && !chatLoading
                                                ? "#fff"
                                                : "var(--text-tertiary)",
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default CodeWiki;
