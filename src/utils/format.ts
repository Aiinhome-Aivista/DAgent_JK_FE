/**
 * Toggles whether Route-to-Market (RtM) Ontology Benchmark and Strategic Conclusion
 * are displayed in the UI analysis.
 * Currently commented out / hidden per user requirement. Set to true to re-enable later if requested.
 */
export const SHOW_RTM_AND_STRATEGIC_CONCLUSION = false;

export const filterOutOntologyAndConclusion = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  if (SHOW_RTM_AND_STRATEGIC_CONCLUSION) return text;

  let cleaned = text;

  // 1. Remove Section 8: Route-to-Market (RtM) Ontology Benchmark and all its bullet points
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:\*\*)?8\.?\s*(?:Route-to-Market|RtM)[^\n]*(?:\*\*)?[\s\S]*?(?=(?:\n\s*###|\n\s*\*\*\d+\.|\n\s*Business Risks|$))/gi,
    '\n'
  );

  // 2. Remove Strategic Conclusion
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:###\s*|\*\*)?Strategic Conclusion(?:\*\*)?:?[\s\S]*?(?=(?:\n\s*###|$))/gi,
    '\n'
  );

  // 3. Remove Coverage Gaps in Architecture / Route-to-Market Architecture section
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:###\s*|\*\*)?(?:\d+\.\s*)?Coverage\s+Gaps\b[^\n]*(?:\*\*)?:?[\s\S]*?(?=(?:\n\s*(?:###|\*\*\d+\.|\*\*Business Risks|\*\*Actionable Recommendations))|$)/gi,
    '\n'
  );

  // 4. Remove sentences mentioning ontology analysis, core framework, or data coverage gaps from Executive Summary
  cleaned = cleaned.replace(
    /(?<=(?:^|[.!?]\s+|\n\s*))[^.!?\n]*?\b(?:ontology|gaps\s+in\s+(?:route-to-market\s+)?data\s+coverage|core\s+framework)\b[\s\S]*?(?:\.(?!\d)|$)/gi,
    ''
  );
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\./g, '.');

  // 5. Clean up Route-to-Market mentions in the title if present
  cleaned = cleaned.replace(
    /(?:,\s*)?(?:and\s+)?(?:with\s+)?Route-to-Market\s*(?:\(RtM\))?\s*(?:Capability\s*Gaps|Ontology\s*Benchmark)?/gi,
    ''
  );

  return cleaned.trim();
};

/**
 * Safely formats inline Markdown (bold, italic, and optionally inline code & links)
 * on text while preventing literal asterisks inside SKUs/identifiers (e.g. `E2_***_TL`)
 * or unmatched asterisks on one line from corrupting subsequent lines.
 */
export const formatInlineMarkdown = (
  text: string,
  options?: {
    strongClass?: string;
    inlineCodeClass?: string;
    linkClass?: string;
    includeCodeAndLinks?: boolean;
  }
): string => {
  if (!text) return '';
  const strongClass = options?.strongClass ?? 'font-bold text-slate-900';
  const includeCodeAndLinks = options?.includeCodeAndLinks ?? false;
  const inlineCodeClass = options?.inlineCodeClass ?? '';
  const linkClass = options?.linkClass ?? '';

  const formatLine = (line: string): string => {
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Inline code: protect asterisks inside code spans from bold/italic parsing
    if (includeCodeAndLinks) {
      html = html.replace(/`([^`]+)`/g, (_m, code) =>
        `<code class="${inlineCodeClass}">${code.replace(/\*/g, '&#42;')}</code>`
      );
    }

    // Escape literal asterisks inside identifiers/SKUs (e.g., 14.00R25_ZCB5_E2_***_TL or a*b)
    html = html.replace(/([A-Za-z0-9_])(\*+)(?=[A-Za-z0-9_])/g, (_m, prefix, stars) =>
      prefix + '&#42;'.repeat(stars.length)
    );
    html = html.replace(/_(\*{3,})/g, (_m, stars) => '_' + '&#42;'.repeat(stars.length));

    // Markdown links (protect asterisks inside href before bold/italic parsing)
    if (includeCodeAndLinks) {
      const linkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0 opacity-80"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>`;
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, label, url) =>
          `<a href="${url.replace(/\*/g, '%2A')}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${label} ${linkSvg}</a>`
      );
    }

    // Bold & italic text (single-line and non-whitespace-bounded to prevent stray * bleeding)
    html = html.replace(
      /\*\*([^\s*](?:[^*\n]*?[^\s*])?)\*\*/g,
      `<strong class="${strongClass}">$1</strong>`
    );
    html = html.replace(
      /\*([^\s*](?:[^*\n]*?[^\s*])?)\*/g,
      '<em class="italic">$1</em>'
    );

    return html;
  };

  return text.split('\n').map(formatLine).join('\n');
};

/**
 * Formats a chat message string supporting a subset of Markdown:
 * - Code blocks (with language header)
 * - Inline code
 * - Bold and italic text
 * - Markdown links with external indicator icons
 * - Headers (H2, H3, H4)
 * - Numbered and bulleted lists
 * - Paragraphs and spacing
 */
export const formatChatMessage = (text: string, isAssistant: boolean): string => {
  if (typeof text !== 'string') return '';

  // Filter out Route-to-Market & Strategic Conclusion if disabled
  text = filterOutOntologyAndConclusion(text);

  // Replace dollar sign with rupee sign in the chat response
  text = text.replace(/\$/g, '₹');

  // Remove verbose limit notices from automated answer
  text = text.replace(/Since the result exceeds the \d+-record display limit,\s*/gi, '');


  // Tailored classes based on message owner/theme to ensure high-end aesthetics
  const linkClass = isAssistant
    ? 'text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium break-all'
    : 'text-white underline hover:opacity-90 inline-flex items-center gap-1 font-semibold break-all';

  const inlineCodeClass = isAssistant
    ? 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--accent)] font-mono text-[12px] px-1.5 py-0.5 rounded transition-colors'
    : 'bg-white/20 border border-white/10 text-white font-mono text-[12px] px-1.5 py-0.5 rounded';

  const codeBlockClass = isAssistant
    ? 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-[12px] p-3.5 rounded-xl my-3 overflow-x-auto block w-full leading-relaxed shadow-inner'
    : 'bg-black/20 border border-white/10 text-white font-mono text-[12px] p-3.5 rounded-xl my-3 overflow-x-auto block w-full leading-relaxed shadow-inner';

  const headerClass = isAssistant ? 'text-[var(--text-primary)] font-bold' : 'text-white font-bold';

  const formatInline = (lineText: string): string =>
    formatInlineMarkdown(lineText, {
      strongClass: 'font-semibold',
      inlineCodeClass,
      linkClass,
      includeCodeAndLinks: true,
    });

  // 1. Split code blocks to preserve code content formatting and avoid nested parsing
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const codeContent = match ? match[2] : part.slice(3, -3);

      const escapedCode = codeContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      return `<pre class="${codeBlockClass}">${language
          ? `<div class="text-[9px] text-[var(--text-secondary)] mb-1.5 font-sans uppercase tracking-wider font-semibold border-b border-[var(--border)] pb-1">${language}</div>`
          : ''
        }<code>${escapedCode.trim()}</code></pre>`;
    } else {
      // Handle headers, lists, and paragraphs line by line so inline formatting never spans across lines
      const lines = part.split('\n');
      let resultHtml = '';
      let inList = false;
      let inOrderedList = false;
      let inAccountGroupSection = false;
      let inChurnSection = false;
      let accountGroupDateRange = '';

      const escapeAttr = (val: string) =>
        val
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      const updateSectionContext = (rawTitle: string) => {
        const plainTitle = rawTitle.replace(/\*/g, '').trim();
        if (/account\s+group\s+breakdown/i.test(plainTitle)) {
          inAccountGroupSection = true;
          inChurnSection = false;
          const rangeMatch = plainTitle.match(/\((?:KTOKD\s*:\s*)?([^)]+)\)/i);
          accountGroupDateRange = rangeMatch ? rangeMatch[1].trim() : '';
        } else if (/customer\s+churn\s*&\s*inactivity\s+risk/i.test(plainTitle)) {
          inAccountGroupSection = false;
          inChurnSection = true;
        } else {
          inAccountGroupSection = false;
          inChurnSection = false;
        }
      };

      const CHURN_QUESTION_MAP: Array<[RegExp, string]> = [
        [
          /^Accounts\s+with\s+>\s*5%\s+Sales\s+Decline$/i,
          'Accounts with > 5% Sales Decline (Last 30 Days)',
        ],
        [
          /^Accounts\s+with\s+>\s*10%\s+Sales\s+Decline$/i,
          'Accounts with > 10% Sales Decline (Last 30 Days)',
        ],
        [
          /^Steepest\s+Sales\s+Decline\s+Accounts/i,
          'Steepest Sales Decline Accounts (Last 30 Days)',
        ],
        [
          /^High-Risk\s+Inactive\s+Accounts/i,
          'High-Risk Inactive Accounts (Last 30 Days)',
        ],
        [
          /^Zero-Sale\s+Active\s+Counters$/i,
          'Zero-Sale Active Counters (Last 30 Days)',
        ],
      ];

      const wrapLabelAsLink = (htmlItem: string, question: string): string => {
        const linkAttrs = `type="button" class="view-account-group-btn text-[var(--accent)] hover:text-[var(--accent-hover)] underline decoration-[var(--accent)]/60 hover:decoration-[var(--accent-hover)] underline-offset-2 font-semibold cursor-pointer transition-colors text-left" data-rag-question="${escapeAttr(question)}" title="Click here to know more"`;
        return htmlItem.replace(
          /^(?:<strong class="font-semibold">)?([^<]+?)(?:<\/strong>)?(?=\s*:)/,
          `<button ${linkAttrs}>$1</button>`
        );
      };

      const parseSkuCategories = (startIdx: number): { categories: Array<{ category: string; skus: Array<{ name: string; value: string }> }>; endIdx: number } => {
        const categories: Array<{ category: string; skus: Array<{ name: string; value: string }> }> = [];
        let idx = startIdx;
        // Skip optional single blank line between title and first category bullet
        while (idx < lines.length && lines[idx].trim() === '') {
          idx++;
        }
        let lastMatched = startIdx - 1;
        while (idx < lines.length) {
          const t = lines[idx].trim();
          if (!(t.startsWith('- ') || t.startsWith('* ') || t.startsWith('• '))) {
            break;
          }
          const raw = t.replace(/^[-*•]\s+/, '');
          const catMatch = raw.match(/^\*{0,2}([^:*]+?)\*{0,2}\s*:\s*(.+)$/);
          if (!catMatch) {
            break;
          }
          const category = catMatch[1].trim();
          const skusRaw = catMatch[2].trim();
          const skus: Array<{ name: string; value: string }> = [];
          const skuRegex = /(.+?)\s*\((?:Sales\s*Value:\s*)?(₹\s*-?[\d,]+(?:\.\d+)?\s*Cr)\)(?:\s*,\s*|$)/gi;
          let m: RegExpExecArray | null;
          while ((m = skuRegex.exec(skusRaw)) !== null) {
            skus.push({ name: m[1].trim(), value: m[2].trim() });
          }
          if (skus.length === 0) {
            break;
          }
          categories.push({ category, skus });
          lastMatched = idx;
          idx++;
        }
        return { categories, endIdx: lastMatched };
      };

      const renderTopSkusTabbedCard = (
        titleText: string,
        categories: Array<{ category: string; skus: Array<{ name: string; value: string }> }>
      ): string => {
        const cleanTitle = escapeAttr(titleText.replace(/[:*]+$/, '').trim());
        const activeTabCls = 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs';
        const inactiveTabCls = 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:border-slate-300';

        const tabsHtml = categories
          .map((cat, idx) => {
            const cls = idx === 0 ? activeTabCls : inactiveTabCls;
            const catEsc = escapeAttr(cat.category);
            return `<button type="button" class="sku-tab-btn px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${cls}" data-sku-tab="${idx}">${catEsc}</button>`;
          })
          .join('');

        const panelsHtml = categories
          .map((cat, idx) => {
            const catEsc = escapeAttr(cat.category);
            const rowsHtml = cat.skus
              .map((sku, sIdx) => {
                const nameEsc = escapeAttr(sku.name);
                const valEsc = escapeAttr(sku.value);
                const borderCls = sIdx < cat.skus.length - 1 ? 'border-b border-[var(--border)]/60' : '';
                return `<div class="flex items-center justify-between gap-4 py-2 ${borderCls}"><div class="flex items-center gap-2.5 min-w-0"><span class="text-xs font-medium text-[var(--text-secondary)] w-4 shrink-0">${sIdx + 1}.</span><span class="text-xs sm:text-sm font-medium text-[var(--accent)] truncate" title="${nameEsc}">${nameEsc}</span></div><span class="text-xs sm:text-sm whitespace-nowrap shrink-0"><span class="font-semibold text-[var(--text-primary)] mr-1">Sales Value:</span><span class="font-normal text-[var(--text-primary)]">${valEsc}</span></span></div>`;
              })
              .join('');

            return `<div class="sku-tab-panel ${idx === 0 ? '' : 'hidden'} pt-3" data-sku-panel="${idx}"><div class="flex items-center justify-between mb-1.5"><span class="text-xs font-bold text-[var(--text-primary)]">${catEsc} Materials</span><span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">Top ${cat.skus.length}</span></div><div>${rowsHtml}</div></div>`;
          })
          .join('');

        return `<div class="sku-tabs-card my-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs"><div class="flex items-center justify-between gap-2 mb-3"><h4 class="text-sm font-bold text-[var(--text-primary)] m-0 whitespace-nowrap overflow-x-auto">${cleanTitle}</h4></div><div class="flex flex-wrap gap-1.5 pb-3 border-b border-[var(--border)]">${tabsHtml}</div>${panelsHtml}</div>`;
      };

      const closeLists = () => {
        if (inList) {
          resultHtml += `</ul>`;
          inList = false;
        }
        if (inOrderedList) {
          resultHtml += `</ol>`;
          inOrderedList = false;
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        const headerMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
        const isBullet = !headerMatch && (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• '));
        const isNumbered = !headerMatch && !isBullet && /^\d+\.\s/.test(trimmed);

        // Detect "Top 5 SKUs by Top 5 Categories (...)" or "Top SKUs by Category (...)" block and render interactive tabbed card
        const candidateTitle = (headerMatch ? headerMatch[2] : trimmed.replace(/^[-*•]\s+/, '')).replace(/\*/g, '').replace(/:$/, '').trim();
        if (/^Top\s*(?:\d+\s+)?SKUs\s+by\s+/i.test(candidateTitle) && !candidateTitle.includes('Cr)')) {
          const { categories, endIdx } = parseSkuCategories(i + 1);
          if (categories.length > 0) {
            closeLists();
            inAccountGroupSection = false;
            inChurnSection = false;
            resultHtml += renderTopSkusTabbedCard(candidateTitle, categories);
            i = endIdx;
            continue;
          }
        }

        if (headerMatch) {
          closeLists();
          updateSectionContext(headerMatch[2]);
          const level = headerMatch[1].length;
          const headerContent = formatInline(headerMatch[2]);
          if (level === 4) {
            resultHtml += `<h4 class="text-sm font-bold text-slate-800 mt-3 mb-1.5 ${headerClass}">${headerContent}</h4>`;
          } else if (level === 3) {
            resultHtml += `<h4 class="text-sm mt-3 mb-1.5 ${headerClass}">${headerContent}</h4>`;
          } else if (level === 2) {
            resultHtml += `<h3 class="text-base mt-4 mb-2 ${headerClass}">${headerContent}</h3>`;
          } else {
            resultHtml += `<h2 class="text-lg mt-5 mb-2.5 ${headerClass}">${headerContent}</h2>`;
          }
        } else if (isBullet) {
          if (inOrderedList) {
            resultHtml += `</ol>`;
            inOrderedList = false;
          }

          const rawBullet = trimmed.replace(/^[-*•]\s+/, '');
          let itemContent = formatInline(rawBullet);
          const isCategorySubheader =
            /(?:Breakdown|Top SKUs|SKUs by Category|by Category)<\/strong>:\s*$/i.test(itemContent) ||
            /^(?:Account Group Breakdown|Top SKUs by Category|Top 5 SKUs)/i.test(itemContent.replace(/<[^>]+>/g, '').trim()) && itemContent.trim().endsWith(':');

          if (isCategorySubheader) {
            if (inList) {
              resultHtml += `</ul>`;
              inList = false;
            }
            updateSectionContext(rawBullet);
            resultHtml += `<div class="font-bold text-slate-800 mt-3 mb-1 text-sm">${itemContent}</div>`;
          } else {
            if (!inList) {
              resultHtml += `<ul class="list-disc pl-5 my-2 space-y-1">`;
              inList = true;
            }
            if (inAccountGroupSection && /active\s+customer/i.test(rawBullet)) {
              const grpMatch = rawBullet.match(/^\*{0,2}([^(*]+?)\s*\(([A-Za-z0-9_]+)\)\*{0,2}\s*:/);
              if (grpMatch) {
                const groupName = grpMatch[1].trim();
                const groupCode = grpMatch[2].trim();
                const dateClause = accountGroupDateRange ? ` for ${accountGroupDateRange}` : '';
                const question = `List all active customers in Account Group ${groupName} (${groupCode})${dateClause} with customer code, customer name, sales value, and units sold`;
                itemContent = wrapLabelAsLink(itemContent, question);
              }
            } else if (inChurnSection) {
              const labelMatch = rawBullet.match(/^\*{0,2}([^:*]+(?:\([^)]+\))?)\*{0,2}\s*:/);
              if (labelMatch) {
                const rawLabel = labelMatch[1].trim();
                const matchedEntry = CHURN_QUESTION_MAP.find(([pattern]) => pattern.test(rawLabel));
                if (matchedEntry) {
                  itemContent = wrapLabelAsLink(itemContent, matchedEntry[1]);
                }
              }
            }
            resultHtml += `<li>${itemContent}</li>`;
          }
        } else if (isNumbered) {
          inAccountGroupSection = false;
          inChurnSection = false;
          if (inList) {
            resultHtml += `</ul>`;
            inList = false;
          }
          if (!inOrderedList) {
            resultHtml += `<ol class="list-decimal pl-5 my-2 space-y-1">`;
            inOrderedList = true;
          }
          const itemContent = formatInline(trimmed.replace(/^\d+\.\s+/, ''));
          resultHtml += `<li>${itemContent}</li>`;
        } else {
          closeLists();
          inAccountGroupSection = false;

          if (trimmed === '') {
            resultHtml += `<div class="h-2"></div>`;
          } else {
            updateSectionContext(trimmed);
            resultHtml += `<p class="mb-1.5 last:mb-0 leading-relaxed">${formatInline(trimmed)}</p>`;
          }
        }
      }

      closeLists();

      return resultHtml;
    }
  }).join('');
};

/**
 * Delegated click handler for interactive summary links (Account Group Breakdown & Churn Risk).
 * Extracts the pre-built RAG question from `data-rag-question` (or legacy group attributes)
 * and dispatches a `rag-chat-ask` custom event for ChatWindow to execute.
 */
export const handleAccountGroupViewClick = (e: { target: EventTarget | null }) => {
  const target = e.target as HTMLElement | null;

  // Handle Top SKUs category tab switching
  const tabBtn = target?.closest?.('.sku-tab-btn') as HTMLElement | null;
  if (tabBtn) {
    const card = tabBtn.closest('.sku-tabs-card');
    const selectedTab = tabBtn.getAttribute('data-sku-tab');
    if (card && selectedTab !== null) {
      const activeClasses = ['bg-[var(--accent)]', 'text-white', 'border-[var(--accent)]', 'shadow-xs'];
      const inactiveClasses = ['bg-[var(--surface-hover)]', 'text-[var(--text-secondary)]', 'border-[var(--border)]', 'hover:text-[var(--text-primary)]', 'hover:border-slate-300'];

      card.querySelectorAll('.sku-tab-btn').forEach((btn) => {
        const isSelected = btn.getAttribute('data-sku-tab') === selectedTab;
        if (isSelected) {
          btn.classList.remove(...inactiveClasses);
          btn.classList.add(...activeClasses);
        } else {
          btn.classList.remove(...activeClasses);
          btn.classList.add(...inactiveClasses);
        }
      });

      card.querySelectorAll('.sku-tab-panel').forEach((panel) => {
        if (panel.getAttribute('data-sku-panel') === selectedTab) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    }
    return;
  }

  const btn = target?.closest?.('.view-account-group-btn') as HTMLElement | null;
  if (!btn) return;

  const directQuestion = btn.getAttribute('data-rag-question')?.trim();
  if (directQuestion) {
    window.dispatchEvent(new CustomEvent('rag-chat-ask', { detail: { question: directQuestion } }));
    return;
  }

  const groupCode = btn.getAttribute('data-group-code') || '';
  const groupName = btn.getAttribute('data-group-name') || '';
  const dateRange = btn.getAttribute('data-date-range') || '';
  if (!groupCode) return;

  const dateClause = dateRange ? ` for ${dateRange}` : '';
  const question = `List all active customers in Account Group ${groupName} (${groupCode})${dateClause} with customer code, customer name, sales value, and units sold`;

  window.dispatchEvent(new CustomEvent('rag-chat-ask', { detail: { question } }));
};
