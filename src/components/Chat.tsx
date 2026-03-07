import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Send,
    Square,
    ChevronDown,
    Plus,
    MessageSquare,
    Bot,
    Loader2,
    Paperclip,
    X,
    File,
    Folder,
    ChevronRight,
    Brain,
    Trash2,
    GitBranch,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
    fetchRepos,
    fetchRepoContents,
    fetchFileContent,
    fetchRepoTree,
    type GitHubRepo,
    type GitHubContent,
} from "../lib/github";
import {
    streamChat,
    AI_PROVIDERS,
    getModelsForProvider,
    fetchProviderModels,
    type ChatMessage,
    type AIModel,
    type StreamCallbacks,
} from "../lib/ai";
import { LazyStore } from "@tauri-apps/plugin-store";
import MarkdownRenderer from "./MarkdownRenderer";

const chatStore = new LazyStore("chats.json");

// --- Types ---

interface Attachment {
    name: string;
    path: string;
    type: "file" | "folder" | "repo";
    content?: string;
    repo: string;
    tree?: string[];
}

interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    provider: string;
    model: string;
}

// --- Thinking block ---

const ThinkingBlock: React.FC<{ thinking: string; isStreaming: boolean }> = ({
    thinking,
    isStreaming,
}) => {
    const [expanded, setExpanded] = useState(true);
    const thinkingEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll thinking content during streaming
    useEffect(() => {
        if (isStreaming && expanded && thinkingEndRef.current) {
            thinkingEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }
    }, [thinking, isStreaming, expanded]);

    if (!thinking && !isStreaming) return null;

    return (
        <div className="mb-2">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md transition-colors"
                style={{
                    color: "var(--text-secondary)",
                    background: "var(--bg-secondary)",
                }}
            >
                <Brain
                    className={`w-3.5 h-3.5 ${isStreaming ? "animate-pulse" : ""}`}
                    style={{ color: isStreaming ? "var(--accent)" : undefined }}
                />
                <span>
                    {isStreaming
                        ? thinking
                            ? "Thinking..."
                            : "Processing..."
                        : "Thought process"}
                </span>
                {isStreaming && !thinking && (
                    <span className="flex gap-0.5 ml-1">
                        <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{
                                background: "var(--text-tertiary)",
                                animationDelay: "0ms",
                            }}
                        />
                        <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{
                                background: "var(--text-tertiary)",
                                animationDelay: "150ms",
                            }}
                        />
                        <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{
                                background: "var(--text-tertiary)",
                                animationDelay: "300ms",
                            }}
                        />
                    </span>
                )}
                <ChevronRight
                    className="w-3 h-3 transition-transform"
                    style={{ transform: expanded ? "rotate(90deg)" : "none" }}
                />
            </button>
            {expanded && thinking && (
                <div
                    className="mt-1.5 px-3 py-2 rounded-md text-xs leading-relaxed max-h-60 overflow-y-auto"
                    style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-tertiary)",
                        borderLeft: `2px solid ${isStreaming ? "var(--accent)" : "var(--border)"}`,
                    }}
                >
                    <span className="whitespace-pre-wrap">{thinking}</span>
                    <div ref={thinkingEndRef} />
                </div>
            )}
        </div>
    );
};

// --- File picker ---

const FilePicker: React.FC<{
    repos: GitHubRepo[];
    onAttach: (attachment: Attachment) => void;
    onAttachRepo: (repo: GitHubRepo) => void;
    onClose: () => void;
}> = ({ repos, onAttach, onAttachRepo, onClose }) => {
    const [selectedRepo, setSelectedRepo] = useState<string>("");
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [contents, setContents] = useState<GitHubContent[]>([]);
    const [loadingContents, setLoadingContents] = useState(false);

    const loadContents = useCallback(
        async (repoFullName: string, path: string) => {
            setLoadingContents(true);
            try {
                const [owner, name] = repoFullName.split("/");
                const items = await fetchRepoContents(owner, name, path);
                setContents(
                    items.sort((a, b) => {
                        if (a.type === "dir" && b.type !== "dir") return -1;
                        if (a.type !== "dir" && b.type === "dir") return 1;
                        return a.name.localeCompare(b.name);
                    }),
                );
            } catch {
                setContents([]);
            } finally {
                setLoadingContents(false);
            }
        },
        [],
    );

    const selectRepo = (repoFullName: string) => {
        setSelectedRepo(repoFullName);
        setCurrentPath([]);
        loadContents(repoFullName, "");
    };

    const navigateToFolder = (folderName: string) => {
        const newPath = [...currentPath, folderName];
        setCurrentPath(newPath);
        loadContents(selectedRepo, newPath.join("/"));
    };

    const navigateUp = () => {
        const newPath = currentPath.slice(0, -1);
        setCurrentPath(newPath);
        loadContents(selectedRepo, newPath.join("/"));
    };

    const attachFile = async (item: GitHubContent) => {
        const [owner, name] = selectedRepo.split("/");
        let content: string | undefined;
        if (item.type === "file" && item.size < 100_000) {
            try {
                content = await fetchFileContent(owner, name, item.path);
            } catch {
                /* skip content */
            }
        }
        onAttach({
            name: item.name,
            path: item.path,
            type: item.type === "dir" ? "folder" : "file",
            content,
            repo: selectedRepo,
        });
    };

    const attachFolder = (item: GitHubContent) => {
        onAttach({
            name: item.name,
            path: item.path,
            type: "folder",
            repo: selectedRepo,
        });
    };

    return (
        <div
            className="absolute bottom-full left-0 mb-2 w-80 rounded-lg border shadow-lg z-50"
            style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
            }}
        >
            <div
                className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor: "var(--border)" }}
            >
                <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                >
                    Attach from GitHub
                </span>
                <button
                    onClick={onClose}
                    className="p-0.5 rounded"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {!selectedRepo ? (
                <div className="max-h-60 overflow-y-auto p-1">
                    {repos.map((r) => (
                        <div
                            key={r.id}
                            className="w-full text-left px-3 py-2 text-xs rounded transition-colors flex items-center gap-2 group cursor-pointer"
                            style={{ color: "var(--text-primary)" }}
                            onClick={() => selectRepo(r.full_name)}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                    "var(--bg-tertiary)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                    "transparent")
                            }
                        >
                            <Folder
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <span className="truncate flex-1">
                                {r.full_name}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAttachRepo(r);
                                }}
                                className="hidden group-hover:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{
                                    background: "var(--accent)",
                                    color: "white",
                                }}
                            >
                                <GitBranch className="w-2.5 h-2.5" /> Attach
                                repo
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div>
                    {/* Breadcrumb */}
                    <div
                        className="flex items-center gap-1 px-3 py-2 text-xs border-b"
                        style={{
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <button
                            onClick={() => {
                                setSelectedRepo("");
                                setCurrentPath([]);
                                setContents([]);
                            }}
                            className="hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            repos
                        </button>
                        <span>/</span>
                        <button
                            onClick={() => {
                                setCurrentPath([]);
                                loadContents(selectedRepo, "");
                            }}
                            className="hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            {selectedRepo.split("/")[1]}
                        </button>
                        {currentPath.map((seg, i) => (
                            <React.Fragment key={i}>
                                <span>/</span>
                                <button
                                    onClick={() => {
                                        const newPath = currentPath.slice(
                                            0,
                                            i + 1,
                                        );
                                        setCurrentPath(newPath);
                                        loadContents(
                                            selectedRepo,
                                            newPath.join("/"),
                                        );
                                    }}
                                    className="hover:underline"
                                    style={{ color: "var(--accent)" }}
                                >
                                    {seg}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {currentPath.length > 0 && (
                            <button
                                onClick={navigateUp}
                                className="w-full text-left px-3 py-1.5 text-xs rounded transition-colors"
                                style={{ color: "var(--text-secondary)" }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        "var(--bg-tertiary)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                        "transparent")
                                }
                            >
                                ..
                            </button>
                        )}
                        {loadingContents ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2
                                    className="w-4 h-4 animate-spin"
                                    style={{ color: "var(--text-tertiary)" }}
                                />
                            </div>
                        ) : (
                            contents.map((item) => (
                                <button
                                    key={item.sha}
                                    onClick={() =>
                                        item.type === "dir"
                                            ? navigateToFolder(item.name)
                                            : attachFile(item)
                                    }
                                    className="w-full text-left px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-2 group"
                                    style={{ color: "var(--text-primary)" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background =
                                            "var(--bg-tertiary)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background =
                                            "transparent")
                                    }
                                >
                                    {item.type === "dir" ? (
                                        <Folder
                                            className="w-3.5 h-3.5 flex-shrink-0"
                                            style={{ color: "var(--accent)" }}
                                        />
                                    ) : (
                                        <File
                                            className="w-3.5 h-3.5 flex-shrink-0"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        />
                                    )}
                                    <span className="truncate flex-1">
                                        {item.name}
                                    </span>
                                    {item.type === "dir" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                attachFolder(item);
                                            }}
                                            className="hidden group-hover:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                                            style={{
                                                background: "var(--accent)",
                                                color: "white",
                                            }}
                                        >
                                            <Paperclip className="w-2.5 h-2.5" />{" "}
                                            Attach
                                        </button>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// === Main Chat Component ===

const Chat: React.FC = () => {
    const { user } = useAuthStore();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);

    // Conversation state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [thinkingMap, setThinkingMap] = useState<Record<number, string>>({});

    // UI state
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [thinkingStream, setThinkingStream] = useState("");
    const [error, setError] = useState("");
    const [provider, setProvider] = useState(AI_PROVIDERS[0].id);
    const [modelId, setModelId] = useState(AI_PROVIDERS[0].defaultModel);
    const [models, setModels] = useState<AIModel[]>(
        getModelsForProvider(AI_PROVIDERS[0].id),
    );
    const [modelsLoading, setModelsLoading] = useState(false);
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Refs
    const abortRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const providerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const shouldAutoScroll = useRef(true);

    const currentProvider = AI_PROVIDERS.find((p) => p.id === provider);
    const currentModel = models.find((m) => m.id === modelId);

    // Load saved conversations from store
    useEffect(() => {
        chatStore
            .get<Conversation[]>("conversations")
            .then((saved) => {
                if (saved && saved.length > 0) setConversations(saved);
            })
            .catch(() => {});
    }, []);

    // Persist conversations whenever they change
    useEffect(() => {
        if (conversations.length > 0) {
            chatStore
                .set("conversations", conversations)
                .then(() => chatStore.save())
                .catch(() => {});
        } else {
            chatStore
                .delete("conversations")
                .then(() => chatStore.save())
                .catch(() => {});
        }
    }, [conversations]);

    // Load repos
    useEffect(() => {
        fetchRepos()
            .then(setRepos)
            .catch(() => {});
    }, []);

    // Load models
    useEffect(() => {
        setModels(getModelsForProvider(provider));
        setModelsLoading(true);
        fetchProviderModels(provider)
            .then((m) => {
                setModels(m);
                if (!m.find((x) => x.id === modelId)) {
                    const p = AI_PROVIDERS.find((x) => x.id === provider);
                    if (p) setModelId(p.defaultModel);
                }
            })
            .catch(() => {})
            .finally(() => setModelsLoading(false));
    }, [provider]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                providerRef.current &&
                !providerRef.current.contains(e.target as Node)
            )
                setShowProviderMenu(false);
            if (
                modelRef.current &&
                !modelRef.current.contains(e.target as Node)
            )
                setShowModelMenu(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Smart auto-scroll: only scroll down if user is near bottom
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const threshold = 100;
        shouldAutoScroll.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    }, []);

    useEffect(() => {
        if (shouldAutoScroll.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, thinkingStream]);

    // Build system message
    const buildSystemMessage = (): ChatMessage => {
        const repoList = repos
            .slice(0, 20)
            .map((r) => {
                const parts = [`${r.full_name}`];
                if (r.description) parts.push(`— ${r.description}`);
                parts.push(
                    `(${r.language || "unknown"}, ★${r.stargazers_count}, ${r.private ? "private" : "public"})`,
                );
                return parts.join(" ");
            })
            .join("\n");

        return {
            role: "system" as const,
            content: `You are NxtGit AI assistant, an intelligent Git & GitHub assistant embedded in the NxtGit desktop application. You help the user understand their repositories, review code, manage PRs and issues, and answer any development questions.

Current user: ${user?.login || "unknown"}

User's repositories:
${repoList || "(none loaded)"}

Guidelines:
- Be concise and helpful. Use markdown formatting in your responses (headers, code blocks, lists).
- When asked about a specific repository, use the information available above.
- You can help with: explaining code, reviewing PRs, understanding project structure, suggesting improvements, writing commit messages, and general development questions.
- If the user attaches a repository, you will receive its full file tree. Use it to understand the project structure. If you need to see a specific file's content, ask the user to attach that file.
- If you don't have enough information about a repo's contents, say so and suggest the user attach the repo or specific files.`,
        };
    };

    // Send message
    const handleSend = async () => {
        const text = input.trim();
        if (!text || streaming) return;

        // Build attachment context
        let attachmentContext = "";
        if (attachments.length > 0) {
            attachmentContext = "\n\n--- Attached context ---\n";
            for (const att of attachments) {
                if (att.type === "repo") {
                    attachmentContext += `\n**Repository: ${att.repo}**\n`;
                    if (att.tree && att.tree.length > 0) {
                        attachmentContext += `File tree (${att.tree.length} files):\n\`\`\`\n${att.tree.join("\n")}\n\`\`\`\n`;
                        attachmentContext += `\nNote: Only the file tree is shown. If you need to see the contents of a specific file, ask the user and they can attach it.\n`;
                    }
                } else if (att.type === "file" && att.content) {
                    attachmentContext += `\n**${att.repo}/${att.path}:**\n\`\`\`\n${att.content}\n\`\`\`\n`;
                } else if (att.type === "folder") {
                    attachmentContext += `\n**Folder:** ${att.repo}/${att.path}/\n`;
                } else {
                    attachmentContext += `\n**File:** ${att.repo}/${att.path} (content not loaded)\n`;
                }
            }
        }

        const userMsg: ChatMessage = {
            role: "user" as const,
            content: text,
            attachments: attachments.map((a) => ({
                name: a.name,
                type: a.type,
                content: a.content,
                repo: a.repo,
            })),
        };

        setInput("");
        setAttachments([]);
        setError("");
        shouldAutoScroll.current = true;

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        const systemMessage = buildSystemMessage();
        const apiMessages: ChatMessage[] = [
            systemMessage,
            ...updatedMessages.map((m) => ({
                ...m,
                content:
                    m.role === "user" && m === userMsg
                        ? text + attachmentContext
                        : m.content,
            })),
        ];

        setStreaming(true);
        setThinkingStream("");
        const controller = new AbortController();
        abortRef.current = controller;

        const assistantIdx = updatedMessages.length;
        setMessages((prev) => [
            ...prev,
            { role: "assistant" as const, content: "" },
        ]);

        let assistantText = "";
        let thinkText = "";

        const streamCallbacks: StreamCallbacks = {
            onChunk: (chunk) => {
                assistantText += chunk;
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantIdx] = {
                        role: "assistant",
                        content: assistantText,
                    };
                    return updated;
                });
            },
            onThinking: (chunk) => {
                thinkText += chunk;
                setThinkingStream(thinkText);
            },
        };

        try {
            await streamChat(
                provider,
                apiMessages,
                streamCallbacks,
                controller.signal,
                modelId,
            );

            // Save thinking text for this message
            if (thinkText) {
                setThinkingMap((prev) => ({
                    ...prev,
                    [assistantIdx]: thinkText,
                }));
            }

            // Save to conversation history
            const finalMessages = [
                ...updatedMessages,
                { role: "assistant" as const, content: assistantText },
            ];
            saveConversation(finalMessages);
        } catch (e: unknown) {
            if (e instanceof Error && e.name === "AbortError") return;
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            if (!assistantText) {
                setMessages((prev) => prev.slice(0, -1));
            }
        } finally {
            setStreaming(false);
            setThinkingStream("");
            abortRef.current = null;
        }
    };

    const saveConversation = (msgs: ChatMessage[]) => {
        const userMessages = msgs.filter((m) => m.role === "user");
        const title = userMessages[0]?.content.slice(0, 50) || "New chat";

        if (activeConvId) {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeConvId ? { ...c, messages: msgs, title } : c,
                ),
            );
        } else {
            const id = Date.now().toString();
            const conv: Conversation = {
                id,
                title,
                messages: msgs,
                createdAt: Date.now(),
                provider,
                model: modelId,
            };
            setConversations((prev) => [conv, ...prev]);
            setActiveConvId(id);
        }
    };

    const handleStop = () => abortRef.current?.abort();

    const handleNewChat = () => {
        if (streaming) handleStop();
        setMessages([]);
        setThinkingMap({});
        setThinkingStream("");
        setError("");
        setActiveConvId(null);
        setAttachments([]);
        inputRef.current?.focus();
    };

    const loadConversation = (conv: Conversation) => {
        if (streaming) return;
        setActiveConvId(conv.id);
        setMessages(conv.messages);
        setThinkingMap({});
        setError("");
        setProvider(conv.provider);
        setModelId(conv.model);
    };

    const deleteConversation = (id: string) => {
        setConversations((prev) => {
            const updated = prev.filter((c) => c.id !== id);
            return updated;
        });
        if (activeConvId === id) {
            handleNewChat();
        }
    };

    const switchProvider = (pid: string) => {
        setProvider(pid);
        const p = AI_PROVIDERS.find((x) => x.id === pid);
        if (p) setModelId(p.defaultModel);
        setShowProviderMenu(false);
    };

    const addAttachment = (att: Attachment) => {
        setAttachments((prev) => {
            if (prev.find((a) => a.repo === att.repo && a.path === att.path))
                return prev;
            return [...prev, att];
        });
        setShowFilePicker(false);
    };

    const addRepoAttachment = async (repo: GitHubRepo) => {
        setShowFilePicker(false);
        // Check if already attached
        if (
            attachments.find(
                (a) => a.type === "repo" && a.repo === repo.full_name,
            )
        )
            return;
        const [owner, name] = repo.full_name.split("/");
        let treePaths: string[] = [];
        try {
            const tree = await fetchRepoTree(owner, name, repo.default_branch);
            treePaths = tree
                .filter((e) => e.type === "blob")
                .map((e) => e.path);
        } catch {
            /* tree fetch failed, attach without tree */
        }
        setAttachments((prev) => [
            ...prev,
            {
                name: repo.full_name,
                path: "",
                type: "repo",
                repo: repo.full_name,
                tree: treePaths,
            },
        ]);
    };

    const removeAttachment = (idx: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="h-full flex">
            {/* Sidebar - conversation history */}
            <div
                className="w-56 flex-shrink-0 border-r flex flex-col"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <div
                    className="px-3 py-3 border-b flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}
                >
                    <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Conversations
                    </span>
                    <button
                        onClick={handleNewChat}
                        className="p-1 rounded-md transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                                "var(--bg-tertiary)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                        }
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                    {conversations.length === 0 ? (
                        <p
                            className="text-[11px] px-2 py-4 text-center"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            No conversations yet
                        </p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${conv.id === activeConvId ? "" : ""}`}
                                style={{
                                    background:
                                        conv.id === activeConvId
                                            ? "var(--bg-tertiary)"
                                            : "transparent",
                                    color:
                                        conv.id === activeConvId
                                            ? "var(--text-primary)"
                                            : "var(--text-secondary)",
                                }}
                                onClick={() => loadConversation(conv)}
                                onMouseEnter={(e) => {
                                    if (conv.id !== activeConvId)
                                        e.currentTarget.style.background =
                                            "var(--bg-tertiary)";
                                }}
                                onMouseLeave={(e) => {
                                    if (conv.id !== activeConvId)
                                        e.currentTarget.style.background =
                                            "transparent";
                                }}
                            >
                                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs truncate flex-1">
                                    {conv.title}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConversation(conv.id);
                                    }}
                                    className="hidden group-hover:block p-0.5 rounded"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div
                    className="px-4 py-3 border-b flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-2">
                        <Bot
                            className="w-4 h-4"
                            style={{ color: "var(--text-tertiary)" }}
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {activeConvId
                                ? conversations.find(
                                      (c) => c.id === activeConvId,
                                  )?.title || "Chat"
                                : "New chat"}
                        </span>
                    </div>
                    {hasMessages && (
                        <button
                            onClick={handleNewChat}
                            className="text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{
                                color: "var(--text-secondary)",
                                background: "var(--bg-tertiary)",
                            }}
                        >
                            <Plus className="w-3 h-3 inline mr-1" />
                            New chat
                        </button>
                    )}
                </div>

                {/* Messages area */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto"
                >
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Bot
                                className="w-10 h-10 mb-4"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <h2
                                className="text-lg font-semibold mb-1"
                                style={{ color: "var(--text-primary)" }}
                            >
                                How can I help you?
                            </h2>
                            <p
                                className="text-sm"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Ask about your repos, review code, or get
                                development help.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`${msg.role === "user" ? "max-w-[75%]" : "max-w-[85%]"}`}
                                    >
                                        {/* Attachments on user messages */}
                                        {msg.role === "user" &&
                                            msg.attachments &&
                                            msg.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-1 justify-end">
                                                    {msg.attachments.map(
                                                        (att, j) => (
                                                            <span
                                                                key={j}
                                                                className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                                                                style={{
                                                                    background:
                                                                        "rgba(0, 122, 255, 0.15)",
                                                                    color: "var(--accent)",
                                                                }}
                                                            >
                                                                {att.type ===
                                                                "repo" ? (
                                                                    <GitBranch className="w-2.5 h-2.5" />
                                                                ) : att.type ===
                                                                  "folder" ? (
                                                                    <Folder className="w-2.5 h-2.5" />
                                                                ) : (
                                                                    <File className="w-2.5 h-2.5" />
                                                                )}
                                                                {att.type ===
                                                                "repo"
                                                                    ? att.repo
                                                                    : att.name}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                        {/* Thinking block */}
                                        {msg.role === "assistant" &&
                                            (thinkingMap[i] ||
                                                (streaming &&
                                                    i ===
                                                        messages.length -
                                                            1)) && (
                                                <ThinkingBlock
                                                    thinking={
                                                        thinkingMap[i] ||
                                                        thinkingStream
                                                    }
                                                    isStreaming={
                                                        streaming &&
                                                        i ===
                                                            messages.length -
                                                                1 &&
                                                        !thinkingMap[i]
                                                    }
                                                />
                                            )}

                                        {/* Message bubble — hide when assistant has no content yet */}
                                        {(msg.role !== "assistant" ||
                                            msg.content) && (
                                            <div
                                                className="text-sm rounded-lg px-3 py-2"
                                                style={{
                                                    background:
                                                        msg.role === "user"
                                                            ? "var(--accent)"
                                                            : "var(--bg-tertiary)",
                                                    color:
                                                        msg.role === "user"
                                                            ? "white"
                                                            : "var(--text-primary)",
                                                }}
                                            >
                                                {msg.role === "assistant" ? (
                                                    msg.content ? (
                                                        <MarkdownRenderer
                                                            content={
                                                                msg.content
                                                            }
                                                        />
                                                    ) : null
                                                ) : (
                                                    <span className="whitespace-pre-wrap">
                                                        {msg.content}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {error && (
                    <div
                        className="px-4 py-2 text-xs"
                        style={{ color: "var(--error)" }}
                    >
                        {error}
                    </div>
                )}

                {/* Input area */}
                <div
                    className="border-t px-4 pt-3 pb-2"
                    style={{ borderColor: "var(--border)" }}
                >
                    {/* Attachments preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {attachments.map((att, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2 py-1 rounded-md flex items-center gap-1.5"
                                    style={{
                                        background: "var(--bg-tertiary)",
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {att.type === "repo" ? (
                                        <GitBranch className="w-3 h-3" />
                                    ) : att.type === "folder" ? (
                                        <Folder className="w-3 h-3" />
                                    ) : (
                                        <File className="w-3 h-3" />
                                    )}
                                    <span className="truncate max-w-[150px]">
                                        {att.type === "repo"
                                            ? att.repo
                                            : att.name}
                                    </span>
                                    <button
                                        onClick={() => removeAttachment(i)}
                                        className="p-0.5"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            rows={1}
                            className="w-full text-sm py-3 px-4 pr-12 rounded-lg outline-none resize-none"
                            style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--text-primary)",
                                minHeight: "44px",
                                maxHeight: "120px",
                            }}
                            onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height =
                                    Math.min(el.scrollHeight, 120) + "px";
                            }}
                            disabled={streaming}
                        />
                    </div>
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-4 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                        {/* Provider selector */}
                        <div className="relative" ref={providerRef}>
                            <button
                                onClick={() =>
                                    setShowProviderMenu(!showProviderMenu)
                                }
                                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md transition-colors"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{currentProvider?.name || "Ask"}</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showProviderMenu && (
                                <div
                                    className="absolute left-0 bottom-full mb-1 w-48 rounded-lg border py-1 z-50 shadow-lg"
                                    style={{
                                        background: "var(--bg-secondary)",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    {AI_PROVIDERS.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => switchProvider(p.id)}
                                            className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between"
                                            style={{
                                                color:
                                                    p.id === provider
                                                        ? "var(--accent)"
                                                        : "var(--text-primary)",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    "var(--bg-tertiary)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background =
                                                    "transparent")
                                            }
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {p.name}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "var(--text-tertiary)",
                                                    }}
                                                >
                                                    {p.description}
                                                </div>
                                            </div>
                                            {p.usesOAuth && (
                                                <span
                                                    className="text-[9px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0"
                                                    style={{
                                                        background:
                                                            "rgba(0, 122, 255, 0.1)",
                                                        color: "var(--accent)",
                                                    }}
                                                >
                                                    OAuth
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attach button */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowFilePicker(!showFilePicker)
                                }
                                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md transition-colors"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Attach</span>
                            </button>
                            {showFilePicker && (
                                <FilePicker
                                    repos={repos}
                                    onAttach={addAttachment}
                                    onAttachRepo={addRepoAttachment}
                                    onClose={() => setShowFilePicker(false)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Model selector */}
                        <div className="relative" ref={modelRef}>
                            <button
                                onClick={() => setShowModelMenu(!showModelMenu)}
                                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md transition-colors"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <span>
                                    {modelsLoading
                                        ? "..."
                                        : currentModel?.name || modelId}
                                </span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showModelMenu && (
                                <div
                                    className="absolute right-0 bottom-full mb-1 w-52 rounded-lg border py-1 z-50 shadow-lg max-h-60 overflow-y-auto"
                                    style={{
                                        background: "var(--bg-secondary)",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setModelId(m.id);
                                                setShowModelMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs transition-colors"
                                            style={{
                                                color:
                                                    m.id === modelId
                                                        ? "var(--accent)"
                                                        : "var(--text-primary)",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    "var(--bg-tertiary)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background =
                                                    "transparent")
                                            }
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Send / Stop */}
                        {streaming ? (
                            <button
                                onClick={handleStop}
                                className="p-2 rounded-md"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <Square className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 rounded-md transition-colors"
                                style={{
                                    color: input.trim()
                                        ? "var(--accent)"
                                        : "var(--text-tertiary)",
                                }}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
