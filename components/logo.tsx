export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Fallow Docket"
    >
      <rect width="64" height="64" rx="14" fill="#4a3428" />
      <path
        d="M16 18h26.5L50 25.5V46a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z"
        fill="#f6f1e7"
      />
      <path d="M42.5 18.5V26H50" fill="#e4d3bc" />
      <path
        d="M18 36.5c5.2 2.2 8.4-2.4 13.6-.2 5.2 2.2 8.6-2.2 14.2-.2"
        fill="none"
        stroke="#8d5a32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 43c5.2 2.2 8.4-2.4 13.6-.2 5.2 2.2 8.6-2.2 14.2-.2"
        fill="none"
        stroke="#8d5a32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 49.5c5.2 2.2 8.4-2.4 13.6-.2 5.2 2.2 8.6-2.2 14.2-.2"
        fill="none"
        stroke="#c4a574"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
