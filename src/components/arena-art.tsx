export function ArenaArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 260"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <g transform="rotate(-8 180 130)">
        <rect x="18" y="40" width="324" height="184" rx="58" fill="#e53935" opacity="0.9" />
        <rect x="42" y="58" width="276" height="148" rx="48" fill="#fb8c00" opacity="0.95" />
        <rect x="70" y="76" width="220" height="112" rx="40" fill="#fdd835" />
        <rect x="98" y="92" width="164" height="80" rx="30" fill="#8e24aa" />
        <rect x="124" y="104" width="112" height="56" rx="22" fill="#43a047" />
        <rect x="148" y="115" width="64" height="34" rx="14" fill="#ffffff" />
      </g>
      <rect x="18" y="28" width="62" height="22" rx="10" fill="#f06292" />
      <rect x="286" y="30" width="56" height="22" rx="10" fill="#1e88e5" />
      <rect x="24" y="212" width="54" height="20" rx="9" fill="#1e88e5" opacity="0.9" />
      <rect x="290" y="210" width="50" height="20" rx="9" fill="#f06292" opacity="0.9" />
      <text
        x="180"
        y="136"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#0f172a"
        opacity="0.55"
        style={{ letterSpacing: "0.18em" }}
      >
        STAGE
      </text>
    </svg>
  );
}
