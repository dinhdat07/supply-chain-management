import { humanizeStatus } from '../../lib/presenters';
import { type StageStatus, stageTone } from './AgentShared';

export type WorkspaceView = 'operations' | 'execution' | 'approval';

interface WorkflowStage {
  key: string;
  title: string;
  status: StageStatus;
  detail: string;
  action: string;
  workspaceTarget: WorkspaceView;
}

interface WorkspaceOption {
  key: WorkspaceView;
  label: string;
  detail: string;
}

interface WorkflowSectionProps {
  workflowStages: readonly WorkflowStage[];
  workspaceOptions: WorkspaceOption[];
  currentWorkspace: WorkspaceView;
  onWorkspaceChange: (view: WorkspaceView) => void;
}

export function WorkflowSection({
  workflowStages,
  workspaceOptions,
  currentWorkspace,
  onWorkspaceChange,
}: WorkflowSectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Operator Workflow</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          The control tower runs through a fixed operating cadence: monitor, assess, plan, approve or execute, then learn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {workflowStages.map((stage, index) => (
          <button
            key={stage.key}
            type="button"
            onClick={() => onWorkspaceChange(stage.workspaceTarget)}
            className={`rounded-[20px] border p-4 text-left transition-all ${stageTone(stage.status)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-pureWhite/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                Stage {index + 1}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {humanizeStatus(stage.status)}
              </span>
            </div>
            <div className="mt-3 text-[17px] font-bold">{stage.title}</div>
            <p className="mt-2 text-[13px] leading-5">{stage.detail}</p>
            <div className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-secondaryGray">
              {stage.action}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-[24px] border border-borderGray bg-pureWhite p-4 shadow-card">
        <div className="flex flex-wrap gap-3">
          {workspaceOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onWorkspaceChange(option.key)}
              className={`rounded-full border px-4 py-3 text-left transition-all ${
                currentWorkspace === option.key
                  ? 'border-nearBlack bg-nearBlack text-pureWhite'
                  : 'border-borderGray bg-lightSurface text-nearBlack hover:bg-pureWhite'
              }`}
            >
              <div className="text-[13px] font-bold uppercase tracking-wider">{option.label}</div>
              <div className={`mt-1 text-[12px] ${currentWorkspace === option.key ? 'text-pureWhite/80' : 'text-secondaryGray'}`}>
                {option.detail}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
