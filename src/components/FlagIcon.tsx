import React from "react";

type FlagCode = "au" | "eu" | "jp" | "us";

interface FlagIconProps {
    code: FlagCode;
    className?: string;
    title: string;
}

const FLAG_EMOJI: Record<FlagCode, string> = {
    us: "🇺🇸",
    eu: "🇪🇺",
    au: "🇦🇺",
    jp: "🇯🇵",
};

const STAR_POSITIONS = [
    [32, 9],
    [38.5, 11],
    [43, 16],
    [44.5, 23],
    [43, 30],
    [38.5, 35],
    [32, 37],
    [25.5, 35],
    [21, 30],
    [19.5, 23],
    [21, 16],
    [25.5, 11],
] as const;

const FlagIcon: React.FC<FlagIconProps> = ({ code, className, title }) => {
    const useNativeEmoji =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("platform-macos");

    if (useNativeEmoji) {
        return (
            <span
                className={className}
                aria-label={title}
                role="img"
                title={title}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                }}
            >
                {FLAG_EMOJI[code]}
            </span>
        );
    }

    switch (code) {
        case "us":
            return (
                <svg
                    viewBox="0 0 64 48"
                    className={className}
                    aria-label={title}
                    role="img"
                >
                    <title>{title}</title>
                    <rect width="64" height="48" rx="4" fill="#B22234" />
                    <path
                        fill="#FFFFFF"
                        d="M0 3.69h64v3.69H0zm0 7.38h64v3.69H0zm0 7.38h64v3.69H0zm0 7.38h64v3.69H0zm0 7.38h64v3.69H0zm0 7.38h64v3.69H0z"
                    />
                    <rect width="28" height="25.85" rx="4" fill="#3C3B6E" />
                    {Array.from({ length: 5 }).map((_, row) =>
                        Array.from({ length: row % 2 === 0 ? 6 : 5 }).map((__, column) => (
                            <circle
                                key={`${row}-${column}`}
                                cx={row % 2 === 0 ? 3.2 + column * 4.4 : 5.4 + column * 4.4}
                                cy={3.2 + row * 4.3}
                                r="1"
                                fill="#FFFFFF"
                            />
                        )),
                    )}
                </svg>
            );
        case "eu":
            return (
                <svg
                    viewBox="0 0 64 48"
                    className={className}
                    aria-label={title}
                    role="img"
                >
                    <title>{title}</title>
                    <rect width="64" height="48" rx="4" fill="#003399" />
                    {STAR_POSITIONS.map(([cx, cy], index) => (
                        <circle key={index} cx={cx} cy={cy} r="2" fill="#FFCC00" />
                    ))}
                </svg>
            );
        case "jp":
            return (
                <svg
                    viewBox="0 0 64 48"
                    className={className}
                    aria-label={title}
                    role="img"
                >
                    <title>{title}</title>
                    <rect width="64" height="48" rx="4" fill="#FFFFFF" />
                    <circle cx="32" cy="24" r="11" fill="#BC002D" />
                </svg>
            );
        case "au":
            return (
                <svg
                    viewBox="0 0 64 48"
                    className={className}
                    aria-label={title}
                    role="img"
                >
                    <title>{title}</title>
                    <rect width="64" height="48" rx="4" fill="#012169" />
                    <g>
                        <rect width="30" height="24" fill="#012169" />
                        <path d="M0 0l30 24M30 0L0 24" stroke="#FFFFFF" strokeWidth="5" />
                        <path d="M0 0l30 24M30 0L0 24" stroke="#C8102E" strokeWidth="2.5" />
                        <path d="M15 0v24M0 12h30" stroke="#FFFFFF" strokeWidth="8" />
                        <path d="M15 0v24M0 12h30" stroke="#C8102E" strokeWidth="4" />
                    </g>
                    <circle cx="46" cy="14" r="3" fill="#FFFFFF" />
                    <circle cx="52" cy="23" r="2.4" fill="#FFFFFF" />
                    <circle cx="45" cy="30" r="2.6" fill="#FFFFFF" />
                    <circle cx="56" cy="34" r="2" fill="#FFFFFF" />
                    <circle cx="36" cy="36" r="3.4" fill="#FFFFFF" />
                </svg>
            );
    }
};

export default FlagIcon;
