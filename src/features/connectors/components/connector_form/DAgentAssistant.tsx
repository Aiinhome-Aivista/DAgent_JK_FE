import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Info, Shield, Globe } from 'lucide-react';
import { ThreeAvatar } from '../../../chat/components/ThreeAvatar';
import { FieldGuide } from '@/src/types/connector';

interface DAgentAssistantProps {
  guide: FieldGuide | null;
  activeField: string | null;
}

export const DAgentAssistant = ({ guide, activeField }: DAgentAssistantProps) => {
  return (
    <div className="lg:sticky lg:top-28 space-y-6">
      <div className="relative">
        <AnimatePresence mode="wait">
          {guide ? (
            <motion.div
              key={activeField}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="relative z-10"
            >
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-3xl shadow-2xl relative">
                {/* Speech Bubble Arrow */}
                <div className="absolute -left-2 top-10 w-4 h-4 bg-[var(--surface)] border-l border-b border-[var(--border)] rotate-45 hidden lg:block" />

                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">DAgent Guide</span>
                </div>

                <h4 className="font-bold text-lg mb-2">{guide.title}</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                  {guide.description}
                </p>

                <div className="p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    <p className="text-xs italic text-[var(--text-primary)]/80">
                      {guide.tip}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-3xl text-center"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                Hover or click on a field to get guidance from DAgent.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative">
            <ThreeAvatar />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[var(--bg)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          </div>
          <div className="mt-4 text-center">
            <h5 className="font-bold">DAgent Assistant</h5>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">Always here to help</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">Secure Data source</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">SSL/TLS Encryption</span>
        </div>
      </div>
    </div>
  );
};
