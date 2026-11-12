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

      return `<pre class="${codeBlockClass}">${
        language 
          ? `<div class="text-[9px] text-[var(--text-secondary)] mb-1.5 font-sans uppercase tracking-wider font-semibold border-b border-[var(--border)] pb-1">${language}</div>` 
          : ''
      }<code>${escapedCode.trim()}</code></pre>`;
    } else {
      // Handle headers, lists, and paragraphs line by line so inline formatting never spans across lines
      const lines = part.split('\n');
      let resultHtml = '';
      let inList = false;
      let inOrderedList = false;

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

        if (headerMatch) {
          closeLists();
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

          const itemContent = formatInline(trimmed.replace(/^[-*•]\s+/, ''));
          const isCategorySubheader =
            /(?:Breakdown|Top SKUs|SKUs by Category|by Category)<\/strong>:\s*$/i.test(itemContent) ||
            /^(?:Account Group Breakdown|Top SKUs by Category|Top 5 SKUs)/i.test(itemContent.replace(/<[^>]+>/g, '').trim()) && itemContent.trim().endsWith(':');

          if (isCategorySubheader) {
            if (inList) {
              resultHtml += `</ul>`;
              inList = false;
            }
            resultHtml += `<div class="font-bold text-slate-800 mt-3 mb-1 text-sm">${itemContent}</div>`;
          } else {
            if (!inList) {
              resultHtml += `<ul class="list-disc pl-5 my-2 space-y-1">`;
              inList = true;
            }
            resultHtml += `<li>${itemContent}</li>`;
          }
        } else if (isNumbered) {
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

          if (trimmed === '') {
            resultHtml += `<div class="h-2"></div>`;
          } else {
            resultHtml += `<p class="mb-1.5 last:mb-0 leading-relaxed">${formatInline(trimmed)}</p>`;
          }
        }
      }

      closeLists();

      return resultHtml;
    }
  }).join('');
};
