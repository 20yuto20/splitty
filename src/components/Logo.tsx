type Props = { className?: string };

export function Logo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Splitty logo"
    >
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#g)" />
      <path
        d="M9 22 L23 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="12" r="2.5" fill="white" />
      <circle cx="21" cy="20" r="2.5" fill="white" />
    </svg>
  );
}
