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

  // Replace dollar sign with rupee sign in the chat response
  text = text.replace(/\$/g, '₹');


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
      let html = part;

      // Escape raw HTML blocks to protect against XSS
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Inline code
      html = html.replace(/`([^`]+)`/g, `<code class="${inlineCodeClass}">$1</code>`);

      // Bold text
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

      // Italic text
      html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

      // Markdown links with small external indicator
      const linkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0 opacity-80"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>`;
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        `<a href="$2" target="_blank" rel="noopener noreferrer" class="${linkClass}">$1 ${linkSvg}</a>`
      );

      // Headers: #, ##, ###
      html = html.replace(/^### (.*$)/gim, `<h4 class="text-sm mt-3 mb-1.5 ${headerClass}">$1</h4>`);
      html = html.replace(/^## (.*$)/gim, `<h3 class="text-base mt-4 mb-2 ${headerClass}">$1</h3>`);
      html = html.replace(/^# (.*$)/gim, `<h2 class="text-lg mt-5 mb-2.5 ${headerClass}">$1</h2>`);

      // Handle lists and paragraphs line by line
      const lines = html.split('\n');
      let resultHtml = '';
      let inList = false;
      let inOrderedList = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        const isNumbered = /^\d+\.\s/.test(trimmed);

        if (isBullet) {
          if (inOrderedList) {
            resultHtml += `</ol>`;
            inOrderedList = false;
          }
          if (!inList) {
            resultHtml += `<ul class="list-disc pl-5 my-2 space-y-1">`;
            inList = true;
          }
          const itemContent = trimmed.replace(/^[-*•]\s+/, '');
          resultHtml += `<li>${itemContent}</li>`;
        } else if (isNumbered) {
          if (inList) {
            resultHtml += `</ul>`;
            inList = false;
          }
          if (!inOrderedList) {
            resultHtml += `<ol class="list-decimal pl-5 my-2 space-y-1">`;
            inOrderedList = true;
          }
          const itemContent = trimmed.replace(/^\d+\.\s+/, '');
          resultHtml += `<li>${itemContent}</li>`;
        } else {
          if (inList) {
            resultHtml += `</ul>`;
            inList = false;
          }
          if (inOrderedList) {
            resultHtml += `</ol>`;
            inOrderedList = false;
          }

          if (trimmed === '') {
            resultHtml += `<div class="h-2"></div>`;
          } else {
            // Check if line is a header HTML tag we generated
            if (trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.startsWith('<h4')) {
              resultHtml += trimmed;
            } else {
              resultHtml += `<p class="mb-1.5 last:mb-0 leading-relaxed">${trimmed}</p>`;
            }
          }
        }
      }

      if (inList) resultHtml += `</ul>`;
      if (inOrderedList) resultHtml += `</ol>`;

      return resultHtml;
    }
  }).join('');
};
