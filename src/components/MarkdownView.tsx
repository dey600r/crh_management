import { memo } from 'react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView = memo(function MarkdownView({ content }: MarkdownViewProps) {
  if (!content) return null;

  const lines = content.split('\n');
  
  return (
    <div className="space-y-3 font-sans text-sm text-slate-800 leading-relaxed">
      {lines.map((line, idx) => {
        // Trimmed line for checks
        const trimmed = line.trim();

        // 1. Headers
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-slate-950 mt-4 mb-2 border-b border-slate-100 pb-1">
              {trimmed.substring(2)}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2">
              {trimmed.substring(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1">
              {trimmed.substring(4)}
            </h3>
          );
        }

        // 2. Unordered lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.substring(2);
          return (
            <ul key={idx} className="list-disc list-inside ml-4 space-y-1 text-slate-700">
              <li>{parseInlineBold(listText)}</li>
            </ul>
          );
        }

        // 3. Ordered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const text = trimmed.replace(/^\d+\.\s/, '');
          return (
            <ol key={idx} className="list-decimal list-inside ml-4 space-y-1 text-slate-700">
              <li>{parseInlineBold(text)}</li>
            </ol>
          );
        }

        // 4. Code Blocks
        if (trimmed.startsWith('```')) {
          return null; // Skip markdown block backticks
        }

        // 5. Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // 6. Normal paragraph
        return (
          <p key={idx} className="text-slate-700">
            {parseInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
});

// Helper to format inline bold (**word**) and backticks (`code`)
function parseInlineBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
