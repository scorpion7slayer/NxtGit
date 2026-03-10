import React, { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, X } from "lucide-react";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import {
    formatUpdaterError,
    getAvailableAppUpdate,
    getUpdateReleaseUrl,
    installAppUpdate,
    type AvailableAppUpdate,
} from "../lib/updater";

const UpdateBanner: React.FC = () => {
    const [availableUpdate, setAvailableUpdate] =
        useState<AvailableAppUpdate | null>(null);
    const [dismissedVersion, setDismissedVersion] = useState("");
    const [installing, setInstalling] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const update = await getAvailableAppUpdate();
                if (cancelled || !update || update.version === dismissedVersion) {
                    return;
                }
                setAvailableUpdate(update);
            } catch {
                // Silent on startup; manual checks surface the error explicitly.
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [dismissedVersion]);

    const handleInstall = async () => {
        if (!availableUpdate) {
            return;
        }

        setInstalling(true);
        setError("");
        setStatus("Downloading update...");

        try {
            let downloadedBytes = 0;
            let totalBytes = 0;

            await installAppUpdate(availableUpdate.update, (event) => {
                if (event.event === "Started") {
                    totalBytes = event.data.contentLength ?? 0;
                } else if (event.event === "Progress") {
                    downloadedBytes += event.data.chunkLength;
                    if (totalBytes > 0) {
                        const percent = Math.min(
                            100,
                            Math.round((downloadedBytes / totalBytes) * 100),
                        );
                        setStatus(`Downloading update... ${percent}%`);
                    }
                } else if (event.event === "Finished") {
                    setStatus("Installing update...");
                }
            });

            setStatus("Restarting...");
            await relaunch();
        } catch (installError) {
            setError(formatUpdaterError(installError));
            setInstalling(false);
        }
    };

    if (!availableUpdate || dismissedVersion === availableUpdate.version) {
        return null;
    }

    return (
        <div className="update-banner border rounded-xl">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Update available: v{availableUpdate.version}
                    </p>
                    <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Current version: {availableUpdate.currentVersion}
                    </p>
                    {availableUpdate.body && (
                        <p
                            className="text-xs mt-2 whitespace-pre-wrap"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            {availableUpdate.body}
                        </p>
                    )}
                    {status && (
                        <p
                            className="text-xs mt-2"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {status}
                        </p>
                    )}
                    {error && (
                        <p
                            className="text-xs mt-2"
                            style={{ color: "var(--error)" }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    className="macos-drag-bar-nodrag p-1 rounded-md hover:bg-[var(--bg-tertiary)]"
                    onClick={() => setDismissedVersion(availableUpdate.version)}
                    aria-label="Dismiss update notification"
                >
                    <X
                        className="w-4 h-4"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
                <button
                    type="button"
                    onClick={handleInstall}
                    disabled={installing}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 macos-drag-bar-nodrag"
                >
                    {installing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Download className="w-3.5 h-3.5" />
                    )}
                    {installing ? "Installing..." : "Update now"}
                </button>
                <button
                    type="button"
                    onClick={() => setDismissedVersion(availableUpdate.version)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 macos-drag-bar-nodrag"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Later
                </button>
                {error && (
                    <button
                        type="button"
                        onClick={() =>
                            open(getUpdateReleaseUrl(availableUpdate.version))
                        }
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 macos-drag-bar-nodrag"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Open release
                    </button>
                )}
            </div>
        </div>
    );
};

export default UpdateBanner;
