
import React, { useMemo } from 'react';
import katex from 'https://esm.sh/katex@0.16.9';

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

const preprocessMath = (text: string): string => {
  if (!text) return "";

  // 1. Detect equations without delimiters that look like "F = k \frac{...}"
  // Look for: start-of-line or whitespace, followed by variable, equals, and then latex command like \frac
  const looseEquationRegex = /(^|\n|\.\s)([a-zA-Z][a-zA-Z0-9_\^{}]*\s*=\s*[^$\n\\]*?\\[a-zA-Z]+[^$\n]*?)(?=$|\n|\.)/g;
  
  // 2. Fix specific common cases if they appear raw (e.g. from the user prompt examples)
  // Replaces raw "F = k \frac" with wrapped "\\[ F = k \frac... \\]"
  let processed = text.replace(looseEquationRegex, (match, prefix, content) => {
    // Only wrap if it doesn't already have delimiters
    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) return match;
    return `${prefix}\\[ ${content} \\]`;
  });

  return processed;
};

const renderTextWithMath = (text: string) => {
  if (!text) return null;
  const processed = preprocessMath(text);
  
  // Split by delimiters: \[ \], \( \), $$ $$, $ $
  // Regex captures the delimiter and content
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[\s\S]*?(?<!\\)\$)/g;
  
  const parts = processed.split(regex);
  
  return parts.map((part, index) => {
    if (part.match(regex)) {
      let formula = part;
      let displayMode = false;
      
      // Strip delimiters
      if (part.startsWith('$$')) {
        formula = part.slice(2, -2);
        displayMode = true;
      } else if (part.startsWith('\\[')) {
        formula = part.slice(2, -2);
        displayMode = true;
      } else if (part.startsWith('\\(')) {
        formula = part.slice(2, -2);
        displayMode = false;
      } else if (part.startsWith('$')) {
        formula = part.slice(1, -1);
        displayMode = false;
      }
      
      try {
        const html = katex.renderToString(formula, {
          displayMode: displayMode,
          throwOnError: false,
          output: 'html', // Use HTML output for lighter weight
          trust: true
        });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="katex-rendered inline-block align-middle" />;
      } catch (e) {
        console.warn("KaTeX rendering error:", e);
        return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
      }
    }
    // Render regular text (preserving newlines if needed, though usually handled by parent)
    return <span key={index}>{part}</span>;
  });
};

export const MathText: React.FC<MathTextProps> = React.memo(({ text, className, block }) => {
  const content = useMemo(() => renderTextWithMath(text), [text]);
  
  if (block) {
    return <div className={`math-block ${className || ''}`}>{content}</div>;
  }
  
  return <span className={`math-text ${className || ''}`}>{content}</span>;
});
