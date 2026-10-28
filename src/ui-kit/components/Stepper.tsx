import { Check, Circle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface StepperProps {
  steps: { title: string }[];
  currentStep: number;
}

export const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex items-center justify-between w-full mb-12">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step.title} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isActive ? 'var(--accent)' : 'var(--surface)',
                  borderColor: isCompleted || isActive ? 'var(--accent)' : 'var(--border)',
                  scale: isActive ? 1.2 : 1,
                }}
                className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center z-10
                  ${isCompleted ? 'text-white' : isActive ? 'text-white' : 'text-[var(--text-secondary)]'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </motion.div>
              <div className="absolute top-12 whitespace-nowrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  {step.title}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-4 bg-[var(--border)] relative overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  className="absolute h-full bg-[var(--accent)]"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
