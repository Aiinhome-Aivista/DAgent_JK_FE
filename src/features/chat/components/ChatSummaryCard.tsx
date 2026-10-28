import React, { useState } from 'react';
import { Sparkles, ChevronUp } from 'lucide-react';
import { formatChatMessage } from '../../../utils/format';
import { motion } from 'motion/react';

export const ChatSummaryCard = ({ title, content, isLoading }: { title?: string, content?: string, isLoading?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 border-l-4 border-l-[#5B5EFC]/50 shadow-sm flex flex-col gap-3 relative overflow-hidden mb-6 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="pl-12">
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!title && !content) return null;
  
  const isLongContent = content && content.length > 400;
  
  return (
    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 border-l-4 border-l-[#5B5EFC] shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:shadow-md mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B5EFC]/10 flex items-center justify-center text-[#5B5EFC] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-base leading-snug">
            {title || "Executive Summary"}
          </h3>
        </div>
      </div>

      <div className="pl-12 -mt-1">
        <div className="flex flex-col gap-1.5">
          {content && (
            !expanded ? (
              <div className="flex flex-col items-end gap-2">
                <div 
                  className="text-slate-600 text-sm leading-relaxed font-normal flex-1 prose-chat break-words w-full relative max-h-32 overflow-hidden"
                >
                  <div dangerouslySetInnerHTML={{ __html: formatChatMessage(content, true) }} />
                  {isLongContent && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                {isLongContent && (
                  <button 
                    onClick={() => setExpanded(true)}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#5B5EFC] hover:text-[#4A4DE0] transition-colors cursor-pointer focus:outline-none bg-white"
                  >
                    Read More
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div 
                  className="flex flex-col gap-2 text-slate-600 text-sm leading-relaxed font-normal prose-chat break-words"
                  dangerouslySetInnerHTML={{ __html: formatChatMessage(content, true) }} 
                />
                <button 
                  onClick={() => setExpanded(false)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#5B5EFC] hover:text-[#4A4DE0] transition-colors self-end mt-2 cursor-pointer focus:outline-none"
                >
                  Show Less <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Subtle decorative glow in the background */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#5B5EFC]/5 rounded-full blur-xl pointer-events-none" />
    </div>
  );
};
