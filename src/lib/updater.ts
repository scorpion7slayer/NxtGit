import { getVersion } from "@tauri-apps/api/app";
import {
    check,
    type Update,
    type DownloadEvent,
} from "@tauri-apps/plugin-updater";

export interface AvailableAppUpdate {
    body: string;
    currentVersion: string;
    update: Update;
    version: string;
}

export async function getAvailableAppUpdate(): Promise<AvailableAppUpdate | null> {
    const currentVersion = await getVersion();
    let update = await check();

    if (!update) {
        update = await getRelaxedFixUpdate(currentVersion);
    }

    if (!update) {
        return null;
    }

    return {
        update,
        currentVersion,
        version: update.version,
        body: update.body || "",
    };
}

async function getRelaxedFixUpdate(currentVersion: string): Promise<Update | null> {
    const candidate = await check({ allowDowngrades: true });

    if (!candidate) {
        return null;
    }

    if (isSupportedRelaxedUpdate(currentVersion, candidate.version)) {
        return candidate;
    }

    await candidate.close().catch(() => {});
    return null;
}

function isSupportedRelaxedUpdate(
    currentVersion: string,
    candidateVersion: string,
): boolean {
    const current = parseVersion(currentVersion);
    const candidate = parseVersion(candidateVersion);
    const coreComparison = compareCoreVersions(candidate.core, current.core);

    if (coreComparison > 0) {
        return true;
    }

    if (coreComparison < 0) {
        return false;
    }

    const candidateFixLevel = parseFixLevel(candidate.suffix);
    if (candidateFixLevel === null) {
        return false;
    }

    const currentFixLevel = parseFixLevel(current.suffix) ?? 0;
    return candidateFixLevel > currentFixLevel;
}

function parseVersion(version: string): { core: number[]; suffix: string } {
    const normalized = version.trim().replace(/^v/i, "");
    const [corePart, ...suffixParts] = normalized.split("-");
    const core = corePart.split(".").map((segment) => {
        const value = Number.parseInt(segment, 10);
        return Number.isFinite(value) ? value : 0;
    });

    return {
        core,
        suffix: suffixParts.join("-").toLowerCase(),
    };
}

function compareCoreVersions(left: number[], right: number[]): number {
    const length = Math.max(left.length, right.length);

    for (let index = 0; index < length; index += 1) {
        const leftValue = left[index] ?? 0;
        const rightValue = right[index] ?? 0;

        if (leftValue > rightValue) {
            return 1;
        }

        if (leftValue < rightValue) {
            return -1;
        }
    }

    return 0;
}

function parseFixLevel(suffix: string): number | null {
    if (!suffix) {
        return null;
    }

    const match = suffix.match(/^fix(?:[.-]?(\d+))?$/i);
    if (!match) {
        return null;
    }

    return Number.parseInt(match[1] ?? "1", 10);
}

export async function installAppUpdate(
    update: Update,
    onEvent?: (event: DownloadEvent) => void,
): Promise<void> {
    await update.downloadAndInstall(onEvent);
}

export function getUpdateReleaseUrl(version: string): string {
    return `https://github.com/scorpion7slayer/NxtGit/releases/tag/v${version}`;
}

export function formatUpdaterError(error: unknown): string {
    const message = extractErrorMessage(error);

    if (
        message.includes("latest.json") ||
        message.includes("404") ||
        message.includes("Not Found")
    ) {
        return "Updater metadata missing on GitHub release (`latest.json` or signatures not published yet).";
    }

    if (message.includes("not allowed") || message.includes("forbidden")) {
        return "Updater blocked by Tauri permissions.";
    }

    if (message.includes("Download request failed with status: 500")) {
        return "GitHub release asset download failed with HTTP 500. The release exists, but the in-app updater could not fetch the asset. Use the release page fallback below.";
    }

    return message;
}

function extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    if (typeof error === "object" && error !== null) {
        const record = error as Record<string, unknown>;

        if (typeof record.message === "string" && record.message.trim()) {
            return record.message;
        }

        const serialized = JSON.stringify(error);
        if (serialized && serialized !== "{}") {
            return serialized;
        }
    }

    return "Unknown updater error";
}
