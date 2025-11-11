import { Link } from "react-router-dom";

// Reusable logo component that adapts to dark mode by swapping fill/stroke colors
// You can replace the inline SVG with an <img src="/logo.svg" /> if you add the asset to public/
export function Logo({ to = "/", size = 32 }: { to?: string; size?: number }) {
  return (
    <Link to={to} className="flex items-center gap-2 select-none">
      {/* Inline SVG version to allow easy theming */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="QuizGrad logo"
        className="shrink-0"
      >
        {/* Background ring (adapts via currentColor + opacity) */}
        <circle cx="128" cy="128" r="110" fill="currentColor" className="text-foreground/5 dark:text-foreground/10" />
        {/* Stylized Q and upward arrow inspired mark */}
        <path
          d="M128 44c-46 0-84 38-84 84s38 84 84 84 84-38 84-84-38-84-84-84zm0 24c33.3 0 60 26.7 60 60s-26.7 60-60 60-60-26.7-60-60 26.7-60 60-60z"
          fill="url(#g1)"
        />
        <path d="M72 168c30-26 58-66 108-90l-8 20 28-10-4-30-28 10 8-20c-70 22-95 74-112 120z" fill="url(#g2)" opacity="0.9" />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-foreground">Quiz</span>
        <span className="text-quiz-primary">Grad</span>
      </span>
    </Link>
  );
}

export default Logo;
