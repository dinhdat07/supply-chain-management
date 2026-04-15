
import { type StageStatus } from './AgentShared';

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
    <section className="space-y-6">
      {/* Redesigned Stepper for Cognitive Load Reduction and Flow Clarity */}
      <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-sm relative z-0">
        <h2 className="text-[16px] font-bold text-nearBlack tracking-tight uppercase">Operator Workflow</h2>
        <div className="mt-8 relative">
          <div className="absolute top-[18px] left-8 right-8 h-[2px] bg-borderGray/40 -z-10" />
          <div className="grid grid-cols-5 gap-2 relative">
            {workflowStages.map((stage, index) => {
              const isActive = stage.status === 'active';
              const isComplete = stage.status === 'complete';
              const isPending = stage.status === 'pending';

              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => onWorkspaceChange(stage.workspaceTarget)}
                  className={`flex flex-col items-center text-center group outline-none focus-visible:ring-2 focus-visible:ring-nearBlack/20 rounded-lg p-2 transition-all ${isPending ? 'opacity-50 hover:opacity-100' : ''}`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] font-bold border-[2px] transition-all z-10 ${
                    isActive ? 'bg-nearBlack border-nearBlack text-pureWhite shadow-md scale-110' :
                    isComplete ? 'bg-green-50 border-green-600 text-green-700' :
                    'bg-pureWhite border-borderGray text-secondaryGray'
                  }`}>
                    {isComplete ? '✓' : index + 1}
                  </div>
                  <div className={`mt-3 text-[13px] font-bold ${isActive ? 'text-nearBlack' : 'text-secondaryGray group-hover:text-nearBlack transition-colors'}`}>
                    {stage.title}
                  </div>
                  <div className={`mt-1 text-[11px] leading-tight max-w-[120px] ${isActive ? 'text-nearBlack/80 font-medium' : 'text-secondaryGray/70'}`}>
                    {stage.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simplified Workspace Tabs */}
      <div className="flex border-b border-borderGray gap-6 overflow-x-auto custom-scrollbar">
        {workspaceOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onWorkspaceChange(option.key)}
            className={`py-3 relative text-[13px] font-bold uppercase tracking-wider transition-colors outline-none focus-visible:text-nearBlack ${
              currentWorkspace === option.key
                ? 'text-nearBlack'
                : 'text-secondaryGray hover:text-nearBlack/80'
            }`}
          >
            {option.label}
            {currentWorkspace === option.key && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-nearBlack rounded-t-sm" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
