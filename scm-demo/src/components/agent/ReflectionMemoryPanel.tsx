import { BookOpenText, CheckCircle2 } from 'lucide-react';

import type { ReflectionView } from '../../lib/types';
import { humanizeLabel, humanizeStatus } from '../../lib/presenters';

interface ReflectionMemoryPanelProps {
  reflections: ReflectionView[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}

export function ReflectionMemoryPanel({
  reflections,
  title = 'Reflection Memory',
  description = 'Lessons captured from prior runs to help operators understand what the system learned.',
  emptyMessage = 'No reflection note has been recorded yet for this operating window.',
}: ReflectionMemoryPanelProps) {
  const latest = reflections[0] ?? null;

  return (
    <section className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
      <div>
        <h3 className="text-[20px] font-bold text-nearBlack">{title}</h3>
        <p className="mt-1 text-[13px] text-secondaryGray">{description}</p>
      </div>

      {latest ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[20px] border border-borderGray bg-lightSurface p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-pureWhite p-3 shadow-sm">
                <BookOpenText className="h-5 w-5 text-rausch" />
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Latest learning note
                </div>
                <h4 className="mt-1 text-[18px] font-bold text-nearBlack">
                  {humanizeStatus(latest.mode)} · {humanizeStatus(latest.approval_status)}
                </h4>
                <p className="mt-2 text-[14px] text-secondaryGray">
                  {latest.summary}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                  Lessons retained
                </div>
                <div className="mt-3 space-y-2">
                  {latest.lessons.map((lesson) => (
                    <div
                      key={lesson}
                      className="flex items-start gap-2 rounded-card border border-borderGray bg-pureWhite px-3 py-3 text-[13px] text-nearBlack"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                  <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                    Pattern tags
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {latest.pattern_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[12px] font-semibold text-nearBlack"
                      >
                        {humanizeLabel(tag)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                  <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                    Follow-up checks
                  </div>
                  <div className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                    {latest.follow_up_checks.map((check) => (
                      <div key={check} className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
                        {check}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {reflections.length > 1 ? (
            <div className="rounded-[20px] border border-borderGray bg-pureWhite p-5">
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                Recent memory timeline
              </div>
              <div className="mt-4 space-y-3">
                {reflections.slice(1, 4).map((note) => (
                  <div
                    key={note.note_id}
                    className="rounded-card border border-borderGray bg-lightSurface px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                        {humanizeStatus(note.mode)}
                      </span>
                      <span className="rounded-full bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                        {humanizeStatus(note.approval_status)}
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] text-secondaryGray">
                      {note.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
