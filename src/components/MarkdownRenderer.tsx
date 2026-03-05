import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, CheckCircle } from "lucide-react";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className,
}) => {
    return (
        <div className={`markdown-body ${className || ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(
                            codeClassName || "",
                        );
                        const codeString = String(children).replace(/\n$/, "");

                        if (match) {
                            return (
                                <CodeBlock
                                    language={match[1]}
                                    code={codeString}
                                />
                            );
                        }

                        return (
                            <code
                                className="inline-code"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--accent)",
                                    padding: "0.15em 0.4em",
                                    borderRadius: "4px",
                                    fontSize: "0.875em",
                                    fontFamily:
                                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                                }}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    h1: ({ children }) => (
                        <h1
                            style={{
                                color: "var(--text-primary)",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                marginTop: "1.25rem",
                                marginBottom: "0.5rem",
                            }}
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            style={{
                                color: "var(--text-primary)",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                marginTop: "1.25rem",
                                marginBottom: "0.5rem",
                            }}
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3
                            style={{
                                color: "var(--text-primary)",
                                fontSize: "1rem",
                                fontWeight: 600,
                                marginTop: "1rem",
                                marginBottom: "0.375rem",
                            }}
                        >
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4
                            style={{
                                color: "var(--text-primary)",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                marginTop: "0.75rem",
                                marginBottom: "0.25rem",
                            }}
                        >
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p
                            style={{
                                color: "var(--text-primary)",
                                lineHeight: 1.7,
                                marginBottom: "0.75rem",
                                fontSize: "0.875rem",
                            }}
                        >
                            {children}
                        </p>
                    ),
                    ul: ({ children }) => (
                        <ul
                            style={{
                                paddingLeft: "1.25rem",
                                marginBottom: "0.75rem",
                                listStyleType: "disc",
                            }}
                        >
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol
                            style={{
                                paddingLeft: "1.25rem",
                                marginBottom: "0.75rem",
                                listStyleType: "decimal",
                            }}
                        >
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li
                            style={{
                                color: "var(--text-primary)",
                                fontSize: "0.875rem",
                                lineHeight: 1.7,
                                marginBottom: "0.25rem",
                            }}
                        >
                            {children}
                        </li>
                    ),
                    strong: ({ children }) => (
                        <strong
                            style={{
                                color: "var(--text-primary)",
                                fontWeight: 600,
                            }}
                        >
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em style={{ color: "var(--text-secondary)" }}>
                            {children}
                        </em>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote
                            style={{
                                borderLeft: "3px solid var(--accent)",
                                paddingLeft: "0.75rem",
                                margin: "0.75rem 0",
                                color: "var(--text-secondary)",
                            }}
                        >
                            {children}
                        </blockquote>
                    ),
                    hr: () => (
                        <hr
                            style={{
                                border: "none",
                                borderTop: "1px solid var(--border)",
                                margin: "1rem 0",
                            }}
                        />
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: "var(--accent)",
                                textDecoration: "underline",
                            }}
                        >
                            {children}
                        </a>
                    ),
                    table: ({ children }) => (
                        <div
                            style={{
                                overflowX: "auto",
                                marginBottom: "0.75rem",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "0.875rem",
                                }}
                            >
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th
                            style={{
                                textAlign: "left",
                                padding: "0.5rem 0.75rem",
                                fontWeight: 600,
                                borderBottom: "2px solid var(--border)",
                                color: "var(--text-primary)",
                                background: "var(--bg-tertiary)",
                            }}
                        >
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td
                            style={{
                                padding: "0.5rem 0.75rem",
                                borderBottom: "1px solid var(--border)",
                                color: "var(--text-primary)",
                            }}
                        >
                            {children}
                        </td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({
    language,
    code,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            style={{
                position: "relative",
                marginBottom: "0.75rem",
                borderRadius: "8px",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.375rem 0.75rem",
                    background: "rgba(0,0,0,0.3)",
                    fontSize: "0.75rem",
                }}
            >
                <span
                    style={{
                        color: "rgba(255,255,255,0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: copied ? "#34C759" : "rgba(255,255,255,0.5)",
                        fontSize: "0.75rem",
                    }}
                >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <SyntaxHighlighter
                style={oneDark}
                language={language}
                customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    padding: "0.75rem 1rem",
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

export default MarkdownRenderer;
