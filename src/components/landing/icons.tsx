export function NixeloLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#nixeloGrad)" />
      <path d="M10 12L16 8L22 12V20L16 24L10 20V12Z" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="2.5" fill="white" />
      <defs>
        <linearGradient id="nixeloGrad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#06b6d4" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function WorkflowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12h3M14 6h2.5a1.5 1.5 0 011.5 1.5v3M14 18h2.5a1.5 1.5 0 001.5-1.5v-3" />
    </svg>
  );
}

export function TimeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8h18M8 2v4M16 2v4" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}

export function ClarityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 3l10 5-10 5V3z" />
    </svg>
  );
}
