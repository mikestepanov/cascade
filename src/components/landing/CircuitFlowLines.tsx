export function CircuitFlowLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      preserveAspectRatio="xMidYMin slice"
      fill="none"
    >
      <defs>
        <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ color: "var(--color-status-info)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
          <stop
            offset="50%"
            style={{ color: "var(--color-status-info)" }}
            stopColor="currentColor"
            stopOpacity="0.6"
          />
          <stop
            offset="100%"
            style={{ color: "var(--color-brand-400)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
        </linearGradient>
        <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ color: "var(--color-brand-400)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
          <stop
            offset="50%"
            style={{ color: "var(--color-accent-500)" }}
            stopColor="currentColor"
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            style={{ color: "var(--color-status-success)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
        </linearGradient>
        <linearGradient id="flowGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ color: "var(--color-status-success)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
          <stop
            offset="50%"
            style={{ color: "var(--color-status-success)" }}
            stopColor="currentColor"
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            style={{ color: "var(--color-status-info)" }}
            stopColor="currentColor"
            stopOpacity="0"
          />
        </linearGradient>
        <filter id="flowGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#flowGlow)">
        {/* Horizontal flow lines */}
        <path
          d="M0,150 Q200,130 400,170 T800,140 T1200,180 T1600,150 T2000,170"
          stroke="url(#flowGrad1)"
          strokeWidth="1.5"
          className="animate-flow-1"
        />
        <path
          d="M0,300 Q250,280 500,320 T1000,290 T1500,330 T2000,300"
          stroke="url(#flowGrad2)"
          strokeWidth="1.5"
          className="animate-flow-2"
        />
        <path
          d="M0,450 Q300,420 600,460 T1200,430 T1800,470 T2400,440"
          stroke="url(#flowGrad3)"
          strokeWidth="1.5"
          className="animate-flow-3"
        />

        {/* Vertical connectors */}
        <path
          d="M400,170 L400,280"
          style={{ color: "var(--color-status-info)" }}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <path
          d="M800,140 L800,290"
          style={{ color: "var(--color-brand-400)" }}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <path
          d="M1000,290 L1000,430"
          style={{ color: "var(--color-accent-500)" }}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
      </g>

      {/* Animated dots */}
      <circle
        r="3"
        style={{ color: "var(--color-status-info)" }}
        fill="currentColor"
        filter="url(#flowGlow)"
      >
        <animateMotion
          dur="8s"
          repeatCount="indefinite"
          path="M0,150 Q200,130 400,170 T800,140 T1200,180 T1600,150 T2000,170"
        />
      </circle>
      <circle
        r="2.5"
        style={{ color: "var(--color-accent-500)" }}
        fill="currentColor"
        filter="url(#flowGlow)"
      >
        <animateMotion
          dur="10s"
          repeatCount="indefinite"
          path="M0,300 Q250,280 500,320 T1000,290 T1500,330 T2000,300"
        />
      </circle>
      <circle
        r="2.5"
        style={{ color: "var(--color-status-success)" }}
        fill="currentColor"
        filter="url(#flowGlow)"
      >
        <animateMotion
          dur="9s"
          repeatCount="indefinite"
          path="M0,450 Q300,420 600,460 T1200,430 T1800,470 T2400,440"
        />
      </circle>

      {/* Node points */}
      <g filter="url(#flowGlow)">
        <circle
          cx="400"
          cy="170"
          r="4"
          style={{ color: "var(--color-status-info)" }}
          fill="currentColor"
        />
        <circle
          cx="800"
          cy="140"
          r="4"
          style={{ color: "var(--color-brand-400)" }}
          fill="currentColor"
        />
        <circle
          cx="500"
          cy="320"
          r="4"
          style={{ color: "var(--color-accent-500)" }}
          fill="currentColor"
        />
        <circle
          cx="1000"
          cy="290"
          r="4"
          style={{ color: "var(--color-status-success)" }}
          fill="currentColor"
        />
        <circle
          cx="600"
          cy="460"
          r="4"
          style={{ color: "var(--color-status-success)" }}
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
