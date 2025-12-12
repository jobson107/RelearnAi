
/**
 * Utility to detect and wrap raw LaTeX math in proper delimiters for KaTeX.
 * Handles common AI output issues where math is returned without \( \) or \[ \].
 */
export const ensureMathDelimiters = (text: string): string => {
  if (!text) return "";

  // 1. Fix inconsistent escaping often seen in LLM outputs (e.g. \\frac instead of \frac)
  // We replace double backslashes with single, checking for common math commands
  let processed = text.replace(/\\\\(frac|sum|int|vec|sqrt|theta|pi|infty|cdot|times|partial|nabla|alpha|beta|gamma|sigma|omega|Delta|mu|lambda)/g, '\\$1');

  // 2. Detect Block Math (Equations on their own line)
  // Pattern: Newline (or start), Variable = Expression, Newline (or end)
  // Heuristic: Must contain typical math symbols (\, ^, _, {) to distinguish from code or plain text
  const blockEquationRegex = /(^|\n)(?<!\\\[)(?![ \t]*[-*])\s*([a-zA-Z][a-zA-Z0-9_{}()]*\s*=\s*[^$\n]+)(?=$|\n)/g;
  
  processed = processed.replace(blockEquationRegex, (match, prefix, content) => {
    // Validation: Must look like math
    if (!/[\^_\{\}\\]/.test(content)) return match; // Plain text "Name = Value" isn't math
    if (content.includes('http') || content.includes('```') || content.includes('const ') || content.includes('let ')) return match; // Code or URL
    if (content.trim().startsWith('\\[')) return match; // Already wrapped

    return `${prefix}\\[ ${content.trim()} \\]`;
  });

  // 3. Detect Inline Math (commands missing delimiters)
  // Pattern: \command followed by optional brackets, not surrounded by $ or \
  // We explicitly look for common commands to avoid false positives with normal text backslashes
  const inlineCommandRegex = /(?<![\\$\w])(\\(?:frac|sum|int|vec|sqrt|theta|pi|infty|cdot|times|partial|nabla|alpha|beta|gamma|sigma|omega|Delta|approx|ne|le|ge|pm)(?:\{[^\}]+\}|\[[^\]]+\])?)(?![\\$])/g;
  
  processed = processed.replace(inlineCommandRegex, (match) => {
    return `\\( ${match} \\)`;
  });

  return processed;
};
