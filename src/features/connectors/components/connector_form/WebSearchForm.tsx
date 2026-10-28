import { Input, Button } from '@/src/ui-kit';
import { Search, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebSearchResult } from '@/src/types/connector';

interface WebSearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleFocus: (field: string) => void;
  handleMouseEnter: (field: string) => void;
  handleWebSearch: () => void;
  isSearching: boolean;
  hasResearched: boolean;
  viewResults: boolean;
  setViewResults: (view: boolean) => void;
  setHasResearched: (researched: boolean) => void;
  searchResults: WebSearchResult[];
  selectedResultIds: Set<string>;
  toggleSelect: (id: string) => void;
  handleImport: () => void;
}

export const WebSearchForm = ({
  searchQuery,
  setSearchQuery,
  handleFocus,
  handleMouseEnter,
  handleWebSearch,
  isSearching,
  hasResearched,
  viewResults,
  setViewResults,
  setHasResearched,
  searchResults,
  selectedResultIds,
  toggleSelect,
  handleImport
}: WebSearchFormProps) => {
  return (
    <div className="space-y-6">
      <div onMouseEnter={() => handleMouseEnter('search')}>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="search"
              placeholder="e.g. Latest stock market trends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => handleFocus('search')}
            />
          </div>
          <Button
            onClick={handleWebSearch}
            disabled={isSearching}
            className="px-6 h-11"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/5 flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)]/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] animate-ping opacity-20" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Researching Websites...</h4>
              <p className="text-xs text-[var(--text-secondary)]">Analyzing live web data and extracting insights</p>
            </div>
          </motion.div>
        )}

        {hasResearched && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {!viewResults && (
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold mb-2">
                <Check className="w-3.5 h-3.5" />
                Fast Research completed!
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(viewResults ? searchResults : searchResults.slice(0, 3)).map((result) => {
                  const resultId = result.id || result.url;
                  return (
                    <div
                      key={resultId}
                      onClick={() => toggleSelect(resultId)}
                      className={`
                        p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4
                        ${selectedResultIds.has(resultId)
                          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                          : 'border-[var(--border)] bg-[var(--surface-hover)]/30 hover:border-[var(--accent)]/40'}
                      `}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {result.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                          {result.brief}
                        </p>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                          {result.url}
                        </a>
                      </div>
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedResultIds.has(resultId)}
                          onChange={() => { }} // Controlled via parent div click
                          className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {!viewResults && searchResults.length > 3 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--accent)] border border-white" />
                      <div className="w-3 h-3 rounded-full bg-[var(--accent)]/60 border border-white" />
                    </div>
                    <button
                      onClick={() => setViewResults(true)}
                      className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                      {searchResults.length - 3} more sources
                      <span className="text-[var(--text-secondary)] font-medium">View</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  {selectedResultIds.size} sources selected
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setViewResults(false); setHasResearched(false); }}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedResultIds.size === 0}
                    onClick={handleImport}
                    className="px-6 rounded-full"
                  >
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
