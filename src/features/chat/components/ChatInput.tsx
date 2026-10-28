import { useState, FormEvent, useRef } from 'react';
import { Button, Input } from '@/src/ui-kit';
import { SendHorizontal, MoreHorizontal, Database } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onOpenDataSource?: () => void;
  value: string;
  onChange: (value: string) => void;
}

export const ChatInput = ({ onSend, disabled, onOpenDataSource, value, onChange }: ChatInputProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      onChange('');
    }
  };

  const openMenu = () => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    menuTimeout.current = setTimeout(() => setMenuOpen(false), 120);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
      <div className="flex-1">
        <Input
          placeholder="Ask anything about your data..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="border-none bg-transparent shadow-none focus-visible:ring-0 text-sm py-4 px-3"
        />
      </div>

      {onOpenDataSource && (
        <div
          className="relative shrink-0"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <button
            type="button"
            className="h-10 w-10 rounded-lg p-0 flex items-center justify-center border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] text-[var(--text-secondary)] transition-all active:scale-95"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute bottom-full mb-2 right-0 min-w-max bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50"
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
            >
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenDataSource(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors text-left"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                Add Data Source
              </button>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={!value.trim() || disabled}
        className="h-12 w-12 rounded-lg p-0 shrink-0 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white shadow-lg shadow-[var(--accent)]/20 transition-transform active:scale-95"
      >
        <SendHorizontal className="w-9 h-9" />
      </Button>
    </form>
  );
};
