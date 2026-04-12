import { LoaderCircle } from 'lucide-react';

interface ActiveWork {
  title: string;
  detail: string;
}

interface ActiveWorkSectionProps {
  activeWork: ActiveWork | null;
}

export function ActiveWorkSection({ activeWork }: ActiveWorkSectionProps) {
  if (!activeWork) return null;

  return (
    <section className="rounded-[24px] border border-rausch/20 bg-rausch/5 p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-pureWhite p-2 shadow-card">
            <LoaderCircle className="h-5 w-5 animate-spin text-rausch" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-nearBlack">{activeWork.title}</h2>
            <p className="mt-1 text-[14px] text-secondaryGray">{activeWork.detail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Risk agent', 'Inventory agent', 'Planner agent'].map((item) => (
            <span key={item} className="rounded-full border border-rausch/20 bg-pureWhite px-3 py-2 text-[12px] font-semibold text-rausch animate-pulse">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
