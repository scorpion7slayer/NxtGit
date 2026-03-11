import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

export const SETTINGS_UPDATED_EVENT = "nxtgit:settings-updated";

const settingsStore = new LazyStore("settings.json");

export type ShortcutId =
    | "goDashboard"
    | "goRepositories"
    | "goIssues"
    | "goPullRequests"
    | "goChat"
    | "goSearch"
    | "goNotifications"
    | "goSettings";

export type ShortcutMap = Record<ShortcutId, string>;

export type AppPreferences = {
    notifications: boolean;
    autoReview: boolean;
    keyboardShortcuts: ShortcutMap;
};

export type ShortcutDefinition = {
    id: ShortcutId;
    label: string;
    description: string;
    path: string;
};

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
    {
        id: "goDashboard",
        label: "Dashboard",
        description: "Open the dashboard",
        path: "/",
    },
    {
        id: "goRepositories",
        label: "Repositories",
        description: "Open repositories",
        path: "/repos",
    },
    {
        id: "goIssues",
        label: "Issues",
        description: "Open issues",
        path: "/issues",
    },
    {
        id: "goPullRequests",
        label: "Pull Requests",
        description: "Open pull requests",
        path: "/prs",
    },
    {
        id: "goChat",
        label: "Chat",
        description: "Open AI chat",
        path: "/chat",
    },
    {
        id: "goSearch",
        label: "Search",
        description: "Open global search",
        path: "/search",
    },
    {
        id: "goNotifications",
        label: "Notifications",
        description: "Open notifications",
        path: "/notifications",
    },
    {
        id: "goSettings",
        label: "Settings",
        description: "Open settings",
        path: "/settings",
    },
];

const LEGACY_DEFAULT_KEYBOARD_SHORTCUTS: ShortcutMap = {
    goDashboard: "Mod+1",
    goRepositories: "Mod+2",
    goIssues: "Mod+3",
    goPullRequests: "Mod+4",
    goChat: "Mod+5",
    goSearch: "Mod+K",
    goNotifications: "Shift+Mod+N",
    goSettings: "Mod+,",
};

export const DEFAULT_KEYBOARD_SHORTCUTS: ShortcutMap = {
    goDashboard: "Mod+D",
    goRepositories: "Mod+R",
    goIssues: "Mod+I",
    goPullRequests: "Shift+Mod+P",
    goChat: "Shift+Mod+C",
    goSearch: "Mod+K",
    goNotifications: "Shift+Mod+N",
    goSettings: "Mod+,",
};

export const DEFAULT_PREFERENCES: AppPreferences = {
    notifications: true,
    autoReview: false,
    keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
};

export async function loadAppPreferences(): Promise<AppPreferences> {
    const notifications =
        (await settingsStore.get<boolean>("notifications")) ??
        DEFAULT_PREFERENCES.notifications;
    const autoReview =
        (await settingsStore.get<boolean>("autoReview")) ??
        DEFAULT_PREFERENCES.autoReview;
    const storedShortcuts = await settingsStore.get<Partial<ShortcutMap>>(
        "keyboardShortcuts",
    );
    const keyboardShortcuts = mergeShortcutMap(
        shouldUpgradeLegacyShortcuts(storedShortcuts)
            ? DEFAULT_KEYBOARD_SHORTCUTS
            : storedShortcuts,
    );

    return {
        notifications,
        autoReview,
        keyboardShortcuts,
    };
}

export async function saveAppPreferences(
    preferences: AppPreferences,
): Promise<void> {
    await settingsStore.set("notifications", preferences.notifications);
    await settingsStore.set("autoReview", preferences.autoReview);
    await settingsStore.set("keyboardShortcuts", preferences.keyboardShortcuts);
    await settingsStore.save();
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
}

export function mergeShortcutMap(
    overrides?: Partial<ShortcutMap> | null,
): ShortcutMap {
    return {
        ...DEFAULT_KEYBOARD_SHORTCUTS,
        ...(overrides ?? {}),
    };
}

export function shortcutFromKeyboardEvent(
    event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>,
): string | null {
    const key = normalizeShortcutKey(event.key);
    if (!key) {
        return null;
    }

    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) {
        parts.push("Mod");
    }
    if (event.altKey) {
        parts.push("Alt");
    }
    if (event.shiftKey) {
        parts.push("Shift");
    }

    if (key === "Shift" || key === "Alt" || key === "Mod") {
        return null;
    }

    parts.push(key);
    return parts.join("+");
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const eventShortcut = shortcutFromKeyboardEvent(event);
    return eventShortcut === normalizeShortcut(shortcut);
}

export function normalizeShortcut(shortcut: string): string {
    const tokens = shortcut
        .split("+")
        .map((token) => token.trim())
        .filter(Boolean);

    const modifiers = new Set<string>();
    let key = "";

    for (const token of tokens) {
        const normalized = normalizeShortcutKey(token);
        if (!normalized) {
            continue;
        }

        if (normalized === "Shift" || normalized === "Alt" || normalized === "Mod") {
            modifiers.add(normalized);
        } else {
            key = normalized;
        }
    }

    const ordered = ["Mod", "Alt", "Shift"].filter((token) =>
        modifiers.has(token),
    );
    return key ? [...ordered, key].join("+") : ordered.join("+");
}

export function formatShortcutLabel(
    shortcut: string,
    isMac: boolean = navigator.userAgent.includes("Macintosh"),
): string {
    return normalizeShortcut(shortcut)
        .split("+")
        .map((token) => {
            if (token === "Mod") {
                return isMac ? "Cmd" : "Ctrl";
            }
            return token;
        })
        .join(" + ");
}

function normalizeShortcutKey(key: string): string | null {
    if (!key) {
        return null;
    }

    const trimmed = key.trim();
    if (!trimmed) {
        return null;
    }

    const lower = trimmed.toLowerCase();
    if (lower === "meta" || lower === "control" || lower === "ctrl" || lower === "mod") {
        return "Mod";
    }
    if (lower === "alt" || lower === "option") {
        return "Alt";
    }
    if (lower === "shift") {
        return "Shift";
    }
    if (lower === "escape") {
        return "Esc";
    }
    if (lower === " ") {
        return "Space";
    }
    if (lower === "arrowup") {
        return "Up";
    }
    if (lower === "arrowdown") {
        return "Down";
    }
    if (lower === "arrowleft") {
        return "Left";
    }
    if (lower === "arrowright") {
        return "Right";
    }
    if (lower.length === 1) {
        return lower.toUpperCase();
    }
    if (/^f\d{1,2}$/i.test(trimmed)) {
        return trimmed.toUpperCase();
    }
    return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function shouldUpgradeLegacyShortcuts(
    shortcuts?: Partial<ShortcutMap> | null,
): boolean {
    if (!shortcuts) {
        return false;
    }

    return (Object.keys(LEGACY_DEFAULT_KEYBOARD_SHORTCUTS) as ShortcutId[]).every(
        (shortcutId) =>
            normalizeShortcut(shortcuts[shortcutId] ?? "") ===
            normalizeShortcut(LEGACY_DEFAULT_KEYBOARD_SHORTCUTS[shortcutId]),
    );
}
