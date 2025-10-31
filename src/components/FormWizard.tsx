import React, { useState } from 'react';
import { useCreativeStore } from '@/stores/creativeStore';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

interface FormWizardProps {
  children: React.ReactNode[];
}

export const FormWizard: React.FC<FormWizardProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Get state for determining step unlock status
  const hasAttemptedVerification = useCreativeStore(state =>
    state.facebook.hasAttempted ?? Boolean(state.facebook.pageData)
  );
  const websiteUrl = useCreativeStore(state => state.brief.websiteUrl);
  const companyOverview = useCreativeStore(state => state.brief.companyOverview);
  const campaignObjective = useCreativeStore(state => state.brief.campaignObjective);

  // Check if we're in edit mode by looking for ad_name (only exists when editing)
  const adName = useCreativeStore(state => state.adCopy.adName);
  const isEditMode = Boolean(adName);

  // Step 1 is complete when user has verified Facebook and filled required fields
  const step1Complete = Boolean(hasAttemptedVerification && websiteUrl && companyOverview && campaignObjective);

  const steps = [
    { label: 'Advertiser Info', description: 'Brand context & goals' },
    { label: 'Ad Copy', description: 'Content & messaging' }
  ];

  // Function to go to next step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="flex flex-col -mx-6 -my-6">
      {/* Step Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => {
                  // In edit mode, allow navigation to any step
                  // Otherwise, only allow clicking on step 1 or when step 1 is complete
                  if (isEditMode || index === 0 || step1Complete) {
                    setCurrentStep(index);
                  }
                }}
                disabled={!isEditMode && index > 0 && !step1Complete}
                className={cn(
                  'flex items-center gap-3 transition-all',
                  !isEditMode && index > 0 && !step1Complete ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-14 transition-all',
                    currentStep === index
                      ? 'bg-meta-blue text-white'
                      : currentStep > index
                      ? 'bg-green-500 text-white'
                      : 'bg-surface-100 text-text-muted'
                  )}
                >
                  {currentStep > index ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-left">
                  <div className={cn(
                    'text-14 font-semibold',
                    currentStep === index ? 'text-meta-blue' : 'text-text-primary'
                  )}>
                    {step.label}
                  </div>
                  <div className="text-11 text-text-muted">{step.description}</div>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-border mx-4 min-w-[40px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content - Show only current step */}
      <div className="px-6 py-6">
        {React.Children.toArray(children).map((child, index) => (
          <div
            key={index}
            className={cn(
              'transition-opacity duration-200',
              currentStep === index ? 'block' : 'hidden'
            )}
          >
            {/* Clone the child and inject goToNextStep prop for first step only */}
            {index === 0 && React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, { goToNextStep })
              : child}
          </div>
        ))}
      </div>
    </div>
  );
};
