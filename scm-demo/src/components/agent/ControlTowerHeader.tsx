import { BrainCircuit } from 'lucide-react';
import { humanizeStatus } from '../../lib/presenters';
import { modeTone } from './AgentShared';

interface ControlTowerHeaderProps {
  mode: string | null | undefined;
}

export function ControlTowerHeader({ mode }: ControlTowerHeaderProps) {
  return (
    <header className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-rausch/10 p-3">
            <BrainCircuit className="h-6 w-6 text-rausch" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.18px] text-nearBlack">Control Tower</h1>
            <p className="mt-2 max-w-3xl text-[15px] text-secondaryGray">
              Review the current network state, generate recovery recommendations, simulate disruptions, and resolve approvals from one operating workspace.
            </p>
          </div>
        </div>

        <div className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] ${modeTone(mode)}`}>
          {humanizeStatus(mode)}
        </div>
      </div>
    </header>
  );
}
