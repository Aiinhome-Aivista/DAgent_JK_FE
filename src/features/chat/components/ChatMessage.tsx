import React from 'react';
import { Message } from '../types';
import { motion } from 'motion/react';
import { ChatVisualization } from './ChatVisualization';
import { formatChatMessage } from '../../../utils/format';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = React.memo(({ message }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div
        className={`
          max-w-[90%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isAssistant
            ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'
            : 'bg-[var(--accent)] text-white rounded-tr-none shadow-lg shadow-[var(--accent)]/10'}
        `}
      >
        <div
          className="prose-chat break-words"
          dangerouslySetInnerHTML={{ __html: formatChatMessage(message.content, isAssistant) }}
        />

        {isAssistant && message.visualizations && message.visualizations.length > 0 && (
          <div className="mt-4 space-y-4 w-full overflow-x-auto">
            {message.visualizations.map((viz, idx) => (
              <ChatVisualization key={idx} visualization={viz} />
            ))}
          </div>
        )}

        <div
          className={`
            text-[9px] font-mono uppercase tracking-widest opacity-40
            ${isAssistant ? 'text-[var(--text-secondary)]' : 'text-white/80'}
          `}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = 'ChatMessage';

