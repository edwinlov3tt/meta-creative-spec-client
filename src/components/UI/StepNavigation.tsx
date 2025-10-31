import { cn } from '@/utils/cn';

interface Step {
  id: string;
  label: string;
  isComplete: boolean;
  isLocked: boolean;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <div className="flex flex-col gap-6">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const canNavigate = !step.isLocked;

          return (
            <button
              key={step.id}
              onClick={() => canNavigate && onStepClick(index)}
              disabled={step.isLocked}
              className={cn(
                'group relative transition-all',
                canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
              )}
              title={step.isLocked ? 'Complete previous steps to unlock' : step.label}
            >
              {/* Dot indicator only */}
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 transition-all',
                  isActive
                    ? 'bg-primary border-primary scale-150'
                    : step.isComplete
                    ? 'bg-success border-success'
                    : 'bg-surface-200 border-border group-hover:border-primary'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Connecting line */}
      <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-border -z-10" />
    </div>
  );
};
