import { NixeloLogo } from "../landing/icons";
import { Typography } from "../ui/Typography";

export function AppSplashScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-ui-bg-hero z-[9999]">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative animate-in fade-in zoom-in duration-700 ease-out">
            <NixeloLogo size={64} />
          </div>
        </div>

        {/* Loader and Optional Text */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
          {/* Minimal high-end loader - Always show to indicate activity */}
          <div className="w-32 h-[2px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-purple-500 w-full -translate-x-full animate-shimmer"
              style={{ animation: "shimmer 1.5s infinite linear" }}
            />
          </div>

          {/* Optional Message */}
          {message && (
            <Typography className="text-ui-text-tertiary font-medium tracking-wide">
              {message}
            </Typography>
          )}
        </div>
      </div>

      <style>
        {`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        `}
      </style>
    </div>
  );
}
