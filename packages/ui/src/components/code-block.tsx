'use client';

import { Highlight, themes } from 'prism-react-renderer';
import { useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { Badge } from './badge';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg overflow-hidden group',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Badge variant="default">{language}</Badge>
          {title ? (
            <span className="text-xs text-text-secondary font-mono">{title}</span>
          ) : null}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-text-muted hover:text-text-primary font-mono transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? 'copied!' : 'copy'}
        </button>
      </div>

      <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
        {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(hlClassName, 'overflow-x-auto p-4 text-sm leading-relaxed')}
            style={{ ...style, backgroundColor: 'transparent' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              const isHighlighted = highlightLines.includes(i + 1);
              return (
                <div
                  key={i}
                  {...lineProps}
                  className={cn(
                    lineProps.className,
                    isHighlighted && 'bg-accent-muted -mx-4 px-4',
                  )}
                >
                  {showLineNumbers ? (
                    <span className="inline-block w-8 text-right mr-4 text-text-muted select-none">
                      {i + 1}
                    </span>
                  ) : null}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
