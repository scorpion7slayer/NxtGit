import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// ---------- Types ----------

export interface WikiDiagram {
    svg: string;
    dotSource: string;
    altText: string | null;
    reasoning: string | null;
    sourceFiles: string[];
}

export interface WikiSection {
    title: string;
    level: number;
    summary: string | null;
    markdown: string;
    anchor: string | null;
    diagramCount: number;
    diagrams: WikiDiagram[];
    sourceFiles: string[];
}

export interface FetchWikiResult {
    repo: string;
    commit: string | null;
    canonicalUrl: string | null;
    sections: WikiSection[];
}

export interface SearchRepoResult {
    fullName: string;
    url: string | null;
    description: string | null;
    avatarUrl: string | null;
}

// ---------- Batchexecute protocol ----------

const BASE_URL = "https://codewiki.google";
const XSSI_PREFIX = ")]}'";

interface WrbFrame {
    rpcId: string;
    payload: unknown;
}

function stripXssiPrefix(text: string): string {
    const trimmed = text.trimStart();
    if (trimmed.startsWith(XSSI_PREFIX)) {
        return trimmed.slice(XSSI_PREFIX.length).trimStart();
    }
    return text;
}

function safeJsonParse(input: string): unknown | undefined {
    try {
        return JSON.parse(input);
    } catch {
        return undefined;
    }
}

function collectWrbFrames(node: unknown, out: WrbFrame[]): void {
    if (!Array.isArray(node)) return;

    if (
        node.length >= 3 &&
        node[0] === "wrb.fr" &&
        typeof node[1] === "string"
    ) {
        const rpcId = node[1];
        const rawPayload = node[2];
        const payload =
            typeof rawPayload === "string"
                ? (safeJsonParse(rawPayload) ?? rawPayload)
                : rawPayload;
        out.push({ rpcId, payload });
    }

    for (const child of node) {
        collectWrbFrames(child, out);
    }
}

function extractRpcPayload(responseText: string, rpcId: string): unknown {
    const body = stripXssiPrefix(responseText);
    const frames: WrbFrame[] = [];

    for (const rawLine of body.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line.startsWith("[") || !line.endsWith("]")) continue;
        const parsed = safeJsonParse(line);
        if (parsed !== undefined) {
            collectWrbFrames(parsed, frames);
        }
    }

    if (frames.length === 0) {
        throw new Error("No wrb.fr frames found in Code Wiki response");
    }

    const match = frames.find((f) => f.rpcId === rpcId) ?? frames[0];
    return match.payload;
}

async function callRpc(
    rpcId: string,
    rpcPayload: unknown,
    sourcePath?: string,
): Promise<unknown> {
    const url = new URL(
        `${BASE_URL}/_/BoqAngularSdlcAgentsUi/data/batchexecute`,
    );
    url.searchParams.set("rpcids", rpcId);
    url.searchParams.set("rt", "c");
    if (sourcePath) {
        url.searchParams.set("source-path", sourcePath);
    }

    const bodyObject = [
        [[rpcId, JSON.stringify(rpcPayload), null, "generic"]],
    ];
    const body = `f.req=${encodeURIComponent(JSON.stringify(bodyObject))}&`;

    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise((r) =>
                setTimeout(r, 250 * Math.pow(2, attempt - 1)),
            );
        }

        try {
            const response = await tauriFetch(url.toString(), {
                method: "POST",
                headers: {
                    "content-type":
                        "application/x-www-form-urlencoded;charset=UTF-8",
                },
                body,
            });

            if (!response.ok) {
                const err = new Error(
                    `Code Wiki RPC ${rpcId} failed: ${response.status}`,
                );
                if (response.status < 500) throw err;
                lastError = err;
                continue;
            }

            const text = await response.text();
            return extractRpcPayload(text, rpcId);
        } catch (err) {
            lastError = err;
            if (attempt === maxRetries) throw err;
        }
    }

    throw lastError;
}

// ---------- SVG color fix ----------

const LIGHT_FILLS = new Set([
    "white",
    "#fff",
    "#ffffff",
    "#fdfdfd",
    "#f0f0f0",
    "lightblue",
    "lightyellow",
    "lightgray",
    "lightgrey",
    "lightgreen",
    "lightcyan",
    "lightsalmon",
    "lightpink",
    "lightskyblue",
    "lightsteelblue",
    "linen",
    "aliceblue",
    "azure",
    "beige",
    "cornsilk",
    "floralwhite",
    "ghostwhite",
    "honeydew",
    "ivory",
    "lavender",
    "lavenderblush",
    "lemonchiffon",
    "mintcream",
    "mistyrose",
    "oldlace",
    "seashell",
    "snow",
    "whitesmoke",
]);

/**
 * Fix white text on light backgrounds in Graphviz SVGs.
 * The DOT source sometimes uses fontcolor=white on lightblue nodes,
 * making text invisible on a white background.
 */
function fixSvgTextColors(svg: string): string {
    // Match each <g class="node"> group and fix white text inside
    return svg.replace(
        /(<g\s[^>]*class="node"[^>]*>)([\s\S]*?)(<\/g>)/g,
        (_match, open: string, inner: string, close: string) => {
            // Find the polygon/ellipse fill in this node group
            const fillMatch = inner.match(
                /(?:<polygon|<ellipse|<rect)[^>]*fill="([^"]+)"/,
            );
            const shapeFill = fillMatch
                ? fillMatch[1].toLowerCase()
                : "white";

            // If the shape fill is light, change white text to dark
            if (LIGHT_FILLS.has(shapeFill)) {
                inner = inner.replace(
                    /(<text[^>]*)(fill="white")([^>]*>)/g,
                    '$1fill="#1a1a1a"$3',
                );
            }
            return open + inner + close;
        },
    );
}

// ---------- Public API ----------

function repoSourcePath(owner: string, name: string): string {
    return `/github.com/${owner}/${name}`;
}

function repoUrl(owner: string, name: string): string {
    return `https://github.com/${owner}/${name}`;
}

/**
 * Fetch the full wiki documentation for a repo from Code Wiki.
 */
export async function fetchCodeWiki(
    owner: string,
    name: string,
): Promise<FetchWikiResult> {
    const payload = (await callRpc(
        "VSX6ub",
        [repoUrl(owner, name)],
        repoSourcePath(owner, name),
    )) as unknown[];

    const root = Array.isArray(payload) ? payload : [];
    const primary = Array.isArray(root[0]) ? root[0] : [];
    const repoInfo = Array.isArray(primary[0]) ? primary[0] : [];
    const sectionsRaw = Array.isArray(primary[1]) ? primary[1] : [];

    const canonicalUrl =
        Array.isArray(root[1]) &&
        Array.isArray(root[1][0]) &&
        typeof root[1][0][1] === "string"
            ? root[1][0][1]
            : null;

    const repoName =
        typeof repoInfo[0] === "string" ? repoInfo[0] : `${owner}/${name}`;
    const commit = typeof repoInfo[1] === "string" ? repoInfo[1] : null;

    const sections: WikiSection[] = sectionsRaw
        .filter((item): item is unknown[] => Array.isArray(item))
        .map((item) => {
            const title =
                typeof item[0] === "string" ? item[0] : "Untitled";
            const rawLevel = item[1];
            const level =
                typeof rawLevel === "number" && Number.isFinite(rawLevel)
                    ? Math.max(1, Math.min(6, Math.floor(rawLevel)))
                    : 1;
            const summary =
                typeof item[2] === "string" ? item[2] : null;
            const rawMarkdown =
                typeof item[5] === "string"
                    ? item[5]
                    : typeof item[4] === "string"
                      ? item[4]
                      : (summary ?? "");

            // Rewrite relative Code Wiki links to absolute URLs
            const markdown = rawMarkdown.replace(
                /\]\(\/([\w.-]+\/[\w.-]+\/[^)]+)\)/g,
                `](${BASE_URL}/$1)`,
            );

            // Extract diagrams from item[7]
            const diagrams: WikiDiagram[] = [];
            if (Array.isArray(item[7])) {
                for (const d of item[7]) {
                    if (!Array.isArray(d)) continue;
                    const meta = Array.isArray(d[0]) ? d[0] : [];
                    const content = Array.isArray(d[2]) ? d[2] : [];
                    const dotSource =
                        typeof content[0] === "string" ? content[0] : "";
                    const rawSvg =
                        typeof content[1] === "string" ? content[1] : "";
                    if (!rawSvg && !dotSource) continue;
                    const svg = rawSvg ? fixSvgTextColors(rawSvg) : "";
                    const reasoning =
                        typeof meta[1] === "string" ? meta[1] : null;
                    const altText =
                        typeof meta[2] === "string" ? meta[2] : null;
                    const sourceFiles: string[] = [];
                    if (Array.isArray(meta[3])) {
                        for (const sf of meta[3]) {
                            if (
                                Array.isArray(sf) &&
                                typeof sf[0] === "string"
                            ) {
                                sourceFiles.push(sf[0]);
                            }
                        }
                    }
                    diagrams.push({
                        svg,
                        dotSource,
                        altText,
                        reasoning,
                        sourceFiles,
                    });
                }
            }
            const diagramCount = diagrams.length;

            // Extract source file references from item[3]
            const sourceFiles: string[] = [];
            if (Array.isArray(item[3])) {
                for (const sf of item[3]) {
                    if (Array.isArray(sf) && typeof sf[0] === "string") {
                        sourceFiles.push(sf[0]);
                    }
                }
            }

            const anchor =
                [...item]
                    .reverse()
                    .find(
                        (v): v is string =>
                            typeof v === "string" && v.startsWith("#"),
                    ) ?? null;

            return {
                title,
                level,
                summary,
                markdown,
                anchor,
                diagramCount,
                diagrams,
                sourceFiles,
            };
        });

    if (sections.length === 0) {
        throw new Error("NOT_INDEXED");
    }

    return { repo: repoName, commit, canonicalUrl, sections };
}

/**
 * Ask a question about a repository using Code Wiki's Gemini chat.
 */
export async function askCodeWiki(
    owner: string,
    name: string,
    question: string,
    history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
    const messages: [string, "user" | "model"][] = [
        ...history.map(
            (item) =>
                [
                    item.content,
                    item.role === "assistant" ? "model" : "user",
                ] as [string, "user" | "model"],
        ),
        [question, "user"],
    ];

    const payload = await callRpc(
        "EgIxfe",
        [messages, [null, repoUrl(owner, name)]],
        repoSourcePath(owner, name),
    );

    if (Array.isArray(payload) && typeof payload[0] === "string") {
        return payload[0];
    }
    if (typeof payload === "string") {
        return payload;
    }
    return JSON.stringify(payload, null, 2);
}

/**
 * Search for repositories indexed by Code Wiki.
 */
export async function searchCodeWiki(
    query: string,
    limit = 10,
): Promise<SearchRepoResult[]> {
    const payload = (await callRpc("vyWDAf", [query, limit, query, 0], "/")) as unknown[];

    const rows =
        Array.isArray(payload) && Array.isArray(payload[0])
            ? payload[0]
            : [];

    return rows
        .filter((item): item is unknown[] => Array.isArray(item))
        .map((item) => {
            const fullName =
                typeof item[0] === "string" ? item[0] : "unknown/unknown";
            const url =
                Array.isArray(item[3]) && typeof item[3][1] === "string"
                    ? item[3][1]
                    : null;
            let description: string | null = null;
            let avatarUrl: string | null = null;
            if (Array.isArray(item[5])) {
                description =
                    typeof item[5][0] === "string" ? item[5][0] : null;
                avatarUrl =
                    typeof item[5][1] === "string" ? item[5][1] : null;
            }
            return { fullName, url, description, avatarUrl };
        });
}
