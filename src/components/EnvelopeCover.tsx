import React from 'react';
import { PostmarkStamp, WaxSealMark } from './Ornament';
import { formatReadableDate } from '../utils/text';

interface EnvelopeCoverProps {
  recipientLabel: string;
  title: string;
  publishedAt: string;
  redditPostTitle?: string;
  onOpen: () => void;
}

export const EnvelopeCover: React.FC<EnvelopeCoverProps> = ({
  recipientLabel,
  title,
  publishedAt,
  redditPostTitle,
  onOpen,
}) => {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
      <div className="envelope-card relative overflow-hidden rounded-xl px-7 py-10 sm:px-12 sm:py-14">
        {/* Subtle envelope flap fold lines */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 border-b border-[var(--ps-sheet-border)]/70 opacity-60"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            backgroundColor: 'rgba(130, 100, 68, 0.045)',
          }}
          aria-hidden="true"
        />

        {/* Top Row: Postmark & Botanical Stamp */}
        <div className="relative flex items-start justify-between gap-4">
          <span className="font-handwritten text-xl text-[var(--ps-sheet-muted)]">
            {formatReadableDate(publishedAt)}
          </span>
          <PostmarkStamp dateText={publishedAt} />
        </div>

        {/* Addressed Envelope Center */}
        <div className="relative my-10 text-center sm:my-12">
          <p className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
            For {recipientLabel},
          </p>
          <h1 className="mt-2 font-serif-editorial text-3xl font-medium leading-snug text-[var(--ps-sheet-ink)] sm:text-4xl [text-wrap:balance]">
            {title}
          </h1>
          {redditPostTitle && (
            <p className="mx-auto mt-3 max-w-md text-xs italic text-[var(--ps-sheet-muted)]">
              In reply to: {redditPostTitle}
            </p>
          )}
        </div>

        {/* Interactive Wax Seal Opening Button */}
        <div className="relative flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpen}
            className="group inline-flex min-h-[48px] items-center gap-3 rounded-full border border-[var(--ps-seal)]/45 bg-[var(--ps-seal)]/10 px-6 py-2.5 text-sm font-medium text-[var(--ps-seal)] transition-all hover:border-[var(--ps-seal)] hover:bg-[var(--ps-seal)] hover:text-[#FAF4E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ps-seal)]"
          >
            <WaxSealMark className="h-6 w-6 transition-transform duration-200 group-hover:scale-105" />
            <span>Open letter</span>
          </button>
          <span className="font-handwritten text-base text-[var(--ps-sheet-muted)]">
            A page kept just for you
          </span>
        </div>
      </div>
    </div>
  );
};
