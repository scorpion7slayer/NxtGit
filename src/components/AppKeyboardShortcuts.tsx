import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DEFAULT_KEYBOARD_SHORTCUTS,
    SETTINGS_UPDATED_EVENT,
    SHORTCUT_DEFINITIONS,
    type ShortcutMap,
    loadAppPreferences,
    matchesShortcut,
} from "../lib/preferences";

function isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) {
        return false;
    }

    const tagName = element.tagName?.toLowerCase();
    return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        element.isContentEditable
    );
}

const AppKeyboardShortcuts: React.FC = () => {
    const navigate = useNavigate();
    const [shortcuts, setShortcuts] = useState<ShortcutMap>(
        DEFAULT_KEYBOARD_SHORTCUTS,
    );

    useEffect(() => {
        const loadShortcuts = () => {
            loadAppPreferences()
                .then((preferences) => setShortcuts(preferences.keyboardShortcuts))
                .catch(() => setShortcuts(DEFAULT_KEYBOARD_SHORTCUTS));
        };

        loadShortcuts();
        window.addEventListener(SETTINGS_UPDATED_EVENT, loadShortcuts);
        return () => {
            window.removeEventListener(SETTINGS_UPDATED_EVENT, loadShortcuts);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat) {
                return;
            }
            if (document.body.dataset.shortcutRecording === "true") {
                return;
            }
            if (isEditableTarget(event.target)) {
                return;
            }

            for (const shortcut of SHORTCUT_DEFINITIONS) {
                if (matchesShortcut(event, shortcuts[shortcut.id])) {
                    event.preventDefault();
                    navigate(shortcut.path);
                    return;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [navigate, shortcuts]);

    return null;
};

export default AppKeyboardShortcuts;
