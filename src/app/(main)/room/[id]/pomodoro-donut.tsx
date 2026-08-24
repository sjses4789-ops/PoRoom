export function PomodoroDonut({
  progress,
  color,
  size = 64,
  strokeWidth = 6,
  label,
  subLabel,
}: {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-neutral-100"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-white">
            {label}
          </span>
          {subLabel && (
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
              {subLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
