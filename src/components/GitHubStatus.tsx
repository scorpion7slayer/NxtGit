import React, { useState, useEffect } from "react";
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    MinusCircle,
    Loader2,
    RefreshCw,
    Globe,
    ExternalLink,
} from "lucide-react";
import { fetch } from "@tauri-apps/plugin-http";

// --- Types ---

interface StatusComponent {
    id: string;
    name: string;
    status: string;
    description: string | null;
    position: number;
    group_id: string | null;
}

interface StatusIncident {
    id: string;
    name: string;
    status: string;
    impact: string;
    created_at: string;
    updated_at: string;
    shortlink: string;
    incident_updates: {
        id: string;
        status: string;
        body: string;
        created_at: string;
    }[];
}

interface StatusSummary {
    page: { name: string; url: string; updated_at: string };
    status: { indicator: string; description: string };
    components: StatusComponent[];
    incidents: StatusIncident[];
}

interface RegionalStatus {
    region: string;
    flag: string;
    url: string;
    status: { indicator: string; description: string } | null;
    loading: boolean;
}

// --- Helpers ---

function statusIcon(indicator: string) {
    switch (indicator) {
        case "none":
        case "operational":
            return <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />;
        case "minor":
        case "degraded_performance":
            return <AlertTriangle className="w-4 h-4" style={{ color: "var(--warning)" }} />;
        case "major":
        case "partial_outage":
            return <XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />;
        case "critical":
        case "major_outage":
            return <XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />;
        case "maintenance":
            return <MinusCircle className="w-4 h-4" style={{ color: "var(--accent)" }} />;
        default:
            return <MinusCircle className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />;
    }
}

function statusColor(indicator: string): string {
    switch (indicator) {
        case "none":
        case "operational":
            return "var(--success)";
        case "minor":
        case "degraded_performance":
            return "var(--warning)";
        case "major":
        case "partial_outage":
        case "critical":
        case "major_outage":
            return "var(--error)";
        case "maintenance":
            return "var(--accent)";
        default:
            return "var(--text-tertiary)";
    }
}

function statusLabel(status: string): string {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function incidentImpactColor(impact: string): string {
    switch (impact) {
        case "none": return "var(--text-tertiary)";
        case "minor": return "var(--warning)";
        case "major": return "var(--error)";
        case "critical": return "var(--error)";
        default: return "var(--text-tertiary)";
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// --- Regions ---

const REGIONS: { region: string; flag: string; url: string }[] = [
    { region: "United States", flag: "🇺🇸", url: "https://us.githubstatus.com/api/v2/status.json" },
    { region: "Europe", flag: "🇪🇺", url: "https://eu.githubstatus.com/api/v2/status.json" },
    { region: "Australia", flag: "🇦🇺", url: "https://au.githubstatus.com/api/v2/status.json" },
    { region: "Japan", flag: "🇯🇵", url: "https://jp.githubstatus.com/api/v2/status.json" },
];

// --- Component ---

const GitHubStatus: React.FC = () => {
    const [summary, setSummary] = useState<StatusSummary | null>(null);
    const [regions, setRegions] = useState<RegionalStatus[]>(
        REGIONS.map((r) => ({ ...r, status: null, loading: true })),
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadStatus = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("https://www.githubstatus.com/api/v2/summary.json", {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: StatusSummary = await res.json();
            setSummary(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load status");
        }
        setLoading(false);
    };

    const loadRegions = async () => {
        const results = await Promise.allSettled(
            REGIONS.map(async (r) => {
                const res = await fetch(r.url, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                return data.status as { indicator: string; description: string };
            }),
        );

        setRegions(
            REGIONS.map((r, i) => ({
                ...r,
                status: results[i].status === "fulfilled"
                    ? (results[i] as PromiseFulfilledResult<{ indicator: string; description: string }>).value
                    : null,
                loading: false,
            })),
        );
    };

    useEffect(() => {
        loadStatus();
        loadRegions();
    }, []);

    const refresh = () => {
        loadStatus();
        setRegions(REGIONS.map((r) => ({ ...r, status: null, loading: true })));
        loadRegions();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-tertiary)" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p style={{ color: "var(--error)" }}>{error}</p>
                <button onClick={refresh} className="btn-primary mt-3 text-sm">
                    Retry
                </button>
            </div>
        );
    }

    if (!summary) return null;

    const topComponents = summary.components
        .filter((c) => !c.group_id && c.name !== "Visit www.githubstatus.com for more information")
        .sort((a, b) => a.position - b.position);

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    GitHub Status
                </h1>
                <button
                    onClick={refresh}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                    <RefreshCw className="w-3 h-3" /> Refresh
                </button>
            </div>

            {/* Overall status */}
            <div
                className="border rounded-xl p-5 mb-6 flex items-center gap-4"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: `${statusColor(summary.status.indicator)}15` }}
                >
                    {summary.status.indicator === "none" ? (
                        <CheckCircle className="w-6 h-6" style={{ color: "var(--success)" }} />
                    ) : (
                        <AlertTriangle className="w-6 h-6" style={{ color: statusColor(summary.status.indicator) }} />
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        {summary.status.description}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        Updated {timeAgo(summary.page.updated_at)}
                    </p>
                </div>
            </div>

            {/* Components */}
            <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                Components
            </h2>
            <div
                className="border rounded-lg divide-y mb-6"
                style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
            >
                {topComponents.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                            {comp.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    color: statusColor(comp.status),
                                    background: `${statusColor(comp.status)}12`,
                                }}
                            >
                                {statusLabel(comp.status)}
                            </span>
                            {statusIcon(comp.status)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Regional status */}
            <h2 className="text-sm font-medium mb-3 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Globe className="w-3.5 h-3.5" /> Enterprise Cloud by Region
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {regions.map((r) => (
                    <div
                        key={r.region}
                        className="border rounded-lg p-4 flex items-center gap-3"
                        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                    >
                        <span className="text-xl">{r.flag}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                {r.region}
                            </p>
                            {r.loading ? (
                                <Loader2 className="w-3 h-3 animate-spin mt-1" style={{ color: "var(--text-tertiary)" }} />
                            ) : r.status ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {statusIcon(r.status.indicator)}
                                    <span className="text-xs" style={{ color: statusColor(r.status.indicator) }}>
                                        {r.status.description}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    Unavailable
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent incidents */}
            {summary.incidents.length > 0 && (
                <>
                    <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                        Active Incidents
                    </h2>
                    <div className="space-y-3 mb-6">
                        {summary.incidents.map((inc) => (
                            <div
                                key={inc.id}
                                className="border rounded-lg overflow-hidden"
                                style={{ borderColor: "var(--border)" }}
                            >
                                <div
                                    className="px-4 py-3 flex items-center justify-between"
                                    style={{ background: "var(--bg-secondary)" }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ background: incidentImpactColor(inc.impact) }}
                                        />
                                        <a href={inc.shortlink} target="_blank" rel="noopener noreferrer"
                                           className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                                            {inc.name}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                color: incidentImpactColor(inc.impact),
                                                background: `${incidentImpactColor(inc.impact)}12`,
                                            }}
                                        >
                                            {inc.impact}
                                        </span>
                                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                            {timeAgo(inc.updated_at)}
                                        </span>
                                    </div>
                                </div>
                                {inc.incident_updates.slice(0, 3).map((update) => (
                                    <div
                                        key={update.id}
                                        className="px-4 py-2 border-t text-xs"
                                        style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
                                    >
                                        <span className="font-medium mr-2" style={{ color: "var(--text-secondary)" }}>
                                            {statusLabel(update.status)}
                                        </span>
                                        <span style={{ color: "var(--text-primary)" }}>{update.body}</span>
                                        <span className="ml-2" style={{ color: "var(--text-tertiary)" }}>
                                            {timeAgo(update.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {summary.incidents.length === 0 && (
                <div
                    className="border rounded-lg p-4 text-center text-sm mb-6"
                    style={{ borderColor: "var(--border)", background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}
                >
                    No active incidents
                </div>
            )}

            <a
                href="https://www.githubstatus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs hover:underline"
                style={{ color: "var(--accent)" }}
            >
                <ExternalLink className="w-3 h-3" /> View on githubstatus.com
            </a>
        </div>
    );
};

export default GitHubStatus;
