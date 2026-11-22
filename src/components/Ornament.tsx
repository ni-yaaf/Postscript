import React from 'react';

interface DividerProps {
  variant?: 'star' | 'botanical' | 'line';
  onPaper?: boolean;
  className?: string;
}

export const NotebookDivider: React.FC<DividerProps> = ({
  variant = 'star',
  onPaper = false,
  className = '',
}) => {
  const lineColor = onPaper
    ? 'bg-[var(--ps-sheet-border)]'
    : 'bg-[var(--ps-border)]';
  const iconColor = onPaper
    ? 'text-[var(--ps-sheet-accent)]'
    : 'text-[var(--ps-accent)]';

  if (variant === 'line') {
    return (
      <div
        className={`h-px w-full ${lineColor} ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`flex items-center gap-4 ${iconColor} ${className}`}
      aria-hidden="true"
    >
      <span className={`h-px flex-1 ${lineColor}`} />
      {variant === 'botanical' ? (
        <svg
          width="36"
          height="16"
          viewBox="0 0 36 16"
          fill="none"
          className="opacity-85"
        >
          <path
            d="M4 10C10 9.5 14.5 7.5 18 4C21.5 7.5 26 9.5 32 10"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinecap="round"
          />
          <path
            d="M18 4V13"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinecap="round"
          />
          <path
            d="M18 8.5C15.8 8.5 14.2 7.2 13.8 5.4C15.7 5.3 17.3 6.6 18 8.5Z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path
            d="M18 9.5C20.2 9.5 21.8 8.2 22.2 6.4C20.3 6.3 18.7 7.6 18 9.5Z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-85"
        >
          <path
            d="M8 1L9.6 6.4L15 8L9.6 9.6L8 15L6.4 9.6L1 8L6.4 6.4L8 1Z"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className={`h-px flex-1 ${lineColor}`} />
    </div>
  );
};

export const BotanicalSprig: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M14 44C20 35 28 24 41 13"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
    <path
      d="M23 32C18 31 15 27 15 22C20 22 23 26 23 32Z"
      stroke="currentColor"
      strokeWidth="1.05"
      strokeLinejoin="round"
    />
    <path
      d="M26 28C32 29 36 27 38 22C32 21 28 23 26 28Z"
      stroke="currentColor"
      strokeWidth="1.05"
      strokeLinejoin="round"
    />
    <path
      d="M32 21C28 19 26 15 27 11C31 12 33 16 32 21Z"
      stroke="currentColor"
      strokeWidth="1.05"
      strokeLinejoin="round"
    />
    <circle cx="42" cy="12" r="1.6" fill="currentColor" fillOpacity="0.65" />
  </svg>
);

export const PostmarkStamp: React.FC<{
  dateText: string;
  className?: string;
}> = ({ dateText, className = '' }) => {
  const shortDate = (() => {
    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) return 'KEPT';
    return parsed
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      .toUpperCase();
  })();

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Circular ink postmark */}
      <svg
        width="46"
        height="46"
        viewBox="0 0 52 52"
        fill="none"
        className="text-[var(--ps-sheet-muted)] opacity-75"
      >
        <circle
          cx="26"
          cy="26"
          r="22"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="0.8" />
        <text
          x="26"
          y="23"
          textAnchor="middle"
          fill="currentColor"
          fontSize="6"
          letterSpacing="1.2"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          POSTSCRIPT
        </text>
        <text
          x="26"
          y="32"
          textAnchor="middle"
          fill="currentColor"
          fontSize="6.5"
          fontWeight="600"
          letterSpacing="0.8"
          fontFamily="JetBrains Mono, monospace"
        >
          {shortDate}
        </text>
      </svg>

      {/* Tiny botanical postage stamp */}
      <div className="flex h-12 w-10 flex-col items-center justify-center rounded-[2px] border border-dashed border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)]/70 p-1 text-[var(--ps-olive)]">
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <path
            d="M10 19V5M10 13C7.5 13 5.8 11.2 5.5 8.5C8 8.5 9.6 10.2 10 13ZM10 10.5C12.5 10.5 14.2 8.7 14.5 6C12 6 10.4 7.7 10 10.5Z"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const WaxSealMark: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle
      cx="16"
      cy="16"
      r="12.5"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeOpacity="0.8"
    />
    <circle
      cx="16"
      cy="16"
      r="9.2"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeOpacity="0.45"
      strokeDasharray="2 2"
    />
    <path
      d="M16 10.5L17.3 14.7L21.5 16L17.3 17.3L16 21.5L14.7 17.3L10.5 16L14.7 14.7L16 10.5Z"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinejoin="round"
    />
  </svg>
);
