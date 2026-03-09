import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowDragRegionProps {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const WindowDragRegion: React.FC<WindowDragRegionProps> = ({
    children,
    className,
    style,
}) => {
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
            return;
        }

        const target = event.target as HTMLElement;
        if (
            target.closest(
                "button, a, input, textarea, select, summary, [role='button'], .macos-drag-bar-nodrag",
            )
        ) {
            return;
        }

        void getCurrentWindow().startDragging().catch(() => {});
    };

    return (
        <div
            className={className}
            data-tauri-drag-region
            onMouseDown={handleMouseDown}
            style={style}
        >
            {children}
        </div>
    );
};

export default WindowDragRegion;
