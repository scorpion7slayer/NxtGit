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
    const update = await check();

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

export async function installAppUpdate(
    update: Update,
    onEvent?: (event: DownloadEvent) => void,
): Promise<void> {
    await update.downloadAndInstall(onEvent);
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
